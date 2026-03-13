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
