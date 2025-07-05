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
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
} from "@heroui/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
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
  const { supplies, records, isLoading, error } = useSupplies();
  const [summary, setSummary] = useState<any>(null);
  const [recentRecords, setRecentRecords] = useState<InventoryRecord[]>([]);
  const [lowStockItems, setLowStockItems] = useState<SupplyItem[]>([]);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  useEffect(() => {
    updateDashboardData();
  }, [supplies, records]);

  const updateDashboardData = () => {
    if (!Array.isArray(supplies) || !Array.isArray(records)) {
      return;
    }
    
    const summaryData = generateInventorySummary(supplies, records);
    setSummary(summaryData);

    // 获取最近10条记录
    const recent = records.slice(0, 10);
    setRecentRecords(recent);

    // 获取库存不足的耗材
    const lowStock = supplies.filter(item => item.current_stock <= item.safety_stock);
    setLowStockItems(lowStock);
  };

  // 调试信息
  const debugInfo = {
    suppliesCount: supplies.length,
    recordsCount: records.length,
    isLoading,
    error,
    hasRecentRecords: records.filter(r => {
      const recordDate = new Date(r.timestamp);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return recordDate >= weekAgo;
    }).length > 0,
    recordTypes: {
      in: records.filter(r => r.type === 'in').length,
      out: records.filter(r => r.type === 'out').length,
      adjust: records.filter(r => r.type === 'adjust').length,
    }
  };

  // 准备图表数据
  const getCategoryData = () => {
    if (!Array.isArray(supplies) || supplies.length === 0) {
      return [];
    }
    
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
    if (!Array.isArray(records)) {
      return [];
    }
    
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
    if (!Array.isArray(records)) {
      return [
        { name: '入库', value: 0, color: '#10B981' },
        { name: '出库', value: 0, color: '#EF4444' },
        { name: '调整', value: 0, color: '#F59E0B' },
      ];
    }
    
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

  const formatStockStatus = (item: SupplyItem) => {
    const percentage = item.safety_stock > 0 ? (item.current_stock / item.safety_stock) * 100 : 100;
    if (percentage <= 50) {
      return { color: "danger", label: "严重不足" };
    } else if (percentage <= 100) {
      return { color: "warning", label: "库存不足" };
    } else {
      return { color: "success", label: "库存充足" };
    }
  };

  const categoryData = getCategoryData();
  const trendData = getTrendData();
  const operationTypeData = getOperationTypeData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">仪表板</h1>
          <p className="text-gray-600 mt-1">库存管理系统概览</p>
        </div>
      </div>

      {/* 数据状态检查 */}
      {(debugInfo.recordsCount === 0 || !debugInfo.hasRecentRecords) && (
        <Card className="shadow-lg border-l-4 border-l-warning">
          <CardBody>
            <div className="flex items-start gap-3">
              <WarningIcon className="text-warning flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-warning mb-2">数据状态提示</h3>
                {debugInfo.recordsCount === 0 ? (
                  <p className="text-sm text-gray-600">
                    系统中暂无库存变动记录，趋势图表将显示为空。请先进行一些入库、出库或调整操作。
                  </p>
                ) : !debugInfo.hasRecentRecords ? (
                  <p className="text-sm text-gray-600">
                    最近7天没有库存变动记录，趋势图表可能显示为空。当前共有 {debugInfo.recordsCount} 条历史记录。
                  </p>
                ) : null}
                <div className="mt-3 flex gap-2">
                  <Button 
                    size="sm" 
                    color="primary" 
                    variant="flat"
                    onPress={() => setShowDebugInfo(!showDebugInfo)}
                  >
                    {showDebugInfo ? '隐藏' : '显示'}调试信息
                  </Button>
                  <Button 
                    size="sm" 
                    color="success" 
                    variant="flat" 
                    onPress={() => navigate('/supplies/add-record')}
                  >
                    添加库存记录
                  </Button>
                </div>
                {showDebugInfo && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs">
                    <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* 关键指标卡片 - 仅显示有数据时 */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-lg border-l-4 border-l-primary">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">总耗材数</p>
                  <p className="text-2xl font-bold text-primary">{summary.totalSupplies}</p>
                </div>
                <div className="text-primary text-3xl">📦</div>
              </div>
            </CardBody>
          </Card>

          <Card className="shadow-lg border-l-4 border-l-success">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">变动记录</p>
                  <p className="text-2xl font-bold text-success">{summary.totalRecords}</p>
                </div>
                <div className="text-success text-3xl">📋</div>
              </div>
            </CardBody>
          </Card>

          <Card className="shadow-lg border-l-4 border-l-warning">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">本周活动</p>
                  <p className="text-2xl font-bold text-warning">{summary.recentActivity}</p>
                </div>
                <div className="text-warning text-3xl">📈</div>
              </div>
            </CardBody>
          </Card>

          <Card className="shadow-lg border-l-4 border-l-danger">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">库存不足</p>
                  <p className="text-2xl font-bold text-danger">{summary.lowStockItems}</p>
                </div>
                <div className="text-danger text-3xl">⚠️</div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 分类分布饼图 */}
        <Card className="shadow-lg">
          <CardBody>
            <h3 className="text-lg font-semibold mb-4">分类分布</h3>
            <div className="h-80">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 20, right: 80, bottom: 80, left: 80 }}>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="45%"
                      labelLine={false}
                      label={false}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      minAngle={5}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      formatter={(value, name) => [
                        `${value} 项`,
                        name
                      ]}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={60}
                      wrapperStyle={{
                        paddingTop: '20px',
                        fontSize: '12px'
                      }}
                      formatter={(value, entry) => {
                        const item = categoryData.find(d => d.name === value);
                        const percent = item ? ((item.value / categoryData.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(0) : '0';
                        return `${value} ${percent}%`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-4">📊</div>
                    <div className="text-lg font-medium mb-2">暂无分类数据</div>
                    <div className="text-sm">请先添加一些耗材</div>
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* 操作类型统计 */}
        <Card className="shadow-lg">
          <CardBody>
            <h3 className="text-lg font-semibold mb-4">操作类型统计</h3>
            <div className="h-64">
              {operationTypeData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={operationTypeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip />
                    <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-4">📈</div>
                    <div className="text-lg font-medium mb-2">暂无操作数据</div>
                    <div className="text-sm">请先进行一些库存操作</div>
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 趋势图表 */}
      <Card className="shadow-lg">
        <CardBody>
          <h3 className="text-lg font-semibold mb-4">最近7天活动趋势</h3>
          <div className="h-64">
            {trendData.some(d => d.records > 0 || d.in > 0 || d.out > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="records" stroke="#3B82F6" strokeWidth={2} name="总记录数" />
                  <Line type="monotone" dataKey="in" stroke="#10B981" strokeWidth={2} name="入库" />
                  <Line type="monotone" dataKey="out" stroke="#EF4444" strokeWidth={2} name="出库" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-4">📊</div>
                  <div className="text-lg font-medium mb-2">暂无趋势数据</div>
                  <div className="text-sm">
                    {debugInfo.recordsCount === 0 ? 
                      '请先添加一些库存变动记录' : 
                      '最近7天没有库存变动'
                    }
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* 库存不足警告 */}
      {lowStockItems.length > 0 && (
        <Card className="shadow-lg border-l-4 border-l-danger">
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-danger">⚠️ 库存不足警告</h3>
              <Chip color="danger" size="sm">{lowStockItems.length} 项</Chip>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {lowStockItems.slice(0, 5).map((item) => {
                const status = formatStockStatus(item);
                const percentage = item.safety_stock > 0 ? (item.current_stock / item.safety_stock) * 100 : 100;
                
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{item.name}</span>
                        <Chip color={status.color as any} size="sm" variant="flat">
                          {status.label}
                        </Chip>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        当前库存: {item.current_stock} {item.unit} | 安全库存: {item.safety_stock} {item.unit}
                      </div>
                      <Progress 
                        value={percentage} 
                        color={status.color as any} 
                        size="sm" 
                        className="mt-2"
                      />
                    </div>
                    <Tooltip content="查看详情">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="primary"
                        onPress={() => navigate(`/supplies/details/${item.id}`)}
                      >
                        <EyeIcon />
                      </Button>
                    </Tooltip>
                  </div>
                );
              })}
              {lowStockItems.length > 5 && (
                <div className="text-center pt-2">
                  <Button 
                    size="sm" 
                    variant="flat" 
                    color="danger"
                    onPress={() => navigate('/supplies/inventory-overview')}
                  >
                    查看全部 ({lowStockItems.length - 5} 项更多)
                  </Button>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* 最近记录表格 */}
      {recentRecords.length > 0 && (
        <Card className="shadow-lg">
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">最近变动记录</h3>
              <Button 
                size="sm" 
                color="primary" 
                variant="flat"
                onPress={() => navigate('/supplies/records')}
              >
                查看全部
              </Button>
            </div>
            <Table aria-label="最近记录表格">
              <TableHeader>
                <TableColumn>耗材名称</TableColumn>
                <TableColumn>操作类型</TableColumn>
                <TableColumn>数量</TableColumn>
                <TableColumn>操作员</TableColumn>
                <TableColumn>时间</TableColumn>
              </TableHeader>
              <TableBody>
                {recentRecords.slice(0, 5).map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.supply_name || '未知耗材'}</TableCell>
                    <TableCell>
                      <Chip
                        color={
                          record.type === 'in' ? 'success' :
                          record.type === 'out' ? 'danger' : 'warning'
                        }
                        size="sm"
                        variant="flat"
                      >
                        {record.type === 'in' ? '入库' :
                         record.type === 'out' ? '出库' : '调整'}
                      </Chip>
                    </TableCell>
                    <TableCell>{record.quantity}</TableCell>
                    <TableCell>{record.operator}</TableCell>
                    <TableCell>
                      {new Date(record.timestamp).toLocaleDateString('zh-CN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
