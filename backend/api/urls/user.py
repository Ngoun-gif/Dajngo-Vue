from rest_framework.routers import DefaultRouter
from backend.api.views.user import UserViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)  # 👈 This is what registers /api/users/

urlpatterns = router.urls