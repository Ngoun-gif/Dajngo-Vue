from rest_framework import serializers
from backend.models import Subject
from backend.api.serializers.teacher import TeacherSerializer

class SubjectSerializer(serializers.ModelSerializer):
    teachers = TeacherSerializer(many=True, read_only=True)  # will work if related_name='products' is set in FK

    class Meta:
        model = Subject
        fields = '__all__'
