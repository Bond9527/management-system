import { useState, useEffect } from 'react';
import { suppliesApi, recordsApi, statisticsApi } from '@/services/supplies';
import type { SupplyItem, InventoryRecord, CreateSupplyRequest, UpdateSupplyRequest, AdjustStockRequest } from '@/services/supplies';

// 导出接口供其他组件使用
export type { SupplyItem, InventoryRecord };

export const useSupplies = () => {
  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取所有耗材
  const fetchSupplies = async (params?: { category?: string; search?: string }) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await suppliesApi.getSupplies(params);
      setSupplies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取耗材列表失败');
      console.error('Failed to fetch supplies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取所有记录
  const fetchRecords = async (params?: { supply_id?: number; type?: string }) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await recordsApi.getRecords(params);
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取记录列表失败');
      console.error('Failed to fetch records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 添加新耗材
  const addSupply = async (newSupply: Omit<CreateSupplyRequest, 'id'>) => {
    try {
      setIsLoading(true);
      setError(null);
      const createdSupply = await suppliesApi.createSupply(newSupply);
      setSupplies(prev => [createdSupply, ...prev]);
      return createdSupply;
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加耗材失败');
      console.error('Failed to add supply:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 更新耗材
  const updateSupply = async (updatedSupply: UpdateSupplyRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      const updated = await suppliesApi.updateSupply(updatedSupply);
      setSupplies(prev => prev.map(supply => 
        supply.id === updated.id ? updated : supply
      ));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新耗材失败');
      console.error('Failed to update supply:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 删除耗材
  const deleteSupply = async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      await suppliesApi.deleteSupply(id);
      setSupplies(prev => prev.filter(supply => supply.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除耗材失败');
      console.error('Failed to delete supply:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 获取单个耗材
  const getSupply = async (id: number) => {
    try {
      return await suppliesApi.getSupply(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取耗材详情失败');
      console.error('Failed to get supply:', err);
      throw err;
    }
  };

  // 库存调整
  const adjustStock = async (data: AdjustStockRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await suppliesApi.adjustStock(data);
      
      // 如果调整了单价，需要重新获取耗材数据以确保数据同步
      if (data.unit_price !== undefined) {
        await fetchSupplies();
      } else {
        // 只更新库存数量
        setSupplies(prev => prev.map(supply => 
          supply.id === data.supply_id 
            ? { ...supply, current_stock: result.record.new_stock }
            : supply
        ));
      }
      
      // 添加新记录到本地记录列表
      setRecords(prev => [result.record, ...prev]);
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '库存调整失败');
      console.error('Failed to adjust stock:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 添加库存变动记录（现在通过adjustStock实现）
  const addRecord = async (record: Omit<AdjustStockRequest, 'supply_id'> & { supply_id: number }) => {
    return adjustStock(record);
  };

  // 获取记录
  const getRecords = () => records;

  // 清空记录（仅清空本地状态，不影响服务器）
  const clearRecords = () => {
    setRecords([]);
  };

  // 获取统计信息
  const getStatistics = async () => {
    try {
      return await statisticsApi.getStatistics();
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取统计信息失败');
      console.error('Failed to get statistics:', err);
      throw err;
    }
  };

  // 初始化时获取数据
  useEffect(() => {
    fetchSupplies();
    fetchRecords();
  }, []);

  return {
    supplies,
    records,
    isLoading,
    error,
    // 数据获取
    fetchSupplies,
    fetchRecords,
    // 耗材管理
    addSupply,
    updateSupply,
    deleteSupply,
    getSupply,
    // 库存管理
    adjustStock,
    addRecord,
    getRecords,
    clearRecords,
    // 统计
    getStatistics,
    // 工具方法
    setError: (error: string | null) => setError(error),
  };
}; 