from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import (
    Department, JobTitle, UserRole, UserProfile,
    Permission, Menu, OperationLog
)

# 如果需要自定义用户管理，可以在这里添加
# 目前使用 Django 默认的 UserAdmin

# 如果将来添加自定义模型，可以在这里注册
# from .models import YourModel
# admin.site.register(YourModel)

# Department Admin
@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'is_active', 'created_at']
    list_filter = ['is_active', 'parent', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']
    list_editable = ['is_active']

# JobTitle Admin  
@admin.register(JobTitle)
class JobTitleAdmin(admin.ModelAdmin):
    list_display = ['name', 'level', 'is_active', 'created_at']
    list_filter = ['level', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['level', 'name']
    list_editable = ['is_active']

# UserRole Admin
@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']

# UserProfile Admin
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'department', 'job_title', 'is_active']
    list_filter = ['is_active', 'role', 'department', 'job_title', 'created_at']
    search_fields = ['user__username', 'user__email', 'phone']
    ordering = ['user__username']
    list_editable = ['is_active']

# Permission Admin
@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ['name', 'codename', 'permission_type', 'is_active']
    list_filter = ['permission_type', 'is_active', 'created_at']
    search_fields = ['name', 'codename', 'description']
    ordering = ['permission_type', 'name']
    list_editable = ['is_active']

# Menu Admin
@admin.register(Menu)
class MenuAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'menu_type', 'order', 'is_visible', 'is_active']
    list_filter = ['menu_type', 'is_visible', 'is_active', 'display_position']
    search_fields = ['name', 'path', 'component']
    ordering = ['order', 'name']
    list_editable = ['is_visible', 'is_active']

# OperationLog Admin
@admin.register(OperationLog)
class OperationLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'operation_type', 'model_name', 'description', 'ip_address', 'created_at']
    list_filter = ['operation_type', 'model_name', 'status_code', 'created_at']
    search_fields = ['user__username', 'description', 'ip_address']
    ordering = ['-created_at']
    readonly_fields = ['created_at']

# 扩展默认的User Admin
class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = '用户信息'

class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)

# 重新注册User模型
admin.site.unregister(User)
admin.site.register(User, UserAdmin)
