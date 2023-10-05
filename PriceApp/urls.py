from django.urls import path
from .views import GameController

urlpatterns = [
    path('', GameController.game_view, name='game_view'),
    path('get_new_products/', GameController.get_new_products, name='get_new_products'),
    path('fetch_gif/', GameController.fetch_gif_view, name='fetch_gif'),
]