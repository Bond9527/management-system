import pandas as pd
from django.core.management.base import BaseCommand
from supplies.models import Supply
from decimal import Decimal
import re

class Command(BaseCommand):
    help = '从Excel文件导入耗材基础数据'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default='B482 202507耗材評估表V2.xlsx',
            help='Excel文件路径'
        )

    def handle(self, *args, **options):
        file_path = options['file']
        
        try:
            self.stdout.write('开始导入Excel数据...')
            
            # 读取主数据工作表
            df1 = pd.read_excel(file_path, sheet_name='2025年7月份耗材管控表 ')
            
            # 读取使用频次工作表
            df2 = pd.read_excel(file_path, sheet_name='2024年7月耗材需求计算 ')
            
            # 创建使用频次映射
            usage_map = self.create_usage_map(df2)
            
            # 导入主数据
            created_count = self.import_main_data(df1, usage_map)
            
            self.stdout.write(
                self.style.SUCCESS(f'成功导入 {created_count} 个耗材记录')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'导入失败: {str(e)}')
            )

    def create_usage_map(self, df2):
        """创建耗材使用频次映射"""
        usage_map = {}
        
        for i in range(1, len(df2)):
            row = df2.iloc[i]
            if pd.notna(row.iloc[2]):  # 耗材名称列
                material_name = str(row.iloc[2])
                usage_station = str(row.iloc[3]) if pd.notna(row.iloc[3]) else ""
                usage_per_machine = int(row.iloc[4]) if pd.notna(row.iloc[4]) and str(row.iloc[4]).isdigit() else 0
                usage_count = int(row.iloc[5]) if pd.notna(row.iloc[5]) and str(row.iloc[5]).isdigit() else 0
                
                # 提取耗材关键标识符
                key = self.extract_material_key(material_name)
                if key:
                    usage_map[key] = {
                        'usage_station': usage_station,
                        'usage_per_machine': usage_per_machine,
                        'standard_usage_count': usage_count
                    }
        
        return usage_map

    def extract_material_key(self, material_name):
        """从耗材名称中提取关键标识符"""
        # 提取类似 '3.PRO.000556', '118-6000-B-60-BB-i' 等标识符
        patterns = [
            r'(\d+\.PRO\.\d+)',  # 3.PRO.000556
            r'(\d+-\d+-[A-Z]-\d+-[A-Z]+-[a-z])',  # 118-6000-B-60-BB-i
            r'(P\d+-[A-Z]\d+)',  # P100-J1
            r'(\d+AA-\d+FK\.\d+)',  # 410AA-00057FK.01
        ]
        
        for pattern in patterns:
            match = re.search(pattern, material_name)
            if match:
                return match.group(1)
        
        return None

    def import_main_data(self, df1, usage_map):
        """导入主数据"""
        created_count = 0
        
        # 从第4行开始处理数据（跳过标题行）
        for i in range(3, len(df1)):
            row = df1.iloc[i]
            
            # 检查是否有序号（判断是否为数据行）
            if pd.notna(row.iloc[0]):
                try:
                    # 提取基础数据
                    serial_no = row.iloc[0]
                    name = str(row.iloc[1]) if pd.notna(row.iloc[1]) else ""
                    unit = str(row.iloc[2]) if pd.notna(row.iloc[2]) else "pcs"
                    purchaser = str(row.iloc[3]) if pd.notna(row.iloc[3]) else ""
                    unit_price = Decimal(str(row.iloc[4])) if pd.notna(row.iloc[4]) else Decimal('0')
                    
                    # 提取库存相关数据
                    max_stock = int(row.iloc[5]) if pd.notna(row.iloc[5]) and str(row.iloc[5]).isdigit() else 0
                    min_stock = int(row.iloc[6]) if pd.notna(row.iloc[6]) and str(row.iloc[6]).isdigit() else 0
                    
                    # 提取MOQ信息
                    moq = self.extract_moq(row)
                    
                    # 分类判断
                    category = self.determine_category(name)
                    
                    # 查找使用频次信息
                    material_key = self.extract_material_key(name)
                    usage_info = usage_map.get(material_key, {})
                    
                    # 创建或更新耗材记录
                    supply, created = Supply.objects.get_or_create(
                        name=name,
                        defaults={
                            'category': category,
                            'unit': unit,
                            'unit_price': unit_price,
                            'purchaser': purchaser,
                            'min_order_quantity': moq,
                            'max_stock': max_stock,
                            'min_stock': min_stock,
                            'safety_stock': min_stock,  # 暂时用最低库存作为安全库存
                            'usage_station': usage_info.get('usage_station', ''),
                            'usage_per_machine': usage_info.get('usage_per_machine', 0),
                            'standard_usage_count': usage_info.get('standard_usage_count', 0),
                        }
                    )
                    
                    if created:
                        created_count += 1
                        self.stdout.write(f'创建耗材: {name}')
                    
                except Exception as e:
                    self.stdout.write(
                        self.style.WARNING(f'跳过第{i+1}行，处理出错: {str(e)}')
                    )
                    continue
        
        return created_count

    def extract_moq(self, row):
        """提取MOQ信息"""
        # 在备注列或其他列中查找MOQ信息
        for col_idx in range(len(row)):
            if pd.notna(row.iloc[col_idx]):
                cell_value = str(row.iloc[col_idx])
                # 查找MOQ:200PCS格式
                moq_match = re.search(r'MOQ:(\d+)', cell_value)
                if moq_match:
                    return int(moq_match.group(1))
        return 1

    def determine_category(self, name):
        """根据名称判断分类"""
        name_lower = name.lower()
        
        if '测试针' in name or '探针' in name or 'tip' in name_lower:
            return '探针'
        elif '線材' in name or '线材' in name or '線' in name:
            return '线材'
        elif '開關' in name or '开关' in name or 'switch' in name_lower:
            return '开关'
        elif '傳感器' in name or '传感器' in name or 'sensor' in name_lower:
            return '传感器'
        elif '彈簧' in name or '弹簧' in name or 'spring' in name_lower:
            return '弹簧'
        elif '設備耗材' in name:
            return '设备耗材'
        elif '設備配件' in name:
            return '设备配件'
        else:
            return '其他' 