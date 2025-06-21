from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from .models import UserProfile, UserRole, OperationLog, Menu, Department, Position, JobTitle, Permission
from django.contrib.auth import authenticate
from django.utils import timezone
from .serializers import (
    MenuSerializer, MenuTreeSerializer, MenuDetailSerializer, 
    UserSerializer, UserCreateSerializer, UserUpdateSerializer, UserPasswordSerializer,
    DepartmentSerializer, DepartmentTreeSerializer, PositionSerializer, JobTitleSerializer, 
    UserRoleSerializer, UserProfileSerializer, PermissionSerializer, OperationLogSerializer, 
    BatchUpdateSerializer, MenuBatchUpdateSerializer
)
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

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
            if profile and profile.role:
                data['user']['role'] = {
                    'id': profile.role.id,
                    'name': profile.role.name,
                    'display_name': profile.role.get_name_display(),
                    'permissions': [
                        perm.codename if hasattr(perm, 'codename') else perm
                        for perm in (profile.role.permissions.all() if hasattr(profile.role.permissions, 'all') else profile.role.permissions)
                    ],
                }
                # 使用序列化器序列化 department 和 position
                if profile.department:
                    data['user']['department'] = DepartmentSerializer(profile.department).data
                else:
                    data['user']['department'] = None
                    
                if profile.position:
                    data['user']['position'] = PositionSerializer(profile.position).data
                else:
                    data['user']['position'] = None
            else:
                data['user']['role'] = None
                data['user']['department'] = None
                data['user']['position'] = None
        except UserProfile.DoesNotExist:
            data['user']['role'] = None
            data['user']['department'] = None
            data['user']['position'] = None
        
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
                'department': profile.department if profile else '',
                'position': profile.position if profile else '',
                'phone': profile.phone if profile else '',
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
                'position': '',
                'phone': '',
            }
        
        # 记录操作日志
        try:
            OperationLog.objects.create(
                user=user,
                operation_type='view',
                model_name='User',
                object_id=str(user.id),
                description=f'查看用户信息: {user.username}',
                ip_address=request.client_ip if hasattr(request, 'client_ip') else '127.0.0.1',
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                status_code=200,
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
                profile.department = data['department']
            if 'position' in data:
                profile.position = data['position']
            if 'phone' in data:
                profile.phone = data['phone']
            
            profile.save()
            
            # 记录操作日志
            try:
                OperationLog.objects.create(
                    user=user,
                    operation_type='update',
                    model_name='User',
                    object_id=str(user.id),
                    description=f'更新用户信息: {user.username}',
                    ip_address=request.client_ip if hasattr(request, 'client_ip') else '127.0.0.1',
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    status_code=200,
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
                'department': profile.department,
                'position': profile.position,
                'phone': profile.phone,
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
            OperationLog.objects.create(
                user=user,
                operation_type='create',
                model_name='User',
                object_id=str(user.id),
                description=f'用户注册: {username}',
                ip_address=request.client_ip if hasattr(request, 'client_ip') else '127.0.0.1',
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                status_code=201,
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
    """用户登出"""
    try:
        # 获取refresh token
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        # 记录操作日志
        OperationLog.objects.create(
            user=request.user,
            operation_type='logout',
            model_name='User',
            object_id=str(request.user.id),
            description=f'用户登出: {request.user.username}',
            ip_address=request.client_ip if hasattr(request, 'client_ip') else '127.0.0.1',
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            status_code=200,
        )
        
        return Response({'msg': '登出成功'})
        
    except Exception as e:
        return Response({'error': '登出失败'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
    permission_classes = [IsAdminUser]  # 只有管理员可以管理用户

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer

    def perform_create(self, serializer):
        """创建用户时自动创建profile"""
        user = serializer.save()
        # 自动创建用户profile
        UserProfile.objects.get_or_create(user=user)
        # 记录操作日志
        OperationLog.objects.create(
            user=self.request.user,
            operation_type='create',
            model_name='User',
            object_id=str(user.id),
            description=f'创建用户: {user.username}',
            ip_address=self.request.META.get('REMOTE_ADDR', ''),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
            status_code=201,
        )

    def perform_update(self, serializer):
        """更新用户时记录日志"""
        user = serializer.save()
        OperationLog.objects.create(
            user=self.request.user,
            operation_type='update',
            model_name='User',
            object_id=str(user.id),
            description=f'更新用户: {user.username}',
            ip_address=self.request.META.get('REMOTE_ADDR', ''),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
            status_code=200,
        )

    def perform_destroy(self, instance):
        """删除用户时记录日志"""
        username = instance.username
        instance.delete()
        OperationLog.objects.create(
            user=self.request.user,
            operation_type='delete',
            model_name='User',
            object_id=str(instance.id),
            description=f'删除用户: {username}',
            ip_address=self.request.META.get('REMOTE_ADDR', ''),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
            status_code=204,
        )

    @action(detail=False, methods=['get'])
    def me(self, request):
        """获取当前用户信息"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """重置指定用户密码"""
        try:
            user = self.get_object()
            serializer = UserPasswordSerializer(data=request.data)
            if serializer.is_valid():
                user.set_password(serializer.validated_data['password'])
                user.save()
                OperationLog.objects.create(
                    user=request.user,
                    operation_type='update',
                    model_name='User',
                    object_id=str(user.id),
                    description=f'重置用户密码: {user.username}',
                    ip_address=request.META.get('REMOTE_ADDR', ''),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    status_code=200,
                )
                return Response({'message': f'用户 {user.username} 密码重置成功'})
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'error': '用户不存在'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """切换用户激活状态"""
        try:
            user = self.get_object()
            user.is_active = not user.is_active
            user.save()
            status_text = '激活' if user.is_active else '禁用'
            OperationLog.objects.create(
                user=request.user,
                operation_type='update',
                model_name='User',
                object_id=str(user.id),
                description=f'{status_text}用户: {user.username}',
                ip_address=request.META.get('REMOTE_ADDR', ''),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                status_code=200,
            )
            return Response({
                'message': f'用户 {user.username} {status_text}成功',
                'is_active': user.is_active
            })
        except User.DoesNotExist:
            return Response({'error': '用户不存在'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def batch_delete(self, request):
        """批量删除用户"""
        user_ids = request.data.get('user_ids', [])
        if not user_ids:
            return Response({'error': '请选择要删除的用户'}, status=status.HTTP_400_BAD_REQUEST)
        
        users = User.objects.filter(id__in=user_ids)
        usernames = list(users.values_list('username', flat=True))
        users.delete()
        
        OperationLog.objects.create(
            user=request.user,
            operation_type='delete',
            model_name='User',
            object_id=','.join(map(str, user_ids)),
            description=f'批量删除用户: {", ".join(usernames)}',
            ip_address=request.META.get('REMOTE_ADDR', ''),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            status_code=200,
        )
        
        return Response({
            'message': f'成功删除 {len(usernames)} 个用户',
            'deleted_users': usernames
        })

class DepartmentViewSet(viewsets.ModelViewSet):
    """部门管理视图集"""
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
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

class PositionViewSet(viewsets.ModelViewSet):
    """职位管理视图集"""
    queryset = Position.objects.all()
    serializer_class = PositionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'department']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    @action(detail=False, methods=['post'])
    def batch_update(self, request):
        """批量更新职位状态"""
        serializer = BatchUpdateSerializer(data=request.data)
        if serializer.is_valid():
            ids = serializer.validated_data['ids']
            is_active = serializer.validated_data.get('is_active')
            
            queryset = Position.objects.filter(id__in=ids)
            if is_active is not None:
                queryset.update(is_active=is_active)
            
            return Response({'message': f'成功更新 {queryset.count()} 个职位'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class JobTitleViewSet(viewsets.ModelViewSet):
    """职称管理视图集"""
    queryset = JobTitle.objects.all()
    serializer_class = JobTitleSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'level']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'level', 'created_at']
    ordering = ['level', 'name']

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
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'role', 'department', 'position', 'job_title']
    search_fields = ['user__username', 'user__email', 'user__first_name', 'user__last_name']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

class PermissionViewSet(viewsets.ModelViewSet):
    """权限管理视图集"""
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
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
