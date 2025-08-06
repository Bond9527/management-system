import React from 'react';
import { Table } from 'antd';

interface DemandPurchaseTableProps {
  dataSource: any[];
  loading?: boolean;
  rowSelection?: any;
  scroll?: any;
  size?: 'small' | 'middle' | 'large';
  rowClassName?: (record: any) => string;
  rowKey?: string;
}

const DemandPurchaseTable: React.FC<DemandPurchaseTableProps> = ({
  dataSource,
  loading = false,
  rowSelection,
  scroll,
  size = 'small',
  rowClassName,
  rowKey = 'id',
}) => {
  // 定义列配置
  const columns = [
    {
      title: 'No.',
      dataIndex: 'no',
      key: 'no',
      width: 80,
      fixed: 'left' as const,
    },
    {
      title: '料材名稱',
      dataIndex: 'material_name',
      key: 'material_name',
      width: 200,
      fixed: 'left' as const,
    },
    {
      title: '使用站別',
      dataIndex: 'usage_station',
      key: 'usage_station',
      width: 150,
    },
    {
      title: '當月需求/站',
      dataIndex: 'monthly_demand',
      key: 'monthly_demand',
      width: 120,
      render: (value: number) => value?.toLocaleString() || '0',
    },
    {
      title: '當月總需求',
      dataIndex: 'monthly_total_demand',
      key: 'monthly_total_demand',
      width: 120,
      render: (value: number) => value?.toLocaleString() || '0',
    },
    {
      title: '實際請購數量',
      dataIndex: 'actual_purchase_quantity',
      key: 'actual_purchase_quantity',
      width: 140,
      render: (value: number) => value?.toLocaleString() || '0',
    },
    {
      title: '備註 (MOQ)',
      dataIndex: 'moq_remark',
      key: 'moq_remark',
      width: 150,
      render: (value: string) => value || '-',
    },
    {
      title: '單價',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 100,
      render: (value: number) => value ? `¥${value.toFixed(2)}` : '-',
    },
    {
      title: '總金額',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      render: (value: number) => value ? `¥${value.toLocaleString()}` : '-',
    },
    {
      title: '採購員',
      dataIndex: 'purchaser',
      key: 'purchaser',
      width: 100,
    },
  ];

  // 处理列定义，添加合并单元格功能
  const processedColumns = columns.map(col => ({
    ...col,
    onCell: (record: any, index: number | undefined) => {
      if (index === undefined) return {};
      const currentRow = dataSource[index];
      
      // 需要合并的字段列表
      const mergeFields = [
        'monthly_total_demand',    // 當月總需求
        'actual_purchase_quantity', // 實際請購數量
        'moq_remark',              // 備註(MOQ)
        'total_amount',            // 總金額
        'purchaser'                // 採購員
      ];
      
      if (mergeFields.includes(col.dataIndex)) {
        if (currentRow && currentRow.stationCount > 1) {
          if (currentRow.stationIndex === 0) {
            // 第一行，合并多行
            return {
              rowSpan: currentRow.stationCount,
              colSpan: 1,
              style: {
                verticalAlign: 'middle',
                backgroundColor: '#e6f7ff',
                borderBottom: '2px solid #1890ff',
                fontWeight: 'bold',
                textAlign: 'center' as const,
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
      
      // 对于料材名稱列，只在第一行显示
      if (col.dataIndex === 'material_name') {
        if (currentRow && currentRow.stationCount > 1) {
          if (currentRow.stationIndex === 0) {
            return {
              rowSpan: currentRow.stationCount,
              colSpan: 1,
              style: {
                verticalAlign: 'middle',
                backgroundColor: '#f0f0f0',
                fontWeight: 'bold',
              },
            };
          } else {
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
        scroll={scroll || { x: 1200 }}
        size={size}
        bordered
      />
    </div>
  );
};

export default DemandPurchaseTable; 