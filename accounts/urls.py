from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    DepartmentViewSet, JobTitleViewSet,
    UserRoleViewSet, UserViewSet, UserProfileViewSet, PermissionViewSet, 
    MenuViewSet, OperationLogViewSet,
    CustomTokenObtainPairView, user_info, logout, register, avatar_upload, avatar_delete, check_employee_id, change_password,
    forgot_password, reset_password
)

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet)
router.register(r'job-titles', JobTitleViewSet)
router.register(r'roles', UserRoleViewSet)
router.register(r'users', UserViewSet)
router.register(r'profiles', UserProfileViewSet)
router.register(r'permissions', PermissionViewSet)
router.register(r'menus', MenuViewSet)
router.register(r'logs', OperationLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('user/info/', user_info, name='user_info'),
    path('logout/', logout, name='logout'),
    path('register/', register, name='register'),
    path('upload-avatar/', avatar_upload, name='avatar_upload'),
    path('delete-avatar/', avatar_delete, name='avatar_delete'),
    path('check-employee-id/', check_employee_id, name='check_employee_id'),
    path('change-password/', change_password, name='change_password'),
    path('forgot-password/', forgot_password, name='forgot_password'),
    path('reset-password/', reset_password, name='reset_password'),
] 