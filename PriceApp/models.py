from django.db import models

class Product(models.Model):
    sku = models.CharField(max_length=15, unique=True)
    name = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    review_count = models.IntegerField(null=True, blank=True)
    image_url = models.URLField(blank=True, null=True)

    def amazon_link(self):
        return f"https://www.amazon.com/dp/{self.sku}"