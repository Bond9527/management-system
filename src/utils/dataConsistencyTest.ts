import { SupplyItem, InventoryRecord } from "@/hooks/useSupplies";

/**
 * 验证库存总览和变动台账的数据一致性
 */
export const validateDataConsistency = (
  supplies: SupplyItem[],
  records: InventoryRecord[]
): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];

  // 检查每个耗材的库存是否与记录一致
  supplies.forEach((supply) => {
    const supplyRecords = records.filter(record => record.supplyId === supply.id);
    
    if (supplyRecords.length === 0) {
      // 如果没有记录，检查初始库存是否合理
      if (supply.currentStock > 0) {
        issues.push(`耗材 "${supply.name}" 有库存但无变动记录`);
      }
      return;
    }

    // 按时间排序记录
    const sortedRecords = supplyRecords.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // 计算从记录中得出的当前库存
    let calculatedStock = 0;
    sortedRecords.forEach((record) => {
      switch (record.type) {
        case "in":
          calculatedStock += record.quantity;
          break;
        case "out":
          calculatedStock -= record.quantity;
          break;
        case "adjust":
          calculatedStock = record.quantity;
          break;
      }
    });

    // 检查计算出的库存是否与实际库存一致
    if (Math.abs(calculatedStock - supply.currentStock) > 0.01) {
      issues.push(
        `耗材 "${supply.name}" 库存不一致: 实际库存 ${supply.currentStock}${supply.unit}, ` +
        `根据记录计算应为 ${calculatedStock}${supply.unit}`
      );
    }
  });

  // 检查记录中的耗材是否都存在于库存中
  const supplyIds = new Set(supplies.map(s => s.id));
  records.forEach((record) => {
    if (!supplyIds.has(record.supplyId)) {
      issues.push(`记录中的耗材ID ${record.supplyId} 不存在于库存中`);
    }
  });

  return {
    isValid: issues.length === 0,
    issues
  };
};

/**
 * 生成库存变动摘要
 */
export const generateInventorySummary = (
  supplies: SupplyItem[],
  records: InventoryRecord[]
) => {
  const summary = {
    totalSupplies: supplies.length,
    totalRecords: records.length,
    lowStockItems: supplies.filter(s => s.currentStock <= s.safetyStock).length,
    recentActivity: records.filter(r => {
      const recordDate = new Date(r.timestamp);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return recordDate >= weekAgo;
    }).length,
    byCategory: {} as Record<string, { count: number; totalStock: number }>,
    byOperationType: {
      in: 0,
      out: 0,
      adjust: 0
    }
  };

  // 按类别统计
  supplies.forEach(supply => {
    if (!summary.byCategory[supply.category]) {
      summary.byCategory[supply.category] = { count: 0, totalStock: 0 };
    }
    summary.byCategory[supply.category].count++;
    summary.byCategory[supply.category].totalStock += supply.currentStock;
  });

  // 按操作类型统计
  records.forEach(record => {
    summary.byOperationType[record.type]++;
  });

  return summary;
};

/**
 * 修复数据不一致问题
 */
export const fixDataInconsistencies = (
  supplies: SupplyItem[],
  records: InventoryRecord[]
): { updatedSupplies: SupplyItem[]; issues: string[] } => {
  const issues: string[] = [];
  const updatedSupplies = [...supplies];

  supplies.forEach((supply, index) => {
    const supplyRecords = records.filter(record => record.supplyId === supply.id);
    
    if (supplyRecords.length === 0) {
      return;
    }

    // 按时间排序记录
    const sortedRecords = supplyRecords.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // 计算从记录中得出的当前库存
    let calculatedStock = 0;
    sortedRecords.forEach((record) => {
      switch (record.type) {
        case "in":
          calculatedStock += record.quantity;
          break;
        case "out":
          calculatedStock -= record.quantity;
          break;
        case "adjust":
          calculatedStock = record.quantity;
          break;
      }
    });

    // 如果库存不一致，更新为计算出的库存
    if (Math.abs(calculatedStock - supply.currentStock) > 0.01) {
      issues.push(
        `已修复耗材 "${supply.name}" 的库存: ${supply.currentStock}${supply.unit} → ${calculatedStock}${supply.unit}`
      );
      updatedSupplies[index] = {
        ...supply,
        currentStock: calculatedStock
      };
    }
  });

  return { updatedSupplies, issues };
}; 