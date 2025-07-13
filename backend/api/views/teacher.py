from rest_framework import viewsets
from backend.models import Teacher
from backend.api.serializers import TeacherSerializer
from rest_framework.parsers import MultiPartParser, FormParser

class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.all().order_by('id')  # 👈 add order_by
    serializer_class = TeacherSerializer
    parser_classes = (MultiPartParser, FormParser)  # Required for file uploads

