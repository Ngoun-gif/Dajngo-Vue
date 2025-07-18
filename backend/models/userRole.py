from django.db import models
from django.contrib.auth.models import User
from .role import Role

class UserRole(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.CASCADE , null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.role.name}"
