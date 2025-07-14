from rest_framework import serializers
from backend.models import Product

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'category', 'price', 'stock', 'description', 'image']

    def update(self, instance, validated_data):
        image = validated_data.pop('image', None)

        if image:
            instance.image = image  # Only update if image provided

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance