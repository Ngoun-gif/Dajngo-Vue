from rest_framework.routers import DefaultRouter
from backend.api.views.category import CategoryViewSet
from backend.api.views.product import ProductViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)

urlpatterns = router.urls
