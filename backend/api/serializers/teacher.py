from rest_framework import serializers
from backend.models import Teacher

class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = ['id', 'first_name', 'last_name', 'gender', 'date_of_birth', 'salary', 'photo','subject','created_at','created_by','updated_at','updated_by']

    def update(self, instance, validated_data):
        photo = validated_data.pop('photo', None)

        if photo:
            instance.image = photo  # Only update if photo provided

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance