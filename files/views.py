from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from django.http import HttpResponse
from django.utils.http import urlquote
from .models import File
from .serializers import FileSerializer
import os
import mimetypes
from django.urls import reverse
import logging

# Create your views here.

logger = logging.getLogger(__name__)

class FileViewSet(viewsets.ModelViewSet):
    queryset = File.objects.all()
    serializer_class = FileSerializer
    permission_classes = [IsAuthenticated]
    
    # Set consistent file size limit (5MB)
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB in bytes

    ALLOWED_CONTENT_TYPES = {
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  # Excel
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  # Word
        'application/msword',  # Old Word .doc
        'text/plain'
    }

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Handle file upload with validation"""
        # Get the uploaded file
        file = self.request.FILES.get('file')
        if not file:
            raise ValidationError("No file was uploaded")

        # Validate file size
        if file.size > self.MAX_FILE_SIZE:
            raise ValidationError(f"File size must be less than {self.MAX_FILE_SIZE / (1024 * 1024)}MB")

        # Validate content type
        if file.content_type not in self.ALLOWED_CONTENT_TYPES:
            raise ValidationError("Only PDF, Excel, Word, and TXT files are allowed")

        # Set file type from content type
        instance = serializer.save(
            user=self.request.user,
            file_type=file.content_type
        )
        
        # Get the full file path
        file_path = os.path.join(settings.MEDIA_ROOT, instance.file.name)
        
        # Log file details for debugging
        logger.info(f"File uploaded: {file_path}")
        logger.info(f"File size: {file.size} bytes")
        logger.info(f"File content type: {file.content_type}")
        
        # Return the download URL in the response
        download_url = self.request.build_absolute_uri(
            reverse('file-download', kwargs={'pk': instance.pk})
        )
        
        return Response(
            {**serializer.data, 'download_url': download_url},
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, pk=None):
        file_obj = self.get_object()
        if file_obj.user != request.user:
            return Response(
                {'error': 'You do not have permission to download this file'},
                status=status.HTTP_403_FORBIDDEN
            )

        file_path = file_obj.file.path
        file_name = os.path.basename(file_path)

        # Ensure the file exists
        if not os.path.exists(file_path):
            return Response(
                {'error': 'File not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Read the file in chunks
        with open(file_path, 'rb') as f:
            file_data = f.read()

        # Get content type
        content_type, _ = mimetypes.guess_type(file_path)
        if not content_type:
            content_type = 'application/octet-stream'

        # Create response with proper headers
        response = HttpResponse(file_data, content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{file_name}"'
        response['Content-Length'] = len(file_data)

        return response
