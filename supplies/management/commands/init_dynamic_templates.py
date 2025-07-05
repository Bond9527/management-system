from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from supplies.models import ApplicationTemplate, ApplicationForm, DynamicForecastData

User = get_user_model()

class Command(BaseCommand):
    help = '初始化动态模板数据'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('开始初始化动态申请表模板...'))
        
        # 确保有管理员用户
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@example.com',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin_user.set_password('admin')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f'创建管理员用户: {admin_user.username}'))

        # 创建默认模板
        templates_data = [
            {
                'name': 'B482耗材管控申请表模板',
                'code': 'B482_TEMPLATE',
                'template_type': ['supply_management'],
                'description': '基于B482系列的标准耗材管控申请表模板，包含完整的耗材信息管理功能',
                'has_calculation': True,
                'is_active': True,
            },
            {
                'name': 'Andor需求计算表模板',
                'code': 'ANDOR_TEMPLATE',
                'template_type': ['demand_calculation'],
                'description': 'Andor系列设备的需求计算表模板，专注于产能预测和需求分析',
                'has_calculation': True,
                'is_active': True,
            },
            {
                'name': 'B453 SMT ATE申请表模板',
                'code': 'B453_TEMPLATE',
                'template_type': ['supply_management', 'demand_calculation'],  # 多选示例
                'description': 'B453 SMT ATE设备专用的耗材管控申请表模板，包含管控表和计算表',
                'has_calculation': True,
                'is_active': True,
            },
            {
                'name': '产能预测表模板',
                'code': 'FORECAST_TEMPLATE',
                'template_type': ['capacity_forecast'],
                'description': '通用产能预测表模板，支持多月份产能数据管理',
                'has_calculation': False,
                'is_active': True,
            },
            {
                'name': '通用耗材申请表模板',
                'code': 'GENERAL_TEMPLATE',
                'template_type': ['supply_management'],
                'description': '通用耗材申请表模板，适用于各种设备和部门',
                'has_calculation': False,
                'is_active': True,
            },
            {
                'name': '综合管理模板',
                'code': 'COMPREHENSIVE_TEMPLATE',
                'template_type': ['supply_management', 'demand_calculation', 'capacity_forecast'],  # 全功能模板
                'description': '综合管理模板，支持耗材管控、需求计算和产能预测所有功能',
                'has_calculation': True,
                'is_active': True,
            },
        ]

        created_count = 0
        updated_count = 0

        for template_data in templates_data:
            template, created = ApplicationTemplate.objects.get_or_create(
                code=template_data['code'],
                defaults={
                    **template_data,
                    'created_by': admin_user,
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'✓ 创建模板: {template.name}'))
            else:
                # 更新现有模板
                for key, value in template_data.items():
                    if key != 'code':  # 不更新code字段
                        setattr(template, key, value)
                template.save()
                updated_count += 1
                self.stdout.write(self.style.WARNING(f'○ 更新模板: {template.name}'))

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ 初始化完成！\n'
                f'   - 新建模板: {created_count} 个\n'
                f'   - 更新模板: {updated_count} 个\n'
                f'   - 总计模板: {ApplicationTemplate.objects.count()} 个'
            )
        )

        # 显示所有模板
        self.stdout.write(self.style.SUCCESS('\n📋 当前所有模板:'))
        for template in ApplicationTemplate.objects.all().order_by('name'):
            status = '🟢 启用' if template.is_active else '🔴 停用'
            calc = '🧮 包含计算' if template.has_calculation else '📊 仅管控'
            self.stdout.write(f'   {status} {calc} {template.name} ({template.code})')

        # 创建示例申请表
        form, created = ApplicationForm.objects.get_or_create(
            code='B453-202507',
            defaults={
                'name': 'B453 SMT ATE 2025年7月份耗材管控表',
                'period': '2025年7月',
                'department': 'TE课',
                'template_types': ['supply_management', 'demand_calculation', 'capacity_forecast'],
                'created_by': admin_user
            }
        )

        # 创建预测数据
        forecast_data = {
            'name': 'B453 产能预测数据',
            'forecast_data': {
                'capacity_forecast': {
                    'monthly_capacity': 363000,  # 当月产能
                    'six_month_capacity': {  # 最近六个月产能
                        'Mar-24': 191800,
                        'Oct-24': 340100,
                        'Dec-24': 430000,
                        'Jan-25': 410000,
                        'Feb-25': 270000,
                        'Mar-25': 312000,
                        'Apr-25': 317400,
                        'May-25': 375000,
                        'Jun-25': 400000,
                        'Jul-25': 363000
                    },
                    'usage_stations': ['B453/L&R FCT', 'B453/L&R ICT'],
                    'test_items': ['FCT测试', 'ICT测试']
                },
                'monthly_control_data': {
                    'Jul-25': {
                        'items': 10,
                        'total_stock': 2000,
                        'total_demand': 1500,
                        'total_amount': 15000.00,
                        'total_warehouse_demand': 1600
                    }
                },
                'prpm_schedule': {
                    'B453探针更换': '2025/7/15',
                    'ICT测试针更换': '2025/7/20'
                },
                'material_demand_schedule': {
                    '7月W01': 400,
                    '7月W02': 300,
                    '7月W03': 500,
                    '7月W04': 400
                }
            }
        }

        forecast, created = DynamicForecastData.objects.get_or_create(
            form=form,
            name=forecast_data['name'],
            defaults={'forecast_data': forecast_data['forecast_data']}
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f'✅ 创建预测数据: {forecast_data["name"]}'))
        else:
            # 更新现有数据
            forecast.forecast_data = forecast_data['forecast_data']
            forecast.save()
            self.stdout.write(self.style.SUCCESS(f'📝 更新预测数据: {forecast_data["name"]}'))

        self.stdout.write(self.style.SUCCESS('完成初始化动态模板数据')) 