import os
import json
import urllib.request
from pathlib import Path
from django.core.files.storage import FileSystemStorage
from django.contrib.auth.hashers import make_password
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import StreamingHttpResponse
from rest_framework import status, permissions
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.contrib.auth import authenticate

from .serializers import UserSerializer
from .rag_logic import LegalRAG, ModelDependencyError

# Instancia compartida del sistema RAG (se inicializa una sola vez)
_rag_system = LegalRAG()


class RegisterView(APIView):
    """Endpoint para crear una cuenta de usuario y obtener su token."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "token": token.key,
                "username": user.username,
                "message": "Usuario registrado con éxito",
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """Endpoint para autenticar a un usuario y devolver su token."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(username=username, password=password)

        if not user:
            return Response(
                {"error": "Credenciales inválidas"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "username": user.username})


class DemoLoginView(APIView):
    """Endpoint para entrar al modo demo sin depender de un token fijo en el frontend."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        user, _ = User.objects.get_or_create(
            username="demo",
            defaults={"email": "", "is_active": True},
        )

        if not user.password or user.password == "!":
            user.password = make_password(None)
            user.save(update_fields=["password"])

        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "token": token.key,
                "username": user.username,
                "isDemo": True,
            }
        )


class ChatView(APIView):
    """Endpoint para realizar consultas al sistema RAG legal."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        question = request.data.get("question", "").strip()
        if not question:
            return Response(
                {"error": "La pregunta es obligatoria"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verificar que Ollama está corriendo antes de cualquier otra operación
        if not _rag_system._is_ollama_running():
            return Response(
                {
                    "error": "El servidor de Ollama no responde. Asegúrate de que Ollama esté abierto y corriendo en tu equipo.",
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # Detectar TODOS los modelos faltantes de una sola vez
        missing = _rag_system.get_missing_models()
        if missing:
            if len(missing) == 1:
                m = missing[0]
                return Response(
                    {
                        "error": f'Falta el modelo de Ollama "{m["model"]}"',
                        "code": "ollama_model_missing",
                        "model": m["model"],
                        "purpose": m["purpose"],
                        "message": (
                            f'Falta el modelo "{m["model"]}" en Ollama. '
                            f'Se usa para {m["purpose"]}. '
                            "Si aceptas descargarlo, el sistema podrá funcionar correctamente."
                        ),
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
            return Response(
                {
                    "error": f'Faltan {len(missing)} modelos en Ollama',
                    "code": "ollama_models_missing",
                    "models": missing,
                    "message": (
                        f'Faltan {len(missing)} modelos requeridos: '
                        f'{", ".join(m["model"] for m in missing)}. '
                        "Descárgalos para que el sistema pueda funcionar correctamente."
                    ),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            answer = _rag_system.query(question)
            return Response({"answer": answer})
        except ModelDependencyError as exc:
            return Response(
                {
                    "error": str(exc),
                    "code": "ollama_model_missing",
                    "model": exc.model_name,
                    "purpose": exc.purpose,
                    "message": (
                        f'Falta el modelo "{exc.model_name}" en Ollama. '
                        f'Se usa para {exc.purpose}. '
                        "Si aceptas descargarlo, el sistema podrá indexar el corpus local y responder con contexto legal."
                    ),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class TrainView(APIView):
    """Endpoint para cargar e indexar nuevos documentos legales (.pdf, .txt, .md)."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if "file" not in request.FILES:
            return Response(
                {"error": "No se proporcionó ningún archivo"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        uploaded_file = request.FILES["file"]
        filename = uploaded_file.name

        # Validar extensión
        if not filename.lower().endswith((".pdf", ".txt", ".md")):
            return Response(
                {"error": "Formato no soportado. Usa .pdf, .txt o .md"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Ruta de destino: carpeta 'data' en la raíz del proyecto
        # Subimos 3 niveles desde views.py: core -> backend -> root
        data_dir = Path(__file__).resolve().parent.parent.parent / "data"
        os.makedirs(data_dir, exist_ok=True)

        fs = FileSystemStorage(location=str(data_dir))
        saved_filename = fs.save(filename, uploaded_file)
        file_path = str(data_dir / saved_filename)

        try:
            result = _rag_system.ingest_file(file_path)
            return Response({"message": result})
        except Exception as exc:
            # Si falla la ingesta, intentamos limpiar el archivo para no dejar basura
            if os.path.exists(file_path):
                os.remove(file_path)
            return Response(
                {"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PullModelView(APIView):
    """Descarga un modelo de Ollama solo cuando el usuario lo autoriza."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        model_name = (request.data.get("model") or "").strip()
        if not model_name:
            return Response(
                {"error": "Debes indicar el nombre del modelo"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payload = json.dumps({"model": model_name, "stream": True}).encode("utf-8")
        req = urllib.request.Request(
            f"{_rag_system._ollama_url}/api/pull",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        def event_stream():
            try:
                with urllib.request.urlopen(req, timeout=600) as response:
                    for raw_line in response:
                        if not raw_line.strip():
                            continue

                        decoded_line = raw_line.decode("utf-8").strip()
                        yield decoded_line + "\n"
            except Exception as exc:
                yield json.dumps(
                    {
                        "status": "error",
                        "error": f"No se pudo descargar el modelo: {exc}",
                    }
                ) + "\n"

        return StreamingHttpResponse(
            event_stream(),
            content_type="application/x-ndjson",
        )
