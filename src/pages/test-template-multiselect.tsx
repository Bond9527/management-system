import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/react";

import DynamicApplicationManager from "../components/DynamicApplicationManager";

const TestTemplateMultiSelectPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <Card className="mb-6">
          <CardHeader>
            <h1 className="text-2xl font-bold">模板类型多选功能测试</h1>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">
                  ✨ 新功能特性
                </h3>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>✅ 支持模板类型多选</li>
                  <li>✅ 一个模板可以同时支持：耗材管控、需求计算、产能预测</li>
                  <li>✅ 界面使用CheckboxGroup替代单选Select</li>
                  <li>✅ 数据库使用JSONField存储数组格式</li>
                  <li>✅ 向后兼容现有的单选数据</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">
                  🎯 使用说明
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-green-700">
                  <li>点击"新建模板"按钮</li>
                  <li>在"模板类型"部分可以勾选多个选项</li>
                  <li>创建后的模板将支持选中的所有功能类型</li>
                  <li>在列表中可以看到多个类型以逗号分隔显示</li>
                </ol>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">
                  📊 预设模板示例
                </h3>
                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                  <li>
                    <strong>B453 SMT ATE申请表模板</strong>：耗材管控 + 需求计算
                  </li>
                  <li>
                    <strong>综合管理模板</strong>：耗材管控 + 需求计算 +
                    产能预测
                  </li>
                  <li>
                    <strong>B482耗材管控申请表模板</strong>：仅耗材管控
                  </li>
                  <li>
                    <strong>Andor需求计算表模板</strong>：仅需求计算
                  </li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 动态申请表管理器组件 */}
        <DynamicApplicationManager />
      </div>
    </div>
  );
};

export default TestTemplateMultiSelectPage;
