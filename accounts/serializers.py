from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Department, Position, JobTitle, UserRole, UserProfile, 
    Permission, Menu, OperationLog
)

class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    last_login_display = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'is_staff', 'is_superuser', 'date_joined', 'last_login', 'last_login_display', 'profile']
        read_only_fields = ['date_joined', 'last_login']
    
    def get_profile(self, obj):
        try:
            profile = obj.profile
            return {
                'id': profile.id,
                'role': profile.role.name if profile.role else None,
                'role_display': profile.role.get_name_display() if profile.role else None,
                'department': profile.department.name if profile.department else None,
                'position': profile.position.name if profile.position else None,
                'job_title': profile.job_title.name if profile.job_title else None,
                'phone': profile.phone,
                'is_active': profile.is_active,
            }
        except UserProfile.DoesNotExist:
            return None
    
    def get_last_login_display(self, obj):
        if obj.last_login:
            return obj.last_login.strftime('%Y-%m-%d %H:%M:%S')
        return None

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'confirm_password', 'is_active', 'is_staff', 'is_superuser']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("密码和确认密码不匹配")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'is_active', 'is_staff', 'is_superuser']

class UserPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("密码和确认密码不匹配")
        return attrs

class DepartmentSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    children_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Department
        fields = '__all__'
    
    def get_children_count(self, obj):
        return obj.children.count()

class DepartmentTreeSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = Department
        fields = '__all__'
    
    def get_children(self, obj):
        children = obj.children.filter(is_active=True)
        return DepartmentTreeSerializer(children, many=True).data

class PositionSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    class Meta:
        model = Position
        fields = '__all__'

class JobTitleSerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    
    class Meta:
        model = JobTitle
        fields = '__all__'

class UserRoleSerializer(serializers.ModelSerializer):
    name_display = serializers.CharField(source='get_name_display', read_only=True)
    
    class Meta:
        model = UserRole
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    role_name = serializers.CharField(source='role.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    position_name = serializers.CharField(source='position.name', read_only=True)
    job_title_name = serializers.CharField(source='job_title.name', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = '__all__'

class PermissionSerializer(serializers.ModelSerializer):
    permission_type_display = serializers.CharField(source='get_permission_type_display', read_only=True)
    
    class Meta:
        model = Permission
        fields = '__all__'

class MenuSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    menu_type_display = serializers.CharField(source='get_menu_type_display', read_only=True)
    display_position_display = serializers.CharField(source='get_display_position_display', read_only=True)
    permissions_count = serializers.SerializerMethodField()
    roles_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Menu
        fields = '__all__'
    
    def get_permissions_count(self, obj):
        return obj.permissions.count()
    
    def get_roles_count(self, obj):
        return obj.roles.count()

class MenuTreeSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    permissions_count = serializers.SerializerMethodField()
    roles_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Menu
        fields = '__all__'
    
    def get_children(self, obj):
        children = obj.children.filter(is_active=True, is_visible=True).order_by('order')
        return MenuTreeSerializer(children, many=True).data
    
    def get_permissions_count(self, obj):
        return obj.permissions.count()
    
    def get_roles_count(self, obj):
        return obj.roles.count()

class MenuDetailSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    menu_type_display = serializers.CharField(source='get_menu_type_display', read_only=True)
    permissions = PermissionSerializer(many=True, read_only=True)
    roles = UserRoleSerializer(many=True, read_only=True)
    children = MenuSerializer(many=True, read_only=True)
    
    class Meta:
        model = Menu
        fields = '__all__'

class OperationLogSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    operation_type_display = serializers.CharField(source='get_operation_type_display', read_only=True)
    
    class Meta:
        model = OperationLog
        fields = '__all__'

# 批量操作序列化器
class BatchUpdateSerializer(serializers.Serializer):
    ids = serializers.ListField(child=serializers.IntegerField())
    is_active = serializers.BooleanField(required=False)
    is_visible = serializers.BooleanField(required=False)

class MenuBatchUpdateSerializer(BatchUpdateSerializer):
    parent = serializers.IntegerField(required=False, allow_null=True)
    menu_type = serializers.ChoiceField(choices=Menu.MENU_TYPES, required=False) 