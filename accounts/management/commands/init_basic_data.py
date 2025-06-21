from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from accounts.models import (
    Department, Position, JobTitle, UserRole, Permission, Menu
)

class Command(BaseCommand):
    help = '初始化基础数据：部门、职位、职称、角色、权限、菜单'

    def handle(self, *args, **options):
        self.stdout.write('开始初始化基础数据...')
        
        # 创建部门
        self.create_departments()
        
        # 创建职位
        self.create_positions()
        
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

    def create_positions(self):
        self.stdout.write('创建职位...')
        
        it_dept = Department.objects.get(name='信息技术部')
        hr_dept = Department.objects.get(name='人力资源部')
        finance_dept = Department.objects.get(name='财务部')
        
        # IT部门职位
        Position.objects.get_or_create(
            name='技术总监',
            defaults={
                'description': '负责技术团队管理',
                'department': it_dept
            }
        )
        
        Position.objects.get_or_create(
            name='高级开发工程师',
            defaults={
                'description': '负责核心功能开发',
                'department': it_dept
            }
        )
        
        Position.objects.get_or_create(
            name='开发工程师',
            defaults={
                'description': '负责功能开发',
                'department': it_dept
            }
        )
        
        Position.objects.get_or_create(
            name='测试工程师',
            defaults={
                'description': '负责系统测试',
                'department': it_dept
            }
        )
        
        # HR部门职位
        Position.objects.get_or_create(
            name='HR经理',
            defaults={
                'description': '负责人力资源管理',
                'department': hr_dept
            }
        )
        
        Position.objects.get_or_create(
            name='HR专员',
            defaults={
                'description': '负责招聘和员工关系',
                'department': hr_dept
            }
        )
        
        # 财务部门职位
        Position.objects.get_or_create(
            name='财务经理',
            defaults={
                'description': '负责财务管理',
                'department': finance_dept
            }
        )
        
        Position.objects.get_or_create(
            name='会计',
            defaults={
                'description': '负责会计核算',
                'department': finance_dept
            }
        )
        
        self.stdout.write(f'创建了 {Position.objects.count()} 个职位')

    def create_job_titles(self):
        self.stdout.write('创建职称...')
        
        # 初级职称
        JobTitle.objects.get_or_create(
            name='助理工程师',
            level='初级',
            defaults={'description': '初级技术职称'}
        )
        
        JobTitle.objects.get_or_create(
            name='助理会计师',
            level='初级',
            defaults={'description': '初级财务职称'}
        )
        
        # 中级职称
        JobTitle.objects.get_or_create(
            name='工程师',
            level='中级',
            defaults={'description': '中级技术职称'}
        )
        
        JobTitle.objects.get_or_create(
            name='会计师',
            level='中级',
            defaults={'description': '中级财务职称'}
        )
        
        # 副高级职称
        JobTitle.objects.get_or_create(
            name='高级工程师',
            level='副高级',
            defaults={'description': '副高级技术职称'}
        )
        
        JobTitle.objects.get_or_create(
            name='高级会计师',
            level='副高级',
            defaults={'description': '副高级财务职称'}
        )
        
        # 正高级职称
        JobTitle.objects.get_or_create(
            name='技术专家',
            level='正高级',
            defaults={'description': '正高级技术职称'}
        )
        
        self.stdout.write(f'创建了 {JobTitle.objects.count()} 个职称')

    def create_roles(self):
        self.stdout.write('创建角色...')
        
        # 角色已经在之前的命令中创建，这里只检查
        roles_count = UserRole.objects.count()
        self.stdout.write(f'现有 {roles_count} 个角色')

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
            name='耗材列表',
            path='/supplies/list',
            defaults={
                'component': 'SupplyList',
                'icon': 'list',
                'menu_type': 'page',
                'order': 2,
                'parent': supplies_menu
            }
        )
        
        Menu.objects.get_or_create(
            name='入库管理',
            path='/supplies/inbound',
            defaults={
                'component': 'InboundManagement',
                'icon': 'arrow-down',
                'menu_type': 'page',
                'order': 3,
                'parent': supplies_menu
            }
        )
        
        Menu.objects.get_or_create(
            name='出库管理',
            path='/supplies/outbound',
            defaults={
                'component': 'OutboundManagement',
                'icon': 'arrow-up',
                'menu_type': 'page',
                'order': 4,
                'parent': supplies_menu
            }
        )
        
        self.stdout.write(f'创建了 {Menu.objects.count()} 个菜单') 