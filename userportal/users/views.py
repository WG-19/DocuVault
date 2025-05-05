from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.messages.views import SuccessMessageMixin
from django.db.models import QuerySet
from django.http import JsonResponse, HttpResponse, FileResponse
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import DetailView
from django.views.generic import RedirectView
from django.views.generic import UpdateView
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authentication import SessionAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import viewsets
from .models import User, Address, PhoneNumber, File
from .serializers import UserSerializer, AddressSerializer, PhoneNumberSerializer, FileSerializer
from rest_framework.decorators import action
from rest_framework import serializers
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import AllowAny
import logging
import json
import os
import mimetypes

logger = logging.getLogger(__name__)

class UserDetailView(LoginRequiredMixin, DetailView):
    model = User
    slug_field = "id"
    slug_url_kwarg = "id"

    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)

user_detail_view = UserDetailView.as_view()


class UserUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user
        name = request.data.get('name')
        
        if not name:
            return Response(
                {'detail': 'Name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not name.strip():
            return Response(
                {'detail': 'Please enter a valid name'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        user.name = name
        user.save()
        
        return Response(
            {'detail': 'Username updated successfully'},
            status=status.HTTP_200_OK
        )

user_update_view = UserUpdateAPIView.as_view()


class UserRedirectView(LoginRequiredMixin, RedirectView):
    permanent = False

    def get_redirect_url(self) -> str:
        if not self.request.user.is_authenticated:
            return JsonResponse(
                {'detail': 'Authentication credentials were not provided.'},
                status=401
            )
        return reverse("users:detail", kwargs={"pk": self.request.user.pk})

    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse(
                {'detail': 'Authentication credentials were not provided.'},
                status=401
            )
        return super().dispatch(request, *args, **kwargs)

user_redirect_view = UserRedirectView.as_view()


@csrf_exempt
@require_http_methods(["POST"])
def login_view_api(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        
        if not email or not password:
            return JsonResponse({
                'message': 'Email and password are required'
            }, status=400)

        user = authenticate(request, email=email, password=password)
        
        if user is not None:
            refresh = RefreshToken.for_user(user)
            return JsonResponse({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'name': user.name
                }
            })

        return JsonResponse({
            'message': 'Invalid credentials'
        }, status=401)

    return JsonResponse({
        'message': 'Method not allowed'
    }, status=405)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    if request.method == 'POST':
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({
                'message': 'Email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, email=email, password=password)
        
        if user is not None:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)

        return Response({
            'message': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)

    return Response({
        'message': 'Method not allowed'
    }, status=status.HTTP_405_METHOD_NOT_ALLOWED)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    if request.method == 'POST':
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        
        # Customize error messages
        errors = serializer.errors
        if 'email' in errors:
            if 'unique' in str(errors['email']):
                errors['email'] = ['An account with this email already exists. Please login or use a different email.']
            elif 'valid' in str(errors['email']):
                errors['email'] = ['Please enter a valid email address.']
        
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)
    return Response({
        'message': 'Method not allowed'
    }, status=status.HTTP_405_METHOD_NOT_ALLOWED)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get('refresh_token')
        if not refresh_token:
            return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        token = RefreshToken(refresh_token)
        token.blacklist()
        
        return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Logout failed: {str(e)}")
        return Response({"detail": "Logout failed."}, status=status.HTTP_400_BAD_REQUEST)


@require_http_methods(["GET"])
@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def me_view(request):
    user = request.user
    return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


class UserDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data)

user_detail_api_view = UserDetailAPIView.as_view()


class ProfileView(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    authentication_classes = (JWTAuthentication,)
    permission_classes = (IsAuthenticated,)
    def get_queryset(self):
        return User.objects.filter(pk=self.request.user.pk)

class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    authentication_classes = (JWTAuthentication,)
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # If creating a primary address, unmark all other addresses first
        if serializer.validated_data.get('is_primary', False):
            Address.objects.filter(
                user=self.request.user
            ).update(is_primary=False)
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.instance
        # If updating to primary, unmark all other addresses first
        if serializer.validated_data.get('is_primary', False) and not instance.is_primary:
            Address.objects.filter(
                user=self.request.user
            ).exclude(id=instance.id).update(is_primary=False)
        serializer.save()

    def update(self, request, *args, **kwargs):
        # Override update to ensure proper handling of primary status
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        # If setting to primary, unmark all other addresses
        if serializer.validated_data.get('is_primary', False) and not instance.is_primary:
            Address.objects.filter(
                user=self.request.user
            ).exclude(id=instance.id).update(is_primary=False)

        self.perform_update(serializer)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        # Override create to ensure proper handling of primary status
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # If creating a primary address, unmark all other addresses first
        if serializer.validated_data.get('is_primary', False):
            Address.objects.filter(
                user=self.request.user
            ).update(is_primary=False)

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class PhoneNumberViewSet(viewsets.ModelViewSet):
    serializer_class = PhoneNumberSerializer
    authentication_classes = (JWTAuthentication,)
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return self.request.user.phone_numbers.all()

    def perform_create(self, serializer):
        user = self.request.user
        if user.phone_numbers.exists():
            raise serializers.ValidationError("User can only have one phone number. Please edit the existing number instead.")
        serializer.save(user=user)

    def perform_update(self, serializer):
        instance = serializer.instance
        if not instance:
            raise serializers.ValidationError("Phone number not found")
        serializer.save(user=self.request.user)

class FileViewSet(viewsets.ModelViewSet):
    serializer_class = FileSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        return File.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        file = self.get_object()
        if file.user != request.user:
            return Response(
                {'error': 'You do not have permission to download this file'},
                status=status.HTTP_403_FORBIDDEN
            )

        file_path = file.file.path
        file_name = os.path.basename(file_path)
        content_type, _ = mimetypes.guess_type(file_path)
        if not content_type:
            content_type = 'application/octet-stream'

        response = FileResponse(open(file_path, 'rb'), content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{file_name}"'
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user != request.user:
            return Response(
                {'error': 'You do not have permission to delete this file'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class MyTokenObtainPairView(TokenObtainPairView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            
            if response.status_code == 200:
                # Get the user from the request
                user = authenticate(
                    email=request.data.get('email'),
                    password=request.data.get('password')
                )
                if user and user.is_authenticated:
                    user_data = UserSerializer(user).data
                    response['X-User-Data'] = json.dumps(user_data)
                return response

            # If authentication failed
            error_message = response.data.get('detail')
            if not error_message:
                error_message = 'Invalid credentials'
            return Response(
                {'error': error_message},
                status=status.HTTP_401_UNAUTHORIZED
            )

        except Exception as e:
            logger.error(f"Token authentication error: {str(e)}")
            return Response(
                {'error': 'An error occurred during authentication'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
