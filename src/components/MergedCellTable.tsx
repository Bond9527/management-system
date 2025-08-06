import React from 'react';
import { Table } from 'antd';

interface MergedCellTableProps {
  dataSource: any[];
  columns: any[];
  loading?: boolean;
  rowSelection?: any;
  scroll?: any;
  size?: 'small' | 'middle' | 'large';
  rowClassName?: (record: any) => string;
  rowKey?: string;
}

const MergedCellTable: React.FC<MergedCellTableProps> = ({
  dataSource,
  columns,
  loading = false,
  rowSelection,
  scroll,
  size = 'small',
  rowClassName,
  rowKey = 'id',
}) => {
  // 处理列定义，添加合并单元格功能
  const processedColumns = columns.map(col => ({
    ...col,
    onCell: (record: any, index: number) => {
      const currentRow = dataSource[index];
      
      // 需要合并的字段列表
      const mergeFields = [
        'no',                      // 序号列
        'min_total_stock', 
        'max_total_stock',
        'monthly_total_demand',    // 當月總需求
        'actual_purchase_quantity', // 實際請購數量
        'moq_remark',              // 備註(MOQ)
        'total_amount',            // 總金額
        'purchaser',               // 採購員
        'material_name'            // 料材名稱
      ];
      
      if (mergeFields.includes(col.dataIndex)) {
        if (currentRow && currentRow.stationCount > 1) {
          if (currentRow.stationIndex === 0) {
            // 第一行，合并多行
            const baseStyle = {
              verticalAlign: 'middle',
              borderBottom: '1px solid #e9ecef',
            };



            // 为序号列添加特殊样式
            if (col.dataIndex === 'no') {
              return {
                rowSpan: currentRow.stationCount,
                colSpan: 1,
                style: {
                  ...baseStyle,
                  backgroundColor: '#fff3cd', // 橙色背景，与网页表格保持一致
                  fontWeight: 'bold',
                  textAlign: 'center',
                  padding: '12px 8px',
                },
              };
            }

            // 为料材名稱列添加特殊样式
            if (col.dataIndex === 'material_name') {
              return {
                rowSpan: currentRow.stationCount,
                colSpan: 1,
                style: {
                  ...baseStyle,
                  backgroundColor: '#f0f8ff', // 浅蓝色背景
                  fontWeight: 'normal',
                  padding: '12px 8px',
                },
              };
            }

            // 其他合并字段的样式
            return {
              rowSpan: currentRow.stationCount,
              colSpan: 1,
              style: {
                ...baseStyle,
                backgroundColor: '#f8f9fa',
                fontWeight: 'bold',
              },
            };
          } else {
            // 其他行，隐藏单元格
            return {
              rowSpan: 0,
              colSpan: 0,
            };
          }
        }
      }
      
      return {};
    },
  }));

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <Table
        className="ant-table-striped"
        columns={processedColumns}
        dataSource={dataSource}
        loading={loading}
        pagination={false}
        rowClassName={rowClassName}
        rowKey={rowKey}
        rowSelection={rowSelection}
        scroll={scroll}
        size={size}
      />
    </div>
  );
};

export default MergedCellTable; 