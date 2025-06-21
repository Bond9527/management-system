import { FC, useState, Fragment } from "react";
import {
  Card,
  CardBody,
  Input,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Select,
  SelectItem,
  Chip,
  Tooltip,
  Badge,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { SearchIcon, DownloadIcon, EyeIcon, WarningIcon, InfoIcon } from "@/components/icons";
import { supplyCategories } from "@/config/supplies";
import { useSupplies, SupplyItem } from "@/hooks/useSupplies";
import { useNavigate } from "react-router-dom";
import { validateDataConsistency, generateInventorySummary, fixDataInconsistencies } from "@/utils/dataConsistencyTest";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getCurrentDateForFilename } from "@/utils/dateUtils";

// 根据类别返回对应的单位
const getUnitByCategory = (category: string): string => {
  const unitMap: Record<string, string> = {
    "探针": "支",
    "清洁剂": "瓶",
    "继电器": "个",
    "连接器": "个",
    "轴承": "个",
    "手动工具": "套",
    "安全防护用品": "套",
    "包装材料": "包",
    "办公用品": "个",
    "其他": "个"
  };
  return unitMap[category] || "个";
};

// 格式化价格显示
const formatPrice = (price: number): string => {
  return `¥${price.toFixed(2)}`;
};

// 计算总价值
const calculateTotalValue = (supplies: SupplyItem[]): number => {
  return supplies.reduce((total, supply) => {
    return total + (supply.current_stock * parseFloat(supply.unit_price));
  }, 0);
};

const COLORS = [
  "#3B82F6", // blue-500
  "#10B981", // emerald-500
  "#F59E0B", // amber-500
  "#EF4444", // red-500
  "#8B5CF6", // violet-500
  "#EC4899", // pink-500
  "#14B8A6", // teal-500
  "#F97316", // orange-500
];

const SuppliesInventoryOverviewPage: FC = () => {
  const navigate = useNavigate();
  const { supplies, records, updateSupply } = useSupplies();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [minQuantity, setMinQuantity] = useState<string>("");
  const [maxQuantity, setMaxQuantity] = useState<string>("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [showConsistencyModal, setShowConsistencyModal] = useState(false);
  const [consistencyIssues, setConsistencyIssues] = useState<string[]>([]);
  const [isConsistencyValid, setIsConsistencyValid] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const filteredData = supplies.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesQuantity = (!minQuantity || item.current_stock >= Number(minQuantity)) &&
                          (!maxQuantity || item.current_stock <= Number(maxQuantity));
    return matchesSearch && matchesCategory && matchesQuantity;
  });

  const paginatedData = filteredData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const categories = Array.from(new Set(supplies.map((item) => item.category)));

  // 准备饼图数据 - 按类别汇总
  const pieChartData = categories.map(category => {
    const categorySupplies = supplies.filter(item => item.category === category);
    const totalQuantity = categorySupplies.reduce((sum, item) => sum + item.current_stock, 0);
    return {
      name: category,
      value: totalQuantity
    };
  });

  // 准备柱状图数据
  const barChartData = supplies.map((item) => ({
    name: item.name,
    quantity: item.current_stock,
    safetyStock: item.safety_stock,
  }));

  const handleExportExcel = () => {
    // TODO: 实现导出Excel功能
    console.log("Exporting to Excel...");
  };

  const handleExportCSV = () => {
    // 准备CSV数据
    const headers = ["耗材名称", "分类", "单位", "单价", "当前库存", "总价值", "安全库存", "库存状态"];
    const csvData = filteredData.map(item => [
      item.name,
      item.category,
      item.unit,
      formatPrice(parseFloat(item.unit_price)),
      item.current_stock,
      formatPrice(item.current_stock * parseFloat(item.unit_price)),
      item.safety_stock,
      item.current_stock <= item.safety_stock ? "库存不足" : "库存充足"
    ]);

    // 转换为CSV格式
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");

    // 创建Blob对象
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // 创建下载链接并触发下载
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `库存总览_${getCurrentDateForFilename()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleViewDetails = (id: number) => {
    navigate(`/supplies/details/${id}`);
  };

  const handleCheckConsistency = () => {
    setIsChecking(true);
    const result = validateDataConsistency(supplies, records);
    setConsistencyIssues(result.issues);
    setIsConsistencyValid(result.isValid);
    setShowConsistencyModal(true);
    setIsChecking(false);
  };

  const handleFixInconsistencies = async () => {
    const { fixedSupplies, issues } = fixDataInconsistencies(supplies, records);
    
    // 批量更新耗材库存
    for (const updatedSupply of fixedSupplies) {
      const originalSupply = supplies.find(s => s.id === updatedSupply.id);
      if (originalSupply && originalSupply.current_stock !== updatedSupply.current_stock) {
        await updateSupply(updatedSupply);
      }
    }
    
    setConsistencyIssues(issues);
    setIsConsistencyValid(true);
  };

  const summary = generateInventorySummary(supplies, records);

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">库存总览</h1>
        <div className="flex items-center gap-2">
          <Button
            color="warning"
            variant="flat"
            startContent={<WarningIcon />}
            onClick={handleCheckConsistency}
            isLoading={isChecking}
          >
            数据一致性检查
          </Button>
        </div>
      </div>

      {/* 统计摘要 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="shadow-lg">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-primary">{summary.totalSupplies}</div>
            <div className="text-sm text-gray-600">总耗材数</div>
          </CardBody>
        </Card>
        <Card className="shadow-lg">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-success">{summary.totalRecords}</div>
            <div className="text-sm text-gray-600">变动记录数</div>
          </CardBody>
        </Card>
        <Card className="shadow-lg">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-danger">{summary.lowStockItems}</div>
            <div className="text-sm text-gray-600">库存不足</div>
          </CardBody>
        </Card>
        <Card className="shadow-lg">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-warning">{summary.recentActivity}</div>
            <div className="text-sm text-gray-600">本周变动</div>
          </CardBody>
        </Card>
        <Card className="shadow-lg">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-blue-600">{formatPrice(calculateTotalValue(supplies))}</div>
            <div className="text-sm text-gray-600">库存总价值</div>
          </CardBody>
        </Card>
      </div>

      {/* 搜索与筛选栏 */}
      <Card className="shadow-lg">
        <CardBody>
          <div className="flex flex-wrap gap-4 items-center">
            <Input
              isClearable
              className="w-64"
              placeholder="搜索耗材名称..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              startContent={<SearchIcon className="text-default-400" />}
            />
            <Select
              selectedKeys={new Set([selectedCategory])}
              onSelectionChange={(keys) => setSelectedCategory(Array.from(keys)[0] as string)}
              className="w-1/2"
            >
              <SelectItem key="all" textValue="全部">全部</SelectItem>
              <Fragment>
                {categories.map(category => (
                  <SelectItem key={category} textValue={category}>{category}</SelectItem>
                ))}
              </Fragment>
            </Select>
            <Input
              type="number"
              placeholder="最小数量"
              value={minQuantity}
              onValueChange={setMinQuantity}
              className="w-32"
            />
            <Input
              type="number"
              placeholder="最大数量"
              value={maxQuantity}
              onValueChange={setMaxQuantity}
              className="w-32"
            />
            <Dropdown>
              <DropdownTrigger>
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<DownloadIcon />}
                >
                  导出
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="导出选项">
                <DropdownItem
                  key="excel"
                  description="导出为Excel格式"
                  startContent={<DownloadIcon />}
                  onClick={handleExportExcel}
                >
                  导出Excel
                </DropdownItem>
                <DropdownItem
                  key="csv"
                  description="导出为CSV格式"
                  startContent={<DownloadIcon />}
                  onClick={handleExportCSV}
                >
                  导出CSV
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </CardBody>
      </Card>

      {/* 库存列表表格 */}
      <Card className="shadow-lg">
        <CardBody>
          <Table aria-label="库存列表">
            <TableHeader>
              <TableColumn>耗材名称</TableColumn>
              <TableColumn>分类</TableColumn>
              <TableColumn>单位</TableColumn>
              <TableColumn>单价</TableColumn>
              <TableColumn>当前库存</TableColumn>
              <TableColumn>总价值</TableColumn>
              <TableColumn>安全库存</TableColumn>
              <TableColumn>库存状态</TableColumn>
              <TableColumn>操作</TableColumn>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Button
                      variant="light"
                      className="p-0"
                      onClick={() => handleViewDetails(item.id)}
                    >
                      {item.name}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Chip color="primary" variant="flat">
                      {item.category}
                    </Chip>
                  </TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>
                    <span className="font-medium text-green-600">
                      {formatPrice(parseFloat(item.unit_price))}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      color={item.current_stock <= item.safety_stock ? "danger" : "success"}
                      variant="flat"
                    >
                      {item.current_stock}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-blue-600">
                      {formatPrice(item.current_stock * parseFloat(item.unit_price))}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Chip color="default" variant="flat">
                      {item.safety_stock}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={item.current_stock <= item.safety_stock ? "danger" : "success"}
                      variant="flat"
                    >
                      {item.current_stock <= item.safety_stock ? "库存不足" : "库存充足"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Tooltip content="查看记录">
                        <Button
                          isIconOnly
                          variant="light"
                          size="sm"
                          onClick={() => handleViewDetails(item.id)}
                        >
                          <EyeIcon className="text-default-500" />
                        </Button>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-center mt-4">
            <Pagination
              total={Math.ceil(filteredData.length / rowsPerPage)}
              page={page}
              onChange={setPage}
              color="primary"
            />
          </div>
        </CardBody>
      </Card>

      {/* 统计区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardBody>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-700">分类汇总</h3>
              <Chip color="primary" variant="flat">
                库存分布
              </Chip>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card className="shadow-lg">
          <CardBody>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-700">库存预警</h3>
              <Chip color="danger" variant="flat">
                库存不足
              </Chip>
            </div>
            <div className="space-y-3">
              {supplies
                .filter((item) => item.current_stock <= item.safety_stock)
                .map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-danger-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">{item.name}</span>
                      <Chip size="sm" color="primary" variant="flat">
                        {item.category}
                      </Chip>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color="danger" variant="flat">
                        {item.current_stock} {item.unit}
                      </Badge>
                      <Chip color="danger" variant="flat" size="sm">
                        安全库存: {item.safety_stock}
                      </Chip>
                    </div>
                  </div>
                ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 库存柱状图 */}
      <Card className="shadow-lg">
        <CardBody>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-700">库存数量一览</h3>
            <div className="flex gap-2">
              <Chip color="primary" variant="flat" className="font-medium">
                当前库存
              </Chip>
              <Chip color="success" variant="flat" className="font-medium">
                安全库存
              </Chip>
            </div>
          </div>
          <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 100,
                }}
                barGap={0}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false}
                  stroke="#E5E7EB"
                />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  fontSize={12}
                />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar 
                  dataKey="quantity" 
                  name="当前库存" 
                  fill="#3B82F6" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="safetyStock" 
                  name="安全库存" 
                  fill="#10B981" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>

      {/* 数据一致性检查模态框 */}
      <Modal
        isOpen={showConsistencyModal}
        onClose={() => setShowConsistencyModal(false)}
        size="lg"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {isConsistencyValid ? (
                <Chip color="success" variant="flat" startContent={<InfoIcon />}>
                  数据一致性检查
                </Chip>
              ) : (
                <Chip color="warning" variant="flat" startContent={<WarningIcon />}>
                  发现数据不一致
                </Chip>
              )}
            </div>
          </ModalHeader>
          <ModalBody>
            {isConsistencyValid ? (
              <div className="text-center py-6">
                <InfoIcon className="text-success text-5xl mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-success mb-2">数据一致性良好</h3>
                <p className="text-gray-600 text-sm">库存总览和变动台账的数据完全一致，没有发现任何问题。</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
                  <h4 className="font-semibold text-warning-800 mb-2 text-sm">发现以下问题：</h4>
                  <ul className="space-y-1">
                    {consistencyIssues.map((issue, index) => (
                      <li key={index} className="text-xs text-warning-700 flex items-start gap-2">
                        <span className="text-warning-500 mt-1">•</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-info-50 border border-info-200 rounded-lg p-3">
                  <h4 className="font-semibold text-info-800 mb-2 text-sm">建议操作：</h4>
                  <p className="text-xs text-info-700">
                    点击"修复数据"按钮将根据变动记录自动修正库存数据，确保数据一致性。
                  </p>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="flat"
              onClick={() => setShowConsistencyModal(false)}
            >
              关闭
            </Button>
            {!isConsistencyValid && (
              <Button
                color="warning"
                onClick={handleFixInconsistencies}
              >
                修复数据
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default SuppliesInventoryOverviewPage; 