import { FC, useState } from "react";
import {
  Card,
  CardBody,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Badge,
} from "@heroui/react";

import { useSupplies } from "@/hooks/useSupplies";
import {
  validateDataConsistency,
  generateInventorySummary,
} from "@/utils/dataConsistencyTest";
import { formatTimestamp } from "@/utils/dateUtils";

const TestConsistencyPage: FC = () => {
  const { supplies, records } = useSupplies();
  const [consistencyResult, setConsistencyResult] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  const handleTestConsistency = () => {
    const result = validateDataConsistency(supplies, records);

    setConsistencyResult(result);

    const summaryData = generateInventorySummary(supplies, records);

    setSummary(summaryData);
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">数据一致性测试</h1>

      <Card className="shadow-lg">
        <CardBody>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">测试结果</h2>
            <Button color="primary" onClick={handleTestConsistency}>
              运行一致性检查
            </Button>
          </div>

          {consistencyResult && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-lg ${
                  consistencyResult.isValid
                    ? "bg-success-50 border border-success-200"
                    : "bg-warning-50 border border-warning-200"
                }`}
              >
                <h3
                  className={`font-semibold mb-2 ${
                    consistencyResult.isValid
                      ? "text-success-800"
                      : "text-warning-800"
                  }`}
                >
                  {consistencyResult.isValid
                    ? "✅ 数据一致性良好"
                    : "⚠️ 发现数据不一致"}
                </h3>
                {consistencyResult.issues.length > 0 && (
                  <ul className="space-y-1">
                    {consistencyResult.issues.map(
                      (issue: string, index: number) => (
                        <li key={index} className="text-sm text-warning-700">
                          • {issue}
                        </li>
                      ),
                    )}
                  </ul>
                )}
              </div>
            </div>
          )}

          {summary && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">数据摘要</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {summary.totalSupplies}
                  </div>
                  <div className="text-sm text-gray-600">总耗材数</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {summary.totalRecords}
                  </div>
                  <div className="text-sm text-gray-600">变动记录数</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {summary.lowStockItems}
                  </div>
                  <div className="text-sm text-gray-600">库存不足</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {summary.recentActivity}
                  </div>
                  <div className="text-sm text-gray-600">本周变动</div>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 库存数据 */}
        <Card className="shadow-lg">
          <CardBody>
            <h2 className="text-lg font-semibold mb-4">
              库存数据 ({supplies.length})
            </h2>
            <Table aria-label="库存数据">
              <TableHeader>
                <TableColumn>耗材名称</TableColumn>
                <TableColumn>当前库存</TableColumn>
                <TableColumn>安全库存</TableColumn>
                <TableColumn>状态</TableColumn>
              </TableHeader>
              <TableBody>
                {supplies.slice(0, 10).map((supply) => (
                  <TableRow key={supply.id}>
                    <TableCell>{supply.name}</TableCell>
                    <TableCell>
                      <Badge
                        color={
                          supply.current_stock <= supply.safety_stock
                            ? "danger"
                            : "success"
                        }
                        variant="flat"
                      >
                        {supply.current_stock} {supply.unit}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {supply.safety_stock} {supply.unit}
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={
                          supply.current_stock <= supply.safety_stock
                            ? "danger"
                            : "success"
                        }
                        size="sm"
                        variant="flat"
                      >
                        {supply.current_stock <= supply.safety_stock
                          ? "库存不足"
                          : "库存充足"}
                      </Chip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        {/* 变动记录 */}
        <Card className="shadow-lg">
          <CardBody>
            <h2 className="text-lg font-semibold mb-4">
              变动记录 ({records.length})
            </h2>
            <Table aria-label="变动记录">
              <TableHeader>
                <TableColumn>耗材名称</TableColumn>
                <TableColumn>操作类型</TableColumn>
                <TableColumn>数量</TableColumn>
                <TableColumn>时间</TableColumn>
              </TableHeader>
              <TableBody>
                {records.slice(0, 10).map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.supply_name}</TableCell>
                    <TableCell>
                      <Chip
                        color={
                          record.type === "in"
                            ? "success"
                            : record.type === "out"
                              ? "danger"
                              : "default"
                        }
                        size="sm"
                        variant="flat"
                      >
                        {record.type === "in"
                          ? "入库"
                          : record.type === "out"
                            ? "出库"
                            : "调整"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Badge
                        color={
                          record.type === "in"
                            ? "success"
                            : record.type === "out"
                              ? "danger"
                              : "default"
                        }
                        variant="flat"
                      >
                        {record.type === "in"
                          ? "+"
                          : record.type === "out"
                            ? "-"
                            : ""}
                        {record.quantity} {record.supply_unit}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatTimestamp(record.timestamp)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default TestConsistencyPage;
