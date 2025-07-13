from rest_framework import viewsets
from backend.models import Subject
from backend.api.serializers import SubjectSerializer

class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all().order_by('id')  # 👈 add order_by
    serializer_class = SubjectSerializer
