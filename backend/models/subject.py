from django.db import models
from django.contrib.auth.models import User


# Subject Model
class Subject(models.Model):
    subject_name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='subject_created_by')
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='subject_updated_by')

    def __str__(self):
        return self.subject_name