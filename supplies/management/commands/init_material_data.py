from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from supplies.models import B482SupplyItem, AndorSupplyItem, CapacityForecast, B453SupplyItem, B453CalculationItem, B453ForecastData
from decimal import Decimal

class Command(BaseCommand):
    help = '初始化耗材管理系统数据（B482、Andor、B453）'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='删除现有数据并重新初始化',
        )

    def handle(self, *args, **options):
        # 获取管理员用户
        try:
            admin_user = User.objects.filter(is_superuser=True).first()
            if not admin_user:
                admin_user = User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
                self.stdout.write(self.style.SUCCESS('创建了管理员用户: admin/admin123'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'创建管理员用户失败: {e}'))
            return

        if options['reset']:
            # 删除现有数据
            B482SupplyItem.objects.all().delete()
            AndorSupplyItem.objects.all().delete()
            CapacityForecast.objects.all().delete()
            B453SupplyItem.objects.all().delete()
            B453CalculationItem.objects.all().delete()
            B453ForecastData.objects.all().delete()
            self.stdout.write(self.style.WARNING('已删除所有现有数据'))

        # 初始化B482数据
        self.init_b482_data(admin_user)
        
        # 初始化Andor数据
        self.init_andor_data(admin_user)
        
        # 初始化产能预测数据
        self.init_capacity_forecast_data(admin_user)
        
        # 初始化B453数据
        self.init_b453_data(admin_user)
        
        # 初始化B453计算数据
        self.init_b453_calculation_data(admin_user)
        
        # 初始化B453预测数据
        self.init_b453_forecast_data(admin_user)

        self.stdout.write(self.style.SUCCESS('耗材管理系统数据初始化完成！'))

    def init_b482_data(self, user):
        """初始化B482数据"""
        b482_data = [
            {
                'serial_number': 1,
                'material_description': '故障排除線(SUB Batt SA測試夾具偵1.PRO.000556測試針)',
                'unit': 'pcs',
                'purchaser': '陳雲',
                'unit_price': Decimal('9.23'),
                'max_safety_stock': 416,
                'min_safety_stock': 118,
                'moq': 200,
                'unpurchased_amount': Decimal('2760'),
                'lead_time': 15,
                'june_2025': 41,
                'july_2025': 299,
                'july_m1': 300,
                'july_m2': 0,
                'july_m3': 200,
                'july_m4': 0,
                'remark': 'MOQ:200PCS 訂貨用',
                'usage_per_set': 18,
                'usage_count': 30000,
                'monthly_capacity': 497700,
                'enable_auto_calculation': True,
                'created_by': user
            },
            {
                'serial_number': 2,
                'material_description': '故障排除線(A/P 測試夾具.塔/JI8-6000-B-60-BB-i/線材)',
                'unit': 'pcs',
                'purchaser': '陳雲',
                'unit_price': Decimal('62.16'),
                'max_safety_stock': 28,
                'min_safety_stock': 8,
                'moq': 32,
                'unpurchased_amount': Decimal('1989.12'),
                'lead_time': 21,
                'june_2025': 10,
                'july_2025': 40,
                'july_m1': 32,
                'july_m2': 0,
                'july_m3': 0,
                'july_m4': 40,
                'remark': 'MOQ:32PCS FLK訂貨',
                'usage_per_set': 4,
                'usage_count': 100000,
                'monthly_capacity': 497700,
                'enable_auto_calculation': True,
                'created_by': user
            }
        ]

        for data in b482_data:
            B482SupplyItem.objects.get_or_create(
                serial_number=data['serial_number'],
                defaults=data
            )
        
        self.stdout.write(self.style.SUCCESS(f'初始化了 {len(b482_data)} 条B482数据'))

    def init_andor_data(self, user):
        """初始化Andor数据"""
        andor_data = [
            {
                'month': '2025.7',
                'no': 1,
                'material_name': '3.PRO.000556/測試針',
                'usage_station': 'Batt SA',
                'usage_per_set': 18,
                'usage_count': 30000,
                'monthly_capacity': 497700,
                'min_inventory': 267,
                'max_inventory': 416,
                'monthly_demand': 299,
                'remark': '300 (MOQ:200)',
                'created_by': user
            },
            {
                'month': '2025.7',
                'no': 2,
                'material_name': 'JI8-6000-B-60-BB-i/線材(HWTE線)',
                'usage_station': '403-QT3',
                'usage_per_set': 4,
                'usage_count': 100000,
                'monthly_capacity': 497700,
                'min_inventory': 18,
                'max_inventory': 28,
                'monthly_demand': 20,
                'remark': '32 (MOQ:32)',
                'created_by': user
            },
            {
                'month': '2025.7',
                'no': 2,
                'material_name': 'JI8-6000-B-60-BB-i/線材(HWTE線)',
                'usage_station': '507-Gatekeeper',
                'usage_per_set': 4,
                'usage_count': 100000,
                'monthly_capacity': 497700,
                'min_inventory': 18,
                'max_inventory': 28,
                'monthly_demand': 20,
                'remark': '',
                'created_by': user
            }
        ]

        for i, data in enumerate(andor_data):
            AndorSupplyItem.objects.get_or_create(
                no=data['no'],
                usage_station=data['usage_station'],
                defaults=data
            )
        
        self.stdout.write(self.style.SUCCESS(f'初始化了 {len(andor_data)} 条Andor数据'))

    def init_capacity_forecast_data(self, user):
        """初始化产能预测数据"""
        forecast_data = {
            'name': '默认产能预测',
            'max_capacity': 694000,
            'min_capacity': 445000,
            'apr_24': 694000,
            'may_25': 445000,
            'jun_25': 509000,
            'jul_25': 497700,
            'created_by': user
        }

        CapacityForecast.objects.get_or_create(
            name=forecast_data['name'],
            defaults=forecast_data
        )
        
        self.stdout.write(self.style.SUCCESS('初始化了产能预测数据'))

    def init_b453_data(self, user):
        """初始化B453数据"""
        b453_data = [
            {
                'serial_number': 1,
                'material_description': '設備耗材類-(B453/L&R FCT設備/探針/DB1639SAR-TSK1)',
                'unit': 'pcs',
                'purchaser': '湯麗瑩',
                'unit_price': Decimal('9.82'),
                'min_safety_stock': 228,
                'max_safety_stock': 512,
                'moq': 100,
                'lead_time_weeks': 15,
                'apr_2025_stock': 240,
                'may_2025_demand': 500,
                'may_2025_stock': 200,
                'jun_2025_demand': 500,
                'jun_2025_stock': 200,
                'jul_2025_demand': 500,
                'jul_2025_stock': 500,
                'aug_2025_demand': 0,
                'remark': '4910',
                'calculation_id': 1,
                'has_calculation': True,
                'created_by': user
            },
            {
                'serial_number': 2,
                'material_description': '設備耗材類-(B453/L&R FCT設備/探針/FB1-058B2700T70-BB-A38)',
                'unit': 'pcs',
                'purchaser': '湯麗瑩',
                'unit_price': Decimal('9.05'),
                'min_safety_stock': 61,
                'max_safety_stock': 138,
                'moq': 100,
                'lead_time_weeks': 15,
                'apr_2025_stock': 0,
                'may_2025_demand': 200,
                'may_2025_stock': 80,
                'jun_2025_demand': 200,
                'jun_2025_stock': 75,
                'jul_2025_demand': 100,
                'jul_2025_stock': 100,
                'aug_2025_demand': 0,
                'remark': '805',
                'calculation_id': 2,
                'has_calculation': True,
                'created_by': user
            },
            {
                'serial_number': 3,
                'material_description': '設備耗材類-(B453/AJ FCT設備/探針/GKS-075 291 064 V.2000)',
                'unit': 'pcs',
                'purchaser': '湯麗瑩',
                'unit_price': Decimal('1.27'),
                'min_safety_stock': 58,
                'max_safety_stock': 129,
                'moq': 100,
                'lead_time_weeks': 15,
                'apr_2025_stock': 50,
                'may_2025_demand': 100,
                'may_2025_stock': 60,
                'jun_2025_demand': 100,
                'jun_2025_stock': 65,
                'jul_2025_demand': 100,
                'jul_2025_stock': 100,
                'aug_2025_demand': 0,
                'remark': '197',
                'calculation_id': 3,
                'has_calculation': True,
                'created_by': user
            },
            {
                'serial_number': 4,
                'material_description': '生產耗材類-(B453/膠材清潔劑/RK-58D 450ML(金千)',
                'unit': 'pcs',
                'purchaser': '湯麗瑩',
                'unit_price': Decimal('159.80'),
                'min_safety_stock': 3,
                'max_safety_stock': 6,
                'moq': 1,
                'lead_time_weeks': 15,
                'apr_2025_stock': 3,
                'may_2025_demand': 1,
                'may_2025_stock': 3,
                'jun_2025_demand': 6,
                'jun_2025_stock': 2,
                'jul_2025_demand': 1,
                'jul_2025_stock': 1,
                'aug_2025_demand': 0,
                'remark': '160',
                'calculation_id': 4,
                'has_calculation': True,
                'created_by': user
            }
        ]

        for data in b453_data:
            B453SupplyItem.objects.get_or_create(
                serial_number=data['serial_number'],
                defaults=data
            )
        
        self.stdout.write(self.style.SUCCESS(f'初始化了 {len(b453_data)} 条B453数据'))

    def init_b453_calculation_data(self, user):
        """初始化B453计算数据"""
        calculation_data = [
            {
                'no': 1,
                'material_name': 'DB1639SAR-TSK1',
                'usage_station': 'L&R FCT',
                'usage_per_set': 120,
                'usage_count': 80000,
                'monthly_capacity': 363000,
                'min_stock': 228,
                'max_stock': 512,
                'monthly_demand': 544,
                'monthly_net_demand': 316,
                'actual_order': 500,
                'moq_remark': 'MOQ:100',
                'management_id': 1,
                'linked_material': '設備耗材類-(B453/L&R FCT設備/探針/DB1639SAR-TSK1)',
                'unit_price': Decimal('9.82'),
                'moq': 100,
                'created_by': user
            },
            {
                'no': 2,
                'material_name': 'FB1-058B2700T70-BB-A38',
                'usage_station': 'L&R FCT',
                'usage_per_set': 30,
                'usage_count': 80000,
                'monthly_capacity': 363000,
                'min_stock': 61,
                'max_stock': 138,
                'monthly_demand': 136,
                'monthly_net_demand': 75,
                'actual_order': 100,
                'moq_remark': 'MOQ:100',
                'management_id': 2,
                'linked_material': '設備耗材類-(B453/L&R FCT設備/探針/FB1-058B2700T70-BB-A38)',
                'unit_price': Decimal('9.05'),
                'moq': 100,
                'created_by': user
            },
            {
                'no': 3,
                'material_name': 'GKS-075 291 064 V.2000',
                'usage_station': 'AJ FCT',
                'usage_per_set': 24,
                'usage_count': 80000,
                'monthly_capacity': 363000,
                'min_stock': 58,
                'max_stock': 129,
                'monthly_demand': 109,
                'monthly_net_demand': 51,
                'actual_order': 100,
                'moq_remark': 'MOQ:100',
                'management_id': 3,
                'linked_material': '設備耗材類-(B453/AJ FCT設備/探針/GKS-075 291 064 V.2000)',
                'unit_price': Decimal('1.27'),
                'moq': 100,
                'created_by': user
            },
            {
                'no': 4,
                'material_name': 'RK-58D 450ML',
                'usage_station': '生產線',
                'usage_per_set': 1,
                'usage_count': 200000,
                'monthly_capacity': 363000,
                'min_stock': 3,
                'max_stock': 6,
                'monthly_demand': 2,
                'monthly_net_demand': 0,
                'actual_order': 1,
                'moq_remark': 'MOQ:1',
                'management_id': 4,
                'linked_material': '生產耗材類-(B453/膠材清潔劑/RK-58D 450ML(金千)',
                'unit_price': Decimal('159.80'),
                'moq': 1,
                'created_by': user
            }
        ]

        for data in calculation_data:
            B453CalculationItem.objects.get_or_create(
                no=data['no'],
                defaults=data
            )
        
        self.stdout.write(self.style.SUCCESS(f'初始化了 {len(calculation_data)} 条B453计算数据'))

    def init_b453_forecast_data(self, user):
        """初始化B453预测数据"""
        forecast_data = {
            'name': 'B453产能预测',
            'mar_24': 363000,
            'oct_24': 363000,
            'dec_24': 363000,
            'jan_25': 363000,
            'feb_25': 363000,
            'mar_25': 363000,
            'apr_25': 363000,
            'may_25': 363000,
            'jun_25': 363000,
            'jul_25': 363000,
            'created_by': user
        }

        B453ForecastData.objects.get_or_create(
            name=forecast_data['name'],
            defaults=forecast_data
        )
        
        self.stdout.write(self.style.SUCCESS('初始化了B453预测数据')) 