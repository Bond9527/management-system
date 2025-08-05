import pandas as pd
from django.core.management.base import BaseCommand
from supplies.models import DynamicCalculationItem, ApplicationForm
from django.db import transaction
from decimal import Decimal
import math
import re

class Command(BaseCommand):
    help = '将Excel所有sheet内容导入DynamicCalculationItem，挂到B453 SMT ATE 2025年7月份耗材管控表（ID=14）'

    def clean_material_name(self, name):
        """清洗物料名称，去除空格、标点、特殊字符，统一格式"""
        # 去除所有空格、标点、特殊字符，只保留字母数字和连字符
        cleaned = re.sub(r'[^\w\-]', '', str(name).strip())
        # 统一转小写
        return cleaned.lower()

    def add_arguments(self, parser):
        parser.add_argument('--file', type=str, required=True, help='Excel文件路径')

    def handle(self, *args, **options):
        file_path = options['file']
        application_form_id = 14  # 固定ID
        try:
            application_form = ApplicationForm.objects.get(id=application_form_id)
        except ApplicationForm.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'未找到ID={application_form_id}的申请表'))
            return

        self.stdout.write(self.style.WARNING('清空旧数据...'))
        DynamicCalculationItem.objects.filter(form=application_form).delete()

        self.stdout.write(self.style.SUCCESS(f'开始导入 {file_path} 到申请表: {application_form.name}'))
        xls = pd.ExcelFile(file_path)
        total_created = 0
        global_no = 1  # 全局序号
        seen_materials = set()  # 记录已导入的物料名称
        with transaction.atomic():
            for sheet_name in xls.sheet_names:
                # 先尝试多级表头
                try:
                    df = pd.read_excel(xls, sheet_name=sheet_name, header=[0,1])
                    # 拼接多级表头为单行
                    df.columns = [''.join([str(x) for x in col if str(x) != 'nan']).replace(' ', '') for col in df.columns.values]
                except Exception:
                    df = pd.read_excel(xls, sheet_name=sheet_name)
                    df.columns = [str(col).replace(' ', '') for col in df.columns]
                self.stdout.write(f'处理Sheet: {sheet_name}，共{len(df)}行')
                self.stdout.write(f'实际列名: {df.columns.tolist()}')
                # 自动宽松查找物料名列
                material_col = None
                for col in df.columns:
                    if any(key in str(col) for key in ['料描述','物料描述','品名','名称','名稱']):
                        material_col = col
                        break
                if not material_col:
                    self.stdout.write(self.style.ERROR('未找到“料描述/物料描述/品名/名称”列，跳过该sheet'))
                    continue
                for idx, row in df.iterrows():
                    material_name = row.get(material_col)
                    if (
                        not material_name
                        or str(material_name).strip() == ''
                        or str(material_name).strip().lower() == 'nan'
                        or (isinstance(material_name, float) and math.isnan(material_name))
                        or '核准' in str(material_name)
                    ):
                        continue
                    
                    # 去重检查
                    material_name_clean = self.clean_material_name(material_name)
                    if material_name_clean in seen_materials:
                        self.stdout.write(f'跳过重复物料: {material_name} (清洗后: {material_name_clean})')
                        continue  # 跳过重复物料
                    seen_materials.add(material_name_clean)
                    self.stdout.write(f'导入物料: {material_name} (清洗后: {material_name_clean})')
                    
                    # 基础字段
                    unit = self._find_value(row, ['单位','單位','unit']) or 'pcs'
                    purchaser = self._find_value(row, ['采购员','採購員','purchaser']) or ''
                    unit_price_raw = self._find_value(row, ['单价','單價','單價(RMB)','unit_price','price'])
                    unit_price = unit_price_raw or 0
                    if unit_price_raw:
                        self.stdout.write(f'找到单价: {material_name} -> {unit_price_raw}')
                    else:
                        self.stdout.write(f'未找到单价: {material_name}')
                    min_stock = self._find_value(row, ['最低','min_stock','min']) or 0
                    max_stock = self._find_value(row, ['最高','max_stock','max']) or 0
                    moq = self._find_value(row, ['MOQ','moq']) or 0
                    total_amount = self._find_value(row, ['总金额','总金额(RMB)','total_amount','amount']) or 0
                    remark = self._find_value(row, ['备注','備註','remark']) or ''

                    # NaN安全转换
                    min_stock = safe_int(min_stock)
                    max_stock = safe_int(max_stock)
                    moq = safe_int(moq)
                    unit_price = 0 if pd.isna(unit_price) else Decimal(str(unit_price))
                    total_amount = 0 if pd.isna(total_amount) else Decimal(str(total_amount))

                    # 自动识别月度需求/库存、快照、周需求等
                    monthly_data = {}
                    stock_snapshots = {}
                    chase_data = {}
                    for col in df.columns:
                        col_str = str(col)
                        val = row.get(col)
                        if pd.isna(val):
                            continue
                        # 月度需求/库存
                        if '需求' in col_str or ('月' in col_str and '需求' in col_str) or '明细' in col_str:
                            monthly_data[col_str] = val
                        elif '库存' in col_str or '存量' in col_str or '备料' in col_str:
                            stock_snapshots[col_str] = val
                        # 周需求/追料
                        elif ('W0' in col_str or 'W1' in col_str or 'W2' in col_str or 'W3' in col_str or 'W4' in col_str or '周' in col_str) and ('需求' in col_str or '数量' in col_str or '数' in col_str):
                            chase_data[col_str] = val
                        # 追料特殊日期
                        elif ('6/19' in col_str or '6/25' in col_str or '8/19' in col_str or '8/25' in col_str) and ('数量' in col_str or '数' in col_str):
                            chase_data[col_str] = val

                    # 自动分配序号
                    no = global_no

                    item = DynamicCalculationItem(
                        form=application_form,
                        no=global_no,
                        material_name=str(material_name).strip(),
                        purchaser=purchaser,
                        unit_price=unit_price,
                        min_stock=min_stock,
                        max_stock=max_stock,
                        moq=moq,
                        total_amount=total_amount,
                        monthly_data=monthly_data,
                        stock_snapshots=stock_snapshots,
                        chase_data=chase_data,
                        is_visible=True
                    )
                    item.save()
                    total_created += 1
                    global_no += 1
        self.stdout.write(self.style.SUCCESS(f'全部导入完成，共创建 {total_created} 条记录'))

    def _find_value(self, row, keys):
        for key in keys:
            for col in row.index:
                if key in str(col):
                    return row.get(col)
        return None

def safe_int(val):
    try:
        if pd.isna(val):
            return 0
        val_str = str(val).strip()
        if val_str == '' or val_str == '/':
            return 0
        # 允许小数点的数字
        if val_str.replace('.', '', 1).isdigit():
            return int(float(val_str))
        return 0
    except Exception:
        return 0 