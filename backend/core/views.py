import os
from pathlib import Path
from django.core.files.storage import FileSystemStorage
from django.contrib.auth.hashers import make_password
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.contrib.auth import authenticate

from .serializers import UserSerializer
from .rag_logic import LegalRAG

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

        try:
            answer = _rag_system.query(question)
            return Response({"answer": answer})
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
