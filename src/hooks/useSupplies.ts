import { useState, useEffect } from 'react';

export interface SupplyItem {
  id: number;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  safetyStock: number;
}

export interface InventoryRecord {
  id: number;
  type: "in" | "out" | "adjust";
  supplyId: number;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  operator: string;
  department: string;
  timestamp: string;
  remark: string;
  previousStock: number;
  newStock: number;
}

// 全量初始耗材数据
const initialSupplies: SupplyItem[] = [
  { id: 1, name: "P1000探针", category: "探针", unit: "支", currentStock: 25, safetyStock: 20 },
  { id: 2, name: "P500探针", category: "探针", unit: "支", currentStock: 30, safetyStock: 25 },
  { id: 3, name: "P2000探针", category: "探针", unit: "支", currentStock: 15, safetyStock: 15 },
  { id: 4, name: "P3000探针", category: "探针", unit: "支", currentStock: 20, safetyStock: 15 },
  { id: 5, name: "探针清洁剂", category: "清洁剂", unit: "瓶", currentStock: 18, safetyStock: 15 },
  { id: 6, name: "探针专用清洁布", category: "清洁剂", unit: "包", currentStock: 25, safetyStock: 20 },
  { id: 7, name: "继电器模块", category: "继电器", unit: "个", currentStock: 20, safetyStock: 12 },
  { id: 8, name: "继电器底座", category: "继电器", unit: "个", currentStock: 15, safetyStock: 10 },
  { id: 9, name: "探针连接器", category: "连接器", unit: "个", currentStock: 25, safetyStock: 18 },
  { id: 10, name: "探针转接头", category: "连接器", unit: "个", currentStock: 20, safetyStock: 15 },
  { id: 11, name: "探针支架", category: "其他配件", unit: "个", currentStock: 15, safetyStock: 10 },
  { id: 12, name: "探针校准工具", category: "其他配件", unit: "套", currentStock: 8, safetyStock: 5 },
  { id: 13, name: "探针测试板", category: "其他配件", unit: "块", currentStock: 12, safetyStock: 8 },
  { id: 14, name: "探针保护套", category: "其他配件", unit: "个", currentStock: 30, safetyStock: 20 },
  { id: 15, name: "探针收纳盒", category: "其他配件", unit: "个", currentStock: 10, safetyStock: 5 },
  { id: 16, name: "探针维修工具", category: "其他配件", unit: "套", currentStock: 5, safetyStock: 3 },
  { id: 17, name: "探针说明书", category: "其他配件", unit: "本", currentStock: 50, safetyStock: 30 },
  { id: 18, name: "探针标签", category: "其他配件", unit: "张", currentStock: 100, safetyStock: 50 },
  { id: 19, name: "探针防静电袋", category: "其他配件", unit: "个", currentStock: 200, safetyStock: 100 },
  { id: 20, name: "探针包装盒", category: "其他配件", unit: "个", currentStock: 40, safetyStock: 20 },
  { id: 21, name: "A4打印纸", category: "办公用品", unit: "包", currentStock: 48, safetyStock: 30 },
];

// 存储键
const SUPPLIES_STORAGE_KEY = 'supplies_data';
const RECORDS_STORAGE_KEY = 'inventory_records';

// 从 localStorage 获取数据
const getSuppliesFromStorage = (): SupplyItem[] => {
  try {
    const stored = localStorage.getItem(SUPPLIES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : initialSupplies;
  } catch (error) {
    console.error('Failed to load supplies from storage:', error);
    return initialSupplies;
  }
};

const getRecordsFromStorage = (): InventoryRecord[] => {
  try {
    const stored = localStorage.getItem(RECORDS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load records from storage:', error);
    return [];
  }
};

// 保存数据到 localStorage
const saveSuppliesToStorage = (supplies: SupplyItem[]) => {
  try {
    localStorage.setItem(SUPPLIES_STORAGE_KEY, JSON.stringify(supplies));
  } catch (error) {
    console.error('Failed to save supplies to storage:', error);
  }
};

const saveRecordsToStorage = (records: InventoryRecord[]) => {
  try {
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('Failed to save records to storage:', error);
  }
};

export const useSupplies = () => {
  const [supplies, setSupplies] = useState<SupplyItem[]>(getSuppliesFromStorage());
  const [records, setRecords] = useState<InventoryRecord[]>(getRecordsFromStorage());

  // 添加新耗材
  const addSupply = async (newSupply: SupplyItem) => {
    const updatedSupplies = [...supplies, newSupply];
    setSupplies(updatedSupplies);
    saveSuppliesToStorage(updatedSupplies);
  };

  // 更新耗材
  const updateSupply = async (updatedSupply: SupplyItem) => {
    const updatedSupplies = supplies.map(supply => 
      supply.id === updatedSupply.id ? updatedSupply : supply
    );
    setSupplies(updatedSupplies);
    saveSuppliesToStorage(updatedSupplies);
  };

  // 删除耗材
  const deleteSupply = async (id: number) => {
    const updatedSupplies = supplies.filter(supply => supply.id !== id);
    setSupplies(updatedSupplies);
    saveSuppliesToStorage(updatedSupplies);
  };

  // 获取单个耗材
  const getSupply = (id: number) => {
    return supplies.find(supply => supply.id === id);
  };

  // 添加库存变动记录
  const addRecord = (record: Omit<InventoryRecord, 'id' | 'timestamp'>) => {
    const newRecord: InventoryRecord = {
      ...record,
      id: Date.now(),
      timestamp: new Date().toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
    };

    const updatedRecords = [newRecord, ...records];
    setRecords(updatedRecords);
    saveRecordsToStorage(updatedRecords);
  };

  // 获取记录
  const getRecords = () => records;

  // 清空记录
  const clearRecords = () => {
    setRecords([]);
    saveRecordsToStorage([]);
  };

  return {
    supplies,
    records,
    addSupply,
    updateSupply,
    deleteSupply,
    getSupply,
    addRecord,
    getRecords,
    clearRecords,
  };
}; 