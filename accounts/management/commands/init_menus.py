from django.core.management.base import BaseCommand
from accounts.models import Menu, Permission, UserRole
from django.db import transaction

class Command(BaseCommand):
    help = '初始化系统菜单数据'

    def handle(self, *args, **options):
        with transaction.atomic():
            # 清空现有菜单数据
            Menu.objects.all().delete()
            
            # 创建根菜单
            system_menu = Menu.objects.create(
                name='系统管理',
                path='/system',
                component='',
                icon='settings',
                menu_type='menu',
                order=1,
                is_visible=True,
                is_active=True,
                display_position='both',
            )
            
            supplies_menu = Menu.objects.create(
                name='耗材管理',
                path='/supplies',
                component='',
                icon='package',
                menu_type='menu',
                order=2,
                is_visible=True,
                is_active=True,
                display_position='both',
            )
            
            # 创建系统管理子菜单
            user_management = Menu.objects.create(
                name='用户管理',
                path='/system/users',
                component='UserManagement',
                icon='UserManagementIcon',
                menu_type='page',
                order=1,
                is_visible=True,
                is_active=True,
                parent=system_menu,
                display_position='both',
            )
            
            basic_settings = Menu.objects.create(
                name='基础信息设置',
                path='/system/basic-settings',
                component='BasicSettings',
                icon='PermissionManagementIcon',
                menu_type='page',
                order=2,
                is_visible=True,
                is_active=True,
                parent=system_menu,
                display_position='both',
            )
            
            # 创建耗材管理子菜单
            inventory_overview = Menu.objects.create(
                name='库存总览',
                path='/supplies/inventory-overview',
                component='InventoryOverview',
                icon='InventoryManagementIcon',
                menu_type='page',
                order=1,
                is_visible=True,
                is_active=True,
                parent=supplies_menu,
                display_position='both',
            )
            
            add_record = Menu.objects.create(
                name='新增记录',
                path='/supplies/add-record',
                component='AddRecord',
                icon='AddRecordIcon',
                menu_type='page',
                order=2,
                is_visible=True,
                is_active=True,
                parent=supplies_menu,
                display_position='both',
            )
            
            records = Menu.objects.create(
                name='变动台账',
                path='/supplies/records',
                component='Records',
                icon='RecordsManagementIcon',
                menu_type='page',
                order=3,
                is_visible=True,
                is_active=True,
                parent=supplies_menu,
                display_position='both',
            )
            
            statistics = Menu.objects.create(
                name='数据统计',
                path='/supplies/statistics',
                component='Statistics',
                icon='StatisticsManagementIcon',
                menu_type='page',
                order=4,
                is_visible=True,
                is_active=True,
                parent=supplies_menu,
                display_position='both',
            )
            
            # 获取权限和角色
            try:
                permissions = Permission.objects.all()
                roles = UserRole.objects.all()
                
                # 为菜单分配权限和角色
                for menu in Menu.objects.all():
                    menu.permissions.set(permissions)
                    menu.roles.set(roles)
                    
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f'权限或角色数据不存在，跳过权限分配: {e}')
                )
            
            self.stdout.write(
                self.style.SUCCESS(f'成功创建 {Menu.objects.count()} 个菜单')
            )
            
            # 显示创建的菜单结构
            self.stdout.write('\n菜单结构:')
            self.display_menu_tree()
    
    def display_menu_tree(self, parent=None, level=0):
        """递归显示菜单树结构"""
        menus = Menu.objects.filter(parent=parent).order_by('order')
        
        for menu in menus:
            indent = '  ' * level
            self.stdout.write(f'{indent}- {menu.name} ({menu.menu_type})')
            self.display_menu_tree(menu, level + 1) 