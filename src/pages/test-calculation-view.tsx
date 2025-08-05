import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button, Spinner } from '@heroui/react';
import { applicationFormService, dynamicCalculationItemService } from '../services/materialManagement';
import { ApplicationForm, DynamicCalculationItem } from '../services/materialManagement';

const TestCalculationView: React.FC = () => {
  const [forms, setForms] = useState<ApplicationForm[]>([]);
  const [selectedForm, setSelectedForm] = useState<ApplicationForm | null>(null);
  const [calculationItems, setCalculationItems] = useState<DynamicCalculationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      const data = await applicationFormService.getAll();
      setForms(data);
    } catch (error) {
      console.error('加载申请表失败:', error);
    }
  };

  const loadCalculationItems = async (formId: number) => {
    setLoading(true);
    try {
      const data = await dynamicCalculationItemService.getByForm(formId);
      setCalculationItems(data);
      console.log('计算表数据:', data);
    } catch (error) {
      console.error('加载计算表数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectForm = (form: ApplicationForm) => {
    setSelectedForm(form);
    loadCalculationItems(form.id);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">需求计算表视图测试</h1>
      
      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold mb-4">选择申请表</h2>
          <div className="space-y-2">
            {forms.map((form) => (
              <div key={form.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{form.name}</div>
                  <div className="text-sm text-gray-600">
                    {form.department} - {form.period}
                  </div>
                  <div className="text-sm text-gray-500">
                    有计算表: {form.has_calculation_form ? '是' : '否'}
                  </div>
                </div>
                <Button
                  color="primary"
                  size="sm"
                  onPress={() => handleSelectForm(form)}
                >
                  查看计算表
                </Button>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {selectedForm && (
        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold mb-4">
              计算表数据 - {selectedForm.name}
            </h2>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <span className="text-sm text-gray-600">
                    共 {calculationItems.length} 个计算项目
                  </span>
                </div>
                
                <div className="space-y-2">
                  {calculationItems.map((item) => (
                    <div key={item.id} className="p-3 border rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">
                            {item.no}. {item.material_name}
                          </div>
                          <div className="text-sm text-gray-600">
                            使用站别: {item.usage_station}
                          </div>
                          <div className="text-sm text-gray-600">
                            每套用量: {item.usage_per_set} | 使用次数: {item.usage_count}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">
                            月需求: <span className="font-bold text-blue-600">{item.monthly_demand}</span>
                          </div>
                          <div className="text-sm">
                            净需求: <span className="font-bold text-green-600">{item.monthly_net_demand}</span>
                          </div>
                          <div className="text-sm">
                            实际订购: <span className="font-bold text-purple-600">{item.actual_order}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default TestCalculationView; 