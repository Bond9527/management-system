from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal

class Supply(models.Model):
    """耗材主数据模型 - 存储不变的基础信息"""
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200, verbose_name="耗材名称")
    category = models.CharField(max_length=100, verbose_name="分类")
    unit = models.CharField(max_length=20, verbose_name="单位")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="单价(RMB)")
    
    # 新增固定基础数据字段
    purchaser = models.CharField(max_length=50, default="", verbose_name="采购员")
    min_order_quantity = models.IntegerField(default=1, verbose_name="最小采购量(MOQ)")
    lead_time_days = models.IntegerField(default=0, verbose_name="交货周期(天)")
    standard_usage_count = models.IntegerField(default=0, verbose_name="标准使用次数")
    usage_per_machine = models.IntegerField(default=0, verbose_name="每台机用量")
    usage_station = models.CharField(max_length=100, default="", verbose_name="使用站别")
    
    # 库存相关 - 这些是变动数据
    current_stock = models.IntegerField(default=0, verbose_name="当前库存")
    safety_stock = models.IntegerField(default=0, verbose_name="安全库存")
    max_stock = models.IntegerField(default=0, verbose_name="最高库存")
    min_stock = models.IntegerField(default=0, verbose_name="最低库存")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")

    class Meta:
        verbose_name = "耗材"
        verbose_name_plural = "耗材"
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def total_value(self):
        """计算库存总价值"""
        return self.current_stock * self.unit_price

    @property
    def is_low_stock(self):
        """是否库存不足"""
        return self.current_stock <= self.safety_stock

    @property
    def need_reorder(self):
        """是否需要补货"""
        return self.current_stock <= self.min_stock

class InventoryRecord(models.Model):
    """库存变动记录模型"""
    RECORD_TYPES = [
        ('in', '入库'),
        ('out', '出库'),
        ('adjust', '调整'),
    ]
    
    id = models.AutoField(primary_key=True)
    type = models.CharField(max_length=10, choices=RECORD_TYPES, verbose_name="操作类型")
    supply = models.ForeignKey(Supply, on_delete=models.CASCADE, verbose_name="耗材")
    quantity = models.IntegerField(verbose_name="数量")
    operator = models.CharField(max_length=100, verbose_name="操作人")
    department = models.CharField(max_length=100, verbose_name="部门")
    remark = models.TextField(blank=True, verbose_name="备注")
    previous_stock = models.IntegerField(verbose_name="调整前库存")
    new_stock = models.IntegerField(verbose_name="调整后库存")
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="操作时间")

    class Meta:
        verbose_name = "库存变动记录"
        verbose_name_plural = "库存变动记录"
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.supply.name} - {self.get_type_display()} - {self.quantity}"


# ================================
# 🆕 B482耗材管控申请表模型
# ================================

class B482SupplyItem(models.Model):
    """B482 TE课6512部门7月常用消耗材管控申请表"""
    id = models.AutoField(primary_key=True)
    serial_number = models.IntegerField(verbose_name="序号")
    material_description = models.TextField(verbose_name="物料描述")
    unit = models.CharField(max_length=20, default="pcs", verbose_name="单位")
    purchaser = models.CharField(max_length=50, verbose_name="采购员")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="单价(RMB)")
    max_safety_stock = models.IntegerField(verbose_name="最高安全库存")
    min_safety_stock = models.IntegerField(verbose_name="最低安全库存")
    moq = models.IntegerField(verbose_name="最小采购量(MOQ)")
    unpurchased_amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="未采购量(RMB)")
    lead_time = models.IntegerField(verbose_name="L/T(Day)")
    june_2025 = models.IntegerField(default=0, verbose_name="2025年6月份")
    july_2025 = models.IntegerField(default=0, verbose_name="2025年7月份")
    july_m1 = models.IntegerField(default=0, verbose_name="7月M1")
    july_m2 = models.IntegerField(default=0, verbose_name="7月M2")
    july_m3 = models.IntegerField(default=0, verbose_name="7月M3")
    july_m4 = models.IntegerField(default=0, verbose_name="7月M4")
    remark = models.TextField(blank=True, verbose_name="备注")
    
    # 🆕 计算参数 (可选)
    usage_per_set = models.IntegerField(default=1, verbose_name="每臺機用量")
    usage_count = models.IntegerField(default=1000, verbose_name="使用次数")
    monthly_capacity = models.IntegerField(default=497700, verbose_name="当月产能")
    enable_auto_calculation = models.BooleanField(default=False, verbose_name="启用自动计算")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="创建用户")

    class Meta:
        verbose_name = "B482耗材管控申请表"
        verbose_name_plural = "B482耗材管控申请表"
        ordering = ['serial_number']

    def __str__(self):
        return f"B482-{self.serial_number}: {self.material_description[:30]}"


# ================================
# 🆕 Andor耗材需求计算表模型
# ================================

class AndorSupplyItem(models.Model):
    """Andor7月常用耗材需求计算表"""
    id = models.AutoField(primary_key=True)
    month = models.CharField(max_length=20, default="2025.7", verbose_name="月份")
    no = models.IntegerField(verbose_name="No.")
    material_name = models.CharField(max_length=200, verbose_name="耗材名称")
    usage_station = models.CharField(max_length=100, verbose_name="使用站别")
    usage_per_set = models.IntegerField(verbose_name="每臺機用量")
    usage_count = models.IntegerField(verbose_name="使用次数")
    monthly_capacity = models.IntegerField(verbose_name="当月产能")
    min_inventory = models.IntegerField(verbose_name="最低库存")
    max_inventory = models.IntegerField(verbose_name="最高库存")
    monthly_demand = models.IntegerField(verbose_name="当月需求/站")
    remark = models.TextField(blank=True, verbose_name="备注(实际订购数量)")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="创建用户")

    class Meta:
        verbose_name = "Andor耗材需求计算表"
        verbose_name_plural = "Andor耗材需求计算表"
        ordering = ['no', 'usage_station']

    def __str__(self):
        return f"Andor-{self.no}: {self.material_name} ({self.usage_station})"


# ================================
# 🆕 产能预测数据模型
# ================================

class CapacityForecast(models.Model):
    """产能预测数据"""
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, default="默认预测", verbose_name="预测名称")
    max_capacity = models.IntegerField(verbose_name="最高产能")
    min_capacity = models.IntegerField(verbose_name="最低产能")
    apr_24 = models.IntegerField(verbose_name="Apr-24")
    may_25 = models.IntegerField(verbose_name="May-25")
    jun_25 = models.IntegerField(verbose_name="Jun-25")
    jul_25 = models.IntegerField(verbose_name="Jul-25")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="创建用户")

    class Meta:
        verbose_name = "产能预测数据"
        verbose_name_plural = "产能预测数据"
        ordering = ['-updated_at']

    def __str__(self):
        return f"产能预测: {self.name}"


# ================================
# 🆕 B453 SMT ATE耗材管控表模型
# ================================

class B453SupplyItem(models.Model):
    """B453 SMT ATE耗材管控表"""
    id = models.AutoField(primary_key=True)
    serial_number = models.IntegerField(verbose_name="序号")
    material_description = models.TextField(verbose_name="物料描述")
    unit = models.CharField(max_length=20, default="pcs", verbose_name="单位")
    purchaser = models.CharField(max_length=50, verbose_name="采购员")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="单价(RMB)")
    min_safety_stock = models.IntegerField(verbose_name="安全库存-最低")
    max_safety_stock = models.IntegerField(verbose_name="安全库存-最高")
    moq = models.IntegerField(verbose_name="最小采购量(MOQ)")
    lead_time_weeks = models.IntegerField(verbose_name="L/T(Wks)")
    
    # 月度明细数据 (库存+需求)
    apr_2025_stock = models.IntegerField(default=0, verbose_name="2025/4/1库存")
    may_2025_demand = models.IntegerField(default=0, verbose_name="2025年5月份需求")
    may_2025_stock = models.IntegerField(default=0, verbose_name="2025/5/22库存")
    jun_2025_demand = models.IntegerField(default=0, verbose_name="2025年6月份需求")
    jun_2025_stock = models.IntegerField(default=0, verbose_name="2025/6/23库存")
    jul_2025_demand = models.IntegerField(default=0, verbose_name="2025年7月份需求")
    jul_2025_stock = models.IntegerField(default=0, verbose_name="2025/7/20库存")
    aug_2025_demand = models.IntegerField(default=0, verbose_name="2025年8月份需求")
    # 新增：各月周需求
    weekly_demand = models.JSONField(default=dict, blank=True, verbose_name="各月周需求")
    remark = models.TextField(blank=True, verbose_name="备注")
    
    # 🆕 计算关联字段
    calculation_id = models.IntegerField(null=True, blank=True, verbose_name="关联的计算表ID")
    has_calculation = models.BooleanField(default=False, verbose_name="是否有关联的计算表")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="创建用户")

    class Meta:
        verbose_name = "B453 SMT ATE耗材管控表"
        verbose_name_plural = "B453 SMT ATE耗材管控表"
        ordering = ['serial_number']

    def __str__(self):
        return f"B453-{self.serial_number}: {self.material_description[:30]}"


# ================================
# 🆕 B453耗材需求计算表模型
# ================================

class B453CalculationItem(models.Model):
    """B453耗材需求计算表"""
    id = models.AutoField(primary_key=True)
    no = models.IntegerField(verbose_name="No.")
    material_name = models.TextField(verbose_name="料件名稱")
    usage_station = models.CharField(max_length=50, verbose_name="使用站別")
    usage_per_machine = models.IntegerField(default=0, verbose_name="每台机用量")
    usage_count = models.IntegerField(default=0, verbose_name="使用次數")
    monthly_capacity = models.IntegerField(default=0, verbose_name="当月產能")
    min_stock = models.IntegerField(default=0, verbose_name="最低庫存數")
    min_total_stock = models.IntegerField(default=0, verbose_name="最低庫存總數")
    max_stock = models.IntegerField(default=0, verbose_name="最高庫存數")
    max_total_stock = models.IntegerField(default=0, verbose_name="最高庫存總數")
    actual_stock = models.IntegerField(default=0, verbose_name="實際庫存數量")
    monthly_demand_per_station = models.IntegerField(default=0, verbose_name="当月需求/站")
    monthly_total_demand = models.IntegerField(default=0, verbose_name="当月總需求")
    moq_remark = models.TextField(blank=True, verbose_name="備註(MOQ)")
    
    # 关联字段
    management_id = models.IntegerField(null=True, blank=True, verbose_name="关联的管控表ID")
    linked_material = models.TextField(blank=True, verbose_name="关联的物料描述")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="单价")
    moq = models.IntegerField(null=True, blank=True, verbose_name="MOQ")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    created_by = models.ForeignKey('accounts.UserProfile', on_delete=models.SET_NULL, null=True, verbose_name="创建者")

    class Meta:
        verbose_name = "B453耗材需求计算表"
        verbose_name_plural = verbose_name
        ordering = ['no']

    def __str__(self):
        return f"{self.no} - {self.material_name}"


# ================================
# 🆕 B453产能预测数据模型
# ================================

class B453ForecastData(models.Model):
    """B453产能预测数据"""
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, default="B453预测", verbose_name="预测名称")
    mar_24 = models.IntegerField(verbose_name="Mar-24")
    oct_24 = models.IntegerField(verbose_name="Oct-24")
    dec_24 = models.IntegerField(verbose_name="Dec-24")
    jan_25 = models.IntegerField(verbose_name="Jan-25")
    feb_25 = models.IntegerField(verbose_name="Feb-25")
    mar_25 = models.IntegerField(verbose_name="Mar-25")
    apr_25 = models.IntegerField(verbose_name="Apr-25")
    may_25 = models.IntegerField(verbose_name="May-25")
    jun_25 = models.IntegerField(verbose_name="Jun-25")
    jul_25 = models.IntegerField(verbose_name="Jul-25")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="创建用户")

    class Meta:
        verbose_name = "B453产能预测数据"
        verbose_name_plural = "B453产能预测数据"
        ordering = ['-updated_at']

    def __str__(self):
        return f"B453产能预测: {self.name}"


# ================================
# 🆕 动态申请表模板系统
# ================================

class ApplicationTemplate(models.Model):
    """申请表模板"""
    TEMPLATE_TYPES = [
        ('supply_management', '耗材管控申请表'),
        ('demand_calculation', '需求计算表'),
        ('capacity_forecast', '产能预测表'),
        ('custom', '自定义表格'),
    ]
    
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200, verbose_name="模板名称")
    code = models.CharField(max_length=50, unique=True, verbose_name="模板代码")
    template_type = models.JSONField(default=list, verbose_name="模板类型")  # 支持多选模板类型
    description = models.TextField(blank=True, verbose_name="模板描述")
    is_active = models.BooleanField(default=True, verbose_name="是否启用")
    
    # 表格配置
    has_calculation = models.BooleanField(default=False, verbose_name="是否包含计算功能")
    calculation_template_id = models.IntegerField(null=True, blank=True, verbose_name="关联的计算模板ID")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="创建用户")

    class Meta:
        verbose_name = "申请表模板"
        verbose_name_plural = "申请表模板"
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class ApplicationForm(models.Model):
    """申请表实例"""
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('active', '启用'),
        ('archived', '归档'),
    ]
    
    id = models.AutoField(primary_key=True)
    template = models.ForeignKey(ApplicationTemplate, on_delete=models.CASCADE, verbose_name="申请表模板")
    name = models.CharField(max_length=200, verbose_name="申请表名称")
    code = models.CharField(max_length=50, unique=True, verbose_name="申请表代码")
    department = models.CharField(max_length=100, verbose_name="申请部门")
    period = models.CharField(max_length=50, verbose_name="申请周期") # 如: 2025年7月
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name="状态")
    
    # 关联的计算表
    calculation_form_id = models.IntegerField(null=True, blank=True, verbose_name="关联的计算表ID")
    has_calculation_form = models.BooleanField(default=False, verbose_name="是否有关联的计算表")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="创建用户")

    class Meta:
        verbose_name = "申请表"
        verbose_name_plural = "申请表"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.department} ({self.period})"


class DynamicSupplyItem(models.Model):
    """动态申请表的耗材项目"""
    id = models.AutoField(primary_key=True)
    form = models.ForeignKey(ApplicationForm, on_delete=models.CASCADE, verbose_name="所属申请表")
    serial_number = models.IntegerField(verbose_name="序号")
    material_description = models.TextField(verbose_name="物料描述")
    unit = models.CharField(max_length=20, default="pcs", verbose_name="单位")
    purchaser = models.CharField(max_length=50, verbose_name="采购员")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="单价(RMB)")
    max_safety_stock = models.IntegerField(verbose_name="最高安全库存")
    min_safety_stock = models.IntegerField(verbose_name="最低安全库存")
    moq = models.IntegerField(verbose_name="最小采购量(MOQ)")
    lead_time = models.IntegerField(verbose_name="L/T(Day)")
    remark = models.TextField(blank=True, verbose_name="备注")
    
    # 动态月份数据 (JSON格式存储)
    monthly_data = models.JSONField(default=dict, verbose_name="月度数据")
    
    # 计算参数
    usage_per_set = models.IntegerField(default=1, verbose_name="每臺機用量")
    usage_count = models.IntegerField(default=1000, verbose_name="使用次数")
    monthly_capacity = models.IntegerField(default=497700, verbose_name="当月产能")
    enable_auto_calculation = models.BooleanField(default=False, verbose_name="启用自动计算")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")

    class Meta:
        verbose_name = "动态申请表耗材项目"
        verbose_name_plural = "动态申请表耗材项目"
        ordering = ['form', 'serial_number']
        unique_together = ['form', 'serial_number']

    def __str__(self):
        return f"{self.form.code}-{self.serial_number}: {self.material_description[:30]}"


class DynamicCalculationItem(models.Model):
    """动态计算表的计算项目"""
    id = models.AutoField(primary_key=True)
    form = models.ForeignKey(ApplicationForm, on_delete=models.CASCADE, verbose_name="所属申请表")
    no = models.IntegerField(verbose_name="No.")
    material_name = models.CharField(max_length=200, verbose_name="料材名称", default='')
    usage_station = models.CharField(max_length=100, verbose_name="使用站别", default='')
    usage_per_set = models.IntegerField(verbose_name="每臺機用量", default=0)
    usage_count = models.IntegerField(verbose_name="使用次数", default=0)
    monthly_capacity = models.IntegerField(verbose_name="当月产能", default=0)
    min_stock = models.IntegerField(verbose_name="最低库存数量", default=0)
    min_total_stock = models.IntegerField(verbose_name="最低庫存總數", default=0)
    max_stock = models.IntegerField(verbose_name="最高库存数量", default=0)
    max_total_stock = models.IntegerField(verbose_name="最高庫存總數", default=0)
    monthly_demand = models.IntegerField(verbose_name="当月需求/站", default=0)
    monthly_net_demand = models.IntegerField(verbose_name="当月总需求", default=0)
    actual_order = models.IntegerField(verbose_name="实际订购数量", default=0)
    moq_remark = models.TextField(blank=True, verbose_name="备注(MOQ)")
    
    # 🆕 添加采购员字段
    purchaser = models.CharField(max_length=50, default="", verbose_name="采购员")
    
    # 关联的管控表项目
    linked_supply_item_id = models.IntegerField(null=True, blank=True, verbose_name="关联的管控表项目ID")
    linked_material = models.TextField(blank=True, verbose_name="关联的物料描述")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="单价")
    moq = models.IntegerField(null=True, blank=True, verbose_name="MOQ")
    
    # 动态月度数据
    monthly_data = models.JSONField(default=dict, verbose_name="月度库存和需求明细")
    # 动态追料数据
    chase_data = models.JSONField(default=dict, verbose_name="追料需求明细")
    # 动态库存快照
    stock_snapshots = models.JSONField(default=dict, verbose_name="特定日期库存快照")

    # 🆕 一行多列数据存储 - 支持多个使用站别
    multi_station_data = models.JSONField(default=dict, verbose_name="多使用站别数据")
    # 数据结构示例：
    # {
    #     "stations": ["MLR Left DFU", "MLR Right FCT", "MLR Right R2 FCT", "MLR Left FCT"],
    #     "usage_per_set": [21, 8, 8, 24],
    #     "usage_count": [50000, 50000, 50000, 50000],
    #     "monthly_capacity": [363000, 363000, 363000, 363000],
    #     "min_stock": [228, 228, 228, 228],
    #     "max_stock": [512, 512, 512, 512],
    #     "monthly_demand": [181, 65, 65, 202],
    #     "monthly_net_demand": [181, 65, 65, 202],
    #     "actual_order": [181, 65, 65, 202],
    #     "moq_remark": ["MOQ: 100", "MOQ: 100", "MOQ: 100", "MOQ: 100"]
    # }
    
    # 🆕 标识是否使用多站别模式
    is_multi_station = models.BooleanField(default=False, verbose_name="是否使用多站别模式")

    # 总金额 (自动计算)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name="总金额")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")

    # 可见性/逻辑删除
    is_visible = models.BooleanField(default=True, verbose_name="是否可见")

    class Meta:
        verbose_name = "动态计算表项目"
        verbose_name_plural = "动态计算表项目"
        ordering = ['form', 'no']
        unique_together = ['form', 'no']

    def __str__(self):
        return f"{self.form.code}-计算-{self.no}: {self.material_name}"
    
    # 🆕 多站别数据处理方法
    def get_station_count(self):
        """获取使用站别数量"""
        if self.is_multi_station and self.multi_station_data:
            return len(self.multi_station_data.get('stations', []))
        return 1
    
    def get_total_demand(self):
        """获取总需求量"""
        if self.is_multi_station and self.multi_station_data:
            return sum(self.multi_station_data.get('monthly_demand', []))
        return self.monthly_demand
    
    def get_total_actual_order(self):
        """获取总实际订购量"""
        if self.is_multi_station and self.multi_station_data:
            return sum(self.multi_station_data.get('actual_order', []))
        return self.actual_order
    
    def get_stations_summary(self):
        """获取使用站别摘要"""
        if self.is_multi_station and self.multi_station_data:
            stations = self.multi_station_data.get('stations', [])
            if len(stations) > 2:
                return f"{stations[0]}, {stations[1]}... ({len(stations)}个站别)"
            return ", ".join(stations)
        return self.usage_station


class DynamicForecastData(models.Model):
    """动态产能预测数据"""
    id = models.AutoField(primary_key=True)
    form = models.ForeignKey(ApplicationForm, on_delete=models.CASCADE, verbose_name="所属申请表")
    name = models.CharField(max_length=100, verbose_name="预测名称")
    
    # 动态预测数据 (JSON格式存储，支持任意月份)
    forecast_data = models.JSONField(default=dict, verbose_name="预测数据")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")

    class Meta:
        verbose_name = "动态产能预测数据"
        verbose_name_plural = "动态产能预测数据"
        ordering = ['form', 'name']

    def __str__(self):
        return f"{self.form.code}-预测: {self.name}"


class ImportLog(models.Model):
    """导入日志模型 - 记录Excel导入操作"""
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name="操作用户")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="导入时间")
    file_name = models.CharField(max_length=255, verbose_name="文件名")
    result = models.TextField(verbose_name="导入结果")
    success = models.BooleanField(default=True, verbose_name="是否成功")
    
    # 导入详情
    imported_count = models.IntegerField(default=0, verbose_name="导入数量")
    error_count = models.IntegerField(default=0, verbose_name="错误数量")
    error_details = models.TextField(blank=True, verbose_name="错误详情")

    class Meta:
        verbose_name = "导入日志"
        verbose_name_plural = "导入日志"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.file_name} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
