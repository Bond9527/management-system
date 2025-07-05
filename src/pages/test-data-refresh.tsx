import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Spinner, Chip } from '@heroui/react';
import { dynamicCalculationItemService } from '../services/materialManagement';
import type { DynamicCalculationItem } from '../services/materialManagement';

const TestDataRefreshPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<DynamicCalculationItem[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await dynamicCalculationItemService.getAll();
      setItems(data);
      setLastRefresh(new Date());
      console.log('API返回的数据:', data);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center w-full">
              <h1 className="text-2xl font-bold">前端数据刷新测试</h1>
              <div className="flex gap-2 items-center">
                {lastRefresh && (
                  <Chip size="sm" color="success" variant="flat">
                    最后刷新: {lastRefresh.toLocaleTimeString()}
                  </Chip>
                )}
                <Button 
                  color="primary" 
                  onPress={loadData} 
                  isLoading={loading}
                >
                  {loading ? '刷新中...' : '刷新数据'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">📊 数据统计</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{items.length}</div>
                    <div className="text-sm text-gray-600">总项目数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {items.filter(item => (item.apr_2025_stock || 0) > 0).length}
                    </div>
                    <div className="text-sm text-gray-600">有4月库存的项目</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {items.filter(item => (item.current_stock_0619 || 0) > 0).length}
                    </div>
                    <div className="text-sm text-gray-600">有现阶段库存的项目</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {items.filter(item => 
                        (item.jul_m01_demand || 0) + (item.jul_m02_demand || 0) + 
                        (item.jul_m03_demand || 0) + (item.jul_m04_demand || 0) > 0
                      ).length}
                    </div>
                    <div className="text-sm text-gray-600">有追料需求的项目</div>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <Card key={item.id} className="w-full">
                      <CardHeader>
                        <div className="flex justify-between items-center w-full">
                          <h4 className="font-semibold">{item.material_name}</h4>
                          <Chip size="sm" color="primary" variant="flat">
                            No. {item.no}
                          </Chip>
                        </div>
                      </CardHeader>
                      <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* 4-6月份数据 */}
                          <div className="space-y-2">
                            <h5 className="font-medium text-blue-600">月度数据</h5>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>4月库存:</span>
                                <span className="font-semibold text-purple-600">
                                  {(item.apr_2025_stock || 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>5月需求:</span>
                                <span className="font-semibold text-orange-600">
                                  {(item.may_2025_demand || 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>5月库存:</span>
                                <span className="font-semibold text-purple-600">
                                  {(item.may_2025_stock || 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>6月需求:</span>
                                <span className="font-semibold text-orange-600">
                                  {(item.jun_2025_demand || 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>6月库存:</span>
                                <span className="font-semibold text-purple-600">
                                  {(item.jun_2025_stock || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 现阶段库存 */}
                          <div className="space-y-2">
                            <h5 className="font-medium text-green-600">现阶段库存</h5>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>2025/6/19:</span>
                                <span className="font-semibold text-green-600">
                                  {(item.current_stock_0619 || 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>2024/6/25:</span>
                                <span className="font-semibold text-green-600">
                                  {(item.current_stock_0625 || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 追料需求 */}
                          <div className="space-y-2">
                            <h5 className="font-medium text-red-600">追料需求</h5>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>7月M01:</span>
                                <span className="font-semibold text-red-600">
                                  {(item.jul_m01_demand || 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>7月M02:</span>
                                <span className="font-semibold text-red-600">
                                  {(item.jul_m02_demand || 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>7月M03:</span>
                                <span className="font-semibold text-red-600">
                                  {(item.jul_m03_demand || 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>7月M04:</span>
                                <span className="font-semibold text-red-600">
                                  {(item.jul_m04_demand || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 其他数据 */}
                          <div className="space-y-2">
                            <h5 className="font-medium text-gray-600">基本信息</h5>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>单价:</span>
                                <span className="font-semibold text-blue-600">
                                  ¥{(item.unit_price || 0).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>7月需求:</span>
                                <span className="font-semibold text-green-600">
                                  {(item.monthly_demand || 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>7月库存:</span>
                                <span className="font-semibold text-purple-600">
                                  {(item.jul_2025_stock || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default TestDataRefreshPage; 