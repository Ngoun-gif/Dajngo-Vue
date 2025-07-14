from backend.models import Product
from backend.api.serializers import ProductSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status , viewsets

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('id')  # 👈 add order_by
    serializer_class = ProductSerializer
    parser_classes = (MultiPartParser, FormParser)  # Required for file uploads

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        # 🔒 Preserve current image if none uploaded
        data = request.data.copy()
        if 'image' not in request.FILES:
            data['image'] = instance.image

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data, status=status.HTTP_200_OK)