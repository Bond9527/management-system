from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'supplies', views.SupplyViewSet)
router.register(r'inventory-records', views.InventoryRecordViewSet)

# 🆕 新增路由注册
router.register(r'b482-supplies', views.B482SupplyItemViewSet)
router.register(r'andor-supplies', views.AndorSupplyItemViewSet)
router.register(r'capacity-forecasts', views.CapacityForecastViewSet)
router.register(r'b453-supplies', views.B453SupplyItemViewSet)
router.register(r'b453-calculations', views.B453CalculationItemViewSet)
router.register(r'b453-forecasts', views.B453ForecastDataViewSet)

# 动态申请表路由
router.register(r'application-templates', views.ApplicationTemplateViewSet)
router.register(r'application-forms', views.ApplicationFormViewSet)
router.register(r'dynamic-supply-items', views.DynamicSupplyItemViewSet)
router.register(r'dynamic-calculation-items', views.DynamicCalculationItemViewSet)
router.register(r'dynamic-forecast-data', views.DynamicForecastDataViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('adjust-stock/', views.adjust_stock, name='adjust_stock'),
    path('statistics/', views.get_statistics, name='get_statistics'),
    # 🆕 新增API路径
    path('unified-calculation/', views.unified_calculation, name='unified_calculation'),
    path('link-b453-data/', views.link_b453_data, name='link_b453_data'),
    path('dynamic-calculation-items/copy_from_template/', views.DynamicCalculationItemViewSet.as_view({'post': 'copy_from_template'}), name='copy_from_template'),
] 