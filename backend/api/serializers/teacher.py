from rest_framework import serializers
from backend.models import Teacher

class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = ['id', 'first_name', 'last_name', 'gender', 'date_of_birth', 'salary', 'photo','subject','created_at','created_by','updated_at','updated_by']