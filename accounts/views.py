from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from .models import UserProfile, UserRole, OperationLog, Menu, Department, JobTitle, Permission, PasswordResetToken
from django.contrib.auth import authenticate
from django.utils import timezone
from .serializers import (
    MenuSerializer, MenuTreeSerializer, MenuDetailSerializer, 
    UserSerializer, UserCreateSerializer, UserUpdateSerializer, UserPasswordSerializer,
    DepartmentSerializer, DepartmentTreeSerializer, JobTitleSerializer, 
    UserRoleSerializer, UserProfileSerializer, PermissionSerializer, OperationLogSerializer, 
    BatchUpdateSerializer, MenuBatchUpdateSerializer
)
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
import json
from django.core.serializers.json import DjangoJSONEncoder

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # 更新用户最后登录时间
        self.user.last_login = timezone.now()
        self.user.save(update_fields=['last_login'])
        
        # 更新用户profile的最后登录IP
        try:
            profile = self.user.profile
            if profile:
                # 从请求中获取IP地址
                request = self.context.get('request')
                if request:
                    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
                    if x_forwarded_for:
                        ip = x_forwarded_for.split(',')[0]
                    else:
                        ip = request.META.get('REMOTE_ADDR')
                    profile.last_login_ip = ip
                    profile.save(update_fields=['last_login_ip'])
        except UserProfile.DoesNotExist:
            pass
        
        # 添加用户信息到响应中
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'is_superuser': self.user.is_superuser,
            'is_staff': self.user.is_staff,
            'is_active': self.user.is_active,
            'last_login': self.user.last_login.isoformat() if self.user.last_login else None,
        }
        
        # 添加用户角色信息
        try:
            profile = self.user.profile
            if profile:
                # 添加头像信息
                data['user']['avatar'] = profile.avatar.url if profile.avatar else None
                
                if profile.role:
                    data['user']['role'] = {
                        'id': profile.role.id,
                        'name': profile.role.name,
                        'display_name': profile.role.get_name_display(),
                        'permissions': [
                            perm.codename if hasattr(perm, 'codename') else perm
                            for perm in (profile.role.permissions.all() if hasattr(profile.role.permissions, 'all') else profile.role.permissions)
                        ],
                    }
                else:
                    data['user']['role'] = None
                    
                # 使用序列化器序列化 department
                if profile.department:
                    data['user']['department'] = profile.department.name
                    data['user']['department_id'] = profile.department.id
                else:
                    data['user']['department'] = None
                    data['user']['department_id'] = None
                    
                # 添加职称信息
                if profile.job_title:
                    data['user']['job_title'] = profile.job_title.name
                    data['user']['job_title_id'] = profile.job_title.id
                else:
                    data['user']['job_title'] = None
                    data['user']['job_title_id'] = None
                    
                # 添加工号信息
                data['user']['employee_id'] = profile.employee_id
            else:
                data['user']['avatar'] = None
                data['user']['role'] = None
                data['user']['department'] = None
                data['user']['department_id'] = None
                data['user']['job_title'] = None
                data['user']['job_title_id'] = None
                data['user']['employee_id'] = None
        except UserProfile.DoesNotExist:
            data['user']['avatar'] = None
            data['user']['role'] = None
            data['user']['department'] = None
            data['user']['department_id'] = None
            data['user']['job_title'] = None
            data['user']['job_title_id'] = None
            data['user']['employee_id'] = None
        
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_info(request):
    """获取或更新当前用户信息"""
    user = request.user
    
    if request.method == 'GET':
        # 获取用户信息
        try:
            profile = user.profile
            user_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_superuser': user.is_superuser,
                'is_staff': user.is_staff,
                'is_active': user.is_active,
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'date_joined': user.date_joined.isoformat(),
                'department': profile.department.name if profile and profile.department else '',
                'department_id': profile.department.id if profile and profile.department else None,
                'job_title': profile.job_title.name if profile and profile.job_title else '',
                'job_title_id': profile.job_title.id if profile and profile.job_title else None,
                'phone': profile.phone if profile else '',
                'employee_id': profile.employee_id if profile else '',
                'avatar': profile.avatar.url if profile and profile.avatar else None,
            }
        except UserProfile.DoesNotExist:
            user_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_superuser': user.is_superuser,
                'is_staff': user.is_staff,
                'is_active': user.is_active,
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'date_joined': user.date_joined.isoformat(),
                'department': '',
                'department_id': None,
                'job_title': '',
                'job_title_id': None,
                'phone': '',
                'employee_id': '',
                'avatar': None,
            }
        
        # 记录操作日志
        try:
            log_data = {
                'user_data': user_data,
            }
            log_data_json = json.dumps(log_data, cls=DjangoJSONEncoder)
            
            OperationLog.objects.create(
                user=user,
                operation_type='view',
                model_name='User',
                object_id=str(user.id),
                description=f'查看用户信息: {user.username}',
                ip_address=request.client_ip if hasattr(request, 'client_ip') else '127.0.0.1',
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                status_code=200,
                response_data=json.loads(log_data_json)
            )
        except Exception as e:
            print(f"记录操作日志失败: {e}")
        
        return Response(user_data)
    
    elif request.method == 'PUT':
        # 更新用户信息
        try:
            data = request.data
            
            # 更新用户基本信息
            if 'email' in data:
                user.email = data['email']
                user.save(update_fields=['email'])
            
            # 获取或创建用户profile
            try:
                profile = user.profile
            except UserProfile.DoesNotExist:
                profile = UserProfile.objects.create(user=user)
            
            # 更新profile信息
            if 'department' in data:
                # 如果传入的是None或空值，则清除部门
                if data['department'] is None or data['department'] == '':
                    profile.department = None
                else:
                    try:
                        department = Department.objects.get(id=data['department'])
                        profile.department = department
                    except Department.DoesNotExist:
                        return Response({'error': '指定的部门不存在'}, status=status.HTTP_400_BAD_REQUEST)
            if 'job_title' in data:
                # 如果传入的是None或空值，则清除职称
                if data['job_title'] is None or data['job_title'] == '':
                    profile.job_title = None
                else:
                    try:
                        job_title = JobTitle.objects.get(id=data['job_title'])
                        profile.job_title = job_title
                    except JobTitle.DoesNotExist:
                        return Response({'error': '指定的职称不存在'}, status=status.HTTP_400_BAD_REQUEST)
            if 'phone' in data:
                profile.phone = data['phone']
            if 'employee_id' in data:
                profile.employee_id = data['employee_id']
            
            profile.save()
            
            # 记录操作日志
            try:
                log_data = {
                    'updated_data': data,
                    'user_id': user.id,
                    'username': user.username
                }
                log_data_json = json.dumps(log_data, cls=DjangoJSONEncoder)
                
                OperationLog.objects.create(
                    user=user,
                    operation_type='update',
                    model_name='User',
                    object_id=str(user.id),
                    description=f'更新用户信息: {user.username}',
                    ip_address=request.client_ip if hasattr(request, 'client_ip') else '127.0.0.1',
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    status_code=200,
                    request_data=json.loads(log_data_json)
                )
            except Exception as e:
                print(f"记录操作日志失败: {e}")
            
            # 返回更新后的用户信息
            return Response({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_superuser': user.is_superuser,
                'is_staff': user.is_staff,
                'is_active': user.is_active,
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'date_joined': user.date_joined.isoformat(),
                'department': profile.department.name if profile.department else '',
                'department_id': profile.department.id if profile.department else None,
                'job_title': profile.job_title.name if profile.job_title else '',
                'job_title_id': profile.job_title.id if profile.job_title else None,
                'phone': profile.phone,
                'employee_id': profile.employee_id,
                'avatar': profile.avatar.url if profile.avatar else None,
            })
            
        except Exception as e:
            return Response({'error': f'更新失败: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """用户注册"""
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email')
    
    if not username or not password:
        return Response({'error': '用户名和密码必填'}, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(username=username).exists():
        return Response({'error': '用户名已存在'}, status=status.HTTP_400_BAD_REQUEST)
    
    if email and User.objects.filter(email=email).exists():
        return Response({'error': '邮箱已存在'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # 创建用户
        user = User.objects.create_user(
            username=username, 
            password=password, 
            email=email,
            is_active=True
        )
        
        # 创建用户profile
        UserProfile.objects.create(user=user)
        
        # 记录操作日志
        try:
            log_data = {
                'username': username,
                'email': email,
                'created_user_id': user.id
            }
            log_data_json = json.dumps(log_data, cls=DjangoJSONEncoder)
            
            OperationLog.objects.create(
                user=user,
                operation_type='create',
                model_name='User',
                object_id=str(user.id),
                description=f'用户注册: {username}',
                ip_address=request.client_ip if hasattr(request, 'client_ip') else '127.0.0.1',
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                status_code=201,
                request_data=json.loads(log_data_json)
            )
        except Exception as e:
            print(f"记录操作日志失败: {e}")
        
        return Response({
            'msg': '注册成功',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': '注册失败'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """用户退出"""
    try:
        # 获取refresh token
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        # 记录操作日志
        log_data = {
            'username': request.user.username,
            'user_id': request.user.id
        }
        log_data_json = json.dumps(log_data, cls=DjangoJSONEncoder)
        
        OperationLog.objects.create(
            user=request.user,
            operation_type='logout',
            model_name='User',
            object_id=str(request.user.id),
            description=f'用户退出: {request.user.username}',
            ip_address=request.client_ip if hasattr(request, 'client_ip') else '127.0.0.1',
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            status_code=200,
            request_data=json.loads(log_data_json)
        )
        
        return Response({'msg': '退出成功'})
        
    except Exception as e:
        return Response({'error': '退出失败'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_roles(request):
    """获取所有角色"""
    try:
        roles = UserRole.objects.all()
        role_data = []
        
        for role in roles:
            role_data.append({
                'id': role.id,
                'name': role.name,
                'display_name': role.get_name_display(),
                'description': role.description,
                'permissions': role.permissions,
                'created_at': role.created_at.isoformat(),
            })
        
        return Response(role_data)
        
    except Exception as e:
        return Response({'error': '获取角色失败'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_role(request):
    """分配用户角色"""
    if not request.user.is_superuser:
        return Response({'error': '权限不足'}, status=status.HTTP_403_FORBIDDEN)
    
    user_id = request.data.get('user_id')
    role_id = request.data.get('role_id')
    
    if not user_id or not role_id:
        return Response({'error': '用户ID和角色ID必填'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        role = UserRole.objects.get(id=role_id)
        
        profile, created = UserProfile.objects.get_or_create(user=user)
        profile.role = role
        profile.save()
        
        # 记录操作日志
        OperationLog.objects.create(
            user=request.user,
            operation_type='update',
            model_name='UserProfile',
            object_id=str(profile.id),
            description=f'分配角色: {user.username} -> {role.get_name_display()}',
            ip_address=request.client_ip if hasattr(request, 'client_ip') else '127.0.0.1',
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            status_code=200,
        )
        
        return Response({
            'msg': '角色分配成功',
            'user': {
                'id': user.id,
                'username': user.username,
                'role': {
                    'id': role.id,
                    'name': role.name,
                    'display_name': role.get_name_display(),
                }
            }
        })
        
    except User.DoesNotExist:
        return Response({'error': '用户不存在'}, status=status.HTTP_404_NOT_FOUND)
    except UserRole.DoesNotExist:
        return Response({'error': '角色不存在'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': '角色分配失败'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Menu相关视图
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def menu_list(request):
    """获取菜单列表"""
    try:
        # 获取根菜单（没有父菜单的菜单）
        root_menus = Menu.objects.filter(parent=None, is_active=True, is_visible=True).order_by('order')
        serializer = MenuTreeSerializer(root_menus, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def menu_detail(request, menu_id):
    """获取菜单详情"""
    try:
        menu = Menu.objects.get(id=menu_id)
        serializer = MenuDetailSerializer(menu)
        return Response({
            'success': True,
            'data': serializer.data
        })
    except Menu.DoesNotExist:
        return Response({
            'success': False,
            'message': '菜单不存在'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def menu_create(request):
    """创建菜单"""
    try:
        serializer = MenuSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'data': serializer.data,
                'message': '菜单创建成功'
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'success': False,
                'message': '数据验证失败',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def menu_update(request, menu_id):
    """更新菜单"""
    try:
        menu = Menu.objects.get(id=menu_id)
        serializer = MenuSerializer(menu, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'data': serializer.data,
                'message': '菜单更新成功'
            })
        else:
            return Response({
                'success': False,
                'message': '数据验证失败',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    except Menu.DoesNotExist:
        return Response({
            'success': False,
            'message': '菜单不存在'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def menu_delete(request, menu_id):
    """删除菜单"""
    try:
        menu = Menu.objects.get(id=menu_id)
        # 检查是否有子菜单
        if menu.children.exists():
            return Response({
                'success': False,
                'message': '该菜单下有子菜单，无法删除'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        menu.delete()
        return Response({
            'success': True,
            'message': '菜单删除成功'
        })
    except Menu.DoesNotExist:
        return Response({
            'success': False,
            'message': '菜单不存在'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def menu_tree(request):
    """获取菜单树结构"""
    try:
        # 获取所有根菜单
        root_menus = Menu.objects.filter(parent=None, is_active=True).order_by('order')
        serializer = MenuTreeSerializer(root_menus, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def menu_batch_update(request):
    """批量更新菜单"""
    try:
        menus_data = request.data.get('menus', [])
        updated_menus = []
        
        for menu_data in menus_data:
            menu_id = menu_data.get('id')
            if menu_id:
                try:
                    menu = Menu.objects.get(id=menu_id)
                    serializer = MenuSerializer(menu, data=menu_data, partial=True)
                    if serializer.is_valid():
                        serializer.save()
                        updated_menus.append(serializer.data)
                except Menu.DoesNotExist:
                    continue
        
        return Response({
            'success': True,
            'data': updated_menus,
            'message': f'成功更新 {len(updated_menus)} 个菜单'
        })
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserViewSet(viewsets.ModelViewSet):
    """用户管理视图集"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'is_staff', 'is_superuser']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['username', 'date_joined', 'last_login']
    ordering = ['username']
    permission_classes = [IsAuthenticated]  # 修改为已认证用户即可访问，而不仅仅是管理员

    def get_permissions(self):
        """
        根据操作类型设置不同的权限
        """
        if self.action in ['create', 'destroy', 'batch_delete']:
            # 对于创建和删除操作，需要管理员权限
            permission_classes = [IsAdminUser]
        elif self.action in ['update', 'partial_update', 'reset_password', 'toggle_status']:
            # 对于更新操作，需要员工权限（is_staff=True）或超级用户权限
            permission_classes = [IsAuthenticated]  # 我们将在下面的方法中进行更细粒度的权限检查
        else:
            # 对于读取操作，已认证用户即可
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def check_object_permissions(self, request, obj):
        """
        检查对象级权限 - 允许员工或超级用户更新用户信息
        """
        super().check_object_permissions(request, obj)
        
        if self.action in ['update', 'partial_update', 'reset_password', 'toggle_status']:
            # 只有员工（is_staff=True）或超级用户可以更新用户信息
            if not (request.user.is_staff or request.user.is_superuser):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("您需要员工权限才能执行此操作。")

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer

    def perform_create(self, serializer):
        """创建用户时的额外处理"""
        # 保存用户实例
        user = serializer.save()
        
        # 记录操作日志
        try:
            log_data = {
                'created_user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_active': user.is_active,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser,
                }
            }
            log_data_json = json.dumps(log_data, cls=DjangoJSONEncoder)
            
            OperationLog.objects.create(
                user=self.request.user,
                operation_type='create',
                model_name='User',
                object_id=str(user.id),
                description=f'创建用户: {user.username}',
                ip_address=getattr(self.request, 'client_ip', '127.0.0.1'),
                user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
                status_code=201,
                request_data=json.loads(log_data_json)
            )
        except Exception as e:
            print(f"记录操作日志失败: {e}")

    def perform_update(self, serializer):
        """更新用户时的额外处理"""
        user = serializer.save()
        
        # 记录操作日志
        try:
            log_data = {
                'updated_user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_active': user.is_active,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser,
                },
                'updated_fields': list(serializer.validated_data.keys()) if hasattr(serializer, 'validated_data') else []
            }
            log_data_json = json.dumps(log_data, cls=DjangoJSONEncoder)
            
            OperationLog.objects.create(
                user=self.request.user,
                operation_type='update',
                model_name='User',
                object_id=str(user.id),
                description=f'更新用户: {user.username}',
                ip_address=getattr(self.request, 'client_ip', '127.0.0.1'),
                user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
                status_code=200,
                request_data=json.loads(log_data_json)
            )
        except Exception as e:
            print(f"记录操作日志失败: {e}")

    def perform_destroy(self, instance):
        """删除用户时的额外处理"""
        user_data = {
            'id': instance.id,
            'username': instance.username,
            'email': instance.email,
        }
        
        # 记录操作日志
        try:
            log_data = {
                'deleted_user': user_data
            }
            log_data_json = json.dumps(log_data, cls=DjangoJSONEncoder)
            
            OperationLog.objects.create(
                user=self.request.user,
                operation_type='delete',
                model_name='User',
                object_id=str(instance.id),
                description=f'删除用户: {instance.username}',
                ip_address=getattr(self.request, 'client_ip', '127.0.0.1'),
                user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
                status_code=204,
                request_data=json.loads(log_data_json)
            )
        except Exception as e:
            print(f"记录操作日志失败: {e}")
        
        # 删除用户
        instance.delete()

    @action(detail=False, methods=['get'])
    def me(self, request):
        """获取当前用户信息"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """重置用户密码"""
        user = self.get_object()
        serializer = UserPasswordSerializer(data=request.data)
        
        if serializer.is_validated():
            user.set_password(serializer.validated_data['password'])
            user.save()
            
            # 记录操作日志
            try:
                log_data = {
                    'reset_password_for': {
                        'user_id': user.id,
                        'username': user.username
                    }
                }
                log_data_json = json.dumps(log_data, cls=DjangoJSONEncoder)
                
                OperationLog.objects.create(
                    user=request.user,
                    operation_type='update',
                    model_name='User',
                    object_id=str(user.id),
                    description=f'重置用户密码: {user.username}',
                    ip_address=getattr(request, 'client_ip', '127.0.0.1'),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    status_code=200,
                    request_data=json.loads(log_data_json)
                )
            except Exception as e:
                print(f"记录操作日志失败: {e}")
            
            return Response({'message': '密码重置成功'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """切换用户状态"""
        user = self.get_object()
        target_status = request.data.get('status')
        
        try:
            profile = user.profile
            if not profile:
                profile = UserProfile.objects.create(user=user)
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=user)
        
        old_status = profile.status
        
        # 如果指定了目标状态，直接设置
        if target_status and target_status in ['active', 'inactive', 'disabled']:
            profile.status = target_status
        else:
            # 否则按顺序循环：active -> disabled -> inactive -> active
            status_cycle = {
                'active': 'disabled',
                'disabled': 'inactive', 
                'inactive': 'active'
            }
            profile.status = status_cycle.get(profile.status, 'active')
        
        profile.save()
        
        # 同时更新User表的is_active字段以保持兼容性
        user.is_active = (profile.status == 'active')
        user.save()
        
        # 记录操作日志
        try:
            log_data = {
                'toggle_status_for': {
                    'user_id': user.id,
                    'username': user.username,
                    'old_status': old_status,
                    'new_status': profile.status
                }
            }
            log_data_json = json.dumps(log_data, cls=DjangoJSONEncoder)
            
            OperationLog.objects.create(
                user=request.user,
                operation_type='update',
                model_name='User',
                object_id=str(user.id),
                description=f'切换用户状态: {user.username} -> {profile.status_display}',
                ip_address=getattr(request, 'client_ip', '127.0.0.1'),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                status_code=200,
                request_data=json.loads(log_data_json)
            )
        except Exception as e:
            print(f"记录操作日志失败: {e}")
        
        return Response({
            'message': f'用户状态已更改为：{profile.status_display}',
            'status': profile.status,
            'is_active': user.is_active
        })

    @action(detail=False, methods=['post'])
    def batch_delete(self, request):
        """批量删除用户"""
        user_ids = request.data.get('user_ids', [])
        
        if not user_ids:
            return Response({'error': '请选择要删除的用户'}, status=status.HTTP_400_BAD_REQUEST)
        
        deleted_users = []
        for user_id in user_ids:
            try:
                user = User.objects.get(id=user_id)
                # 不允许删除超级用户
                if user.is_superuser:
                    continue
                deleted_users.append({
                    'id': user.id,
                    'username': user.username
                })
                user.delete()
            except User.DoesNotExist:
                continue
        
        # 记录操作日志
        try:
            log_data = {
                'batch_deleted_users': deleted_users,
                'total_count': len(deleted_users)
            }
            log_data_json = json.dumps(log_data, cls=DjangoJSONEncoder)
            
            OperationLog.objects.create(
                user=request.user,
                operation_type='delete',
                model_name='User',
                object_id='',
                description=f'批量删除用户: {len(deleted_users)}个',
                ip_address=getattr(request, 'client_ip', '127.0.0.1'),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                status_code=200,
                request_data=json.loads(log_data_json)
            )
        except Exception as e:
            print(f"记录操作日志失败: {e}")
        
        return Response({
            'message': f'成功删除 {len(deleted_users)} 个用户',
            'deleted_users': deleted_users
                  })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """用户修改自己的密码"""
    user = request.user
    
    # 验证请求数据
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if not old_password:
        return Response({'error': '请输入当前密码'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not new_password:
        return Response({'error': '请输入新密码'}, status=status.HTTP_400_BAD_REQUEST)
    
    if len(new_password) < 8:
        return Response({'error': '新密码至少需要8位字符'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 验证当前密码
    if not user.check_password(old_password):
        return Response({'error': '当前密码不正确'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 检查新密码是否与当前密码相同
    if user.check_password(new_password):
        return Response({'error': '新密码不能与当前密码相同'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # 设置新密码
        user.set_password(new_password)
        user.save()
        
        # 记录操作日志
        try:
            log_data = {
                'change_own_password': {
                    'user_id': user.id,
                    'username': user.username
                }
            }
            log_data_json = json.dumps(log_data, cls=DjangoJSONEncoder)
            
            OperationLog.objects.create(
                user=user,
                operation_type='update',
                model_name='User',
                object_id=str(user.id),
                description=f'修改密码: {user.username}',
                ip_address=getattr(request, 'client_ip', '127.0.0.1'),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                status_code=200,
                request_data=json.loads(log_data_json)
            )
        except Exception as e:
            print(f"记录操作日志失败: {e}")
        
        return Response({'message': '密码修改成功'}, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': f'密码修改失败: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DepartmentViewSet(viewsets.ModelViewSet):
    """部门管理视图集"""
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]  # 添加权限设置
    pagination_class = None  # 关闭分页，返回所有数据
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'parent']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_serializer_class(self):
        if self.action == 'tree':
            return DepartmentTreeSerializer
        return DepartmentSerializer

    @action(detail=False, methods=['get'])
    def tree(self, request):
        """获取部门树形结构"""
        departments = Department.objects.filter(parent=None, is_active=True)
        serializer = self.get_serializer(departments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def batch_update(self, request):
        """批量更新部门状态"""
        serializer = BatchUpdateSerializer(data=request.data)
        if serializer.is_valid():
            ids = serializer.validated_data['ids']
            is_active = serializer.validated_data.get('is_active')
            
            queryset = Department.objects.filter(id__in=ids)
            if is_active is not None:
                queryset.update(is_active=is_active)
            
            return Response({'message': f'成功更新 {queryset.count()} 个部门'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class JobTitleViewSet(viewsets.ModelViewSet):
    """职称管理视图集"""
    queryset = JobTitle.objects.all()  # 保留queryset属性供Django REST framework使用
    serializer_class = JobTitleSerializer
    permission_classes = [IsAuthenticated]  # 添加权限设置
    pagination_class = None  # 关闭分页，返回所有数据
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'level']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'level', 'created_at']
    
    def get_queryset(self):
        """自定义查询集，按职称级别从高到低排序"""
        from django.db.models import Case, When, IntegerField
        
        # 定义职称级别的排序权重
        level_order = Case(
            When(level='正高级', then=1),
            When(level='副高级', then=2),
            When(level='中级', then=3),
            When(level='初级', then=4),
            default=999,
            output_field=IntegerField()
        )
        
        return JobTitle.objects.annotate(
            level_order=level_order
        ).order_by('level_order', 'name')

    @action(detail=False, methods=['post'])
    def batch_update(self, request):
        """批量更新职称状态"""
        serializer = BatchUpdateSerializer(data=request.data)
        if serializer.is_valid():
            ids = serializer.validated_data['ids']
            is_active = serializer.validated_data.get('is_active')
            
            queryset = JobTitle.objects.filter(id__in=ids)
            if is_active is not None:
                queryset.update(is_active=is_active)
            
            return Response({'message': f'成功更新 {queryset.count()} 个职称'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserRoleViewSet(viewsets.ModelViewSet):
    """用户角色管理视图集"""
    queryset = UserRole.objects.all()
    serializer_class = UserRoleSerializer
    permission_classes = [IsAuthenticated]  # 添加权限设置
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['name']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    @action(detail=False, methods=['post'])
    def batch_update(self, request):
        """批量更新角色状态"""
        serializer = BatchUpdateSerializer(data=request.data)
        if serializer.is_valid():
            ids = serializer.validated_data['ids']
            is_active = serializer.validated_data.get('is_active')
            
            queryset = UserRole.objects.filter(id__in=ids)
            if is_active is not None:
                queryset.update(is_active=is_active)
            
            return Response({'message': f'成功更新 {queryset.count()} 个角色'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileViewSet(viewsets.ModelViewSet):
    """用户信息管理视图集"""
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]  # 添加权限设置
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'role', 'department', 'job_title']
    search_fields = ['user__username', 'user__email', 'user__first_name', 'user__last_name']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

class PermissionViewSet(viewsets.ModelViewSet):
    """权限管理视图集"""
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated]  # 添加权限设置
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'permission_type']
    search_fields = ['name', 'codename', 'description']
    ordering_fields = ['name', 'permission_type', 'created_at']
    ordering = ['permission_type', 'name']

    @action(detail=False, methods=['post'])
    def batch_update(self, request):
        """批量更新权限状态"""
        serializer = BatchUpdateSerializer(data=request.data)
        if serializer.is_valid():
            ids = serializer.validated_data['ids']
            is_active = serializer.validated_data.get('is_active')
            
            queryset = Permission.objects.filter(id__in=ids)
            if is_active is not None:
                queryset.update(is_active=is_active)
            
            return Response({'message': f'成功更新 {queryset.count()} 个权限'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MenuViewSet(viewsets.ModelViewSet):
    """菜单管理视图集"""
    queryset = Menu.objects.all()
    serializer_class = MenuSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'is_visible', 'menu_type', 'parent']
    search_fields = ['name', 'path', 'component']
    ordering_fields = ['name', 'order', 'created_at']
    ordering = ['order', 'id']
    pagination_class = None  # 禁用分页，返回所有菜单项

    def get_permissions(self):
        """根据操作类型设置权限"""
        if self.action in ['list', 'tree']:
            # 允许未认证用户查看菜单列表和树形结构
            permission_classes = [AllowAny]
        else:
            # 其他操作需要认证
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        if self.action == 'tree':
            return MenuTreeSerializer
        elif self.action == 'retrieve':
            return MenuDetailSerializer
        return MenuSerializer

    @action(detail=False, methods=['get'])
    def tree(self, request):
        """获取菜单树形结构"""
        menus = Menu.objects.filter(parent=None, is_active=True, is_visible=True).order_by('order')
        serializer = self.get_serializer(menus, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def batch_update(self, request):
        """批量更新菜单"""
        serializer = MenuBatchUpdateSerializer(data=request.data)
        if serializer.is_valid():
            ids = serializer.validated_data['ids']
            is_active = serializer.validated_data.get('is_active')
            is_visible = serializer.validated_data.get('is_visible')
            parent = serializer.validated_data.get('parent')
            menu_type = serializer.validated_data.get('menu_type')
            
            queryset = Menu.objects.filter(id__in=ids)
            update_data = {}
            
            if is_active is not None:
                update_data['is_active'] = is_active
            if is_visible is not None:
                update_data['is_visible'] = is_visible
            if parent is not None:
                update_data['parent_id'] = parent
            if menu_type is not None:
                update_data['menu_type'] = menu_type
            
            if update_data:
                queryset.update(**update_data)
            
            return Response({'message': f'成功更新 {queryset.count()} 个菜单'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OperationLogViewSet(viewsets.ReadOnlyModelViewSet):
    """操作日志视图集（只读）"""
    queryset = OperationLog.objects.all()
    serializer_class = OperationLogSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['operation_type', 'model_name', 'user', 'status_code']
    search_fields = ['description', 'user__username']
    ordering_fields = ['created_at', 'execution_time']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """自定义查询集，支持user='me'参数"""
        queryset = super().get_queryset()
        user_param = self.request.query_params.get('user')
        
        if user_param == 'me':
            # 只返回当前用户的操作日志
            queryset = queryset.filter(user=self.request.user)
        elif user_param:
            # 如果指定了用户ID，过滤指定用户的日志
            try:
                user_id = int(user_param)
                queryset = queryset.filter(user_id=user_id)
            except (ValueError, TypeError):
                pass
        
        return queryset

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """获取操作日志统计信息"""
        from django.db.models import Count, Avg
        from django.utils import timezone
        from datetime import timedelta
        
        # 最近7天的操作统计
        end_date = timezone.now()
        start_date = end_date - timedelta(days=7)
        
        daily_stats = OperationLog.objects.filter(
            created_at__range=(start_date, end_date)
        ).extra(
            select={'day': 'date(created_at)'}
        ).values('day').annotate(
            count=Count('id'),
            avg_time=Avg('execution_time')
        ).order_by('day')
        
        # 操作类型统计
        operation_stats = OperationLog.objects.values('operation_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # 用户操作统计
        user_stats = OperationLog.objects.values('user__username').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        return Response({
            'daily_stats': list(daily_stats),
            'operation_stats': list(operation_stats),
            'user_stats': list(user_stats)
        })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def avatar_upload(request):
    """上传用户头像"""
    try:
        if 'avatar' not in request.FILES:
            return Response({'error': '请选择头像文件'}, status=status.HTTP_400_BAD_REQUEST)
            
        avatar_file = request.FILES['avatar']
        
        # 检查文件类型
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
        if avatar_file.content_type not in allowed_types:
            return Response({'error': '头像文件格式不支持，请上传 JPG, PNG 或 GIF 格式的图片'}, status=status.HTTP_400_BAD_REQUEST)
            
        # 检查文件大小 (5MB)
        max_size = 5 * 1024 * 1024  # 5MB
        if avatar_file.size > max_size:
            return Response({'error': '头像文件大小不能超过5MB'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        
        # 获取或创建用户profile
        try:
            profile = user.profile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=user)
        
        # 删除旧头像文件
        if profile.avatar:
            try:
                profile.avatar.delete(save=False)
            except:
                pass
        
        # 保存新头像
        profile.avatar = avatar_file
        profile.save()
        
        # 记录操作日志
        try:
            log_data = {
                'user_id': user.id,
                'username': user.username,
                'avatar_file_info': {
                    'name': avatar_file.name,
                    'size': avatar_file.size,
                    'content_type': avatar_file.content_type
                }
            }
            log_data_json = json.dumps(log_data, cls=DjangoJSONEncoder)
            
            OperationLog.objects.create(
                user=user,
                operation_type='update',
                model_name='UserProfile',
                object_id=str(profile.id),
                description=f'上传头像: {user.username}',
                ip_address=getattr(request, 'client_ip', '127.0.0.1'),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                status_code=200,
                request_data=json.loads(log_data_json)
            )
        except Exception as e:
            print(f"记录操作日志失败: {e}")
        
        return Response({
            'message': '头像上传成功',
            'avatar_url': profile.avatar.url
        })
        
    except Exception as e:
        return Response({'error': f'头像上传失败: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def avatar_delete(request):
    """删除用户头像"""
    try:
        user = request.user
        
        # 获取用户profile
        try:
            profile = user.profile
        except UserProfile.DoesNotExist:
            return Response({'error': '用户配置文件不存在'}, status=status.HTTP_404_NOT_FOUND)
        
        if not profile.avatar:
            return Response({'error': '用户未设置头像'}, status=status.HTTP_400_BAD_REQUEST)
        
        # 记录要删除的头像信息
        avatar_info = {
            'url': profile.avatar.url,
            'name': profile.avatar.name
        }
        
        # 删除头像文件
        try:
            profile.avatar.delete(save=False)
        except:
            pass
        
        # 清空数据库中的头像字段
        profile.avatar = None
        profile.save()
        
        # 记录操作日志
        try:
            log_data = {
                'user_id': user.id,
                'username': user.username,
                'deleted_avatar': avatar_info
            }
            log_data_json = json.dumps(log_data, cls=DjangoJSONEncoder)
            
            OperationLog.objects.create(
                user=user,
                operation_type='delete',
                model_name='UserProfile',
                object_id=str(profile.id),
                description=f'删除头像: {user.username}',
                ip_address=getattr(request, 'client_ip', '127.0.0.1'),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                status_code=200,
                request_data=json.loads(log_data_json)
            )
        except Exception as e:
            print(f"记录操作日志失败: {e}")
        
        return Response({'message': '头像删除成功'})
        
    except Exception as e:
        return Response({'error': f'头像删除失败: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_employee_id(request):
    """检查工号是否已存在"""
    employee_id = request.data.get('employee_id')
    
    if not employee_id:
        return Response({'exists': False})
    
    # 查找是否有其他用户使用了相同的工号
    current_user = request.user
    existing_profile = UserProfile.objects.filter(employee_id=employee_id).exclude(user=current_user).first()
    
    if existing_profile:
        return Response({'exists': True})
    else:
        return Response({'exists': False})

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """验证账号并生成密码重置令牌"""
    username = request.data.get('username')
    
    if not username:
        return Response({'error': '请输入账号'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'error': '账号不存在，请检查后重新输入'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 生成重置令牌
    import secrets
    from django.utils import timezone
    from datetime import timedelta
    
    token = secrets.token_urlsafe(32)
    expires_at = timezone.now() + timedelta(hours=24)  # 24小时过期
    
    # 删除用户之前的未使用令牌
    PasswordResetToken.objects.filter(user=user, used=False).delete()
    
    # 创建新令牌
    reset_token = PasswordResetToken.objects.create(
        user=user,
        token=token,
        expires_at=expires_at
    )
    
    # 记录操作日志
    try:
        log_data = {
            'forgot_password': {
                'user_id': user.id,
                'username': user.username
            }
        }
        log_data_json = json.dumps(log_data, cls=DjangoJSONEncoder)
        
        OperationLog.objects.create(
            user=user,
            operation_type='create',
            model_name='PasswordResetToken',
            object_id=str(reset_token.id),
            description=f'请求密码重置: {user.username}',
            ip_address=getattr(request, 'client_ip', '127.0.0.1'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            status_code=200,
            request_data=json.loads(log_data_json)
        )
    except Exception as e:
        print(f"记录操作日志失败: {e}")
    
    return Response({
        'message': '账号验证成功',
        'token': token,
        'username': user.username
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """使用令牌重置密码"""
    token = request.data.get('token')
    new_password = request.data.get('new_password')
    
    if not token:
        return Response({'error': '重置令牌不能为空'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not new_password:
        return Response({'error': '新密码不能为空'}, status=status.HTTP_400_BAD_REQUEST)
    
    if len(new_password) < 8:
        return Response({'error': '新密码至少需要8位字符'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        from .models import PasswordResetToken
        reset_token = PasswordResetToken.objects.get(token=token)
        
        if not reset_token.is_valid():
            return Response({'error': '重置令牌已过期或已使用'}, status=status.HTTP_400_BAD_REQUEST)
        
        # 重置密码
        user = reset_token.user
        user.set_password(new_password)
        user.save()
        
        # 标记令牌为已使用
        reset_token.mark_as_used()
        
        # 记录操作日志
        try:
            log_data = {
                'reset_password_via_token': {
                    'user_id': user.id,
                    'username': user.username,
                    'token_id': reset_token.id
                }
            }
            log_data_json = json.dumps(log_data, cls=DjangoJSONEncoder)
            
            OperationLog.objects.create(
                user=user,
                operation_type='update',
                model_name='User',
                object_id=str(user.id),
                description=f'通过令牌重置密码: {user.username}',
                ip_address=getattr(request, 'client_ip', '127.0.0.1'),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                status_code=200,
                request_data=json.loads(log_data_json)
            )
        except Exception as e:
            print(f"记录操作日志失败: {e}")
        
        return Response({'message': '密码重置成功，请使用新密码登录'}, status=status.HTTP_200_OK)
        
    except PasswordResetToken.DoesNotExist:
        return Response({'error': '无效的重置令牌'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': f'密码重置失败: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
