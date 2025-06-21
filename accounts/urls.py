from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, logout, UserViewSet,
    DepartmentViewSet, PositionViewSet, JobTitleViewSet,
    UserRoleViewSet, UserProfileViewSet, PermissionViewSet,
    MenuViewSet, OperationLogViewSet, user_info
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'positions', PositionViewSet)
router.register(r'job-titles', JobTitleViewSet)
router.register(r'roles', UserRoleViewSet)
router.register(r'profiles', UserProfileViewSet)
router.register(r'permissions', PermissionViewSet)
router.register(r'menus', MenuViewSet)
router.register(r'logs', OperationLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', logout, name='logout'),
    path('user/', user_info, name='user_info'),
] 