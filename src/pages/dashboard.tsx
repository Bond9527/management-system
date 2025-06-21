import { FC, useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Badge,
  Progress,
  Divider,
  Avatar,
  User,
  Link,
} from "@heroui/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  SearchIcon,
  PlusIcon,
  MinusIcon,
  WarningIcon,
  InfoIcon,
  ChartIcon,
  ClockIcon,
  UserIcon,
  EditIcon,
  DownloadIcon,
  RefreshIcon,
  EyeIcon,
} from "@/components/icons";
import { useSupplies, SupplyItem, InventoryRecord } from "@/hooks/useSupplies";
import { generateInventorySummary } from "@/utils/dataConsistencyTest";
import { useNavigate } from "react-router-dom";
import { formatRelativeTime } from "@/utils/dateUtils";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

const DashboardPage: FC = () => {
  const navigate = useNavigate();
  const { supplies, records } = useSupplies();
  const [summary, setSummary] = useState<any>(null);
  const [recentRecords, setRecentRecords] = useState<InventoryRecord[]>([]);
  const [lowStockItems, setLowStockItems] = useState<SupplyItem[]>([]);

  useEffect(() => {
    updateDashboardData();
  }, [supplies, records]);

  const updateDashboardData = () => {
    const summaryData = generateInventorySummary(supplies, records);
    setSummary(summaryData);

    // 获取最近10条记录
    const recent = records.slice(0, 10);
    setRecentRecords(recent);

    // 获取库存不足的耗材
    const lowStock = supplies.filter(item => item.current_stock <= item.safety_stock);
    setLowStockItems(lowStock);
  };

  // 准备图表数据
  const getCategoryData = () => {
    const categories = Array.from(new Set(supplies.map(item => item.category)));
    return categories.map(category => {
      const categorySupplies = supplies.filter(item => item.category === category);
      const totalStock = categorySupplies.reduce((sum, item) => sum + item.current_stock, 0);
      return {
        name: category,
        value: totalStock,
        count: categorySupplies.length
      };
    });
  };

  const getTrendData = () => {
    // 生成最近7天的趋势数据
    const days = 7;
    const trendData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
      
      // 统计当天的记录数
      const dayRecords = records.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate.toDateString() === date.toDateString();
      });
      
      trendData.push({
        date: dateStr,
        records: dayRecords.length,
        in: dayRecords.filter(r => r.type === 'in').length,
        out: dayRecords.filter(r => r.type === 'out').length,
      });
    }
    
    return trendData;
  };

  const getOperationTypeData = () => {
    const operationTypes = [
      { name: '入库', value: records.filter(r => r.type === 'in').length, color: '#10B981' },
      { name: '出库', value: records.filter(r => r.type === 'out').length, color: '#EF4444' },
      { name: '调整', value: records.filter(r => r.type === 'adjust').length, color: '#F59E0B' },
    ];
    return operationTypes;
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-record':
        navigate('/supplies/add-record');
        break;
      case 'inventory-overview':
        navigate('/supplies/inventory-overview');
        break;
      case 'records':
        navigate('/supplies/records');
        break;
      case 'statistics':
        navigate('/supplies/statistics');
        break;
      case 'data-comparison':
        navigate('/supplies/data-comparison');
        break;
      default:
        break;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    return formatRelativeTime(timestamp);
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <PlusIcon className="text-success" />;
      case 'out':
        return <MinusIcon className="text-danger" />;
      case 'adjust':
        return <EditIcon className="text-warning" />;
      default:
        return <InfoIcon className="text-default" />;
    }
  };

  const getOperationColor = (type: string) => {
    switch (type) {
      case 'in':
        return 'success';
      case 'out':
        return 'danger';
      case 'adjust':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* 欢迎区域 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">欢迎回来！</h1>
            <p className="text-blue-100 text-lg">
              今天是 {new Date().toLocaleDateString('zh-CN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{summary.totalSupplies}</div>
            <div className="text-blue-100">总耗材数</div>
          </div>
        </div>
      </div>

      {/* 统计概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="shadow-lg">
          <CardBody className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <SearchIcon className="text-blue-600 text-xl" />
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">{summary.totalSupplies}</div>
            <div className="text-gray-600 mb-2">总耗材数</div>
            <Progress 
              value={summary.totalSupplies > 0 ? 100 : 0} 
              color="primary" 
              size="sm" 
              className="max-w-md"
            />
          </CardBody>
        </Card>

        <Card className="shadow-lg">
          <CardBody className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <ClockIcon className="text-green-600 text-xl" />
              </div>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">{summary.totalRecords}</div>
            <div className="text-gray-600 mb-2">变动记录</div>
            <Progress 
              value={summary.totalRecords > 0 ? 100 : 0} 
              color="success" 
              size="sm" 
              className="max-w-md"
            />
          </CardBody>
        </Card>

        <Card className="shadow-lg">
          <CardBody className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <WarningIcon className="text-red-600 text-xl" />
              </div>
            </div>
            <div className="text-3xl font-bold text-red-600 mb-2">{summary.lowStockItems}</div>
            <div className="text-gray-600 mb-2">库存不足</div>
            <Progress 
              value={summary.totalSupplies > 0 ? (summary.lowStockItems / summary.totalSupplies) * 100 : 0} 
              color="danger" 
              size="sm" 
              className="max-w-md"
            />
          </CardBody>
        </Card>

        <Card className="shadow-lg">
          <CardBody className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <ChartIcon className="text-orange-600 text-xl" />
              </div>
            </div>
            <div className="text-3xl font-bold text-orange-600 mb-2">{summary.recentActivity}</div>
            <div className="text-gray-600 mb-2">本周变动</div>
            <Progress 
              value={summary.recentActivity > 0 ? 100 : 0} 
              color="warning" 
              size="sm" 
              className="max-w-md"
            />
          </CardBody>
        </Card>

        <Card className="shadow-lg">
          <CardBody className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <ChartIcon className="text-purple-600 text-xl" />
              </div>
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              ¥{supplies.reduce((total, item) => total + (item.current_stock * parseFloat(item.unit_price)), 0).toFixed(2)}
            </div>
            <div className="text-gray-600 mb-2">库存总价值</div>
            <Progress 
              value={100} 
              color="secondary" 
              size="sm" 
              className="max-w-md"
            />
          </CardBody>
        </Card>
      </div>

      {/* 快速操作 */}
      <Card className="shadow-lg">
        <CardBody>
          <h2 className="text-xl font-bold mb-4">快速操作</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Button
              color="primary"
              variant="flat"
              startContent={<PlusIcon />}
              onClick={() => handleQuickAction('add-record')}
              className="h-16"
            >
              添加记录
            </Button>
            <Button
              color="secondary"
              variant="flat"
              startContent={<EyeIcon />}
              onClick={() => handleQuickAction('inventory-overview')}
              className="h-16"
            >
              库存总览
            </Button>
            <Button
              color="success"
              variant="flat"
              startContent={<ClockIcon />}
              onClick={() => handleQuickAction('records')}
              className="h-16"
            >
              变动记录
            </Button>
            <Button
              color="warning"
              variant="flat"
              startContent={<ChartIcon />}
              onClick={() => handleQuickAction('statistics')}
              className="h-16"
            >
              数据统计
            </Button>
            <Button
              color="danger"
              variant="flat"
              startContent={<InfoIcon />}
              onClick={() => handleQuickAction('data-comparison')}
              className="h-16"
            >
              数据对比
            </Button>
            <Button
              color="default"
              variant="flat"
              startContent={<RefreshIcon />}
              onClick={updateDashboardData}
              className="h-16"
            >
              刷新数据
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 分类分布饼图 */}
        <Card className="shadow-lg">
          <CardBody>
            <h3 className="text-lg font-semibold mb-4">分类分布</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getCategoryData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getCategoryData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* 操作类型统计 */}
        <Card className="shadow-lg">
          <CardBody>
            <h3 className="text-lg font-semibold mb-4">操作类型统计</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getOperationTypeData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 趋势图表 */}
      <Card className="shadow-lg">
        <CardBody>
          <h3 className="text-lg font-semibold mb-4">最近7天活动趋势</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getTrendData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="records" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="in" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="out" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>

      {/* 库存不足警告 */}
      {lowStockItems.length > 0 && (
        <Card className="shadow-lg border-l-4 border-red-500">
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                <WarningIcon />
                库存不足警告
              </h3>
              <Badge color="danger" variant="flat">
                {lowStockItems.length} 项
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockItems.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <div className="font-medium text-red-800">{item.name}</div>
                    <div className="text-sm text-red-600">
                      当前: {item.current_stock}{item.unit} / 安全: {item.safety_stock}{item.unit}
                    </div>
                  </div>
                  <Chip color="danger" variant="flat" size="sm">
                    {item.category}
                  </Chip>
                </div>
              ))}
            </div>
            {lowStockItems.length > 6 && (
              <div className="mt-4 text-center">
                <Button color="danger" variant="flat" size="sm">
                  查看全部 ({lowStockItems.length} 项)
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* 最近活动 */}
      <Card className="shadow-lg">
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">最近活动</h3>
            <Button
              color="primary"
              variant="flat"
              size="sm"
              onClick={() => handleQuickAction('records')}
            >
              查看全部
            </Button>
          </div>
          <div className="space-y-3">
            {recentRecords.length > 0 ? (
              recentRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-full">
                      {getOperationIcon(record.type)}
                    </div>
                    <div>
                      <div className="font-medium">{record.supply_name}</div>
                      <div className="text-sm text-gray-600">
                        {record.operator} • {record.department}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Chip color={getOperationColor(record.type)} variant="flat" size="sm">
                      {record.type === 'in' ? '+' : record.type === 'out' ? '-' : '='}{record.quantity}{record.supply_unit}
                    </Chip>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatTimeAgo(record.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ClockIcon className="text-4xl mx-auto mb-2" />
                <p>暂无活动记录</p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default DashboardPage;
