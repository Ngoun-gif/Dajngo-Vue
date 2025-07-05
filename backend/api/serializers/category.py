from rest_framework import serializers
from backend.models import Category
from backend.api.serializers.product import ProductSerializer

class CategorySerializer(serializers.ModelSerializer):
    products = ProductSerializer(many=True, read_only=True)  # will work if related_name='products' is set in FK

    class Meta:
        model = Category
        fields = ['id', 'name', 'products']
