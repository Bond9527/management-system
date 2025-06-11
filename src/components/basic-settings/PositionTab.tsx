import { Card, CardBody } from "@heroui/react";

export default function PositionTab() {
  return (
    <Card>
      <CardBody>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">岗位管理</h2>
          <p className="text-gray-600">在这里管理公司的岗位设置和人员配置</p>
          {/* 这里可以添加岗位管理的具体内容，如岗位列表、人员分配等 */}
        </div>
      </CardBody>
    </Card>
  );
} 