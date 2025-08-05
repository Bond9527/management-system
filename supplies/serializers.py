from rest_framework import serializers
from .models import Supply, InventoryRecord, B482SupplyItem, AndorSupplyItem, CapacityForecast, B453SupplyItem, B453CalculationItem, B453ForecastData, ApplicationTemplate, ApplicationForm, DynamicSupplyItem, DynamicCalculationItem, DynamicForecastData
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class SupplySerializer(serializers.ModelSerializer):
    class Meta:
        model = Supply
        fields = '__all__'
    
    def create(self, validated_data):
        # 为新字段设置默认值
        validated_data.setdefault('purchaser', '')
        validated_data.setdefault('min_order_quantity', 1)
        validated_data.setdefault('lead_time_days', 0)
        validated_data.setdefault('standard_usage_count', 0)
        validated_data.setdefault('usage_per_machine', 0)
        validated_data.setdefault('usage_station', '')
        validated_data.setdefault('max_stock', 0)
        validated_data.setdefault('min_stock', 0)
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # 确保更新时也有默认值
        return super().update(instance, validated_data)

class InventoryRecordSerializer(serializers.ModelSerializer):
    supply_name = serializers.CharField(source='supply.name', read_only=True)
    supply_category = serializers.CharField(source='supply.category', read_only=True)
    supply_unit = serializers.CharField(source='supply.unit', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    
    class Meta:
        model = InventoryRecord
        fields = '__all__'

class SupplyDetailSerializer(serializers.ModelSerializer):
    records = InventoryRecordSerializer(many=True, read_only=True)
    
    class Meta:
        model = Supply
        fields = '__all__'

# ================================
# 🆕 B482耗材管控申请表序列化器
# ================================

class B482SupplyItemSerializer(serializers.ModelSerializer):
    """B482耗材管控申请表序列化器"""
    
    class Meta:
        model = B482SupplyItem
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by')

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

# ================================
# 🆕 Andor耗材需求计算表序列化器
# ================================

class AndorSupplyItemSerializer(serializers.ModelSerializer):
    """Andor耗材需求计算表序列化器"""
    
    class Meta:
        model = AndorSupplyItem
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by')

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

# ================================
# 🆕 产能预测数据序列化器
# ================================

class CapacityForecastSerializer(serializers.ModelSerializer):
    """产能预测数据序列化器"""
    
    class Meta:
        model = CapacityForecast
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by')

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

# ================================
# 🆕 B453 SMT ATE耗材管控表序列化器
# ================================

class B453SupplyItemSerializer(serializers.ModelSerializer):
    """B453 SMT ATE耗材管控表序列化器"""
    
    class Meta:
        model = B453SupplyItem
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by')

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

# ================================
# 🆕 B453耗材需求计算表序列化器
# ================================

class B453CalculationItemSerializer(serializers.ModelSerializer):
    """B453耗材需求计算表序列化器"""
    
    class Meta:
        model = B453CalculationItem
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by')

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

# ================================
# 🆕 B453产能预测数据序列化器
# ================================

class B453ForecastDataSerializer(serializers.ModelSerializer):
    """B453产能预测数据序列化器"""
    
    class Meta:
        model = B453ForecastData
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by')

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

# ================================
# 🆕 动态申请表序列化器
# ================================

class ApplicationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationTemplate
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by')

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ApplicationFormSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source='template.name', read_only=True)
    template_type = serializers.CharField(source='template.template_type', read_only=True)
    has_calculation = serializers.BooleanField(source='template.has_calculation', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = ApplicationForm
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by')

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class DynamicSupplyItemSerializer(serializers.ModelSerializer):
    form_name = serializers.CharField(source='form.name', read_only=True)
    form_code = serializers.CharField(source='form.code', read_only=True)
    
    class Meta:
        model = DynamicSupplyItem
        fields = '__all__'


class DynamicCalculationItemSerializer(serializers.ModelSerializer):
    form_name = serializers.CharField(source='form.name', read_only=True)
    form_code = serializers.CharField(source='form.code', read_only=True)
    purchaser = serializers.CharField(allow_blank=True, required=False)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    
    class Meta:
        model = DynamicCalculationItem
        fields = '__all__'

    def to_representation(self, instance):
        """添加错误处理，确保序列化时不会因为缺失字段而失败"""
        try:
            return super().to_representation(instance)
        except Exception as e:
            import logging
            logger = logging.getLogger('django')
            logger.error(f"序列化DynamicCalculationItem时出错: {e}")
            # 返回基本字段，避免完全失败
            return {
                'id': instance.id,
                'form': instance.form_id,
                'no': instance.no,
                'material_name': instance.material_name,
                'error': f'序列化错误: {str(e)}'
            }

    def update(self, instance, validated_data):
        import logging
        logger = logging.getLogger('django')
        chase_data = validated_data.get('chase_data', None)
        logger.warning(f"[调试] PATCH 更新 chase_data: {chase_data}")
        result = super().update(instance, validated_data)
        logger.warning(f"[调试] 保存后 instance.chase_data: {instance.chase_data}")
        return result


class DynamicForecastDataSerializer(serializers.ModelSerializer):
    form_name = serializers.CharField(source='form.name', read_only=True)
    form_code = serializers.CharField(source='form.code', read_only=True)
    
    class Meta:
        model = DynamicForecastData
        fields = '__all__' 