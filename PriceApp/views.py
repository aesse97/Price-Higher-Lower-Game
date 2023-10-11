import requests
from django.shortcuts import render
from django.core.cache import cache
from .models import Product
from django.http import JsonResponse
from django.conf import settings


class GameController:

    GOOGLE_CSE_API_KEY = settings.GOOGLE_CSE_API_KEY
    GOOGLE_CSE_ID = settings.GOOGLE_CSE_ID
    GIPHY_API_KEY = settings.GIPHY_API_KEY

    @staticmethod
    def fetch_fail_gif_from_giphy(api_key):
        url = f"https://api.giphy.com/v1/gifs/random?tag=fail&api_key={api_key}&rating=G"
        response = requests.get(url)

        if response.status_code != 200:
            print(f"Error {response.status_code}: {response.text}")
            return None

        result = response.json()

        gif_url = result.get('data', {}).get('images', {}).get('original', {}).get('url', None)

        if not gif_url:
            print("No GIF URL found in the Giphy API response!")
            return None

        print(f"Fetched fail GIF: {gif_url}")
        return gif_url

    @staticmethod
    def fetch_gif_view(request):
        gif_url = GameController.fetch_fail_gif_from_giphy(GameController.GIPHY_API_KEY)
        return JsonResponse({"gif_url": gif_url})

    @staticmethod
    def fetch_image_from_google(search_term, api_key, cse_id):
        url = "https://www.googleapis.com/customsearch/v1"
        params = {
            'q': search_term,
            'key': api_key,
            'cx': cse_id,
            'searchType': 'image',
            'num': 1,
            'siteSearch': 'amazon.com'
        }
        response = requests.get(url, params=params)

        if response.status_code != 200:
            print(f"Error {response.status_code}: {response.text}")
            return None

        result = response.json()

        image_url = result['items'][0]['link'] if 'items' in result and result['items'] else None
        return image_url

    @staticmethod
    def prefetch_product_image():
        all_products = Product.objects.all()
        if not all_products.exists():
            return None
        product = Product.objects.order_by('?').first()
        if not product.image_url:
            image_url = GameController.fetch_image_from_google(product.name, GameController.GOOGLE_CSE_API_KEY,
                                                               GameController.GOOGLE_CSE_ID)

            if image_url:
                product.image_url = image_url
                product.save()
            else:
                product.delete()
                return GameController.prefetch_product_image()

        return product

    @staticmethod
    def get_new_products(request):
        num_products = int(request.GET.get('num', 1))
        products = [GameController.prefetch_product_image() for _ in range(num_products)]
        data = {
            'products': [{
                'name': product.name,
                'price': str(round(product.price)),
                'image_url': product.image_url
            } for product in products]
        }
        return JsonResponse(data)

    @staticmethod
    def game_view(request):

        cache.delete('product1')
        cache.delete('product2')
        cache.delete('next_product1')
        cache.delete('next_product2')

        product1 = cache.get('product1')
        product2 = cache.get('product2')
        next_product1 = cache.get('next_product1')
        next_product2 = cache.get('next_product2')

        if not product1:
            product1 = GameController.prefetch_product_image()
            cache.set('product1', product1, 300)

        if not product2:
            product2 = GameController.prefetch_product_image()
            cache.set('product2', product2, 300)

        if not next_product1:
            next_product1 = GameController.prefetch_product_image()
            cache.set('next_product1', next_product1, 300)

        if not next_product2:
            next_product2 = GameController.prefetch_product_image()
            cache.set('next_product2', next_product2, 300)

        fail_gif_url = GameController.fetch_fail_gif_from_giphy(GameController.GIPHY_API_KEY)

        context = {
            'product1': Product(name=product1.name, price=round(product1.price), image_url=product1.image_url),
            'product2': Product(name=product2.name, price=round(product2.price), image_url=product2.image_url),
            'score': request.session.get('score', 0),
            'high_score': request.session.get('high_score', 0),
            'fail_gif_url': fail_gif_url
        }

        return render(request, 'game/game.html', context)
