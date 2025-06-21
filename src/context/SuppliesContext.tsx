import React, { createContext, useContext, useState, ReactNode } from "react";

export interface SupplyItem {
  id: number;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  safetyStock: number;
  unitPrice: number; // 固定单价（元）
}

const initialSupplies: SupplyItem[] = [
  { id: 1, name: "P1000探针", category: "探针", unit: "支", currentStock: 25, safetyStock: 20, unitPrice: 150.00 },
  { id: 2, name: "P500探针", category: "探针", unit: "支", currentStock: 30, safetyStock: 25, unitPrice: 120.00 },
  { id: 3, name: "P2000探针", category: "探针", unit: "支", currentStock: 15, safetyStock: 15, unitPrice: 180.00 },
  { id: 4, name: "P3000探针", category: "探针", unit: "支", currentStock: 20, safetyStock: 15, unitPrice: 220.00 },
  { id: 5, name: "探针清洁剂", category: "清洁剂", unit: "瓶", currentStock: 18, safetyStock: 15, unitPrice: 45.00 },
  { id: 6, name: "探针专用清洁布", category: "清洁剂", unit: "包", currentStock: 25, safetyStock: 20, unitPrice: 25.00 },
  { id: 7, name: "继电器模块", category: "继电器", unit: "个", currentStock: 20, safetyStock: 12, unitPrice: 35.00 },
  { id: 8, name: "继电器底座", category: "继电器", unit: "个", currentStock: 15, safetyStock: 10, unitPrice: 15.00 },
  { id: 9, name: "探针连接器", category: "连接器", unit: "个", currentStock: 25, safetyStock: 18, unitPrice: 28.00 },
  { id: 10, name: "探针转接头", category: "连接器", unit: "个", currentStock: 20, safetyStock: 15, unitPrice: 32.00 },
  { id: 11, name: "探针支架", category: "其他配件", unit: "个", currentStock: 15, safetyStock: 10, unitPrice: 85.00 },
  { id: 12, name: "探针校准工具", category: "其他配件", unit: "套", currentStock: 8, safetyStock: 5, unitPrice: 280.00 },
  { id: 13, name: "探针测试板", category: "其他配件", unit: "块", currentStock: 12, safetyStock: 8, unitPrice: 120.00 },
  { id: 14, name: "探针保护套", category: "其他配件", unit: "个", currentStock: 30, safetyStock: 20, unitPrice: 18.00 },
  { id: 15, name: "探针收纳盒", category: "其他配件", unit: "个", currentStock: 10, safetyStock: 5, unitPrice: 65.00 },
  { id: 16, name: "探针维修工具", category: "其他配件", unit: "套", currentStock: 5, safetyStock: 3, unitPrice: 450.00 },
  { id: 17, name: "探针说明书", category: "其他配件", unit: "本", currentStock: 50, safetyStock: 30, unitPrice: 15.00 },
  { id: 18, name: "探针标签", category: "其他配件", unit: "张", currentStock: 100, safetyStock: 50, unitPrice: 0.50 },
  { id: 19, name: "探针防静电袋", category: "其他配件", unit: "个", currentStock: 200, safetyStock: 100, unitPrice: 0.80 },
  { id: 20, name: "探针包装盒", category: "其他配件", unit: "个", currentStock: 40, safetyStock: 20, unitPrice: 12.00 },
];

interface SuppliesContextType {
  supplies: SupplyItem[];
  addSupply: (s: SupplyItem) => void;
  updateSupply: (s: SupplyItem) => void;
  deleteSupply: (id: number) => void;
}

const SuppliesContext = createContext<SuppliesContextType | undefined>(undefined);

export const SuppliesProvider = ({ children }: { children: ReactNode }) => {
  const [supplies, setSupplies] = useState<SupplyItem[]>(initialSupplies);

  const addSupply = (s: SupplyItem) => setSupplies(prev => [...prev, s]);
  const updateSupply = (s: SupplyItem) =>
    setSupplies(prev => prev.map(item => (item.id === s.id ? s : item)));
  const deleteSupply = (id: number) =>
    setSupplies(prev => prev.filter(item => item.id !== id));

  return (
    <SuppliesContext.Provider value={{ supplies, addSupply, updateSupply, deleteSupply }}>
      {children}
    </SuppliesContext.Provider>
  );
};

export const useSupplies = () => {
  const ctx = useContext(SuppliesContext);
  if (!ctx) throw new Error("useSupplies must be used within a SuppliesProvider");
  return ctx;
}; 