# backend/api/views/example.py
from django.contrib.auth import logout
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User

class ProtectedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"message": f"Hello, {request.user.username}!"})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Blacklist refresh token (JWT logout)
            refresh_token = request.data.get("refresh", None)
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()

            # Clear Django session (if any)
            logout(request)

            # Prepare response and delete cookies
            response = Response({"detail": "Logout successful."})
            response.delete_cookie('csrftoken')
            response.delete_cookie('sessionid')
            return response

        except Exception as e:
            return Response({"error": str(e)}, status=400)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=400)

        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, status=400)

        user = User.objects.create_user(username=username, email=email, password=password)
        return Response({'message': 'User registered successfully'}, status=status.HTTP_201_CREATED)
