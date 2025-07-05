from rest_framework import viewsets
from backend.models import Product
from backend.api.serializers import ProductSerializer
from rest_framework.parsers import MultiPartParser, FormParser

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('id')  # 👈 add order_by
    serializer_class = ProductSerializer
    parser_classes = (MultiPartParser, FormParser)  # Required for file uploads

