from django.contrib import admin
from .models import Supply, InventoryRecord

@admin.register(Supply)
class SupplyAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'current_stock', 'safety_stock', 'unit_price', 'unit', 'created_at')
    list_filter = ('category', 'created_at', 'updated_at')
    search_fields = ('name', 'category')
    list_editable = ('current_stock', 'safety_stock', 'unit_price')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('基本信息', {
            'fields': ('name', 'category', 'unit')
        }),
        ('库存信息', {
            'fields': ('current_stock', 'safety_stock', 'unit_price')
        }),
        ('时间信息', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related()

@admin.register(InventoryRecord)
class InventoryRecordAdmin(admin.ModelAdmin):
    list_display = ('id', 'supply', 'type', 'quantity', 'operator', 'department', 'previous_stock', 'new_stock', 'timestamp')
    list_filter = ('type', 'department', 'timestamp', 'supply__category')
    search_fields = ('supply__name', 'operator', 'department', 'remark')
    ordering = ('-timestamp',)
    readonly_fields = ('previous_stock', 'new_stock', 'timestamp')
    
    fieldsets = (
        ('基本信息', {
            'fields': ('supply', 'type', 'quantity')
        }),
        ('操作信息', {
            'fields': ('operator', 'department', 'remark')
        }),
        ('库存变化', {
            'fields': ('previous_stock', 'new_stock'),
            'classes': ('collapse',)
        }),
        ('时间信息', {
            'fields': ('timestamp',),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('supply')
