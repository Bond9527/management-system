import time
import json
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django.conf import settings
from rest_framework import status
from .models import OperationLog, UserProfile
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.contrib.auth.models import User
from django.core.serializers.json import DjangoJSONEncoder

class PermissionMiddleware(MiddlewareMixin):
    """权限校验中间件"""
    
    def process_request(self, request):
        # 不需要权限校验的路径
        exempt_paths = [
            '/api/auth/login/',
            '/api/auth/register/',
            '/api/auth/refresh/',
            '/api/auth/verify/',
            '/api/auth/logout/',
            '/api/user/info/',  # 获取用户信息不需要权限
            '/api/menus/',  # 获取菜单不需要权限
            '/api/departments/',  # 获取部门不需要权限
            '/api/job-titles/',  # 获取职称不需要权限
            '/api/roles/',  # 获取角色不需要权限
            '/api/permissions/',  # 获取权限不需要权限
            '/api/upload-avatar/',  # 上传头像不需要权限
            '/api/delete-avatar/',  # 删除头像不需要权限
            '/admin/',  # Django管理后台
            '/static/',  # 静态文件
            '/media/',  # 媒体文件
        ]
        
        # 检查是否为豁免路径
        for exempt_path in exempt_paths:
            if request.path.startswith(exempt_path):
                return None
        
        # 如果是API请求且用户已认证，检查权限
        if request.path.startswith('/api/') and request.user.is_authenticated:
            # 超级用户拥有所有权限
            if request.user.is_superuser:
                return None
            
            # 检查用户权限
            if not self._check_permissions(request, request.user):
                return JsonResponse({
                    'error': '您没有权限访问此资源',
                    'code': 'PERMISSION_DENIED'
                }, status=403)
        
        return None
    
    def _check_permissions(self, request, user):
        """检查用户权限"""
        try:
            profile = user.profile
            
            # 如果用户没有角色，默认拒绝访问
            if not profile.role:
                return False
            
            # 获取用户角色权限
            role_permissions = profile.role.permissions
            
            # 根据请求路径和方法判断所需权限
            required_permission = self._get_required_permission(request)
            
            if not required_permission:
                return True  # 不需要特殊权限
            
            return required_permission in role_permissions
            
        except UserProfile.DoesNotExist:
            return False
    
    def _get_required_permission(self, request):
        """根据请求获取所需权限"""
        path = request.path
        method = request.method
        
        # 权限映射规则
        permission_rules = {
            # 耗材管理权限
            '/api/supplies/': {
                'GET': 'supply_view',
                'POST': 'supply_create',
                'PUT': 'supply_update',
                'PATCH': 'supply_update',
                'DELETE': 'supply_delete',
            },
            # 库存管理权限
            '/api/inventory/': {
                'GET': 'inventory_view',
                'POST': 'inventory_create',
                'PUT': 'inventory_update',
                'PATCH': 'inventory_update',
                'DELETE': 'inventory_delete',
            },
            # 用户管理权限
            '/api/users/': {
                'GET': 'user_view',
                'POST': 'user_create',
                'PUT': 'user_update',
                'PATCH': 'user_update',
                'DELETE': 'user_delete',
            },
            # 系统管理权限
            '/api/system/': {
                'GET': 'system_view',
                'POST': 'system_create',
                'PUT': 'system_update',
                'PATCH': 'system_update',
                'DELETE': 'system_delete',
            },
        }
        
        # 查找匹配的权限规则
        for path_prefix, method_permissions in permission_rules.items():
            if path.startswith(path_prefix):
                return method_permissions.get(method)
        
        return None

class OperationLogMiddleware(MiddlewareMixin):
    """操作日志中间件"""
    
    def process_request(self, request):
        # 记录请求开始时间
        request.start_time = time.time()
        
        # 获取客户端IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        request.client_ip = ip
        
        return None
    
    def process_response(self, request, response):
        # 只记录API请求
        if not request.path.startswith('/api/'):
            return response
        
        # 排除不需要记录的路径
        exclude_paths = [
            '/api/auth/login/',
            '/api/auth/refresh/',
            '/api/auth/verify/',
        ]
        
        for path in exclude_paths:
            if request.path.startswith(path):
                return response
        
        # 计算执行时间
        execution_time = 0
        if hasattr(request, 'start_time'):
            execution_time = time.time() - request.start_time
        
        # 获取请求数据
        request_data = {}
        if request.method in ['POST', 'PUT', 'PATCH']:
            try:
                if request.content_type == 'application/json':
                    request_data = json.loads(request.body.decode('utf-8'))
                else:
                    request_data = dict(request.POST)
            except:
                request_data = {}
        
        # 获取响应数据
        response_data = {}
        if hasattr(response, 'data'):
            response_data = response.data
        
        # 确定操作类型
        operation_type = self._get_operation_type(request.method, request.path)
        
        # 确定模型名称
        model_name = self._get_model_name(request.path)
        
        # 确定对象ID
        object_id = self._get_object_id(request.path)
        
        # 创建操作描述
        description = self._create_description(request, operation_type, model_name)
        
        # 记录日志
        if hasattr(request, 'user') and request.user.is_authenticated:
            try:
                # 使用DjangoJSONEncoder来处理datetime对象
                request_data_json = json.dumps(request_data, cls=DjangoJSONEncoder)
                response_data_json = json.dumps(response_data, cls=DjangoJSONEncoder)
                
                # 将JSON字符串转换回字典（这样存储在数据库中时会被正确序列化）
                try:
                    request_data_processed = json.loads(request_data_json)
                    response_data_processed = json.loads(response_data_json)
                except:
                    request_data_processed = {}
                    response_data_processed = {}
                
                OperationLog.objects.create(
                    user=request.user,
                    operation_type=operation_type,
                    model_name=model_name,
                    object_id=object_id,
                    description=description,
                    ip_address=request.client_ip,
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    request_data=request_data_processed,
                    response_data=response_data_processed,
                    status_code=response.status_code,
                    execution_time=execution_time,
                )
            except Exception as e:
                # 记录日志失败不影响正常响应
                print(f"记录操作日志失败: {e}")
        
        return response
    
    def _get_operation_type(self, method, path):
        """根据HTTP方法和路径确定操作类型"""
        if method == 'GET':
            return 'view'
        elif method == 'POST':
            return 'create'
        elif method in ['PUT', 'PATCH']:
            return 'update'
        elif method == 'DELETE':
            return 'delete'
        else:
            return 'view'
    
    def _get_model_name(self, path):
        """根据路径确定模型名称"""
        path_parts = path.strip('/').split('/')
        if len(path_parts) >= 2:
            return path_parts[1].title()
        return 'Unknown'
    
    def _get_object_id(self, path):
        """从路径中提取对象ID"""
        path_parts = path.strip('/').split('/')
        if len(path_parts) >= 3 and path_parts[2].isdigit():
            return path_parts[2]
        return ''
    
    def _create_description(self, request, operation_type, model_name):
        """创建操作描述"""
        method_names = {
            'GET': '查看',
            'POST': '创建',
            'PUT': '更新',
            'PATCH': '更新',
            'DELETE': '删除',
        }
        
        operation_names = {
            'view': '查看',
            'create': '创建',
            'update': '更新',
            'delete': '删除',
        }
        
        method_name = method_names.get(request.method, '操作')
        operation_name = operation_names.get(operation_type, '操作')
        
        return f"{operation_name}{model_name}" 