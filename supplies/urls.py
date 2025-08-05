from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'supplies', views.SupplyViewSet)
router.register(r'inventory-records', views.InventoryRecordViewSet)
router.register(r'application-templates', views.ApplicationTemplateViewSet)
# router.register(r'supply-items', views.SupplyItemViewSet)  # 注释掉不存在的视图集
router.register(r'application-forms', views.ApplicationFormViewSet) # 修正视图集名称
router.register(r'dynamic-supply-items', views.DynamicSupplyItemViewSet)
router.register(r'dynamic-calculation-items', views.DynamicCalculationItemViewSet)
router.register(r'dynamic-forecast-data', views.DynamicForecastDataViewSet)

# 🆕 添加B453相关的ViewSet注册
router.register(r'b453-supplies', views.B453SupplyItemViewSet)
router.register(r'b453-calculations', views.B453CalculationItemViewSet)
router.register(r'b453-forecasts', views.B453ForecastDataViewSet)

# 🆕 添加B482和Andor相关的ViewSet注册
router.register(r'b482-supplies', views.B482SupplyItemViewSet)
router.register(r'andor-supplies', views.AndorSupplyItemViewSet)
router.register(r'capacity-forecasts', views.CapacityForecastViewSet)

urlpatterns = [
    # 包含由路由器自动生成的所有URL（包括所有ViewSet的@action）
    path('', include(router.urls)),
    
    # 手动添加独立的、非ViewSet的视图URL
    path('b453-management-headers/', views.get_b453_management_headers, name='get_b453_management_headers'),
    path('b453-calculation-headers/', views.get_b453_calculation_headers, name='get_b453_calculation_headers'),
    
    # 🆕 添加其他API端点
    path('adjust-stock/', views.adjust_stock, name='adjust_stock'),
    path('statistics/', views.get_statistics, name='get_statistics'),
    path('unified-calculation/', views.unified_calculation, name='unified_calculation'),
    path('link-b453-data/', views.link_b453_data, name='link_b453_data'),
    
    # 🆕 添加导入Excel相关API
    path('import-supplies-excel/', views.import_supplies_excel, name='supplies_import_supplies_excel'),
    path('import-log-list/', views.import_log_list, name='supplies_import_log_list'),
    
    # 🆕 添加一列多行处理相关API
    path('grouped-material-data/<int:form_id>/', views.get_grouped_material_data, name='get_grouped_material_data'),
    path('add-station/<int:material_id>/', views.add_usage_station, name='add_usage_station'),
] 