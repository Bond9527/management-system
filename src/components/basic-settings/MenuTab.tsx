import { Card, CardBody } from "@heroui/react";

export default function MenuTab() {
  return (
    <Card>
      <CardBody>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">菜单管理</h2>
          <p className="text-gray-600">在这里管理系统的菜单结构和权限配置</p>
          {/* 这里可以添加菜单管理的具体内容，如菜单树、权限设置等 */}
        </div>
      </CardBody>
    </Card>
  );
} 