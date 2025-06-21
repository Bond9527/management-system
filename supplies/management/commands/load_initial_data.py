from django.core.management.base import BaseCommand
from supplies.models import Supply
from decimal import Decimal

class Command(BaseCommand):
    help = '加载初始耗材数据'

    def handle(self, *args, **options):
        # 初始耗材数据
        initial_supplies = [
            {
                'name': 'P1000探针',
                'category': '探针',
                'unit': '支',
                'current_stock': 25,
                'safety_stock': 20,
                'unit_price': Decimal('150.00')
            },
            {
                'name': 'P500探针',
                'category': '探针',
                'unit': '支',
                'current_stock': 30,
                'safety_stock': 25,
                'unit_price': Decimal('120.00')
            },
            {
                'name': 'P2000探针',
                'category': '探针',
                'unit': '支',
                'current_stock': 15,
                'safety_stock': 15,
                'unit_price': Decimal('180.00')
            },
            {
                'name': 'P3000探针',
                'category': '探针',
                'unit': '支',
                'current_stock': 20,
                'safety_stock': 15,
                'unit_price': Decimal('220.00')
            },
            {
                'name': '探针清洁剂',
                'category': '清洁剂',
                'unit': '瓶',
                'current_stock': 18,
                'safety_stock': 15,
                'unit_price': Decimal('45.00')
            },
            {
                'name': '探针专用清洁布',
                'category': '清洁剂',
                'unit': '包',
                'current_stock': 25,
                'safety_stock': 20,
                'unit_price': Decimal('25.00')
            },
            {
                'name': '继电器模块',
                'category': '继电器',
                'unit': '个',
                'current_stock': 20,
                'safety_stock': 12,
                'unit_price': Decimal('35.00')
            },
            {
                'name': '继电器底座',
                'category': '继电器',
                'unit': '个',
                'current_stock': 15,
                'safety_stock': 10,
                'unit_price': Decimal('15.00')
            },
            {
                'name': '探针连接器',
                'category': '连接器',
                'unit': '个',
                'current_stock': 25,
                'safety_stock': 18,
                'unit_price': Decimal('28.00')
            },
            {
                'name': '探针转接头',
                'category': '连接器',
                'unit': '个',
                'current_stock': 20,
                'safety_stock': 15,
                'unit_price': Decimal('32.00')
            },
            {
                'name': '探针支架',
                'category': '其他配件',
                'unit': '个',
                'current_stock': 15,
                'safety_stock': 10,
                'unit_price': Decimal('85.00')
            },
            {
                'name': '探针校准工具',
                'category': '其他配件',
                'unit': '套',
                'current_stock': 8,
                'safety_stock': 5,
                'unit_price': Decimal('280.00')
            },
            {
                'name': '探针测试板',
                'category': '其他配件',
                'unit': '块',
                'current_stock': 12,
                'safety_stock': 8,
                'unit_price': Decimal('120.00')
            },
            {
                'name': '探针保护套',
                'category': '其他配件',
                'unit': '个',
                'current_stock': 30,
                'safety_stock': 20,
                'unit_price': Decimal('18.00')
            },
            {
                'name': '探针收纳盒',
                'category': '其他配件',
                'unit': '个',
                'current_stock': 10,
                'safety_stock': 5,
                'unit_price': Decimal('65.00')
            },
            {
                'name': '探针维修工具',
                'category': '其他配件',
                'unit': '套',
                'current_stock': 5,
                'safety_stock': 3,
                'unit_price': Decimal('450.00')
            },
            {
                'name': '探针说明书',
                'category': '其他配件',
                'unit': '本',
                'current_stock': 50,
                'safety_stock': 30,
                'unit_price': Decimal('15.00')
            },
            {
                'name': '探针标签',
                'category': '其他配件',
                'unit': '张',
                'current_stock': 100,
                'safety_stock': 50,
                'unit_price': Decimal('0.50')
            },
            {
                'name': '探针防静电袋',
                'category': '其他配件',
                'unit': '个',
                'current_stock': 200,
                'safety_stock': 100,
                'unit_price': Decimal('0.80')
            },
            {
                'name': '探针包装盒',
                'category': '其他配件',
                'unit': '个',
                'current_stock': 40,
                'safety_stock': 20,
                'unit_price': Decimal('12.00')
            },
            {
                'name': 'A4打印纸',
                'category': '办公用品',
                'unit': '包',
                'current_stock': 48,
                'safety_stock': 30,
                'unit_price': Decimal('25.00')
            },
        ]

        # 检查是否已有数据
        if Supply.objects.exists():
            self.stdout.write(
                self.style.WARNING('数据库中已存在耗材数据，跳过初始化')
            )
            return

        # 创建耗材数据
        created_count = 0
        for supply_data in initial_supplies:
            supply, created = Supply.objects.get_or_create(
                name=supply_data['name'],
                defaults=supply_data
            )
            if created:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(f'成功创建 {created_count} 个耗材记录')
        ) 