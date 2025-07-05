from django.db import models
from django.contrib.auth.models import User
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class Department(models.Model):
    """部门模型"""
    name = models.CharField(max_length=100, unique=True, verbose_name="部门名称")
    description = models.TextField(blank=True, verbose_name="部门描述")
    parent = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        blank=True, 
        null=True, 
        related_name='children', 
        verbose_name='上级部门'
    )
    is_active = models.BooleanField(default=True, verbose_name="是否激活")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")

    class Meta:
        verbose_name = "部门"
        verbose_name_plural = "部门"
        ordering = ['name']

    def __str__(self):
        return self.name

    def get_children(self):
        """获取子部门"""
        return self.children.filter(is_active=True).order_by('name')

    def get_all_children(self):
        """递归获取所有子部门"""
        children = []
        for child in self.get_children():
            children.append(child)
            children.extend(child.get_all_children())
        return children

class JobTitle(models.Model):
    """职称模型"""
    LEVEL_CHOICES = [
        ('初级', '初级'),
        ('中级', '中级'),
        ('副高级', '副高级'),
        ('正高级', '正高级'),
    ]
    
    # 定义职称级别的排序优先级（数字越小级别越高）
    LEVEL_ORDER = {
        '正高级': 1,
        '副高级': 2,
        '中级': 3,
        '初级': 4,
    }
    
    name = models.CharField(max_length=100, unique=True, verbose_name="职称名称")
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, verbose_name="职称等级")
    description = models.TextField(blank=True, verbose_name="职称描述")
    is_active = models.BooleanField(default=True, verbose_name="是否激活")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")

    class Meta:
        verbose_name = "职称"
        verbose_name_plural = "职称"
        ordering = ['level', 'name']  # 保持原来的默认排序

    def __str__(self):
        return f"{self.name} ({self.level})"

class UserRole(models.Model):
    """用户角色模型"""
    ROLE_CHOICES = [
        ('admin', '管理员'),
        ('user', '普通用户'),
        ('manager', '经理'),
        ('operator', '操作员'),
    ]
    
    name = models.CharField(max_length=20, choices=ROLE_CHOICES, unique=True, verbose_name="角色名称")
    description = models.TextField(blank=True, verbose_name="角色描述")
    permissions = models.JSONField(default=list, verbose_name="权限列表")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")

    class Meta:
        verbose_name = "用户角色"
        verbose_name_plural = "用户角色"
        ordering = ['name']

    def __str__(self):
        return self.get_name_display()

class UserProfile(models.Model):
    """用户扩展信息模型"""
    # 用户状态选择
    STATUS_CHOICES = [
        ('active', '激活'),
        ('inactive', '未激活'), 
        ('disabled', '被禁用'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile', verbose_name="用户")
    role = models.ForeignKey(UserRole, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="用户角色")
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="部门")
    job_title = models.ForeignKey(JobTitle, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="职称")
    phone = models.CharField(max_length=20, blank=True, verbose_name="电话")
    employee_id = models.CharField(max_length=50, blank=True, unique=True, null=True, verbose_name="工号")
    avatar = models.ImageField(upload_to='avatars/%Y/%m/%d/', null=True, blank=True, verbose_name="头像")
    # 新的状态字段
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='inactive', verbose_name="用户状态")
    # 保留原有字段用于兼容性，但标记为过时
    is_active = models.BooleanField(default=True, verbose_name="是否激活(已废弃)")
    last_login_ip = models.GenericIPAddressField(null=True, blank=True, verbose_name="最后登录IP")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")

    class Meta:
        verbose_name = "用户信息"
        verbose_name_plural = "用户信息"

    def __str__(self):
        return f"{self.user.username} - {self.role.name if self.role else '无角色'}"

    @property
    def avatar_url(self):
        """获取头像URL"""
        if self.avatar and hasattr(self.avatar, 'url'):
            return self.avatar.url
        return None
    
    @property
    def status_display(self):
        """获取状态显示文本"""
        return dict(self.STATUS_CHOICES).get(self.status, self.status)
    
    @property
    def is_user_active(self):
        """判断用户是否为激活状态（用于兼容性）"""
        return self.status == 'active'

class OperationLog(models.Model):
    """操作日志模型"""
    OPERATION_TYPES = [
        ('create', '创建'),
        ('update', '更新'),
        ('delete', '删除'),
        ('view', '查看'),
        ('login', '登录'),
        ('logout', '登出'),
        ('export', '导出'),
        ('import', '导入'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="操作用户")
    operation_type = models.CharField(max_length=20, choices=OPERATION_TYPES, verbose_name="操作类型")
    model_name = models.CharField(max_length=100, verbose_name="模型名称")
    object_id = models.CharField(max_length=100, blank=True, verbose_name="对象ID")
    description = models.TextField(verbose_name="操作描述")
    ip_address = models.GenericIPAddressField(verbose_name="IP地址")
    user_agent = models.TextField(blank=True, verbose_name="用户代理")
    request_data = models.JSONField(default=dict, blank=True, verbose_name="请求数据")
    response_data = models.JSONField(default=dict, blank=True, verbose_name="响应数据")
    status_code = models.IntegerField(default=200, verbose_name="状态码")
    execution_time = models.FloatField(default=0.0, verbose_name="执行时间(秒)")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="操作时间")

    class Meta:
        verbose_name = "操作日志"
        verbose_name_plural = "操作日志"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'operation_type']),
            models.Index(fields=['model_name', 'object_id']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.get_operation_type_display()} - {self.description}"

class Permission(models.Model):
    """权限模型"""
    PERMISSION_TYPES = [
        ('supply', '耗材管理'),
        ('inventory', '库存管理'),
        ('user', '用户管理'),
        ('system', '系统管理'),
        ('report', '报表管理'),
    ]
    
    name = models.CharField(max_length=100, unique=True, verbose_name="权限名称")
    codename = models.CharField(max_length=100, unique=True, verbose_name="权限代码")
    permission_type = models.CharField(max_length=20, choices=PERMISSION_TYPES, verbose_name="权限类型")
    description = models.TextField(blank=True, verbose_name="权限描述")
    is_active = models.BooleanField(default=True, verbose_name="是否激活")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")

    class Meta:
        verbose_name = "权限"
        verbose_name_plural = "权限"
        ordering = ['permission_type', 'name']

    def __str__(self):
        return f"{self.get_permission_type_display()} - {self.name}"

class Menu(models.Model):
    """菜单模型"""
    MENU_TYPES = [
        ('menu', '菜单'),
        ('page', '页面'),
        ('button', '按钮'),
    ]
    
    DISPLAY_POSITIONS = [
        ('sidebar', '侧边栏'),
        ('navbar', '导航栏'),
        ('both', '侧边栏和导航栏'),
    ]
    
    name = models.CharField(max_length=100, verbose_name='菜单名称')
    path = models.CharField(max_length=200, blank=True, verbose_name='路由路径')
    component = models.CharField(max_length=200, blank=True, verbose_name='组件路径')
    icon = models.CharField(max_length=100, blank=True, verbose_name='图标')
    menu_type = models.CharField(
        max_length=20, 
        choices=MENU_TYPES, 
        default='menu', 
        verbose_name='菜单类型'
    )
    order = models.IntegerField(default=0, verbose_name='排序')
    is_visible = models.BooleanField(default=True, verbose_name='是否可见')
    is_active = models.BooleanField(default=True, verbose_name='是否激活')
    display_position = models.CharField(
        max_length=20,
        choices=DISPLAY_POSITIONS,
        default='sidebar',
        verbose_name='显示位置'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    # 层级结构
    parent = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        blank=True, 
        null=True, 
        related_name='children', 
        verbose_name='父菜单'
    )
    
    # 权限控制
    permissions = models.ManyToManyField(
        Permission, 
        blank=True, 
        verbose_name='所需权限'
    )
    roles = models.ManyToManyField(
        UserRole, 
        blank=True, 
        verbose_name='可访问角色'
    )

    class Meta:
        verbose_name = '菜单'
        verbose_name_plural = '菜单'
        ordering = ['order', 'id']
        unique_together = [('name', 'parent')]

    def __str__(self):
        return self.name

    def get_children(self):
        """获取子菜单"""
        return self.children.filter(is_active=True, is_visible=True).order_by('order')

    def get_all_children(self):
        """递归获取所有子菜单"""
        children = []
        for child in self.get_children():
            children.append(child)
            children.extend(child.get_all_children())
        return children

    def get_breadcrumb(self):
        """获取面包屑路径"""
        breadcrumb = [self]
        parent = self.parent
        while parent:
            breadcrumb.insert(0, parent)
            parent = parent.parent
        return breadcrumb

class PasswordResetToken(models.Model):
    """密码重置令牌模型"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='用户')
    token = models.CharField(max_length=100, unique=True, verbose_name='重置令牌')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    used = models.BooleanField(default=False, verbose_name='是否已使用')
    expires_at = models.DateTimeField(verbose_name='过期时间')
    
    class Meta:
        verbose_name = '密码重置令牌'
        verbose_name_plural = '密码重置令牌'
        
    def __str__(self):
        return f'{self.user.username} - {self.token[:8]}...'
    
    def is_valid(self):
        """检查令牌是否有效"""
        from django.utils import timezone
        return not self.used and timezone.now() < self.expires_at
    
    def mark_as_used(self):
        """标记令牌为已使用"""
        self.used = True
        self.save()
