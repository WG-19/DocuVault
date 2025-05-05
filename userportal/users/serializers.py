from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from .models import User, Address, PhoneNumber, File

class UserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(
            queryset=User.objects.all(),
            message="An account with this email already exists. Please login or use a different email."
        )]
    )
    password = serializers.CharField(write_only=True, required=True)
    name = serializers.CharField(required=True)

    class Meta:
        model = User
        # include id so front-end can reference user.id
        fields = ('id', 'name', 'email', 'password')
        read_only_fields = ('id',)
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, attrs):
        password = attrs.get('password')
        name = attrs.get('name')
        
        if not password:
            raise serializers.ValidationError({"password": "Password is required"})
        if not name or not name.strip():
            raise serializers.ValidationError({"name": "Please enter a valid name"})
        
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'],
            password=validated_data['password']
        )
        return user

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'street', 'city', 'state', 'postal_code', 'country', 'is_primary']

class PhoneNumberSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhoneNumber
        fields = ['id', 'number']

class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = ['id', 'file', 'file_type', 'file_size', 'upload_date', 'description', 'user']
        read_only_fields = ['user', 'upload_date', 'file_type', 'file_size']

    def validate_file(self, value):
        # Validate file type
        allowed_types = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  # Excel
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  # Word
            'application/msword',  # Old Word .doc
            'text/plain'
        ]
        if value.content_type not in allowed_types:
            raise serializers.ValidationError("Only PDF, Excel, Word, and TXT files are allowed")
        
        # Validate file size (5MB limit)
        if value.size > 5242880:  # 5MB in bytes
            raise serializers.ValidationError("File size must be less than 5MB")
        
        return value

    def create(self, validated_data):
        # Get the file from validated data
        uploaded_file = validated_data.get('file')
        if not uploaded_file:
            raise serializers.ValidationError({"file": "No file was uploaded"})
            
        # Set file size
        validated_data['file_size'] = uploaded_file.size
        
        # Create the file instance
        return super().create(validated_data)