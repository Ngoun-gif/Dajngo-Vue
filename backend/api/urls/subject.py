from rest_framework.routers import DefaultRouter
from backend.api.views import SubjectViewSet

router = DefaultRouter()
router.register(r'subjects', SubjectViewSet)

urlpatterns = router.urls
