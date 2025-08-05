from django.contrib import admin
from .models import Supply, InventoryRecord, B482SupplyItem, AndorSupplyItem, CapacityForecast, B453SupplyItem, B453CalculationItem, B453ForecastData, ApplicationTemplate, ApplicationForm, DynamicSupplyItem, DynamicCalculationItem, DynamicForecastData

@admin.register(Supply)
class SupplyAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'unit', 'unit_price', 'current_stock', 'min_stock', 'max_stock', 'created_at']
    list_filter = ['category', 'created_at']
    search_fields = ['name', 'category']
    list_editable = ['unit_price', 'current_stock', 'min_stock', 'max_stock']
    ordering = ['name']

@admin.register(InventoryRecord)
class InventoryRecordAdmin(admin.ModelAdmin):
    list_display = ['supply', 'type', 'quantity', 'operator', 'department', 'timestamp']
    list_filter = ['type', 'department', 'timestamp']
    search_fields = ['supply__name', 'operator', 'remark']
    readonly_fields = ['timestamp']
    ordering = ['-timestamp']

# ================================
# 🆕 B482耗材管控申请表管理
# ================================

@admin.register(B482SupplyItem)
class B482SupplyItemAdmin(admin.ModelAdmin):
    list_display = ['serial_number', 'material_description_short', 'purchaser', 'unit_price', 'moq', 'july_2025', 'enable_auto_calculation', 'updated_at']
    list_filter = ['purchaser', 'unit', 'enable_auto_calculation', 'created_at']
    search_fields = ['material_description', 'purchaser', 'remark']
    list_editable = ['unit_price', 'moq', 'enable_auto_calculation']
    readonly_fields = ['created_at', 'updated_at', 'created_by']
    ordering = ['serial_number']
    
    def material_description_short(self, obj):
        return obj.material_description[:50] + '...' if len(obj.material_description) > 50 else obj.material_description
    material_description_short.short_description = '物料描述'

# ================================
# 🆕 Andor耗材需求计算表管理
# ================================

@admin.register(AndorSupplyItem)
class AndorSupplyItemAdmin(admin.ModelAdmin):
    list_display = ['no', 'material_name', 'usage_station', 'monthly_demand', 'min_inventory', 'max_inventory', 'month', 'updated_at']
    list_filter = ['month', 'usage_station', 'created_at']
    search_fields = ['material_name', 'usage_station', 'remark']
    list_editable = ['monthly_demand', 'min_inventory', 'max_inventory']
    readonly_fields = ['created_at', 'updated_at', 'created_by']
    ordering = ['no', 'usage_station']

# ================================
# 🆕 产能预测数据管理
# ================================

@admin.register(CapacityForecast)
class CapacityForecastAdmin(admin.ModelAdmin):
    list_display = ['name', 'max_capacity', 'min_capacity', 'jul_25', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['name']
    list_editable = ['max_capacity', 'min_capacity', 'jul_25']
    readonly_fields = ['created_at', 'updated_at', 'created_by']
    ordering = ['-updated_at']

# ================================
# 🆕 B453 SMT ATE耗材管控表管理
# ================================

@admin.register(B453SupplyItem)
class B453SupplyItemAdmin(admin.ModelAdmin):
    list_display = ['serial_number', 'material_description_short', 'purchaser', 'unit_price', 'moq', 'jul_2025_demand', 'has_calculation', 'updated_at']
    list_filter = ['purchaser', 'unit', 'has_calculation', 'created_at']
    search_fields = ['material_description', 'purchaser', 'remark']
    list_editable = ['unit_price', 'moq', 'jul_2025_demand']
    readonly_fields = ['created_at', 'updated_at', 'created_by']
    ordering = ['serial_number']
    
    def material_description_short(self, obj):
        return obj.material_description[:50] + '...' if len(obj.material_description) > 50 else obj.material_description
    material_description_short.short_description = '物料描述'

# ================================
# 🆕 B453耗材需求计算表管理
# ================================

@admin.register(B453CalculationItem)
class B453CalculationItemAdmin(admin.ModelAdmin):
    list_display = ['no', 'material_name', 'usage_station', 'monthly_demand_per_station', 'monthly_total_demand', 'actual_stock', 'management_id', 'updated_at']
    list_filter = ['usage_station', 'created_at']
    search_fields = ['material_name', 'usage_station', 'linked_material']
    list_editable = ['monthly_demand_per_station', 'monthly_total_demand', 'actual_stock']
    readonly_fields = ['created_at', 'updated_at', 'created_by']
    ordering = ['no']

# ================================
# 🆕 B453产能预测数据管理
# ================================

@admin.register(B453ForecastData)
class B453ForecastDataAdmin(admin.ModelAdmin):
    list_display = ['name', 'jul_25', 'jun_25', 'may_25', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['name']
    list_editable = ['jul_25', 'jun_25', 'may_25']
    readonly_fields = ['created_at', 'updated_at', 'created_by']
    ordering = ['-updated_at']

# ================================
# 🆕 动态申请表管理界面
# ================================

@admin.register(ApplicationTemplate)
class ApplicationTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'get_template_types', 'has_calculation', 'is_active', 'created_at', 'created_by']
    list_filter = ['has_calculation', 'is_active', 'created_at']
    search_fields = ['name', 'code', 'description']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = [
        ('基本信息', {
            'fields': ['name', 'code', 'template_type', 'description']
        }),
        ('配置选项', {
            'fields': ['has_calculation', 'calculation_template_id', 'is_active']
        }),
        ('时间信息', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        }),
    ]

    def get_template_types(self, obj):
        """显示模板类型"""
        if isinstance(obj.template_type, list):
            type_map = {
                'supply_management': '耗材管控',
                'demand_calculation': '需求计算',
                'capacity_forecast': '产能预测',
                'custom': '自定义',
            }
            return ', '.join([type_map.get(t, t) for t in obj.template_type])
        return obj.template_type
    get_template_types.short_description = '模板类型'

    def save_model(self, request, obj, form, change):
        if not change:  # 新建时
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(ApplicationForm)
class ApplicationFormAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'department', 'period', 'template', 'status', 'has_calculation_form', 'created_at']
    list_filter = ['status', 'department', 'has_calculation_form', 'created_at', 'template__template_type']
    search_fields = ['name', 'code', 'department', 'period']
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['template']
    fieldsets = [
        ('基本信息', {
            'fields': ['template', 'name', 'code']
        }),
        ('申请信息', {
            'fields': ['department', 'period', 'status']
        }),
        ('关联配置', {
            'fields': ['calculation_form_id', 'has_calculation_form']
        }),
        ('时间信息', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        }),
    ]

    def save_model(self, request, obj, form, change):
        if not change:  # 新建时
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(DynamicSupplyItem)
class DynamicSupplyItemAdmin(admin.ModelAdmin):
    list_display = ['form', 'serial_number', 'material_description_short', 'unit', 'unit_price', 'moq', 'enable_auto_calculation']
    list_filter = ['form', 'unit', 'enable_auto_calculation', 'created_at']
    search_fields = ['material_description', 'purchaser']
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['form']
    fieldsets = [
        ('基本信息', {
            'fields': ['form', 'serial_number', 'material_description', 'unit']
        }),
        ('采购信息', {
            'fields': ['purchaser', 'unit_price', 'moq', 'lead_time']
        }),
        ('库存信息', {
            'fields': ['min_safety_stock', 'max_safety_stock']
        }),
        ('计算参数', {
            'fields': ['usage_per_set', 'usage_count', 'monthly_capacity', 'enable_auto_calculation']
        }),
        ('其他信息', {
            'fields': ['monthly_data', 'remark']
        }),
        ('时间信息', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        }),
    ]

    def material_description_short(self, obj):
        return obj.material_description[:50] + '...' if len(obj.material_description) > 50 else obj.material_description
    material_description_short.short_description = '物料描述'


@admin.register(DynamicCalculationItem)
class DynamicCalculationItemAdmin(admin.ModelAdmin):
    list_display = ['form', 'no', 'material_name', 'usage_station', 'monthly_demand', 'monthly_net_demand', 'actual_order']
    list_filter = ['form', 'usage_station', 'created_at']
    search_fields = ['material_name', 'usage_station', 'linked_material']
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['form']
    fieldsets = [
        ('基本信息', {
            'fields': ['form', 'no', 'material_name', 'usage_station']
        }),
        ('计算参数', {
            'fields': ['usage_per_set', 'usage_count', 'monthly_capacity']
        }),
        ('库存信息', {
            'fields': ['min_stock', 'max_stock']
        }),
        ('计算结果', {
            'fields': ['monthly_demand', 'monthly_net_demand', 'actual_order']
        }),
        ('关联信息', {
            'fields': ['linked_supply_item_id', 'linked_material', 'unit_price', 'moq']
        }),
        ('备注信息', {
            'fields': ['moq_remark']
        }),
        ('时间信息', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        }),
    ]


@admin.register(DynamicForecastData)
class DynamicForecastDataAdmin(admin.ModelAdmin):
    list_display = ['form', 'name', 'created_at', 'updated_at']
    list_filter = ['form', 'created_at']
    search_fields = ['name', 'form__name']
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['form']
    fieldsets = [
        ('基本信息', {
            'fields': ['form', 'name']
        }),
        ('预测数据', {
            'fields': ['forecast_data']
        }),
        ('时间信息', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        }),
    ]
