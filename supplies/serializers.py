from rest_framework import serializers
from .models import Supply, InventoryRecord
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class SupplySerializer(serializers.ModelSerializer):
    class Meta:
        model = Supply
        fields = '__all__'

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