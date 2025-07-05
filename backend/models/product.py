from django.db import models
from .category import Category
import os

class Product(models.Model):
    name = models.CharField(max_length=100)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    
      # 🆕 New fields
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    stock = models.IntegerField(default=0)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='product_images/', blank=True, null=True)

    def delete(self, *args, **kwargs):
        # Delete the image file when the product is deleted
        if self.image:
            if os.path.isfile(self.image.path):
                os.remove(self.image.path)
        super().delete(*args, **kwargs)

    def save(self, *args, **kwargs):
      # Delete the old photo if a new one is uploaded
      if self.pk:  # Only for updates (not new creations)
          old_product = Product.objects.get(pk=self.pk)
          if old_product.image and old_product.image != self.image:
              if os.path.isfile(old_product.image.path):
                  os.remove(old_product.image.path)
      super().save(*args, **kwargs)
  
    
    

