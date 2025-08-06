import React, { useState } from 'react';
import { Card, CardBody, Button } from '@heroui/react';
import DemandPurchaseTable from '../components/DemandPurchaseTable';

const TestDemandPurchaseTable: React.FC = () => {
  const [dataSource] = useState([
    // 多站别项目 - 第一行
    {
      id: 1,
      no: '1',
      material_name: '材料A',
      usage_station: '站别1',
      monthly_demand: 152,
      monthly_total_demand: 432, // 总和
      actual_purchase_quantity: 500, // 采购数量
      moq_remark: 'MOQ: 100', // 最小订购量
      unit_price: 25.50,
      total_amount: 12750, // 总金额
      purchaser: '张三',
      stationIndex: 0,
      stationCount: 4,
    },
    // 多站别项目 - 第二行
    {
      id: 1,
      no: '',
      material_name: '',
      usage_station: '站别2',
      monthly_demand: 54,
      monthly_total_demand: null, // 被合并
      actual_purchase_quantity: null, // 被合并
      moq_remark: null, // 被合并
      unit_price: 25.50,
      total_amount: null, // 被合并
      purchaser: null, // 被合并
      stationIndex: 1,
      stationCount: 4,
    },
    // 多站别项目 - 第三行
    {
      id: 1,
      no: '',
      material_name: '',
      usage_station: '站别3',
      monthly_demand: 54,
      monthly_total_demand: null, // 被合并
      actual_purchase_quantity: null, // 被合并
      moq_remark: null, // 被合并
      unit_price: 25.50,
      total_amount: null, // 被合并
      purchaser: null, // 被合并
      stationIndex: 2,
      stationCount: 4,
    },
    // 多站别项目 - 第四行
    {
      id: 1,
      no: '',
      material_name: '',
      usage_station: '站别4',
      monthly_demand: 171,
      monthly_total_demand: null, // 被合并
      actual_purchase_quantity: null, // 被合并
      moq_remark: null, // 被合并
      unit_price: 25.50,
      total_amount: null, // 被合并
      purchaser: null, // 被合并
      stationIndex: 3,
      stationCount: 4,
    },
    // 单站别项目
    {
      id: 2,
      no: '2',
      material_name: '材料B',
      usage_station: '站别1',
      monthly_demand: 200,
      monthly_total_demand: 200,
      actual_purchase_quantity: 250,
      moq_remark: 'MOQ: 50',
      unit_price: 15.75,
      total_amount: 3937.5,
      purchaser: '李四',
      stationIndex: 0,
      stationCount: 1,
    },
  ]);

  return (
    <div className="p-6">
      <Card>
        <CardBody>
          <h1 className="text-2xl font-bold mb-4">需求与采购信息表格测试</h1>
          <p className="text-gray-600 mb-4">
            测试多站别项目的需求与采购信息的合并单元格功能
          </p>
          
          <DemandPurchaseTable
            dataSource={dataSource}
            rowKey="id"
            size="small"
            scroll={{ x: 1200 }}
          />
          
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">说明：</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 材料A是多站别项目（4个站别），當月總需求、實際請購數量、備註(MOQ)、總金額、採購員列应该合并显示</li>
              <li>• 料材名稱列也会合并显示，只在第一行显示</li>
              <li>• 材料B是单站别项目，不进行合并</li>
              <li>• 合并的单元格有特殊的背景色和样式</li>
              <li>• 當月需求/站显示各个站别的具体需求数量</li>
            </ul>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold mb-2">数据说明：</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 當月總需求: 432 (152+54+54+171)</li>
              <li>• 實際請購數量: 500 (考虑MOQ后的采购数量)</li>
              <li>• 備註(MOQ): MOQ: 100 (最小订购量)</li>
              <li>• 總金額: ¥12,750 (500 × ¥25.50)</li>
            </ul>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default TestDemandPurchaseTable; 