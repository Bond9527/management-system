from django.core.management.base import BaseCommand
from accounts.models import UserProfile, UserRole
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = '为现有用户设置角色'

    def handle(self, *args, **options):
        # 为所有用户创建 profile
        created_profiles = 0
        for user in User.objects.all():
            profile, created = UserProfile.objects.get_or_create(user=user)
            if created:
                created_profiles += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'为 {created_profiles} 个用户创建了 profile')
        )
        
        # 为 admin 用户分配管理员角色
        try:
            admin_user = User.objects.get(username='admin')
            admin_role = UserRole.objects.get(name='admin')
            profile = admin_user.profile
            profile.role = admin_role
            profile.save()
            self.stdout.write(
                self.style.SUCCESS(f'已为 {admin_user.username} 分配 {admin_role.get_name_display()} 角色')
            )
        except (User.DoesNotExist, UserRole.DoesNotExist) as e:
            self.stdout.write(
                self.style.WARNING(f'分配管理员角色失败: {e}')
            )
        
        # 为其他用户分配普通用户角色
        try:
            user_role = UserRole.objects.get(name='user')
            other_users = User.objects.exclude(username='admin')
            assigned_count = 0
            
            for user in other_users:
                profile = user.profile
                if not profile.role:
                    profile.role = user_role
                    profile.save()
                    assigned_count += 1
            
            self.stdout.write(
                self.style.SUCCESS(f'为 {assigned_count} 个用户分配了普通用户角色')
            )
        except UserRole.DoesNotExist:
            self.stdout.write(
                self.style.WARNING('普通用户角色不存在')
            )
        
        # 显示所有用户角色分配情况
        self.stdout.write('\n=== 用户角色分配情况 ===')
        for user in User.objects.all():
            role_name = user.profile.role.get_name_display() if user.profile.role else '无角色'
            self.stdout.write(f'{user.username}: {role_name}')
        
        self.stdout.write(
            self.style.SUCCESS('用户角色设置完成！')
        ) 