from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Department, JobTitle, UserRole, UserProfile,
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
        profile = getattr(obj, 'profile', None)
        if profile:
            return {
                'id': profile.id,
                'role': profile.role.name if profile.role else None,
                'role_id': profile.role.id if profile.role else None,
                'role_display': profile.role.get_name_display() if profile.role else None,
                'department': profile.department.name if profile.department else None,
                'department_id': profile.department.id if profile.department else None,
                'job_title': profile.job_title.name if profile.job_title else None,
                'job_title_id': profile.job_title.id if profile.job_title else None,
                'phone': profile.phone,
                'employee_id': profile.employee_id,
                'avatar_url': profile.avatar_url,
                'status': profile.status,
                'status_display': profile.status_display,
                'is_active': profile.is_user_active,  # 兼容性字段
                'created_at': profile.created_at,
                'updated_at': profile.updated_at,
            }
        return None
    
    def get_last_login_display(self, obj):
        if obj.last_login:
            return obj.last_login.strftime('%Y-%m-%d %H:%M:%S')
        return None

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)
    department = serializers.IntegerField(required=False, allow_null=True)
    job_title = serializers.IntegerField(required=False, allow_null=True)
    role = serializers.IntegerField(required=False, allow_null=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    employee_id = serializers.CharField(required=True)
    avatar = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'confirm_password', 'is_active', 'is_staff', 'is_superuser', 'department', 'job_title', 'role', 'phone', 'employee_id', 'avatar']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("密码和确认密码不匹配")
        return attrs
    
    def validate_employee_id(self, value):
        """验证工号的唯一性"""
        if value:  # 只有当工号不为空时才验证
            # 检查是否有其他用户使用了相同的工号
            existing_profile = UserProfile.objects.filter(employee_id=value).first()
            if existing_profile:
                raise serializers.ValidationError(f"工号 '{value}' 已被用户 '{existing_profile.user.username}' 使用")
        return value
    
    def create(self, validated_data):
        # 提取profile相关字段
        department_id = validated_data.pop('department', None)
        job_title_id = validated_data.pop('job_title', None)
        role_id = validated_data.pop('role', None)
        phone = validated_data.pop('phone', '')
        employee_id = validated_data.pop('employee_id', '')
        avatar = validated_data.pop('avatar', None)
        
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        
        # 创建或更新用户profile
        profile, created = UserProfile.objects.get_or_create(user=user)
        if department_id:
            profile.department_id = department_id
        if job_title_id:
            profile.job_title_id = job_title_id
        if role_id:
            profile.role_id = role_id
        if phone:
            profile.phone = phone
        if employee_id:
            profile.employee_id = employee_id
        if avatar:
            profile.avatar = avatar
        profile.save()
        
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    department = serializers.IntegerField(required=False, allow_null=True)
    job_title = serializers.IntegerField(required=False, allow_null=True)
    role = serializers.IntegerField(required=False, allow_null=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    employee_id = serializers.CharField(required=False, allow_blank=True)
    avatar = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'is_active', 'is_staff', 'is_superuser', 'department', 'job_title', 'role', 'phone', 'employee_id', 'avatar']
    
    def validate_employee_id(self, value):
        """验证工号的唯一性"""
        if value:  # 只有当工号不为空时才验证
            # 获取当前正在更新的用户实例
            instance = self.instance
            # 检查是否有其他用户使用了相同的工号
            existing_profile = UserProfile.objects.filter(employee_id=value).exclude(user=instance).first()
            if existing_profile:
                raise serializers.ValidationError(f"工号 '{value}' 已被用户 '{existing_profile.user.username}' 使用")
        return value
        
    def update(self, instance, validated_data):
        # 提取profile相关字段
        department_id = validated_data.pop('department', None)
        job_title_id = validated_data.pop('job_title', None)
        role_id = validated_data.pop('role', None)
        phone = validated_data.pop('phone', None)
        employee_id = validated_data.pop('employee_id', None)
        avatar = validated_data.pop('avatar', None)
        
        # 更新用户基本信息
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # 创建或更新用户profile
        profile, created = UserProfile.objects.get_or_create(user=instance)
        if department_id is not None:
            profile.department_id = department_id if department_id else None
        if job_title_id is not None:
            profile.job_title_id = job_title_id if job_title_id else None
        if role_id is not None:
            profile.role_id = role_id if role_id else None
        if phone is not None:
            profile.phone = phone
        if employee_id is not None:
            profile.employee_id = employee_id
        if avatar is not None:
            profile.avatar = avatar
        profile.save()
        
        return instance

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