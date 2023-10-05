from django.core.management.base import BaseCommand
import pandas as pd
from PriceApp.models import Product

class Command(BaseCommand):
    help = 'Imports product data from a Excel file'

    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str, help='The path to the Excel file to import.')

    def handle(self, *args, **kwargs):
        file_path = kwargs['file_path']

        self.stdout.write(self.style.SUCCESS(f'Importing data from "{file_path}"...'))

        df = pd.read_excel(file_path)

        for _, row in df.iterrows():
            if pd.isna(row['price']) or row['price'] == 0:
                continue

            Product.objects.create(
                sku=row['sku'],
                name=row['name'],
                price=row['price'],
                review_count=row['review_count'] if not pd.isna(row['review_count']) else None
            )

        self.stdout.write(self.style.SUCCESS('Data import complete!'))