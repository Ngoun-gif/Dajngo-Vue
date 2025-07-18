from django.contrib import admin

from backend.models import Category, Product, Teacher, Subject, RolePermission, Role, UserRole ,Permission

admin.site.register(Category)
admin.site.register(Product)
admin.site.register(Teacher)
admin.site.register(Subject)
admin.site.register(RolePermission)
admin.site.register(Role)
admin.site.register(UserRole)
admin.site.register(Permission)


# Register your models here.
