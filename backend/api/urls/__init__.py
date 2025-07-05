from rest_framework.routers import DefaultRouter
from backend.api.views.category import CategoryViewSet
from backend.api.views.product import ProductViewSet
from backend.api.views.subject import SubjectViewSet
from backend.api.views.teacher import TeacherViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)

router.register(r'subjects', SubjectViewSet)
router.register(r'teachers', TeacherViewSet)

urlpatterns = router.urls
