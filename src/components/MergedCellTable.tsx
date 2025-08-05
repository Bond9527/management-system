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
      // 只对特定字段进行合并
      if (col.dataIndex === 'min_total_stock' || col.dataIndex === 'max_total_stock') {
        const currentRow = dataSource[index];
        
        if (currentRow && currentRow.stationCount > 1) {
          if (currentRow.stationIndex === 0) {
            // 第一行，合并多行
            return {
              rowSpan: currentRow.stationCount,
              colSpan: 1,
              style: {
                verticalAlign: 'middle',
                backgroundColor: '#f8f9fa',
                borderBottom: '1px solid #e9ecef',
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