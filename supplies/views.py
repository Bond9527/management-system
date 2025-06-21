from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import Supply, InventoryRecord
from .serializers import SupplySerializer, InventoryRecordSerializer, SupplyDetailSerializer
from django.db import models
from django.db.models import Q

class SupplyViewSet(viewsets.ModelViewSet):
    """耗材管理视图集"""
    queryset = Supply.objects.all()
    serializer_class = SupplySerializer
    permission_classes = [IsAuthenticated]

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
            if quantity > previous_stock:
                return Response({
                    'error': '出库数量不能超过当前库存'
                }, status=status.HTTP_400_BAD_REQUEST)
            new_stock = previous_stock - quantity
        elif adjustment_type == 'adjust':
            new_stock = quantity
        else:
            return Response({
                'error': '无效的调整类型'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 使用事务确保数据一致性
        with transaction.atomic():
            # 更新库存
            supply.current_stock = new_stock
            
            # 更新单价（如果提供了的话）
            if unit_price is not None:
                supply.unit_price = unit_price
            
            supply.save()
            
            # 创建记录
            record = InventoryRecord.objects.create(
                type=adjustment_type,
                supply=supply,
                quantity=quantity if adjustment_type != 'adjust' else new_stock,
                operator=request.user.username,
                department=getattr(request.user, 'department', '未知部门'),
                remark=remark,
                previous_stock=previous_stock,
                new_stock=new_stock
            )
        
        # 序列化返回数据
        record_serializer = InventoryRecordSerializer(record)
        
        return Response({
            'message': '库存调整成功',
            'record': record_serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'库存调整失败: {str(e)}'
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
