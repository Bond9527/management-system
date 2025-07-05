import React from 'react';
import { Card, CardBody, CardHeader, Chip, Button, Select, SelectItem } from '@heroui/react';
import DynamicApplicationManager from '../components/DynamicApplicationManager';

const TestMonthlyFieldsPage: React.FC = () => {
  // 测试不同月份的表头生成
  const [selectedMonth, setSelectedMonth] = React.useState<number>(7);
  const [selectedYear, setSelectedYear] = React.useState<number>(2025);

  // 🔧 动态生成B453表头的函数（复制自pricing.tsx用于测试）
  const generateB453Headers = (targetYear: number, targetMonth: number) => {
    // 生成前两个月和当前月的月份信息
    const months = [];
    for (let i = -2; i <= 0; i++) {
      const currentMonth = targetMonth + i;
      let actualMonth = currentMonth;
      let actualYear = targetYear;
      
      if (currentMonth <= 0) {
        actualMonth = 12 + currentMonth;
        actualYear = targetYear - 1;
      }
      
      months.push({
        year: actualYear,
        month: actualMonth
      });
    }
    
    // 动态生成主标题
    const mainTitle = `TE課B453 SMT ATE ${targetYear}年${targetMonth}月份耗材管控表`;
    
    // 动态生成主表头
    const mainHeaders = [
      '序號', '物料描述', '單位', '採購員', '', '安全庫存', '', '最小採購量(MOQ)', 'L/T Wks',
      `${targetYear}年${months[1].month}月份明細`, '', // 第二个月
      `${targetYear}年${months[2].month}月份明細`, '', // 第三个月（目标月）
      '现阶段库存', '', 
      '追料需求', '', '', '', 
      '总金额(RMB)', '備註'
    ];
    
    // 动态生成子表头
    const subHeaders = [
      '', '', '', '', '單價(RMB)', '最低', '最高', '', '', 
      `${targetYear}/${months[0].month}/2庫存`, // 第一个月库存
      `${targetYear}年${months[1].month}月份需求`, // 第二个月需求
      `${targetYear}/${months[1].month}/2庫存`, // 第二个月库存
      `${targetYear}年${months[2].month}月份需求`, // 第三个月需求
      `${targetYear}/${months[2].month}/2庫存`, // 第三个月库存
      `${targetYear}/${months[2].month}/19數量`, // 现阶段库存
      `${targetYear-1}/${months[2].month}/25數量`, // 去年同期库存
      `${targetMonth}月M01`, `${targetMonth}月M02`, `${targetMonth}月M03`, `${targetMonth}月M04`, // 追料需求
      '', ''
    ];
    
    return { mainTitle, mainHeaders, subHeaders, months };
  };

  // 根据选择的月份生成表头
  const { mainTitle, mainHeaders, subHeaders, months } = generateB453Headers(selectedYear, selectedMonth);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <Card className="mb-6">
          <CardHeader>
            <h1 className="text-2xl font-bold">📅 月份自适应测试</h1>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">🎯 新增功能概览</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <Chip color="primary" variant="flat">
                    4、5、6月份库存和需求明细
                  </Chip>
                  <Chip color="secondary" variant="flat">
                    现阶段库存数据 (6/19, 6/25)
                  </Chip>
                  <Chip color="success" variant="flat">
                    追料需求 (7月M01-M04)
                  </Chip>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">✅ 数据库更新完成</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">月度库存和需求字段:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>apr_2025_stock - 2025年4月库存</li>
                      <li>may_2025_demand - 2025年5月需求</li>
                      <li>may_2025_stock - 2025年5月库存</li>
                      <li>jun_2025_demand - 2025年6月需求</li>
                      <li>jun_2025_stock - 2025年6月库存</li>
                      <li>jul_2025_stock - 2025年7月库存</li>
                      <li>aug_2025_demand - 2025年8月需求</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">现阶段库存和追料需求:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>current_stock_0619 - 2025/6/19库存</li>
                      <li>current_stock_0625 - 2024/6/25库存</li>
                      <li>jul_m01_demand - 7月M01需求</li>
                      <li>jul_m02_demand - 7月M02需求</li>
                      <li>jul_m03_demand - 7月M03需求</li>
                      <li>jul_m04_demand - 7月M04需求</li>
                      <li>total_amount - 总金额</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-800 mb-2">🧪 测试步骤</h3>
                <ol className="list-decimal list-inside space-y-2 text-orange-700">
                  <li><strong>管控表视图测试:</strong> 查看管控表视图是否显示了新的月度数据列</li>
                  <li><strong>编辑表单测试:</strong> 创建或编辑项目时，查看是否有新的月度字段输入框</li>
                  <li><strong>数据保存测试:</strong> 输入月度数据并保存，确认数据正确保存</li>
                  <li><strong>导出功能测试:</strong> 导出管控表Excel，检查是否包含所有月度数据</li>
                  <li><strong>数据展示测试:</strong> 在表格中查看各月份数据是否正确显示和格式化</li>
                </ol>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">📋 B453标准格式对应</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto border-collapse border border-purple-200">
                    <thead>
                      <tr className="bg-purple-100">
                        <th className="border border-purple-200 px-3 py-2 text-left">Excel列</th>
                        <th className="border border-purple-200 px-3 py-2 text-left">数据库字段</th>
                        <th className="border border-purple-200 px-3 py-2 text-left">说明</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-purple-200 px-3 py-2">2025/4/1库存</td>
                        <td className="border border-purple-200 px-3 py-2">apr_2025_stock</td>
                        <td className="border border-purple-200 px-3 py-2">4月期初库存</td>
                      </tr>
                      <tr>
                        <td className="border border-purple-200 px-3 py-2">5月份需求</td>
                        <td className="border border-purple-200 px-3 py-2">may_2025_demand</td>
                        <td className="border border-purple-200 px-3 py-2">5月份需求量</td>
                      </tr>
                      <tr>
                        <td className="border border-purple-200 px-3 py-2">2025/5/2库存</td>
                        <td className="border border-purple-200 px-3 py-2">may_2025_stock</td>
                        <td className="border border-purple-200 px-3 py-2">5月期末库存</td>
                      </tr>
                      <tr>
                        <td className="border border-purple-200 px-3 py-2">6月份需求</td>
                        <td className="border border-purple-200 px-3 py-2">jun_2025_demand</td>
                        <td className="border border-purple-200 px-3 py-2">6月份需求量</td>
                      </tr>
                      <tr>
                        <td className="border border-purple-200 px-3 py-2">2025/6/2库存</td>
                        <td className="border border-purple-200 px-3 py-2">jun_2025_stock</td>
                        <td className="border border-purple-200 px-3 py-2">6月期末库存</td>
                      </tr>
                      <tr>
                        <td className="border border-purple-200 px-3 py-2">2025/6/19数量</td>
                        <td className="border border-purple-200 px-3 py-2">current_stock_0619</td>
                        <td className="border border-purple-200 px-3 py-2">现阶段库存</td>
                      </tr>
                      <tr>
                        <td className="border border-purple-200 px-3 py-2">7月M01-M04</td>
                        <td className="border border-purple-200 px-3 py-2">jul_m01_demand 等</td>
                        <td className="border border-purple-200 px-3 py-2">追料需求明细</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">💡 使用提示</h3>
                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                  <li>管控表视图现在显示完整的B453标准格式，包含所有月份数据</li>
                  <li>编辑项目时可以输入每个月的具体库存和需求数据</li>
                  <li>导出的Excel文件完全符合B453标准，可直接用于报告</li>
                  <li>表格采用不同颜色区分不同类型的数据（库存、需求、现阶段、追料）</li>
                  <li>总金额自动计算（单价 × 月需求量）</li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">🔧 月份自适应功能测试</h2>
          </CardHeader>
          <CardBody className="space-y-6">
            {/* 月份选择器 */}
            <div className="flex gap-4">
              <Select
                label="选择年份"
                selectedKeys={[selectedYear.toString()]}
                                 onSelectionChange={(keys: any) => {
                   const key = Array.from(keys)[0] as string;
                   setSelectedYear(parseInt(key));
                 }}
                className="w-32"
              >
                <SelectItem key="2024" textValue="2024">2024年</SelectItem>
                <SelectItem key="2025" textValue="2025">2025年</SelectItem>
                <SelectItem key="2026" textValue="2026">2026年</SelectItem>
              </Select>

              <Select
                label="选择目标月份"
                selectedKeys={[selectedMonth.toString()]}
                                 onSelectionChange={(keys: any) => {
                   const key = Array.from(keys)[0] as string;
                   setSelectedMonth(parseInt(key));
                 }}
                className="w-32"
              >
                {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                  <SelectItem key={month.toString()} textValue={`${month}月`}>
                    {month}月
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* 动态生成的表头预览 */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-3">📋 动态生成的B453表头预览</h3>
              
              <div className="space-y-3">
                {/* 主标题 */}
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-semibold text-blue-600">主标题：</h4>
                  <p className="text-sm font-mono">{mainTitle}</p>
                </div>

                {/* 月份逻辑说明 */}
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-semibold text-purple-600">月份逻辑：</h4>
                  <p className="text-sm">
                    目标月份：{selectedYear}年{selectedMonth}月<br/>
                    显示月份：{months.map(m => `${m.year}年${m.month}月`).join(', ')}
                  </p>
                </div>

                {/* 主表头 */}
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-semibold text-orange-600">主表头（关键部分）：</h4>
                  <div className="text-sm font-mono grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {mainHeaders.filter(h => h.includes('月份明細')).map((header, index) => (
                      <div key={index} className="bg-orange-50 p-1 rounded">
                        {header}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 子表头 */}
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-semibold text-indigo-600">子表头（关键部分）：</h4>
                  <div className="text-sm font-mono grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {subHeaders.filter(h => h.includes('庫存') || h.includes('需求') || h.includes('M0')).map((header, index) => (
                      <div key={index} className="bg-indigo-50 p-1 rounded">
                        {header}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 测试用例 */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-3">🧪 测试用例</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  color="primary"
                  variant="ghost"
                  onClick={() => {setSelectedYear(2025); setSelectedMonth(7);}}
                >
                  7月份测试
                </Button>
                <Button 
                  color="secondary"
                  variant="ghost"
                  onClick={() => {setSelectedYear(2025); setSelectedMonth(8);}}
                >
                  8月份测试
                </Button>
                <Button 
                  color="success"
                  variant="ghost"
                  onClick={() => {setSelectedYear(2025); setSelectedMonth(1);}}
                >
                  跨年测试（1月）
                </Button>
              </div>
            </div>

            {/* 预期结果说明 */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">📝 预期结果说明</h3>
              <ul className="list-disc list-inside space-y-1 text-yellow-700 text-sm">
                <li><strong>7月份申请表：</strong> 显示5月、6月、7月的明细（5-6-7月）</li>
                <li><strong>8月份申请表：</strong> 显示6月、7月、8月的明细（6-7-8月）</li>
                <li><strong>1月份申请表：</strong> 显示11月、12月（上一年）、1月的明细（11-12-1月）</li>
                <li><strong>追料需求：</strong> 始终显示目标月份的M01-M04（如：7月M01、8月M01等）</li>
              </ul>
            </div>

            {/* 原有的B453标准格式对应表 */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">📋 B453标准格式对应</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse border border-purple-200">
                  <thead>
                    <tr className="bg-purple-100">
                      <th className="border border-purple-200 px-3 py-2 text-left">Excel列</th>
                      <th className="border border-purple-200 px-3 py-2 text-left">数据库字段</th>
                      <th className="border border-purple-200 px-3 py-2 text-left">说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-purple-200 px-3 py-2">动态：{selectedYear}/{months[0].month}/2库存</td>
                      <td className="border border-purple-200 px-3 py-2">apr_2025_stock</td>
                      <td className="border border-purple-200 px-3 py-2">前两个月的期初库存</td>
                    </tr>
                    <tr>
                      <td className="border border-purple-200 px-3 py-2">动态：{selectedYear}年{months[1].month}月份需求</td>
                      <td className="border border-purple-200 px-3 py-2">may_2025_demand</td>
                      <td className="border border-purple-200 px-3 py-2">前一个月的需求量</td>
                    </tr>
                    <tr>
                      <td className="border border-purple-200 px-3 py-2">动态：{selectedYear}/{months[1].month}/2库存</td>
                      <td className="border border-purple-200 px-3 py-2">may_2025_stock</td>
                      <td className="border border-purple-200 px-3 py-2">前一个月的期末库存</td>
                    </tr>
                    <tr>
                      <td className="border border-purple-200 px-3 py-2">动态：{selectedYear}年{months[2].month}月份需求</td>
                      <td className="border border-purple-200 px-3 py-2">jun_2025_demand</td>
                      <td className="border border-purple-200 px-3 py-2">目标月份的需求量</td>
                    </tr>
                    <tr>
                      <td className="border border-purple-200 px-3 py-2">动态：{selectedMonth}月M01-M04</td>
                      <td className="border border-purple-200 px-3 py-2">jul_m01_demand等</td>
                      <td className="border border-purple-200 px-3 py-2">目标月份的追料需求</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 使用提示 */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">💡 使用提示</h3>
              <ul className="list-disc list-inside space-y-1 text-green-700">
                <li>✅ 月份明细现在完全根据申请表的周期字段自动调整</li>
                <li>✅ 7月申请表显示5-6-7月，8月申请表显示6-7-8月</li>
                <li>✅ 支持跨年情况（如1月申请表会显示前一年11-12月）</li>
                <li>✅ 追料需求始终显示目标月份的M01-M04</li>
                <li>✅ 导出的Excel文件表头完全动态生成</li>
              </ul>
            </div>
          </CardBody>
        </Card>

        {/* 动态申请表管理器组件 */}
        <DynamicApplicationManager />
      </div>
    </div>
  );
};

export default TestMonthlyFieldsPage; 