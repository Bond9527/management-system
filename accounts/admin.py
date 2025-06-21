from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import (
    Department, Position, JobTitle, UserRole, UserProfile, 
    Permission, Menu, OperationLog
)

# 如果需要自定义用户管理，可以在这里添加
# 目前使用 Django 默认的 UserAdmin

# 如果将来添加自定义模型，可以在这里注册
# from .models import YourModel
# admin.site.register(YourModel)

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'is_active', 'created_at']
    list_filter = ['is_active', 'parent', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']
    list_editable = ['is_active']

@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ['name', 'department', 'is_active', 'created_at']
    list_filter = ['is_active', 'department', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']
    list_editable = ['is_active']

@admin.register(JobTitle)
class JobTitleAdmin(admin.ModelAdmin):
    list_display = ['name', 'level', 'is_active', 'created_at']
    list_filter = ['is_active', 'level', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['level', 'name']
    list_editable = ['is_active']

@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_at']
    list_filter = ['name', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'department', 'position', 'job_title', 'is_active']
    list_filter = ['is_active', 'role', 'department', 'position', 'job_title', 'created_at']
    search_fields = ['user__username', 'user__email', 'phone']
    ordering = ['-created_at']
    list_editable = ['is_active']

@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ['name', 'codename', 'permission_type', 'is_active', 'created_at']
    list_filter = ['is_active', 'permission_type', 'created_at']
    search_fields = ['name', 'codename', 'description']
    ordering = ['permission_type', 'name']
    list_editable = ['is_active']

@admin.register(Menu)
class MenuAdmin(admin.ModelAdmin):
    list_display = ['name', 'path', 'menu_type', 'parent', 'order', 'is_visible', 'is_active']
    list_filter = ['is_active', 'is_visible', 'menu_type', 'parent', 'created_at']
    search_fields = ['name', 'path', 'component']
    ordering = ['order', 'id']
    list_editable = ['order', 'is_visible', 'is_active']
    filter_horizontal = ['permissions', 'roles']

@admin.register(OperationLog)
class OperationLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'operation_type', 'model_name', 'object_id', 'status_code', 'created_at']
    list_filter = ['operation_type', 'model_name', 'status_code', 'created_at']
    search_fields = ['user__username', 'description', 'ip_address']
    ordering = ['-created_at']
    readonly_fields = ['user', 'operation_type', 'model_name', 'object_id', 'description', 
                      'ip_address', 'user_agent', 'request_data', 'response_data', 
                      'status_code', 'execution_time', 'created_at']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
