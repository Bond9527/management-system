from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'supplies', views.SupplyViewSet)
router.register(r'records', views.InventoryRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('adjust-stock/', views.adjust_stock, name='adjust-stock'),
    path('statistics/', views.get_statistics, name='statistics'),
] 