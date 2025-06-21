from django.db import models
from django.contrib.auth.models import User

class Supply(models.Model):
    """耗材模型"""
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200, verbose_name="耗材名称")
    category = models.CharField(max_length=100, verbose_name="分类")
    unit = models.CharField(max_length=50, verbose_name="单位")
    current_stock = models.IntegerField(default=0, verbose_name="当前库存")
    safety_stock = models.IntegerField(default=0, verbose_name="安全库存")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="单价")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")

    class Meta:
        verbose_name = "耗材"
        verbose_name_plural = "耗材"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.category})"

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
