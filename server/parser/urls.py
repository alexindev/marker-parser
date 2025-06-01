from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SearchQueryViewSet, ProductResultViewSet

router = DefaultRouter()
router.register(r'search', SearchQueryViewSet, basename='search')
router.register(r'products', ProductResultViewSet, basename='products')

urlpatterns = [
    path('api/', include(router.urls)),
] 