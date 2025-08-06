from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import Supply, InventoryRecord, B482SupplyItem, AndorSupplyItem, CapacityForecast, B453SupplyItem, B453CalculationItem, B453ForecastData, ApplicationTemplate, ApplicationForm, DynamicSupplyItem, DynamicCalculationItem, DynamicForecastData, ImportLog
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

    def destroy(self, request, *args, **kwargs):
        """自定义删除方法，同时删除相关的库存记录"""
        try:
            instance = self.get_object()
            
            # 在事务中执行删除
            with transaction.atomic():
                # 删除相关的库存记录
                records_count = InventoryRecord.objects.filter(supply=instance).count()
                InventoryRecord.objects.filter(supply=instance).delete()
                
                # 删除耗材本身
                instance.delete()
            
            return Response({
                'message': f'成功删除耗材 "{instance.name}"',
                'deleted_records': records_count
            }, status=status.HTTP_200_OK)
            
        except Supply.DoesNotExist:
            return Response(
                {'error': '耗材不存在或已被删除'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'删除失败: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
    计算当月需求/站、最高/最低库存等
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
        
        # 计算当月需求/站
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

    def get_queryset(self):
        """
        根据操作类型调整查询集：
        - 对于列表视图，默认只显示 is_visible=True 的项目，除非提供了 include_hidden=true。
        - 对于详情、更新、删除等操作，返回所有项目，以便能操作隐藏项。
        """
        queryset = DynamicCalculationItem.objects.all()

        if self.action == 'list':
            include_hidden = self.request.query_params.get('include_hidden', 'false').lower() == 'true'
            if not include_hidden:
                queryset = queryset.filter(is_visible=True)
        
        # 对于 'retrieve', 'update', 'partial_update', 'destroy' 等操作，
        # 我们不过滤 is_visible，以便可以获取和操作隐藏的项目。
        return queryset

    @action(detail=False, methods=['get'])
    def by_form(self, request):
        """
        根据申请表ID获取计算项目。
        默认只返回可见的项目，除非 `include_hidden=true`。
        """
        form_id = request.query_params.get('form_id')
        if not form_id:
            return Response({'error': '缺少 form_id 参数'}, status=status.HTTP_400_BAD_REQUEST)

        queryset = DynamicCalculationItem.objects.filter(form_id=form_id)

        include_hidden = self.request.query_params.get('include_hidden', 'false').lower() == 'true'
        if not include_hidden:
            queryset = queryset.filter(is_visible=True)

        serializer = self.get_serializer(queryset.order_by('no'), many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def bulk_hide(self, request):
        """批量隐藏计算项目"""
        ids = request.data.get('ids', [])
        if not ids or not isinstance(ids, list):
            return Response({'error': '请提供一个有效的ID列表'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 过滤掉无效的ID
            valid_ids = [int(id) for id in ids if isinstance(id, int) and id > 0]
            
            if not valid_ids:
                return Response({'error': '提供的ID列表无效'}, status=status.HTTP_400_BAD_REQUEST)

            # 使用 transaction 来确保操作的原子性
            with transaction.atomic():
                updated_count = DynamicCalculationItem.objects.filter(id__in=valid_ids).update(is_visible=False)

            return Response({
                'message': f'成功隐藏 {updated_count} 个项目。',
                'updated_count': updated_count
            })

        except Exception as e:
            return Response({'error': f'批量隐藏操作失败: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def bulk_show(self, request):
        """批量显示计算项目"""
        ids = request.data.get('ids', [])
        if not ids or not isinstance(ids, list):
            return Response({'error': '请提供一个有效的ID列表'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            valid_ids = [int(id) for id in ids if isinstance(id, int) and id > 0]
            if not valid_ids:
                return Response({'error': '提供的ID列表无效'}, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                updated_count = DynamicCalculationItem.objects.filter(id__in=valid_ids).update(is_visible=True)

            return Response({
                'message': f'成功显示 {updated_count} 个项目。',
                'updated_count': updated_count
            })

        except Exception as e:
            return Response({'error': f'批量显示操作失败: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def calculate_demands(self, request):
        """批量计算需求量"""
        form_id = request.data.get('form_id')
        if not form_id:
            return Response({'error': '请提供申请表ID'}, status=400)
        
        items = DynamicCalculationItem.objects.filter(form_id=form_id)
        updated_items = []
        
        for item in items:
            if item.is_multi_station and item.multi_station_data:
                # 多站别数据处理
                stations = item.multi_station_data.get('stations', [])
                usage_per_set = item.multi_station_data.get('usage_per_set', [])
                usage_count = item.multi_station_data.get('usage_count', [])
                monthly_capacity = item.multi_station_data.get('monthly_capacity', [])
                min_stock = item.multi_station_data.get('min_stock', [])
                
                monthly_demands = []
                monthly_net_demands = []
                actual_orders = []
                
                for i in range(len(stations)):
                    if usage_count[i] > 0:
                        demand = int(monthly_capacity[i] * usage_per_set[i] / usage_count[i])
                        net_demand = max(0, demand - min_stock[i])
                        actual_order = net_demand
                    else:
                        demand = 0
                        net_demand = 0
                        actual_order = 0
                    
                    monthly_demands.append(demand)
                    monthly_net_demands.append(net_demand)
                    actual_orders.append(actual_order)
                
                # 更新多站别数据
                item.multi_station_data['monthly_demand'] = monthly_demands
                item.multi_station_data['monthly_net_demand'] = monthly_net_demands
                item.multi_station_data['actual_order'] = actual_orders
                
                # 计算总计
                total_monthly_demand = sum(monthly_demands)
                total_monthly_net_demand = sum(monthly_net_demands)
                total_actual_order = sum(actual_orders)
                
                item.monthly_demand = total_monthly_demand
                item.monthly_net_demand = total_monthly_net_demand
                item.actual_order = total_actual_order
                item.save()
                
                updated_items.append({
                    'id': item.id,
                    'material_name': item.material_name,
                    'monthly_demand': total_monthly_demand,
                    'monthly_net_demand': total_monthly_net_demand,
                    'actual_order': total_actual_order,
                    'is_multi_station': True
                })
            else:
                # 单站别数据处理
                if item.usage_count > 0:
                    monthly_demand = int(item.monthly_capacity * item.usage_per_set / item.usage_count)
                    monthly_net_demand = max(0, monthly_demand - item.min_stock)
                    # 实际订购数量通常等于月度总需求
                    actual_order = monthly_net_demand
                    
                    item.monthly_demand = monthly_demand
                    item.monthly_net_demand = monthly_net_demand
                    item.actual_order = actual_order
                    item.save()
                    
                    updated_items.append({
                        'id': item.id,
                        'material_name': item.material_name,
                        'monthly_demand': monthly_demand,
                        'monthly_net_demand': monthly_net_demand,
                        'actual_order': actual_order,
                        'is_multi_station': False
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

    @action(detail=True, methods=['post'])
    def sync_single_item_data(self, request, pk=None):
        """实时同步单个项目的进料需求与實際請購數量"""
        try:
            item = self.get_object()
            sync_type = request.data.get('sync_type')  # 'chase_to_order' 或 'order_to_chase'
            target_month_key = request.data.get('target_month_key')
            
            if not target_month_key:
                return Response({'error': '请提供目标月份'}, status=400)
            
            if sync_type == 'chase_to_order':
                # 从进料需求同步到實際請購數量
                chase_data = item.chase_data.get(target_month_key, {})
                total_chase = sum(chase_data.values())
                
                # 更新actual_order
                if item.is_multi_station and item.multi_station_data:
                    # 多站别项目：平均分配进料需求
                    station_count = len(item.multi_station_data.get('stations', []))
                    if station_count > 0:
                        per_station_order = total_chase // station_count
                        item.multi_station_data['actual_order'] = [per_station_order] * station_count
                        item.actual_order = total_chase
                else:
                    # 单站别项目
                    item.actual_order = total_chase
                
                item.save()
                
                return Response({
                    'message': f'成功同步项目 {item.material_name} 的进料需求到實際請購數量',
                    'actual_order': item.actual_order,
                    'chase_data': chase_data
                })
                
            elif sync_type == 'order_to_chase':
                # 从實際請購數量同步到进料需求
                actual_order = item.actual_order or 0
                target_week = request.data.get('target_week', 'W02')  # 默认W02，但允许用户选择
                
                # 根据用户选择的周安排實際請購數量
                chase_data = {
                    'W01': target_week == 'W01' and actual_order or 0,
                    'W02': target_week == 'W02' and actual_order or 0,
                    'W03': target_week == 'W03' and actual_order or 0,
                    'W04': target_week == 'W04' and actual_order or 0
                }
                
                # 更新chase_data
                if not item.chase_data:
                    item.chase_data = {}
                item.chase_data[target_month_key] = chase_data
                item.save()
                
                return Response({
                    'message': f'成功同步项目 {item.material_name} 的實際請購數量到进料需求',
                    'actual_order': actual_order,
                    'chase_data': chase_data
                })
            
            else:
                return Response({'error': '无效的同步类型'}, status=400)
                
        except Exception as e:
            return Response({'error': f'同步失败: {str(e)}'}, status=500)

    @action(detail=False, methods=['post'])
    def sync_chase_data_with_actual_order(self, request):
        """同步进料需求与實際請購數量"""
        try:
            form_id = request.data.get('form_id')
            sync_direction = request.data.get('direction', 'chase_to_order')  # chase_to_order 或 order_to_chase
            
            if not form_id:
                return Response({'error': '请提供申请表ID'}, status=400)
            
            items = DynamicCalculationItem.objects.filter(form_id=form_id)
            updated_items = []
            
            for item in items:
                target_month_key = request.data.get('target_month_key')  # 例如: "2025-07"
                if not target_month_key:
                    return Response({'error': '请提供目标月份'}, status=400)
                
                if sync_direction == 'chase_to_order':
                    # 从进料需求同步到實際請購數量
                    chase_data = item.chase_data.get(target_month_key, {})
                    total_chase = sum(chase_data.values())
                    
                    # 更新actual_order
                    if item.is_multi_station and item.multi_station_data:
                        # 多站别项目：平均分配进料需求
                        station_count = len(item.multi_station_data.get('stations', []))
                        if station_count > 0:
                            per_station_order = total_chase // station_count
                            item.multi_station_data['actual_order'] = [per_station_order] * station_count
                            item.actual_order = total_chase
                    else:
                        # 单站别项目
                        item.actual_order = total_chase
                    
                    updated_items.append({
                        'id': item.id,
                        'material_name': item.material_name,
                        'actual_order': item.actual_order,
                        'chase_data': chase_data
                    })
                    
                elif sync_direction == 'order_to_chase':
                    # 从實際請購數量同步到进料需求
                    actual_order = item.actual_order or 0
                    target_week = request.data.get('target_week', 'W02')  # 默认W02，但允许用户选择
                    
                    # 根据用户选择的周安排實際請購數量
                    chase_data = {
                        'W01': target_week == 'W01' and actual_order or 0,
                        'W02': target_week == 'W02' and actual_order or 0,
                        'W03': target_week == 'W03' and actual_order or 0,
                        'W04': target_week == 'W04' and actual_order or 0
                    }
                    
                    # 更新chase_data
                    if not item.chase_data:
                        item.chase_data = {}
                    item.chase_data[target_month_key] = chase_data
                    
                    updated_items.append({
                        'id': item.id,
                        'material_name': item.material_name,
                        'actual_order': actual_order,
                        'chase_data': chase_data
                    })
                
                item.save()
            
            return Response({
                'message': f'成功同步{len(updated_items)}个项目的数据',
                'updated_items': updated_items,
                'sync_direction': sync_direction
            })
            
        except Exception as e:
            return Response({'error': f'同步失败: {str(e)}'}, status=500)


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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_b453_calculation_headers(request):
    """
    提供B453耗材需求计算表的前端表头配置 (Ant Design Table columns)
    现在返回完整的列配置，包含dataIndex和key
    """
    headers = [
        {'title': 'No.', 'dataIndex': 'no', 'key': 'no', 'width': 80},
        {'title': '料材名稱', 'dataIndex': 'material_name', 'key': 'material_name', 'width': 300},
        {'title': '使用站別', 'dataIndex': 'usage_station', 'key': 'usage_station', 'width': 150},
        {'title': '每臺機用量', 'dataIndex': 'usage_per_set', 'key': 'usage_per_set', 'width': 120},
        {'title': '使用次數', 'dataIndex': 'usage_count', 'key': 'usage_count', 'width': 120},
        {'title': '當月產能', 'dataIndex': 'monthly_capacity', 'key': 'monthly_capacity', 'width': 120},
        {'title': '最低庫存數量', 'dataIndex': 'min_stock', 'key': 'min_stock', 'width': 140},
        {'title': '最低庫存總數', 'dataIndex': 'min_total_stock', 'key': 'min_total_stock', 'width': 140},
        {'title': '最高庫存數量', 'dataIndex': 'max_stock', 'key': 'max_stock', 'width': 140},
        {'title': '最高庫存總數', 'dataIndex': 'max_total_stock', 'key': 'max_total_stock', 'width': 140},
        {'title': '當月需求/站', 'dataIndex': 'monthly_demand', 'key': 'monthly_demand', 'width': 120},
        {'title': '當月總需求', 'dataIndex': 'monthly_total_demand', 'key': 'monthly_total_demand', 'width': 150},
        {'title': '實際請購數量', 'dataIndex': 'actual_purchase_quantity', 'key': 'actual_purchase_quantity', 'width': 150},
        {'title': '備註(MOQ)', 'dataIndex': 'moq_remark', 'key': 'moq_remark', 'width': 200}
    ]
    return Response(headers)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_b453_management_headers(request):
    """
    获取B453耗材管控表的表头配置（层级结构）
    """
    headers = [
        {'title': '序號', 'dataIndex': 'no', 'width': 60, 'fixed': 'left', 'className': 'bg-orange-100'},
        {'title': '物料描述', 'dataIndex': 'material_name', 'width': 300, 'fixed': 'left'},
        {'title': '單位', 'dataIndex': 'unit', 'width': 80},
        {'title': '採購員', 'dataIndex': 'purchaser', 'width': 100},
        {'title': '單價 (RMB)', 'dataIndex': 'unit_price', 'width': 100},
        {
            'title': '安全庫存',
            'children': [
                {'title': '最低', 'dataIndex': 'min_stock', 'width': 100},
                {'title': '最高', 'dataIndex': 'max_stock', 'width': 100},
            ]
        },
        {'title': '最小採購量(MOQ)', 'dataIndex': 'moq', 'width': 120},
        {'title': 'L/T Wks', 'dataIndex': 'lead_time_weeks', 'width': 100},
        {
            'title': '2025年5月份明細',
            'children': [
                {'title': '2025/4/22 庫存', 'dataIndex': 'apr_2025_stock', 'width': 120},
                {'title': '2025年5月份需求', 'dataIndex': 'may_2025_demand', 'width': 120},
            ]
        },
        {
            'title': '2025年6月份明細',
            'children': [
                {'title': '2025/5/22 庫存', 'dataIndex': 'may_2025_stock', 'width': 120},
                {'title': '2025年6月份需求', 'dataIndex': 'jun_2025_demand', 'width': 120},
            ]
        },
        {
            'title': '2025年7月份明細',
            'children': [
                {'title': '2025/6/22 庫存', 'dataIndex': 'jun_2025_stock', 'width': 120},
                {'title': '2025年7月份需求', 'dataIndex': 'monthly_demand', 'width': 120},
            ]
        },
        {
            'title': 'PR開立時間與數量',
            'children': [
                {
                    'title': '2025/6/19',
                    'children': [
                        {'title': '数量', 'dataIndex': 'current_stock_0619', 'width': 140},
                    ]
                },
                {
                    'title': '2025/6/25', 
                    'children': [
                        {'title': '数量', 'dataIndex': 'current_stock_0625', 'width': 140},
                    ]
                },
            ]
        },
        {
            'title': '進料需求',
            'children': [
                {
                    'title': '7月W01',
                    'children': [
                        {'title': '数量', 'dataIndex': 'jul_m01_demand', 'width': 100},
                    ]
                },
                {
                    'title': '7月W02',
                    'children': [
                        {'title': '数量', 'dataIndex': 'jul_m02_demand', 'width': 100},
                    ]
                },
                {
                    'title': '7月W03',
                    'children': [
                        {'title': '数量', 'dataIndex': 'jul_m03_demand', 'width': 100},
                    ]
                },
                {
                    'title': '7月W04',
                    'children': [
                        {'title': '数量', 'dataIndex': 'jul_m04_demand', 'width': 100},
                    ]
                },

            ]
        },
        {'title': '總金額(RMB)', 'dataIndex': 'total_amount', 'width': 120},
        {'title': '備註', 'dataIndex': 'moq_remark', 'width': 150},
    ]
    return Response(headers)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def import_supplies_excel(request):
    """
    接收上传的Excel文件，直接在文件上修改格式后返回供下载。
    保留原始文件的所有内容和结构，只调整行高和换行格式。
    """
    from django.http import HttpResponse
    import openpyxl
    from openpyxl.styles import Alignment
    import io
    from datetime import datetime

    if 'file' not in request.FILES:
        return Response({'error': '请上传Excel文件'}, status=status.HTTP_400_BAD_REQUEST)
    
    uploaded_file = request.FILES['file']

    if not uploaded_file.name.endswith(('.xlsx', '.xls')):
        return Response({'error': '请上传Excel文件（.xlsx或.xls格式）'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # 将上传的文件加载到openpyxl
        workbook = openpyxl.load_workbook(uploaded_file)
        worksheet = workbook.active

        # --- 定位"物料描述"列 ---
        material_desc_col_index = -1
        # 表头在第1-4行，我们检查第4行来确定列的位置
        for cell in worksheet[4]: # 假设第4行是详细的列标题
            if cell.value and '物料描述' in str(cell.value):
                material_desc_col_index = cell.column
                break

        if material_desc_col_index == -1:
            return Response({'error': '在文件的第4行中未找到"物料描述"列，无法进行格式化。'}, status=400)

        # --- 应用格式 ---
        # 从第5行开始处理数据
        for row in worksheet.iter_rows(min_row=5):
            cell = row[material_desc_col_index - 1] # 转换为0-based索引
            
            # 1. 为所有单元格启用自动换行
            cell.alignment = Alignment(wrap_text=True, vertical='center')

            # 2. 根据字数设置行高
            if cell.value and len(str(cell.value)) > 50:
                worksheet.row_dimensions[cell.row].height = 40
            else:
                # 对于其他行，可以保留默认高度或设置一个标准高度
                if not worksheet.row_dimensions[cell.row].height: # 避免覆盖已有的高度设置
                    worksheet.row_dimensions[cell.row].height = 18

        # 将修改后的工作簿保存到内存中的二进制流
        output = io.BytesIO()
        workbook.save(output)
        output.seek(0)

        # 构造HTTP响应，让浏览器下载文件
        response = HttpResponse(
            output,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="formatted_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx"'
        
        return response

    except Exception as e:
        return Response({'error': f'处理Excel文件失败: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)





def detect_table_type(columns):
    """
    检测Excel表格类型
    返回 'management' 或 'calculation'
    """
    # 管控表特征列
    management_keywords = ['物料描述', '采购员', '单价', '安全库存', 'MOQ', 'L/T']
    # 需求计算表特征列
    calculation_keywords = ['料材名称', '使用站别', '每臺機用量', '使用次数', '当月产能', '当月需求/站']
    
    management_score = 0
    calculation_score = 0
    
    for col in columns:
        col_str = str(col).lower()
        for keyword in management_keywords:
            if keyword.lower() in col_str:
                management_score += 1
        for keyword in calculation_keywords:
            if keyword.lower() in col_str:
                calculation_score += 1
    
    print(f"管控表匹配分数: {management_score}, 需求计算表匹配分数: {calculation_score}")
    
    if calculation_score > management_score:
        return 'calculation'
    else:
        return 'management'


def detect_table_type_by_sheet_name(sheet_name):
    """
    通过sheet名称检测表格类型
    返回 'management' 或 'calculation' 或 None
    """
    if not sheet_name:
        return None
    
    sheet_name_lower = sheet_name.lower().strip()
    
    # 管控表特征关键词（更精确的匹配）
    management_keywords = [
        '管控', '管理', 'master', 'control', 'management', 
        '基礎', '基础', 'basic', '主檔', '主档', 'master data',
        '庫存', '库存', 'inventory', '物料', 'material'
    ]
    
    # 需求计算表特征关键词（更精确的匹配）
    calculation_keywords = [
        '需求', '计算', 'calculation', 'demand', 'forecast',
        '明细', 'detail', '計算', '預測', '预测', 'forecast',
        '用量', 'usage', '消耗', 'consumption', '請購', '请购'
    ]
    
    # 检查管控表关键词
    for keyword in management_keywords:
        if keyword in sheet_name_lower:
            return 'management'
    
    # 检查需求计算表关键词
    for keyword in calculation_keywords:
        if keyword in sheet_name_lower:
            return 'calculation'
    
    return None


def detect_table_type_by_content(df):
    """
    通过数据内容检测表格类型
    返回 'management' 或 'calculation' 或 None
    """
    # 管控表特征列
    management_keywords = ['物料描述', '采购员', '单价', '安全库存', 'MOQ', 'L/T', '序號', '單位', '備註', '採購員', '單價']
    # 需求计算表特征列
    calculation_keywords = ['料材名称', '使用站别', '每臺機用量', '使用次数', '当月产能', '当月需求/站', 'No.', '月份', '耗材名稱', '當月需求/站', '使用站別']
    
    management_score = 0
    calculation_score = 0
    
    # 检查列名
    for col in df.columns:
        col_str = str(col).lower()
        for keyword in management_keywords:
            if keyword.lower() in col_str:
                management_score += 1
        for keyword in calculation_keywords:
            if keyword.lower() in col_str:
                calculation_score += 1
    
    # 检查数据内容（前几行）
    for idx in range(min(5, len(df))):
        for col in df.columns:
            cell_value = str(df.iloc[idx, df.columns.get_loc(col)]).lower()
            for keyword in management_keywords:
                if keyword.lower() in cell_value:
                    management_score += 0.5
            for keyword in calculation_keywords:
                if keyword.lower() in cell_value:
                    calculation_score += 0.5
    
    print(f"内容检测 - 管控表匹配分数: {management_score}, 需求计算表匹配分数: {calculation_score}")
    
    if calculation_score > management_score and calculation_score > 2:
        return 'calculation'
    elif management_score > calculation_score and management_score > 2:
        return 'management'
    else:
        return None


def import_management_table(df, sheet_name, form_id, request, file_name, full_path, detection_method):
    """
    导入管控表数据
    """
    import pandas as pd
    
    # 定义列名映射（支持多种可能的列名，自动模糊查找）
    column_keywords = {
        '物料描述': ['物料描述', '品名', '名称', '描述', 'material', 'description'],
        '单位': ['单位', '單位', 'unit'],
        '采购员': ['采购员', '採購員', 'purchaser'],
        '单价(RMB)': ['单价', '單價', '單價（RMB)', '單價(RMB)', '单价(RMB)', 'price'],
        '安全库存-最高': ['安全库存-最高', '安全庫存最高', '最高', 'max'],
        '安全库存-最低': ['安全库存-最低', '安全庫存最低', '最低', 'min'],
        '最小采购量(MOQ)': ['最小采购量', 'MOQ', '最小采购量(MOQ)'],
        'L/T(Wks)': ['L/T', 'L/T(Wks)', 'L/T_Wks', 'L/T\nWks', '交货周期', '交期'],
    }
    
    # 自动查找包含关键字的列名
    mapped_columns = {}
    missing_columns = []
    for required_col, keywords in column_keywords.items():
        found = False
        for col in df.columns:
            for kw in keywords:
                if kw.replace('\n', '').replace(' ', '').lower() in str(col).replace('\n', '').replace(' ', '').lower():
                    mapped_columns[required_col] = col
                    found = True
                    break
            if found:
                break
        if not found:
            missing_columns.append(required_col)
    
    if missing_columns:
        return Response({
            'error': f'Excel文件缺少必要的列: {", ".join(missing_columns)}'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # 清理物料描述函数
    def clean_material_description(desc):
        if pd.isna(desc):
            return ""
        return str(desc).strip()
    
    # 处理数据 - 智能过滤和导入有效数据
    imported_items = []
    error_items = []
    
    # 清空现有B453SupplyItem数据
    B453SupplyItem.objects.all().delete()
    
    # 智能过滤有效数据行
    valid_rows = []
    for index, row in df.iterrows():
        material_desc = clean_material_description(row[mapped_columns['物料描述']])
        
        # 跳过空行或无效数据
        if not material_desc or material_desc.lower() in ['nan', 'none', '']:
            continue
        
        # 跳过表头行和汇总行
        skip_keywords = ['核准', '审核', '批准', '合计', '总计', '序號', '序号', 'no.', 'no', '物料描述', 'material']
        if any(keyword.lower() in material_desc.lower() for keyword in skip_keywords):
            continue
        
        # 检查是否包含有效的物料信息（至少包含设备类型或耗材类型）
        valid_material_keywords = ['設備', '设备', '探針', '探针', '清潔劑', '清洁剂', '密封圈', '密封垫', '喇叭', '膠材', '胶材']
        if not any(keyword in material_desc for keyword in valid_material_keywords):
            # 如果不是明显的物料，进一步检查
            if len(material_desc) < 5:  # 太短的描述可能是无效数据
                continue
        
        valid_rows.append((index, row))
    
    print(f"找到 {len(valid_rows)} 条有效物料数据")
    
    # 遍历有效的行数据
    for index, row in valid_rows:
        material_desc = clean_material_description(row[mapped_columns['物料描述']])
        
        try:
            # 创建B453SupplyItem
            item = B453SupplyItem.objects.create(
                serial_number=len(imported_items) + 1,
                material_description=material_desc,
                unit=str(row[mapped_columns['单位']]).strip() if pd.notna(row[mapped_columns['单位']]) else 'pcs',
                purchaser=str(row[mapped_columns['采购员']]).strip() if pd.notna(row[mapped_columns['采购员']]) else '',
                unit_price=float(row[mapped_columns['单价(RMB)']]) if pd.notna(row[mapped_columns['单价(RMB)']]) else 0,
                max_safety_stock=int(row[mapped_columns['安全库存-最高']]) if pd.notna(row[mapped_columns['安全库存-最高']]) else 0,
                min_safety_stock=int(row[mapped_columns['安全库存-最低']]) if pd.notna(row[mapped_columns['安全库存-最低']]) else 0,
                moq=int(row[mapped_columns['最小采购量(MOQ)']]) if pd.notna(row[mapped_columns['最小采购量(MOQ)']]) else 0,
                lead_time_weeks=int(row[mapped_columns['L/T(Wks)']]) if pd.notna(row[mapped_columns['L/T(Wks)']]) else 0,
                created_by=request.user
            )
            imported_items.append({
                'serial_number': item.serial_number,
                'material_description': item.material_description,
                'unit': item.unit,
                'unit_price': item.unit_price
            })
            print(f"✓ 导入管控表: {material_desc}")
            
        except Exception as e:
            error_items.append({
                'material': material_desc,
                'error': str(e)
            })
            print(f"✗ 错误: {material_desc} - {str(e)}")
    
    # 同步到DynamicCalculationItem (form_id)
    try:
        from django.core.management import call_command
        sync_form_id = int(form_id) if form_id else 17  # 默认17，兼容老逻辑
        
        # 先清空目标申请表的现有数据，避免唯一约束冲突
        from supplies.models import DynamicCalculationItem
        existing_count = DynamicCalculationItem.objects.filter(form_id=sync_form_id).count()
        if existing_count > 0:
            print(f"清空现有 {existing_count} 条动态计算表数据")
            DynamicCalculationItem.objects.filter(form_id=sync_form_id).delete()
        
        # 执行同步命令
        call_command('sync_b453_to_dynamic', 
                   application_form_id=sync_form_id, 
                   user_id=request.user.id, 
                   update_existing=False,  # 改为False，因为我们已经清空了数据
                   verbose=True)
        
        # 执行月份数据同步
        call_command('sync_b453_monthly_data', 
                   application_form_id=sync_form_id, 
                   user_id=request.user.id, 
                   verbose=True)
        
    except Exception as e:
        error_items.append({
            'material': '同步到DynamicCalculationItem',
            'error': str(e)
        })
        print(f"同步错误: {str(e)}")
    
    # 记录导入日志
    log = ImportLog.objects.create(
        user=request.user,
        file_name=file_name,
        result=f"成功导入管控表 {len(imported_items)} 条耗材（Sheet: {sheet_name or '默认'}），错误 {len(error_items)} 条",
        success=len(error_items) == 0,
        imported_count=len(imported_items),
        error_count=len(error_items),
        error_details=str(error_items) if error_items else ""
    )
    
    # 打印详细错误信息到终端
    if error_items:
        print(f"\n=== 导入错误详情 ===")
        for i, error in enumerate(error_items, 1):
            print(f"错误 {i}: {error}")
        print(f"=== 共 {len(error_items)} 条错误 ===\n")
    
    return Response({
        'message': f'成功导入管控表 {len(imported_items)} 条耗材（Sheet: {sheet_name or "默认"}）',
        'imported_count': len(imported_items),
        'error_count': len(error_items),
        'imported_items': imported_items,
        'error_items': error_items,
        'log_id': log.id,
        'sheet_name': sheet_name,
        'table_type': 'management',
        'detection_method': detection_method
    }, status=status.HTTP_200_OK)


def import_calculation_table(df, sheet_name, form_id, request, file_name, full_path, detection_method):
    """
    导入需求计算表数据
    """
    import pandas as pd
    
    # 定义列名映射（需求计算表）
    column_keywords = {
        '料材名称': ['料材名称', '料件名稱', '物料名称', 'material', 'name', '耗材名稱', '耗材名称', '料材', '料件'],
        '使用站别': ['使用站别', '使用站別', 'usage_station', 'station', '站别', '站別', '工站'],
        '每臺機用量': ['每臺机用量', '每臺機用量', '每台机用量', 'usage_per_machine', '机用量', '機用量', '用量'],
        '使用次数': ['使用次数', '使用次數', 'usage_count', '次數', '次数'],
        '当月产能': ['当月产能', '當月產能', 'monthly_capacity', '產能', '产能'],
        '最低库存': ['最低库存', '最低庫存', 'min_stock', '庫存數', '库存数'],
        '最高库存': ['最高库存', '最高庫存', 'max_stock', '庫存總數', '库存总数'],
        '当月需求/站': ['当月需求/站', '當月需求/站', 'monthly_demand', '需求', '當月總需求', '当月总需求'],
        '备注': ['备注', '備註', 'remark', 'moq_remark', '備註\n（MOQ）'],
    }
    
    # 自动查找包含关键字的列名
    mapped_columns = {}
    missing_columns = []
    
    print(f"=== 需求计算表列名映射调试 ===")
    print(f"实际列名: {list(df.columns)}")
    
    for required_col, keywords in column_keywords.items():
        found = False
        best_match = None
        best_score = 0
        
        for col in df.columns:
            col_str = str(col).replace('\n', '').replace(' ', '').lower()
            
            for kw in keywords:
                kw_clean = kw.replace('\n', '').replace(' ', '').lower()
                
                # 计算匹配度
                if kw_clean in col_str:
                    score = len(kw_clean) / len(col_str)  # 匹配度 = 关键词长度 / 列名长度
                    if score > best_score:
                        best_score = score
                        best_match = col
                        found = True
                        print(f"  匹配 '{required_col}': '{kw}' -> '{col}' (匹配度: {score:.2f})")
        
        if found and best_match:
            mapped_columns[required_col] = best_match
        else:
            missing_columns.append(required_col)
            print(f"  ❌ 未找到 '{required_col}' 的匹配列")
    
    print(f"=== 映射结果 ===")
    for col, mapped in mapped_columns.items():
        print(f"  {col} -> {mapped}")
    
    if missing_columns:
        return Response({
            'error': f'需求计算表缺少必要的列: {", ".join(missing_columns)}'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # 清理物料名称函数
    def clean_material_name(name):
        if pd.isna(name):
            return ""
        return str(name).strip()
    
    # 处理数据 - 智能过滤和导入有效数据
    imported_items = []
    error_items = []
    
    # 智能过滤有效数据行
    valid_rows = []
    for index, row in df.iterrows():
        material_name = clean_material_name(row[mapped_columns['料材名称']])
        
        # 跳过空行或无效数据
        if not material_name or material_name.lower() in ['nan', 'none', '']:
            continue
        
        # 跳过表头行和汇总行
        skip_keywords = ['核准', '审核', '批准', '合计', '总计', 'No.', '料材名称', 'no.', 'no', 'material', 'name']
        if any(keyword.lower() in material_name.lower() for keyword in skip_keywords):
            continue
        
        # 检查是否包含有效的物料信息
        valid_material_keywords = ['設備', '设备', '探針', '探针', '清潔劑', '清洁剂', '密封圈', '密封垫', '喇叭', '膠材', '胶材', '耗材', '料材']
        if not any(keyword in material_name for keyword in valid_material_keywords):
            # 如果不是明显的物料，进一步检查
            if len(material_name) < 5:  # 太短的描述可能是无效数据
                continue
        
        valid_rows.append((index, row))
    
    print(f"找到 {len(valid_rows)} 条有效需求计算数据")
    
    # 如果有form_id，导入到DynamicCalculationItem，否则导入到B453CalculationItem
    if form_id:
        # 不再清空DynamicCalculationItem数据
        # 遍历有效的行数据
        for index, row in valid_rows:
            material_name = clean_material_name(row[mapped_columns['料材名称']])
            try:
                # 查找是否已存在
                item = DynamicCalculationItem.objects.filter(form_id=form_id, material_name=material_name).first()
                if item:
                    # 更新需求相关字段
                    item.usage_station = str(row[mapped_columns['使用站别']]).strip() if pd.notna(row[mapped_columns['使用站别']]) else ''
                    item.usage_per_set = int(row[mapped_columns['每臺機用量']]) if pd.notna(row[mapped_columns['每臺機用量']]) else 0
                    item.usage_count = int(row[mapped_columns['使用次数']]) if pd.notna(row[mapped_columns['使用次数']]) else 0
                    item.monthly_capacity = int(row[mapped_columns['当月产能']]) if pd.notna(row[mapped_columns['当月产能']]) else 0
                    item.min_stock = int(row[mapped_columns['最低库存']]) if pd.notna(row[mapped_columns['最低库存']]) else 0
                    item.max_stock = int(row[mapped_columns['最高库存']]) if pd.notna(row[mapped_columns['最高库存']]) else 0
                    item.monthly_demand = int(row[mapped_columns['当月需求/站']]) if pd.notna(row[mapped_columns['当月需求/站']]) else 0
                    item.moq_remark = str(row[mapped_columns['备注']]).strip() if pd.notna(row[mapped_columns['备注']]) else ''
                    item.save()
                    print(f"✓ 更新需求计算表(Dynamic): {material_name}")
                else:
                    # 新建
                    item = DynamicCalculationItem.objects.create(
                        form_id=form_id,
                        no=len(imported_items) + 1,
                        material_name=material_name,
                        usage_station=str(row[mapped_columns['使用站别']]).strip() if pd.notna(row[mapped_columns['使用站别']]) else '',
                        usage_per_set=int(row[mapped_columns['每臺機用量']]) if pd.notna(row[mapped_columns['每臺機用量']]) else 0,
                        usage_count=int(row[mapped_columns['使用次数']]) if pd.notna(row[mapped_columns['使用次数']]) else 0,
                        monthly_capacity=int(row[mapped_columns['当月产能']]) if pd.notna(row[mapped_columns['当月产能']]) else 0,
                        min_stock=int(row[mapped_columns['最低库存']]) if pd.notna(row[mapped_columns['最低库存']]) else 0,
                        max_stock=int(row[mapped_columns['最高库存']]) if pd.notna(row[mapped_columns['最高库存']]) else 0,
                        monthly_demand=int(row[mapped_columns['当月需求/站']]) if pd.notna(row[mapped_columns['当月需求/站']]) else 0,
                        moq_remark=str(row[mapped_columns['备注']]).strip() if pd.notna(row[mapped_columns['备注']]) else ''
                    )
                    print(f"✓ 新增需求计算表(Dynamic): {material_name}")
                imported_items.append({
                    'no': item.no,
                    'material_name': item.material_name,
                    'usage_station': item.usage_station,
                    'monthly_demand': item.monthly_demand
                })
            except Exception as e:
                error_items.append({
                    'material': material_name,
                    'error': str(e)
                })
                print(f"✗ 错误: {material_name} - {str(e)}")
    else:
        # 清空现有B453CalculationItem数据
        B453CalculationItem.objects.all().delete()
        
        # 遍历有效的行数据
        for index, row in valid_rows:
            material_name = clean_material_name(row[mapped_columns['料材名称']])
            
            try:
                # 创建B453CalculationItem
                item = B453CalculationItem.objects.create(
                    no=len(imported_items) + 1,
                    material_name=material_name,
                    usage_station=str(row[mapped_columns['使用站别']]).strip() if pd.notna(row[mapped_columns['使用站别']]) else '',
                    usage_per_machine=int(row[mapped_columns['每臺機用量']]) if pd.notna(row[mapped_columns['每臺機用量']]) else 0,
                    usage_count=int(row[mapped_columns['使用次数']]) if pd.notna(row[mapped_columns['使用次数']]) else 0,
                    monthly_capacity=int(row[mapped_columns['当月产能']]) if pd.notna(row[mapped_columns['当月产能']]) else 0,
                    min_stock=int(row[mapped_columns['最低库存']]) if pd.notna(row[mapped_columns['最低库存']]) else 0,
                    max_stock=int(row[mapped_columns['最高库存']]) if pd.notna(row[mapped_columns['最高库存']]) else 0,
                    monthly_demand_per_station=int(row[mapped_columns['当月需求/站']]) if pd.notna(row[mapped_columns['当月需求/站']]) else 0,
                    moq_remark=str(row[mapped_columns['备注']]).strip() if pd.notna(row[mapped_columns['备注']]) else '',
                    created_by=request.user
                )
                imported_items.append({
                    'no': item.no,
                    'material_name': item.material_name,
                    'usage_station': item.usage_station,
                    'monthly_demand': item.monthly_demand_per_station
                })
                print(f"✓ 导入需求计算表(B453): {material_name}")
                
            except Exception as e:
                error_items.append({
                    'material': material_name,
                    'error': str(e)
                })
                print(f"✗ 错误: {material_name} - {str(e)}")
    
    # 记录导入日志
    log = ImportLog.objects.create(
        user=request.user,
        file_name=file_name,
        result=f"成功导入需求计算表 {len(imported_items)} 条记录（Sheet: {sheet_name or '默认'}），错误 {len(error_items)} 条",
        success=len(error_items) == 0,
        imported_count=len(imported_items),
        error_count=len(error_items),
        error_details=str(error_items) if error_items else ""
    )
    
    # 打印详细错误信息到终端
    if error_items:
        print(f"\n=== 导入错误详情 ===")
        for i, error in enumerate(error_items, 1):
            print(f"错误 {i}: {error}")
        print(f"=== 共 {len(error_items)} 条错误 ===\n")
    
    return Response({
        'message': f'成功导入需求计算表 {len(imported_items)} 条记录（Sheet: {sheet_name or "默认"}）',
        'imported_count': len(imported_items),
        'error_count': len(error_items),
        'imported_items': imported_items,
        'error_items': error_items,
        'log_id': log.id,
        'sheet_name': sheet_name,
        'table_type': 'calculation',
        'detection_method': detection_method
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def import_log_list(request):
    """
    获取导入日志列表
    """
    try:
        logs = ImportLog.objects.all().order_by('-created_at')[:50]  # 最近50条
        
        log_data = []
        for log in logs:
            log_data.append({
                'id': log.id,
                'user': log.user.username if log.user else '未知用户',
                'created_at': log.created_at.isoformat(),
                'file_name': log.file_name,
                'result': log.result,
                'success': log.success,
                'imported_count': log.imported_count,
                'error_count': log.error_count
            })
        
        return Response({
            'results': log_data,
            'total': len(log_data)
        })
        
    except Exception as e:
        return Response({
            'error': f'获取日志失败: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_grouped_material_data(request, form_id):
    """
    获取分组的材料数据 - 处理一个耗材对应多个使用站别的情况
    """
    try:
        # 获取申请表
        application_form = ApplicationForm.objects.get(id=form_id)
        
        # 获取所有计算项目
        calculation_items = DynamicCalculationItem.objects.filter(
            form=application_form,
            is_visible=True
        ).order_by('material_name', 'usage_station')
        
        # 按材料名称分组
        grouped_data = {}
        for item in calculation_items:
            material_name = item.material_name
            if material_name not in grouped_data:
                grouped_data[material_name] = {
                    'supply_item': None,
                    'calculation_items': [],
                    'total_demand': 0,
                    'total_order': 0
                }
            
            # 添加计算项目
            calculation_data = {
                'id': item.id,
                'no': item.no,
                'material_name': item.material_name,
                'usage_station': item.usage_station,
                'usage_per_set': item.usage_per_set,
                'usage_count': item.usage_count,
                'monthly_capacity': item.monthly_capacity,
                'min_stock': item.min_stock,
                'max_stock': item.max_stock,
                'monthly_demand': item.monthly_demand,
                'actual_order': item.actual_order,
                'linked_supply_item_id': item.linked_supply_item_id,
                'unit_price': float(item.unit_price) if item.unit_price else 0,
                'moq': item.moq,
                'purchaser': item.purchaser,
            }
            
            grouped_data[material_name]['calculation_items'].append(calculation_data)
            grouped_data[material_name]['total_demand'] += item.monthly_demand or 0
            grouped_data[material_name]['total_order'] += item.actual_order or 0
            
            # 如果有关联的供应项目，获取供应项目信息
            if item.linked_supply_item_id and not grouped_data[material_name]['supply_item']:
                try:
                    supply_item = B453SupplyItem.objects.get(id=item.linked_supply_item_id)
                    grouped_data[material_name]['supply_item'] = {
                        'id': supply_item.id,
                        'material_description': supply_item.material_description,
                        'unit': supply_item.unit,
                        'purchaser': supply_item.purchaser,
                        'unit_price': float(supply_item.unit_price),
                        'min_safety_stock': supply_item.min_safety_stock,
                        'max_safety_stock': supply_item.max_safety_stock,
                        'moq': supply_item.moq,
                        'lead_time_weeks': supply_item.lead_time_weeks,
                    }
                except B453SupplyItem.DoesNotExist:
                    # 如果关联的供应项目不存在，创建一个虚拟的供应项目
                    grouped_data[material_name]['supply_item'] = {
                        'id': 0,
                        'material_description': material_name,
                        'unit': 'pcs',
                        'purchaser': item.purchaser or '',
                        'unit_price': float(item.unit_price) if item.unit_price else 0,
                        'min_safety_stock': item.min_stock or 0,
                        'max_safety_stock': item.max_stock or 0,
                        'moq': item.moq or 0,
                        'lead_time_weeks': 15,
                    }
        
        # 转换为列表格式
        result = []
        for material_name, data in grouped_data.items():
            if not data['supply_item']:
                # 如果没有供应项目，创建一个基于第一个计算项目的虚拟供应项目
                first_calc = data['calculation_items'][0] if data['calculation_items'] else {}
                data['supply_item'] = {
                    'id': 0,
                    'material_description': material_name,
                    'unit': 'pcs',
                    'purchaser': first_calc.get('purchaser', ''),
                    'unit_price': first_calc.get('unit_price', 0),
                    'min_safety_stock': first_calc.get('min_stock', 0),
                    'max_safety_stock': first_calc.get('max_stock', 0),
                    'moq': first_calc.get('moq', 0),
                    'lead_time_weeks': 15,
                }
            result.append(data)
        
        return Response(result, status=200)
        
    except ApplicationForm.DoesNotExist:
        return Response({'error': '申请表不存在'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
def add_usage_station(request, material_id):
    """
    为指定材料添加新的使用站别
    """
    try:
        # 获取请求数据
        data = request.data
        usage_station = data.get('usage_station')
        usage_per_set = data.get('usage_per_set', 0)
        usage_count = data.get('usage_count', 0)
        monthly_capacity = data.get('monthly_capacity', 0)
        form_id = data.get('form_id')
        
        if not usage_station or not form_id:
            return Response({'error': '使用站别和申请表ID为必填项'}, status=400)
        
        # 获取申请表
        application_form = ApplicationForm.objects.get(id=form_id)
        
        # 获取材料信息
        supply_item = B453SupplyItem.objects.get(id=material_id)
        
        # 计算当月需求/站
        monthly_demand = 0
        if usage_per_set and usage_count and monthly_capacity:
            monthly_demand = int((monthly_capacity * usage_per_set) / usage_count)
        
        # 创建新的计算项目
        calculation_item = DynamicCalculationItem.objects.create(
            form=application_form,
            no=DynamicCalculationItem.objects.filter(form=application_form).count() + 1,
            material_name=supply_item.material_description,
            usage_station=usage_station,
            usage_per_set=usage_per_set,
            usage_count=usage_count,
            monthly_capacity=monthly_capacity,
            min_stock=supply_item.min_safety_stock,
            max_stock=supply_item.max_safety_stock,
            monthly_demand=monthly_demand,
            actual_order=monthly_demand,
            linked_supply_item_id=supply_item.id,
            linked_material=supply_item.material_description,
            unit_price=supply_item.unit_price,
            moq=supply_item.moq,
            purchaser=supply_item.purchaser,
        )
        
        return Response({
            'id': calculation_item.id,
            'message': '使用站别添加成功',
            'usage_station': usage_station,
            'monthly_demand': monthly_demand
        }, status=201)
        
    except ApplicationForm.DoesNotExist:
        return Response({'error': '申请表不存在'}, status=404)
    except B453SupplyItem.DoesNotExist:
        return Response({'error': '材料不存在'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
