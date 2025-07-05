import { FC, useState, useEffect } from "react";
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
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import { useSupplies, SupplyItem } from "@/hooks/useSupplies";
import { getCurrentTimestamp } from "@/utils/dateUtils";
import { addToast } from "@heroui/toast";

const DebugSyncPage: FC = () => {
  const { supplies, addSupply } = useSupplies();
  const [newSupplyName, setNewSupplyName] = useState("");
  const [newSupplyCategory, setNewSupplyCategory] = useState("");
  const [newSupplyUnit, setNewSupplyUnit] = useState("");
  const [newSupplyStock, setNewSupplyStock] = useState("");
  const [newSupplySafety, setNewSupplySafety] = useState("");
  const [lastAddedSupply, setLastAddedSupply] = useState<SupplyItem | null>(null);

  const handleAddTestSupply = async () => {
    if (!newSupplyName || !newSupplyCategory || !newSupplyUnit || !newSupplyStock || !newSupplySafety) {
      addToast({
        title: "输入不完整",
        description: "请填写所有字段",
        color: "warning",
        timeout: 3000,
        shouldShowTimeoutProgress: true,
      });
      return;
    }

    const newSupply: SupplyItem = {
      id: Date.now(),
      name: newSupplyName,
      category: newSupplyCategory,
      unit: newSupplyUnit,
      unit_price: "0",
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp(),
      current_stock: Number(newSupplyStock),
      safety_stock: Number(newSupplySafety),
    };

    await addSupply(newSupply);
    setLastAddedSupply(newSupply);
    
    addToast({
      title: "添加成功",
      description: `成功添加测试耗材: ${newSupplyName}`,
      color: "success",
      timeout: 3000,
      shouldShowTimeoutProgress: true,
    });
    
    // 清空表单
    setNewSupplyName("");
    setNewSupplyCategory("");
    setNewSupplyUnit("");
    setNewSupplyStock("");
    setNewSupplySafety("");
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">数据同步调试</h1>

      {/* 新增耗材测试 */}
      <Card className="shadow-lg">
        <CardBody>
          <h2 className="text-lg font-semibold mb-4">新增耗材测试</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="耗材名称"
              value={newSupplyName}
              onValueChange={setNewSupplyName}
            />
            <Select
              placeholder="选择类别"
              selectedKeys={newSupplyCategory ? new Set([newSupplyCategory]) : new Set()}
              onSelectionChange={(keys) => {
                const category = Array.from(keys)[0] as string;
                setNewSupplyCategory(category);
              }}
            >
              <SelectItem key="探针">探针</SelectItem>
              <SelectItem key="清洁剂">清洁剂</SelectItem>
              <SelectItem key="继电器">继电器</SelectItem>
              <SelectItem key="连接器">连接器</SelectItem>
              <SelectItem key="其他配件">其他配件</SelectItem>
            </Select>
            <Input
              placeholder="单位"
              value={newSupplyUnit}
              onValueChange={setNewSupplyUnit}
            />
            <Input
              type="number"
              placeholder="当前库存"
              value={newSupplyStock}
              onValueChange={setNewSupplyStock}
            />
            <Input
              type="number"
              placeholder="安全库存"
              value={newSupplySafety}
              onValueChange={setNewSupplySafety}
            />
            <Button
              color="primary"
              onClick={handleAddTestSupply}
              className="md:col-span-2"
            >
              添加测试耗材
            </Button>
          </div>

          {lastAddedSupply && (
            <div className="mt-4 p-4 bg-success-50 border border-success-200 rounded-lg">
              <h3 className="font-semibold text-success-800 mb-2">最后添加的耗材：</h3>
              <div className="text-sm text-success-700">
                <p>ID: {lastAddedSupply.id}</p>
                <p>名称: {lastAddedSupply.name}</p>
                <p>类别: {lastAddedSupply.category}</p>
                <p>单位: {lastAddedSupply.unit}</p>
                <p>当前库存: {lastAddedSupply.current_stock}</p>
                <p>安全库存: {lastAddedSupply.safety_stock}</p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* 当前耗材列表 */}
      <Card className="shadow-lg">
        <CardBody>
          <h2 className="text-lg font-semibold mb-4">当前耗材列表 ({supplies.length})</h2>
          <Table aria-label="耗材列表">
            <TableHeader>
              <TableColumn>ID</TableColumn>
              <TableColumn>名称</TableColumn>
              <TableColumn>类别</TableColumn>
              <TableColumn>单位</TableColumn>
              <TableColumn>当前库存</TableColumn>
              <TableColumn>安全库存</TableColumn>
              <TableColumn>状态</TableColumn>
            </TableHeader>
            <TableBody>
              {supplies.map((supply) => (
                <TableRow key={supply.id}>
                  <TableCell>{supply.id}</TableCell>
                  <TableCell>{supply.name}</TableCell>
                  <TableCell>
                    <Chip color="primary" variant="flat" size="sm">
                      {supply.category}
                    </Chip>
                  </TableCell>
                  <TableCell>{supply.unit}</TableCell>
                  <TableCell>
                    <Badge
                      color={supply.current_stock <= supply.safety_stock ? "danger" : "success"}
                      variant="flat"
                    >
                      {supply.current_stock}
                    </Badge>
                  </TableCell>
                  <TableCell>{supply.safety_stock}</TableCell>
                  <TableCell>
                    <Chip
                      color={supply.current_stock <= supply.safety_stock ? "danger" : "success"}
                      variant="flat"
                      size="sm"
                    >
                      {supply.current_stock <= supply.safety_stock ? "库存不足" : "库存充足"}
                    </Chip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* 数据统计 */}
      <Card className="shadow-lg">
        <CardBody>
          <h2 className="text-lg font-semibold mb-4">数据统计</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{supplies.length}</div>
              <div className="text-sm text-gray-600">总耗材数</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {supplies.filter(s => s.current_stock > s.safety_stock).length}
              </div>
              <div className="text-sm text-gray-600">库存充足</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {supplies.filter(s => s.current_stock <= s.safety_stock).length}
              </div>
              <div className="text-sm text-gray-600">库存不足</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {Array.from(new Set(supplies.map(s => s.category))).length}
              </div>
              <div className="text-sm text-gray-600">类别数量</div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default DebugSyncPage; 