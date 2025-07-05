from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import Supply, InventoryRecord, B482SupplyItem, AndorSupplyItem, CapacityForecast, B453SupplyItem, B453CalculationItem, B453ForecastData, ApplicationTemplate, ApplicationForm, DynamicSupplyItem, DynamicCalculationItem, DynamicForecastData
from .serializers import SupplySerializer, InventoryRecordSerializer, SupplyDetailSerializer, B482SupplyItemSerializer, AndorSupplyItemSerializer, CapacityForecastSerializer, B453SupplyItemSerializer, B453CalculationItemSerializer, B453ForecastDataSerializer, ApplicationTemplateSerializer, ApplicationFormSerializer, DynamicSupplyItemSerializer, DynamicCalculationItemSerializer, DynamicForecastDataSerializer
from django.db import models
from django.db.models import Q
from rest_framework.decorators import action

class SupplyViewSet(viewsets.ModelViewSet):
    """耗材管理视图集"""
    queryset = Supply.objects.all()
    serializer_class = SupplySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # 关闭分页，返回所有数据

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SupplyDetailSerializer
        return SupplySerializer

    def get_queryset(self):
        queryset = Supply.objects.all()
        category = self.request.query_params.get('category', None)
        search = self.request.query_params.get('search', None)
        
        if category:
            queryset = queryset.filter(category=category)
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(category__icontains=search)
            )
        
        return queryset.order_by('-updated_at')

class InventoryRecordViewSet(viewsets.ModelViewSet):
    """库存变动记录视图集"""
    queryset = InventoryRecord.objects.all()
    serializer_class = InventoryRecordSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # 关闭分页，返回所有数据

    def get_queryset(self):
        queryset = InventoryRecord.objects.all()
        supply_id = self.request.query_params.get('supply_id', None)
        record_type = self.request.query_params.get('type', None)
        
        if supply_id:
            queryset = queryset.filter(supply_id=supply_id)
        
        if record_type:
            queryset = queryset.filter(type=record_type)
        
        return queryset.order_by('-timestamp')

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def adjust_stock(request):
    """
    库存调整API
    """
    try:
        supply_id = request.data.get('supply_id')
        adjustment_type = request.data.get('type')  # 'in', 'out', 'adjust'
        quantity = request.data.get('quantity')
        unit_price = request.data.get('unit_price')  # 新增：单价调整
        remark = request.data.get('remark', '')
        
        if not all([supply_id, adjustment_type, quantity]):
            return Response({
                'error': '缺少必要参数'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            quantity = int(quantity)
            if quantity <= 0:
                return Response({
                    'error': '数量必须大于0'
                }, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({
                'error': '数量必须是有效数字'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 验证单价（如果提供了的话）
        if unit_price is not None:
            try:
                unit_price = float(unit_price)
                if unit_price < 0:
                    return Response({
                        'error': '单价不能为负数'
                    }, status=status.HTTP_400_BAD_REQUEST)
            except (ValueError, TypeError):
                return Response({
                    'error': '单价必须是有效数字'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            supply = Supply.objects.get(id=supply_id)
        except Supply.DoesNotExist:
            return Response({
                'error': '耗材不存在'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 记录原始库存和单价
        previous_stock = supply.current_stock
        previous_unit_price = supply.unit_price
        
        # 计算新库存
        if adjustment_type == 'in':
            new_stock = previous_stock + quantity
        elif adjustment_type == 'out':
            if previous_stock < quantity:
                return Response({
                    'error': '库存不足'
                }, status=status.HTTP_400_BAD_REQUEST)
            new_stock = previous_stock - quantity
        else:  # adjust
            new_stock = quantity
        
        # 开始事务
        with transaction.atomic():
            # 更新耗材库存
            supply.current_stock = new_stock
            
            # 如果提供了单价，也更新单价
            if unit_price is not None:
                supply.unit_price = unit_price
            
            supply.save()
            
            # 创建库存变动记录
            record = InventoryRecord.objects.create(
                type=adjustment_type,
                supply=supply,
                quantity=quantity,
                operator=request.user.username,
                department=getattr(request.user.userprofile, 'department', '未知部门') if hasattr(request.user, 'userprofile') else '未知部门',
                remark=remark,
                previous_stock=previous_stock,
                new_stock=new_stock
            )
            
            return Response({
                'message': '库存调整成功',
                'record': InventoryRecordSerializer(record).data
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        return Response({
            'error': f'操作失败: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_statistics(request):
    """
    获取统计信息
    """
    try:
        from django.db.models import Sum, Count
        from decimal import Decimal
        
        # 基础统计
        total_supplies = Supply.objects.count()
        low_stock_supplies = Supply.objects.filter(
            current_stock__lte=models.F('safety_stock')
        ).count()
        
        # 计算总价值
        total_value = Supply.objects.aggregate(
            total=Sum(models.F('current_stock') * models.F('unit_price'))
        )['total'] or Decimal('0')
        
        # 按分类统计
        from django.db.models import F
        category_stats = {}
        supplies_by_category = Supply.objects.values('category').annotate(
            count=Count('id'),
            total_stock=Sum('current_stock'),
            total_value=Sum(F('current_stock') * F('unit_price'))
        )
        
        for item in supplies_by_category:
            category_stats[item['category']] = {
                'count': item['count'],
                'total_stock': item['total_stock'] or 0,
                'total_value': float(item['total_value'] or 0)
            }
        
        # 最近的记录
        recent_records = InventoryRecord.objects.select_related('supply').order_by('-timestamp')[:10]
        recent_records_serializer = InventoryRecordSerializer(recent_records, many=True)
        
        return Response({
            'total_supplies': total_supplies,
            'low_stock_count': low_stock_supplies,
            'total_value': float(total_value),
            'category_stats': category_stats,
            'recent_records': recent_records_serializer.data
        })
        
    except Exception as e:
        return Response({
            'error': f'获取统计信息失败: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ================================
# 🆕 B482耗材管控申请表视图集
# ================================

class B482SupplyItemViewSet(viewsets.ModelViewSet):
    """B482耗材管控申请表视图集"""
    queryset = B482SupplyItem.objects.all()
    serializer_class = B482SupplyItemSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # 关闭分页

    def get_queryset(self):
        queryset = B482SupplyItem.objects.all()
        # 可以添加过滤逻辑
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(material_description__icontains=search) | 
                Q(purchaser__icontains=search)
            )
        return queryset.order_by('serial_number')

# ================================
# 🆕 Andor耗材需求计算表视图集
# ================================

class AndorSupplyItemViewSet(viewsets.ModelViewSet):
    """Andor耗材需求计算表视图集"""
    queryset = AndorSupplyItem.objects.all()
    serializer_class = AndorSupplyItemSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # 关闭分页

    def get_queryset(self):
        queryset = AndorSupplyItem.objects.all()
        # 可以添加过滤逻辑
        month = self.request.query_params.get('month', None)
        usage_station = self.request.query_params.get('usage_station', None)
        
        if month:
            queryset = queryset.filter(month=month)
        if usage_station:
            queryset = queryset.filter(usage_station__icontains=usage_station)
            
        return queryset.order_by('no', 'usage_station')

# ================================
# 🆕 产能预测数据视图集
# ================================

class CapacityForecastViewSet(viewsets.ModelViewSet):
    """产能预测数据视图集"""
    queryset = CapacityForecast.objects.all()
    serializer_class = CapacityForecastSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # 关闭分页

    def get_queryset(self):
        return CapacityForecast.objects.all().order_by('-updated_at')

# ================================
# 🆕 B453 SMT ATE耗材管控表视图集
# ================================

class B453SupplyItemViewSet(viewsets.ModelViewSet):
    """B453 SMT ATE耗材管控表视图集"""
    queryset = B453SupplyItem.objects.all()
    serializer_class = B453SupplyItemSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # 关闭分页

    def get_queryset(self):
        queryset = B453SupplyItem.objects.all()
        # 可以添加过滤逻辑
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(material_description__icontains=search) | 
                Q(purchaser__icontains=search)
            )
        return queryset.order_by('serial_number')

# ================================
# 🆕 B453耗材需求计算表视图集
# ================================

class B453CalculationItemViewSet(viewsets.ModelViewSet):
    """B453耗材需求计算表视图集"""
    queryset = B453CalculationItem.objects.all()
    serializer_class = B453CalculationItemSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # 关闭分页

    def get_queryset(self):
        queryset = B453CalculationItem.objects.all()
        # 可以添加过滤逻辑
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(material_name__icontains=search) | 
                Q(usage_station__icontains=search)
            )
        return queryset.order_by('no')

# ================================
# 🆕 B453产能预测数据视图集
# ================================

class B453ForecastDataViewSet(viewsets.ModelViewSet):
    """B453产能预测数据视图集"""
    queryset = B453ForecastData.objects.all()
    serializer_class = B453ForecastDataSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # 关闭分页

    def get_queryset(self):
        return B453ForecastData.objects.all().order_by('-updated_at')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

# ================================
# 🆕 统一计算引擎API
# ================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unified_calculation(request):
    """
    统一计算引擎API
    计算当月需求、最高/最低库存等
    """
    try:
        # 获取计算参数
        monthly_capacity = request.data.get('monthly_capacity')
        usage_per_set = request.data.get('usage_per_set')
        usage_count = request.data.get('usage_count')
        max_capacity = request.data.get('max_capacity')
        min_capacity = request.data.get('min_capacity')
        current_stock = request.data.get('current_stock')
        unit_price = request.data.get('unit_price')
        
        if not all([monthly_capacity, usage_per_set, usage_count]):
            return Response({
                'error': '缺少必要参数: monthly_capacity, usage_per_set, usage_count'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 计算当月需求
        monthly_demand = round(monthly_capacity * usage_per_set / usage_count) if usage_count > 0 else 0
        
        result = {
            'monthly_demand': monthly_demand
        }
        
        # 计算最高库存和最低库存
        if max_capacity and usage_count > 0:
            max_inventory = round(max_capacity * usage_per_set / usage_count)
            result['max_inventory'] = max_inventory
            # 安全库存等于最高库存
            result['safety_stock'] = max_inventory
        
        if min_capacity and usage_count > 0:
            min_inventory = round(min_capacity * usage_per_set / usage_count)
            result['min_inventory'] = min_inventory
            
            # 验证安全库存是否在合理范围内
            if 'safety_stock' in result:
                if result['safety_stock'] < min_inventory:
                    return Response({
                        'error': f'安全库存({result["safety_stock"]})不能低于最低库存({min_inventory})'
                    }, status=status.HTTP_400_BAD_REQUEST)
        
        if current_stock is not None:
            result['net_demand'] = max(0, monthly_demand - current_stock)
        
        if unit_price:
            result['demand_value'] = monthly_demand * float(unit_price)
        
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'计算失败: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ================================
# 🆕 数据关联API
# ================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def link_b453_data(request):
    """
    B453管控表和计算表数据关联API
    """
    try:
        management_id = request.data.get('management_id')
        calculation_id = request.data.get('calculation_id')
        
        if not all([management_id, calculation_id]):
            return Response({
                'error': '缺少必要参数: management_id, calculation_id'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            management_item = B453SupplyItem.objects.get(id=management_id)
            calculation_item = B453CalculationItem.objects.get(id=calculation_id)
        except (B453SupplyItem.DoesNotExist, B453CalculationItem.DoesNotExist):
            return Response({
                'error': '指定的记录不存在'
            }, status=status.HTTP_404_NOT_FOUND)
        
        with transaction.atomic():
            # 更新管控表的关联信息
            management_item.calculation_id = calculation_id
            management_item.has_calculation = True
            management_item.save()
            
            # 更新计算表的关联信息和同步数据
            calculation_item.management_id = management_id
            calculation_item.linked_material = management_item.material_description
            calculation_item.unit_price = management_item.unit_price
            calculation_item.moq = management_item.moq
            calculation_item.min_stock = management_item.min_safety_stock
            calculation_item.max_stock = management_item.max_safety_stock
            calculation_item.save()
            
            return Response({
                'message': '数据关联成功',
                'management_item': B453SupplyItemSerializer(management_item).data,
                'calculation_item': B453CalculationItemSerializer(calculation_item).data
            }, status=status.HTTP_200_OK)
            
    except ApplicationForm.DoesNotExist:
        return Response({'error': '指定的申请表不存在'}, status=404)
    except Exception as e:
        return Response({'error': f'复制失败: {str(e)}'}, status=500)

# ================================
# 🆕 动态申请表API视图
# ================================

class ApplicationTemplateViewSet(viewsets.ModelViewSet):
    """申请表模板管理"""
    queryset = ApplicationTemplate.objects.all()
    serializer_class = ApplicationTemplateSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # 关闭分页，返回所有数据
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """自定义删除方法，提供更好的错误处理"""
        try:
            instance = self.get_object()
            
            # 检查是否有权限删除
            if instance.created_by != request.user and not request.user.is_superuser:
                return Response(
                    {'error': '没有权限删除此模板，只有创建者或超级用户可以删除'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # 检查是否有申请表正在使用这个模板
            related_forms = ApplicationForm.objects.filter(template=instance)
            if related_forms.exists():
                form_names = [form.name for form in related_forms[:3]]  # 最多显示3个
                more_count = related_forms.count() - 3
                
                error_message = f'无法删除模板 "{instance.name}"，因为以下申请表正在使用此模板：\n'
                error_message += '\n'.join([f'• {name}' for name in form_names])
                
                if more_count > 0:
                    error_message += f'\n... 还有 {more_count} 个申请表'
                
                error_message += '\n\n请先删除相关申请表，然后再删除此模板。'
                
                return Response(
                    {'error': error_message},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 在事务中执行删除
            with transaction.atomic():
                instance.delete()
            
            return Response(
                {
                    'message': f'成功删除模板 "{instance.name}"'
                },
                status=status.HTTP_200_OK
            )
            
        except ApplicationTemplate.DoesNotExist:
            return Response(
                {'error': '模板不存在或已被删除'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'删除失败: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def active_templates(self, request):
        """获取所有启用的模板"""
        templates = ApplicationTemplate.objects.filter(is_active=True)
        serializer = self.get_serializer(templates, many=True)
        return Response(serializer.data)


class ApplicationFormViewSet(viewsets.ModelViewSet):
    """申请表实例管理"""
    queryset = ApplicationForm.objects.all()
    serializer_class = ApplicationFormSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # 关闭分页，返回所有数据
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """自定义删除方法，提供更好的错误处理"""
        try:
            instance = self.get_object()
            
            # 检查是否有权限删除
            if instance.created_by != request.user and not request.user.is_superuser:
                return Response(
                    {'error': '没有权限删除此申请表，只有创建者或超级用户可以删除'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # 获取关联数据统计
            supply_items_count = DynamicSupplyItem.objects.filter(form=instance).count()
            calculation_items_count = DynamicCalculationItem.objects.filter(form=instance).count()
            forecast_data_count = DynamicForecastData.objects.filter(form=instance).count()
            
            # 在事务中执行删除
            with transaction.atomic():
                # 删除相关数据
                if supply_items_count > 0:
                    DynamicSupplyItem.objects.filter(form=instance).delete()
                
                if calculation_items_count > 0:
                    DynamicCalculationItem.objects.filter(form=instance).delete()
                
                if forecast_data_count > 0:
                    DynamicForecastData.objects.filter(form=instance).delete()
                
                # 删除申请表本身
                instance.delete()
            
            return Response(
                {
                    'message': f'成功删除申请表 "{instance.name}"',
                    'deleted_data': {
                        'supply_items': supply_items_count,
                        'calculation_items': calculation_items_count,
                        'forecast_data': forecast_data_count
                    }
                },
                status=status.HTTP_200_OK
            )
            
        except ApplicationForm.DoesNotExist:
            return Response(
                {'error': '申请表不存在或已被删除'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'删除失败: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def create_calculation_form(self, request, pk=None):
        """为申请表创建关联的计算表"""
        form = self.get_object()
        if form.has_calculation_form:
            return Response({'error': '该申请表已有关联的计算表'}, status=400)
        
        # 创建计算表实例（这里可以根据需要创建对应的计算表数据）
        form.has_calculation_form = True
        form.calculation_form_id = form.id  # 简化处理，实际可以创建独立的计算表
        form.save()
        
        return Response({'message': '计算表创建成功', 'calculation_form_id': form.calculation_form_id})
    
    @action(detail=False, methods=['get'])
    def by_department(self, request):
        """按部门获取申请表"""
        department = request.query_params.get('department')
        if department:
            forms = ApplicationForm.objects.filter(department=department)
            serializer = self.get_serializer(forms, many=True)
            return Response(serializer.data)
        return Response({'error': '请提供部门参数'}, status=400)


class DynamicSupplyItemViewSet(viewsets.ModelViewSet):
    """动态申请表耗材项目管理"""
    queryset = DynamicSupplyItem.objects.all()
    serializer_class = DynamicSupplyItemSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # 关闭分页，返回所有数据
    
    @action(detail=False, methods=['get'])
    def by_form(self, request):
        """根据申请表ID获取耗材项目"""
        form_id = request.query_params.get('form_id')
        if form_id:
            items = DynamicSupplyItem.objects.filter(form_id=form_id).order_by('serial_number')
            serializer = self.get_serializer(items, many=True)
            return Response(serializer.data)
        return Response({'error': '请提供申请表ID'}, status=400)
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """批量创建耗材项目"""
        form_id = request.data.get('form_id')
        items_data = request.data.get('items', [])
        
        if not form_id:
            return Response({'error': '请提供申请表ID'}, status=400)
        
        try:
            form = ApplicationForm.objects.get(id=form_id)
            created_items = []
            
            for item_data in items_data:
                item_data['form'] = form_id
                serializer = self.get_serializer(data=item_data)
                if serializer.is_valid():
                    item = serializer.save()
                    created_items.append(serializer.data)
                else:
                    return Response(serializer.errors, status=400)
            
            return Response({
                'message': f'成功创建 {len(created_items)} 个耗材项目',
                'items': created_items
            })
        except ApplicationForm.DoesNotExist:
            return Response({'error': '申请表不存在'}, status=404)


class DynamicCalculationItemViewSet(viewsets.ModelViewSet):
    """动态计算表项目管理"""
    queryset = DynamicCalculationItem.objects.all()
    serializer_class = DynamicCalculationItemSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # 关闭分页，返回所有数据
    
    @action(detail=False, methods=['get'])
    def by_form(self, request):
        """根据申请表ID获取计算项目"""
        form_id = request.query_params.get('form_id')
        if form_id:
            items = DynamicCalculationItem.objects.filter(form_id=form_id).order_by('no')
            serializer = self.get_serializer(items, many=True)
            return Response(serializer.data)
        return Response({'error': '请提供申请表ID'}, status=400)
    
    @action(detail=False, methods=['post'])
    def calculate_demands(self, request):
        """批量计算需求量"""
        form_id = request.data.get('form_id')
        if not form_id:
            return Response({'error': '请提供申请表ID'}, status=400)
        
        items = DynamicCalculationItem.objects.filter(form_id=form_id)
        updated_items = []
        
        for item in items:
            # 计算当月需求 = 当月产能 × 每套机用量 ÷ 使用次数
            if item.usage_count > 0:
                monthly_demand = int(item.monthly_capacity * item.usage_per_set / item.usage_count)
                monthly_net_demand = max(0, monthly_demand - item.min_stock)
                
                item.monthly_demand = monthly_demand
                item.monthly_net_demand = monthly_net_demand
                item.save()
                
                updated_items.append({
                    'id': item.id,
                    'material_name': item.material_name,
                    'monthly_demand': monthly_demand,
                    'monthly_net_demand': monthly_net_demand
                })
        
        return Response({
            'message': f'成功计算 {len(updated_items)} 个项目的需求量',
            'updated_items': updated_items
        })
    
    @action(detail=False, methods=['post'])
    def copy_from_template(self, request):
        """从模版申请表复制耗材信息"""
        target_form_id = request.data.get('target_form_id')
        source_form_id = request.data.get('source_form_id')
        
        if not target_form_id or not source_form_id:
            return Response({'error': '请提供目标申请表ID和源申请表ID'}, status=400)
        
        try:
            # 检查目标申请表是否存在
            target_form = ApplicationForm.objects.get(id=target_form_id)
            source_form = ApplicationForm.objects.get(id=source_form_id)
            
            # 获取源申请表的所有计算项目
            source_items = DynamicCalculationItem.objects.filter(form_id=source_form_id)
            
            if not source_items.exists():
                return Response({'error': '源申请表中没有耗材项目可以复制'}, status=400)
            
            copied_items = []
            
            with transaction.atomic():
                for source_item in source_items:
                    # 创建新的计算项目，复制基础信息但不复制库存相关数据
                    new_item = DynamicCalculationItem.objects.create(
                        form=target_form,
                        no=source_item.no,
                        material_name=source_item.material_name,
                        usage_station=source_item.usage_station,
                        usage_per_set=source_item.usage_per_set,
                        usage_count=source_item.usage_count,
                        monthly_capacity=source_item.monthly_capacity,
                        
                        # 复制价格和采购信息
                        unit_price=source_item.unit_price,
                        purchaser=source_item.purchaser,
                        moq=source_item.moq,
                        
                        # 复制库存设置（但不复制具体库存数量）
                        min_stock=source_item.min_stock,
                        max_stock=source_item.max_stock,
                        
                        # 为必需字段设置默认值
                        monthly_demand=0,
                        monthly_net_demand=0,
                        actual_order=0,
                        
                        # 复制关联信息
                        linked_supply_item_id=source_item.linked_supply_item_id,
                        linked_material=source_item.linked_material,
                    )
                    
                    copied_items.append({
                        'id': new_item.id,
                        'no': new_item.no,
                        'material_name': new_item.material_name,
                        'unit_price': float(new_item.unit_price) if new_item.unit_price else 0,
                        'purchaser': new_item.purchaser,
                    })
            
            return Response({
                'message': f'成功从 "{source_form.name}" 复制了 {len(copied_items)} 个耗材项目到 "{target_form.name}"',
                'copied_items_count': len(copied_items),
                'copied_items': copied_items,
                'source_form': {
                    'id': source_form.id,
                    'name': source_form.name,
                    'period': source_form.period
                },
                'target_form': {
                    'id': target_form.id,
                    'name': target_form.name,
                    'period': target_form.period
                }
            })
            
        except ApplicationForm.DoesNotExist:
            return Response({'error': '指定的申请表不存在'}, status=404)
        except Exception as e:
            return Response({'error': f'复制失败: {str(e)}'}, status=500)
    
    @action(detail=False, methods=['post'])
    def batch_update_purchaser(self, request):
        """批量设置采购员"""
        form_id = request.data.get('form_id')
        purchaser = request.data.get('purchaser')
        
        if not form_id or not purchaser:
            return Response({'error': '请提供申请表ID和采购员名称'}, status=400)
        
        try:
            items = DynamicCalculationItem.objects.filter(form_id=form_id)
            
            if not items.exists():
                return Response({'error': '该申请表中没有计算项目'}, status=400)
            
            updated_count = items.update(purchaser=purchaser.strip())
            
            return Response({
                'message': f'成功将 {updated_count} 个项目的采购员设置为: {purchaser}',
                'updated_count': updated_count,
                'purchaser': purchaser
            })
            
        except Exception as e:
            return Response({'error': f'批量设置采购员失败: {str(e)}'}, status=500)


class DynamicForecastDataViewSet(viewsets.ModelViewSet):
    """动态产能预测数据管理"""
    queryset = DynamicForecastData.objects.all()
    serializer_class = DynamicForecastDataSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # 关闭分页，返回所有数据
    
    @action(detail=False, methods=['get'])
    def by_form(self, request):
        """根据申请表ID获取预测数据"""
        form_id = request.query_params.get('form_id')
        if form_id:
            forecasts = DynamicForecastData.objects.filter(form_id=form_id)
            serializer = self.get_serializer(forecasts, many=True)
            return Response(serializer.data)
        return Response({'error': '请提供申请表ID'}, status=400)

    @action(detail=False, methods=['post'])
    def copy(self, request):
        """复制预测数据到新表"""
        source_form_id = request.data.get('source_form_id')
        target_form_id = request.data.get('target_form_id')
        
        if not all([source_form_id, target_form_id]):
            return Response({'error': '请提供源表和目标表ID'}, status=400)
            
        try:
            # 获取源表的预测数据
            source_forecasts = DynamicForecastData.objects.filter(form_id=source_form_id)
            
            # 复制到新表
            for forecast in source_forecasts:
                forecast.pk = None  # 清除主键以创建新记录
                forecast.form_id = target_form_id
                forecast.save()
                
            return Response({'message': '预测数据复制成功'})
        except Exception as e:
            return Response({'error': f'复制预测数据失败: {str(e)}'}, status=400)
