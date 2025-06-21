from django.core.management.base import BaseCommand
from accounts.models import UserRole, Permission

class Command(BaseCommand):
    help = '初始化权限和角色数据'

    def handle(self, *args, **options):
        # 创建权限
        permissions_data = [
            # 耗材管理权限
            {'name': '查看耗材', 'codename': 'supply_view', 'permission_type': 'supply', 'description': '查看耗材列表和详情'},
            {'name': '创建耗材', 'codename': 'supply_create', 'permission_type': 'supply', 'description': '创建新的耗材'},
            {'name': '更新耗材', 'codename': 'supply_update', 'permission_type': 'supply', 'description': '更新耗材信息'},
            {'name': '删除耗材', 'codename': 'supply_delete', 'permission_type': 'supply', 'description': '删除耗材'},
            
            # 库存管理权限
            {'name': '查看库存', 'codename': 'inventory_view', 'permission_type': 'inventory', 'description': '查看库存记录'},
            {'name': '创建库存记录', 'codename': 'inventory_create', 'permission_type': 'inventory', 'description': '创建库存变动记录'},
            {'name': '更新库存记录', 'codename': 'inventory_update', 'permission_type': 'inventory', 'description': '更新库存记录'},
            {'name': '删除库存记录', 'codename': 'inventory_delete', 'permission_type': 'inventory', 'description': '删除库存记录'},
            
            # 用户管理权限
            {'name': '查看用户', 'codename': 'user_view', 'permission_type': 'user', 'description': '查看用户列表和详情'},
            {'name': '创建用户', 'codename': 'user_create', 'permission_type': 'user', 'description': '创建新用户'},
            {'name': '更新用户', 'codename': 'user_update', 'permission_type': 'user', 'description': '更新用户信息'},
            {'name': '删除用户', 'codename': 'user_delete', 'permission_type': 'user', 'description': '删除用户'},
            
            # 系统管理权限
            {'name': '查看系统', 'codename': 'system_view', 'permission_type': 'system', 'description': '查看系统信息'},
            {'name': '系统配置', 'codename': 'system_config', 'permission_type': 'system', 'description': '系统配置管理'},
            {'name': '查看日志', 'codename': 'system_log', 'permission_type': 'system', 'description': '查看操作日志'},
            
            # 报表管理权限
            {'name': '查看报表', 'codename': 'report_view', 'permission_type': 'report', 'description': '查看各种报表'},
            {'name': '导出报表', 'codename': 'report_export', 'permission_type': 'report', 'description': '导出报表数据'},
        ]
        
        # 创建权限
        created_permissions = 0
        for perm_data in permissions_data:
            permission, created = Permission.objects.get_or_create(
                codename=perm_data['codename'],
                defaults=perm_data
            )
            if created:
                created_permissions += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'成功创建 {created_permissions} 个权限')
        )
        
        # 创建角色
        roles_data = [
            {
                'name': 'admin',
                'description': '系统管理员，拥有所有权限',
                'permissions': [
                    'supply_view', 'supply_create', 'supply_update', 'supply_delete',
                    'inventory_view', 'inventory_create', 'inventory_update', 'inventory_delete',
                    'user_view', 'user_create', 'user_update', 'user_delete',
                    'system_view', 'system_config', 'system_log',
                    'report_view', 'report_export',
                ]
            },
            {
                'name': 'manager',
                'description': '部门经理，拥有大部分管理权限',
                'permissions': [
                    'supply_view', 'supply_create', 'supply_update',
                    'inventory_view', 'inventory_create', 'inventory_update',
                    'user_view',
                    'system_view',
                    'report_view', 'report_export',
                ]
            },
            {
                'name': 'operator',
                'description': '操作员，拥有基本操作权限',
                'permissions': [
                    'supply_view',
                    'inventory_view', 'inventory_create',
                    'report_view',
                ]
            },
            {
                'name': 'user',
                'description': '普通用户，只有查看权限',
                'permissions': [
                    'supply_view',
                    'inventory_view',
                    'report_view',
                ]
            },
        ]
        
        # 创建角色
        created_roles = 0
        for role_data in roles_data:
            role, created = UserRole.objects.get_or_create(
                name=role_data['name'],
                defaults={
                    'description': role_data['description'],
                    'permissions': role_data['permissions']
                }
            )
            if created:
                created_roles += 1
            else:
                # 更新现有角色的权限
                role.permissions = role_data['permissions']
                role.save()
        
        self.stdout.write(
            self.style.SUCCESS(f'成功创建/更新 {created_roles} 个角色')
        )
        
        self.stdout.write(
            self.style.SUCCESS('权限和角色初始化完成！')
        ) 