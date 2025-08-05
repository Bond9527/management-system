import React, { useState } from 'react';
import { Card, CardBody, Button } from '@heroui/react';
import MergedCellTable from '../components/MergedCellTable';

const TestMergedTable: React.FC = () => {
  const [dataSource] = useState([
    // 单站别项目
    {
      id: 1,
      no: '1',
      material_name: '材料A',
      usage_station: '站别1',
      min_stock: 10,
      max_stock: 100,
      min_total_stock: 10,
      max_total_stock: 100,
      stationIndex: 0,
      stationCount: 1,
    },
    // 多站别项目 - 第一行
    {
      id: 2,
      no: '2',
      material_name: '材料B',
      usage_station: '站别1',
      min_stock: 20,
      max_stock: 150,
      min_total_stock: 70, // 总和
      max_total_stock: 450, // 总和
      stationIndex: 0,
      stationCount: 3,
    },
    // 多站别项目 - 第二行
    {
      id: 2,
      no: '',
      material_name: '',
      usage_station: '站别2',
      min_stock: 25,
      max_stock: 150,
      min_total_stock: null, // 被合并
      max_total_stock: null, // 被合并
      stationIndex: 1,
      stationCount: 3,
    },
    // 多站别项目 - 第三行
    {
      id: 2,
      no: '',
      material_name: '',
      usage_station: '站别3',
      min_stock: 25,
      max_stock: 150,
      min_total_stock: null, // 被合并
      max_total_stock: null, // 被合并
      stationIndex: 2,
      stationCount: 3,
    },
  ]);

  const columns = [
    {
      title: 'No.',
      dataIndex: 'no',
      key: 'no',
      width: 80,
    },
    {
      title: '料材名稱',
      dataIndex: 'material_name',
      key: 'material_name',
      width: 200,
    },
    {
      title: '使用站別',
      dataIndex: 'usage_station',
      key: 'usage_station',
      width: 150,
    },
    {
      title: '最低库存',
      dataIndex: 'min_stock',
      key: 'min_stock',
      width: 100,
    },
    {
      title: '最高库存',
      dataIndex: 'max_stock',
      key: 'max_stock',
      width: 100,
    },
    {
      title: '最低庫存總數',
      dataIndex: 'min_total_stock',
      key: 'min_total_stock',
      width: 140,
    },
    {
      title: '最高庫存總數',
      dataIndex: 'max_total_stock',
      key: 'max_total_stock',
      width: 140,
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <CardBody>
          <h1 className="text-2xl font-bold mb-4">合并单元格表格测试</h1>
          <p className="text-gray-600 mb-4">
            测试多站别项目的最高库存总数和最低库存总数列的合并单元格功能
          </p>
          
          <MergedCellTable
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            size="small"
            scroll={{ x: 1000 }}
          />
          
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">说明：</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 材料A是单站别项目，不进行合并</li>
              <li>• 材料B是多站别项目（3个站别），最高库存总数和最低库存总数列应该合并显示</li>
              <li>• 合并的单元格应该有特殊的背景色和样式</li>
            </ul>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default TestMergedTable; 