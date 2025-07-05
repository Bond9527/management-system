from django.core.management.base import BaseCommand
from supplies.models import ApplicationForm, ApplicationTemplate, DynamicCalculationItem, DynamicForecastData
from accounts.models import User
from datetime import datetime
import json

class Command(BaseCommand):
    help = '导入B482 TE课6512部门7月常用消耗材管控申请表数据'

    def handle(self, *args, **options):
        self.stdout.write("开始导入B482耗材管控数据...")

        # 获取或创建用户
        user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@example.com',
                'is_staff': True,
                'is_superuser': True
            }
        )

        # 创建B482模板
        template, template_created = ApplicationTemplate.objects.get_or_create(
            code='B482-TEMPLATE',
            defaults={
                'name': 'B482耗材管控申请表模板',
                'template_type': 'supply_management',
                'description': 'B482测试设备耗材管控申请表模板',
                'has_calculation': True,
                'is_active': True,
                'created_by': user
            }
        )

        if template_created:
            self.stdout.write(f"✅ 创建模板: {template.name}")
        else:
            self.stdout.write(f"📋 模板已存在: {template.name}")

        # 创建B482申请表
        form, created = ApplicationForm.objects.get_or_create(
            name="B482 TE课6512部门7月常用消耗材管控申请表",
            defaults={
                'template': template,
                'code': 'B482-TE6512-202507',
                'department': 'TE课6512部门',
                'period': '2025年7月',
                'has_calculation_form': True,
                'status': 'active',
                'created_by': user
            }
        )

        if created:
            self.stdout.write(f"✅ 创建申请表: {form.name}")
        else:
            self.stdout.write(f"📋 申请表已存在: {form.name}")

        # B482计算项目数据
        calculation_items = [
            {
                'no': 1,
                'material_name': 'SUB Batt SA测试治具/3.PRO.000556/测试针',
                'usage_station': 'Batt SA',
                'usage_per_set': 18,
                'usage_count': 30000,
                'monthly_capacity': 497700,
                'min_stock': 267,
                'max_stock': 416,
                'monthly_demand': 299,
                'monthly_net_demand': 299,
                'actual_order': 300,
                'unit_price': 9.23,
                'moq': 200,
                'moq_remark': 'MOQ:200PCS 此折扣',
                'linked_material': '采购员:刘姐|单位:pcs|L/T:15天|PRPM:2025年6月份',
            },
            {
                'no': 2,
                'material_name': '118-6000-B-60-BB-i/线材(1WTE线)',
                'usage_station': '403-QT3,507-Gatekeeper',
                'usage_per_set': 4,
                'usage_count': 100000,
                'monthly_capacity': 497700,
                'min_stock': 18,
                'max_stock': 28,
                'monthly_demand': 20,
                'monthly_net_demand': 20,
                'actual_order': 32,
                'unit_price': 62.16,
                'moq': 32,
                'moq_remark': 'MOQ:32PCS FLKN算',
                'linked_material': '采购员:刘姐|单位:pcs|L/T:21天|PRPM:2025年7月份',
            }
        ]

        # 导入计算项目
        for item_data in calculation_items:
            item, created = DynamicCalculationItem.objects.get_or_create(
                form=form,
                no=item_data['no'],
                defaults=item_data
            )
            
            if created:
                self.stdout.write(f"✅ 创建计算项目 {item_data['no']}: {item_data['material_name']}")
            else:
                self.stdout.write(f"📋 计算项目已存在 {item_data['no']}: {item_data['material_name']}")

        # 创建B482预测数据
        forecast_data = {
            'name': 'B482 TE课6512部门产能预测数据',
            'forecast_data': {
                'capacity_forecast': {
                    'monthly_capacity': 497700,
                    'usage_stations': ['Batt SA', '403-QT3', '507-Gatekeeper'],
                    'test_items': ['SUB Batt SA测试', 'FATP QT3测试']
                },
                'monthly_control_data': {
                    'Jul-25': {
                        'items': 2,
                        'total_stock': 444,  # 416 + 28 (最高库存)
                        'total_demand': 319,  # 299 + 20
                        'total_amount': 4032.52,  # 9.23*300 + 62.16*32
                        'total_warehouse_demand': 332  # 300 + 32 (实际订购)
                    },
                    'Aug-25': {
                        'items': 2,
                        'total_stock': 444,
                        'total_demand': 319,
                        'total_amount': 4032.52,
                        'total_warehouse_demand': 332
                    }
                },
                'prpm_schedule': {
                    'SUB Batt SA测试治具': '2025/6/19',
                    '118-6000-B-60-BB-i线材': '2025/7/15'
                },
                'material_demand_schedule': {
                    '7月W01': 200,  # 测试针200
                    '7月W02': 0,
                    '7月W03': 0,
                    '7月W04': 40,   # 线材40
                }
            }
        }

        forecast, created = DynamicForecastData.objects.get_or_create(
            form=form,
            name=forecast_data['name'],
            defaults={'forecast_data': forecast_data['forecast_data']}
        )

        if created:
            self.stdout.write(f"✅ 创建预测数据: {forecast_data['name']}")
        else:
            self.stdout.write(f"📋 预测数据已存在: {forecast_data['name']}")

        # 输出汇总信息
        self.stdout.write("\n" + "="*60)
        self.stdout.write("📊 B482耗材管控数据导入汇总:")
        self.stdout.write("="*60)
        self.stdout.write(f"🏢 部门: TE课6512部门")
        self.stdout.write(f"📅 期间: 2025年7月")
        self.stdout.write(f"📋 计算项目数: {len(calculation_items)}")
        
        total_amount = sum(item['unit_price'] * item['actual_order'] for item in calculation_items)
        total_quantity = sum(item['actual_order'] for item in calculation_items)
        
        self.stdout.write(f"💰 总采购金额: ¥{total_amount:.2f}")
        self.stdout.write(f"📦 总订购数量: {total_quantity} pcs")
        self.stdout.write(f"👤 责任采购员: 刘姐")
        
        self.stdout.write("\n🎯 项目详情:")
        for i, item in enumerate(calculation_items, 1):
            amount = item['unit_price'] * item['actual_order']
            self.stdout.write(f"  {i}. {item['material_name'][:30]}...")
            self.stdout.write(f"     使用站别: {item['usage_station']}")
            self.stdout.write(f"     单价: ¥{item['unit_price']}, 订购: {item['actual_order']} pcs")
            self.stdout.write(f"     小计: ¥{amount:.2f}")
        
        self.stdout.write(f"\n✅ B482耗材管控数据导入完成!") 