from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from accounts.models import (
    Department, JobTitle, UserRole, Permission, Menu
)

class Command(BaseCommand):
    help = '初始化基础数据：部门、职称、角色、权限、菜单'

    def handle(self, *args, **options):
        self.stdout.write('开始初始化基础数据...')
        
        # 创建部门
        self.create_departments()
        
        # 创建职称
        self.create_job_titles()
        
        # 创建角色
        self.create_roles()
        
        # 创建权限
        self.create_permissions()
        
        # 创建菜单
        self.create_menus()
        
        self.stdout.write(self.style.SUCCESS('基础数据初始化完成！'))

    def create_departments(self):
        self.stdout.write('创建部门...')
        
        # 创建顶级部门
        it_dept, _ = Department.objects.get_or_create(
            name='信息技术部',
            defaults={'description': '负责系统开发和维护'}
        )
        
        hr_dept, _ = Department.objects.get_or_create(
            name='人力资源部',
            defaults={'description': '负责人力资源管理'}
        )
        
        finance_dept, _ = Department.objects.get_or_create(
            name='财务部',
            defaults={'description': '负责财务管理'}
        )
        
        # 创建子部门
        Department.objects.get_or_create(
            name='开发组',
            defaults={
                'description': '负责系统开发',
                'parent': it_dept
            }
        )
        
        Department.objects.get_or_create(
            name='测试组',
            defaults={
                'description': '负责系统测试',
                'parent': it_dept
            }
        )
        
        Department.objects.get_or_create(
            name='运维组',
            defaults={
                'description': '负责系统运维',
                'parent': it_dept
            }
        )
        
        self.stdout.write(f'创建了 {Department.objects.count()} 个部门')

    def create_job_titles(self):
        self.stdout.write('创建职称...')
        
        # 清除现有职称数据（可选，如果需要完全重置）
        JobTitle.objects.all().delete()
        
        # 用户提供的16个职称
        job_titles_data = [
            {'name': '检测工程师', 'level': '中级', 'description': '负责检测相关工作的工程师'},
            {'name': '检测高级工程师', 'level': '副高级', 'description': '高级检测工程师'},
            {'name': '检查助理工程师', 'level': '初级', 'description': '辅助检查工作的助理工程师'},
            {'name': '课长', 'level': '副高级', 'description': '课级管理职位'},
            {'name': '副课长', 'level': '中级', 'description': '副课级管理职位'},
            {'name': '检测技术员', 'level': '初级', 'description': '从事检测技术工作的技术员'},
            {'name': '组长', 'level': '中级', 'description': '组级管理职位'},
            {'name': '副组长', 'level': '中级', 'description': '副组级管理职位'},
            {'name': '副经理', 'level': '副高级', 'description': '副经理级管理职位'},
            {'name': '经理', 'level': '副高级', 'description': '经理级管理职位'},
            {'name': '资深经理', 'level': '正高级', 'description': '资深经理级管理职位'},
            {'name': '测试工程师', 'level': '中级', 'description': '负责测试工作的工程师'},
            {'name': 'PE技术员', 'level': '初级', 'description': 'Process Engineer技术员'},
            {'name': '电子工程师', 'level': '中级', 'description': '电子技术工程师'},
            {'name': 'PE助理事务员', 'level': '初级', 'description': 'Process Engineer助理事务员'},
            {'name': 'PE高级工程师', 'level': '副高级', 'description': 'Process Engineer高级工程师'},
        ]
        
        for job_title_data in job_titles_data:
            JobTitle.objects.get_or_create(
                name=job_title_data['name'],
                defaults={
                    'level': job_title_data['level'],
                    'description': job_title_data['description']
                }
            )
        
        self.stdout.write(f'创建了 {JobTitle.objects.count()} 个职称')

    def create_roles(self):
        self.stdout.write('创建角色...')
        
        UserRole.objects.get_or_create(name='admin', defaults={'description': '系统管理员'})
        UserRole.objects.get_or_create(name='user', defaults={'description': '普通用户'})
        UserRole.objects.get_or_create(name='manager', defaults={'description': '管理员'})
        UserRole.objects.get_or_create(name='operator', defaults={'description': '操作员'})
        
        self.stdout.write(f'现有 {UserRole.objects.count()} 个角色')

    def create_permissions(self):
        self.stdout.write('创建权限...')
        
        # 耗材管理权限
        Permission.objects.get_or_create(
            name='查看耗材',
            codename='supply_view',
            permission_type='supply',
            defaults={'description': '查看耗材信息'}
        )
        Permission.objects.get_or_create(
            name='添加耗材',
            codename='supply_add',
            permission_type='supply',
            defaults={'description': '添加新耗材'}
        )
        Permission.objects.get_or_create(
            name='编辑耗材',
            codename='supply_edit',
            permission_type='supply',
            defaults={'description': '编辑耗材信息'}
        )
        Permission.objects.get_or_create(
            name='删除耗材',
            codename='supply_delete',
            permission_type='supply',
            defaults={'description': '删除耗材'}
        )
        # 库存管理权限
        Permission.objects.get_or_create(
            name='查看库存',
            codename='inventory_view',
            permission_type='inventory',
            defaults={'description': '查看库存信息'}
        )
        Permission.objects.get_or_create(
            name='入库操作',
            codename='inventory_in',
            permission_type='inventory',
            defaults={'description': '执行入库操作'}
        )
        Permission.objects.get_or_create(
            name='出库操作',
            codename='inventory_out',
            permission_type='inventory',
            defaults={'description': '执行出库操作'}
        )
        # 用户管理权限
        Permission.objects.get_or_create(
            name='查看用户',
            codename='user_view',
            permission_type='user',
            defaults={'description': '查看用户信息'}
        )
        Permission.objects.get_or_create(
            name='添加用户',
            codename='user_add',
            permission_type='user',
            defaults={'description': '添加新用户'}
        )
        Permission.objects.get_or_create(
            name='编辑用户',
            codename='user_edit',
            permission_type='user',
            defaults={'description': '编辑用户信息'}
        )
        Permission.objects.get_or_create(
            name='删除用户',
            codename='user_delete',
            permission_type='user',
            defaults={'description': '删除用户'}
        )
        # 系统管理权限
        Permission.objects.get_or_create(
            name='系统设置',
            codename='system_settings',
            permission_type='system',
            defaults={'description': '管理系统设置'}
        )
        Permission.objects.get_or_create(
            name='菜单管理',
            codename='menu_manage',
            permission_type='system',
            defaults={'description': '管理系统菜单'}
        )
        Permission.objects.get_or_create(
            name='权限管理',
            codename='permission_manage',
            permission_type='system',
            defaults={'description': '管理系统权限'}
        )
        # 报表管理权限
        Permission.objects.get_or_create(
            name='查看报表',
            codename='report_view',
            permission_type='report',
            defaults={'description': '查看系统报表'}
        )
        Permission.objects.get_or_create(
            name='导出报表',
            codename='report_export',
            permission_type='report',
            defaults={'description': '导出系统报表'}
        )
        self.stdout.write(f'创建了 {Permission.objects.count()} 个权限')

    def create_menus(self):
        self.stdout.write('创建菜单...')
        
        # 获取权限
        supply_view = Permission.objects.get(codename='supply_view')
        inventory_view = Permission.objects.get(codename='inventory_view')
        user_view = Permission.objects.get(codename='user_view')
        system_settings = Permission.objects.get(codename='system_settings')
        report_view = Permission.objects.get(codename='report_view')
        
        # 获取角色
        admin_role = UserRole.objects.get(name='admin')
        user_role = UserRole.objects.get(name='user')
        
        # 创建顶级菜单
        system_menu, _ = Menu.objects.get_or_create(
            name='系统管理',
            path='/system',
            defaults={
                'component': '',
                'icon': 'settings',
                'menu_type': 'menu',
                'order': 1
            }
        )
        system_menu.permissions.add(system_settings)
        system_menu.roles.add(admin_role)
        
        supplies_menu, _ = Menu.objects.get_or_create(
            name='耗材管理',
            path='/supplies',
            defaults={
                'component': '',
                'icon': 'package',
                'menu_type': 'menu',
                'order': 2
            }
        )
        supplies_menu.permissions.add(supply_view)
        supplies_menu.roles.add(admin_role, user_role)
        
        # 创建子菜单
        Menu.objects.get_or_create(
            name='用户管理',
            path='/system/users',
            defaults={
                'component': 'UserManagement',
                'icon': 'users',
                'menu_type': 'page',
                'order': 1,
                'parent': system_menu
            }
        )
        
        Menu.objects.get_or_create(
            name='基础信息设置',
            path='/system/basic-settings',
            defaults={
                'component': 'BasicSettings',
                'icon': 'settings',
                'menu_type': 'page',
                'order': 2,
                'parent': system_menu
            }
        )
        
        Menu.objects.get_or_create(
            name='库存总览',
            path='/supplies/inventory-overview',
            defaults={
                'component': 'InventoryOverview',
                'icon': 'chart',
                'menu_type': 'page',
                'order': 1,
                'parent': supplies_menu
            }
        )
        
        Menu.objects.get_or_create(
            name='新增记录',
            path='/supplies/add-record',
            defaults={
                'component': 'AddRecord',
                'icon': 'plus',
                'menu_type': 'page',
                'order': 2,
                'parent': supplies_menu
            }
        )
        
        Menu.objects.get_or_create(
            name='变动台账',
            path='/supplies/records',
            defaults={
                'component': 'Records',
                'icon': 'table',
                'menu_type': 'page',
                'order': 3,
                'parent': supplies_menu
            }
        )
        
        Menu.objects.get_or_create(
            name='数据统计',
            path='/supplies/statistics',
            defaults={
                'component': 'Statistics',
                'icon': 'chart-bar',
                'menu_type': 'page',
                'order': 4,
                'parent': supplies_menu
            }
        )
        
        self.stdout.write(f'创建了 {Menu.objects.count()} 个菜单') 