import React from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Select,
  SelectItem,
} from "@heroui/react";

import DynamicApplicationManager from "../components/DynamicApplicationManager";
import {
  generateCurrentMonthKey,
  generateChineseMonthKey,
  generateISOMonthKey,
  generateOffsetMonthKey,
  generateMultipleMonthKeys,
  getCurrentYearMonth,
} from "../utils/dateUtils";

const TestMonthlyFieldsPage: React.FC = () => {
  // 测试不同月份的表头生成
  const [selectedMonth, setSelectedMonth] = React.useState<number>(7);
  const [selectedYear, setSelectedYear] = React.useState<number>(2025);

  // 获取当前年月
  const currentYearMonth = getCurrentYearMonth();

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
        month: actualMonth,
      });
    }

    // 动态生成主标题
    const mainTitle = `TE課B453 SMT ATE ${targetYear}年${targetMonth}月份耗材管控表`;

    // 动态生成主表头
    const mainHeaders = [
      "序號",
      "物料描述",
      "單位",
      "採購員",
      "",
      "安全庫存",
      "",
      "最小採購量(MOQ)",
      "L/T Wks",
      `${targetYear}年${months[1].month}月份明細`,
      "", // 第二个月
      `${targetYear}年${months[2].month}月份明細`,
      "", // 第三个月（目标月）
      "现阶段库存",
      "",
      "追料需求",
      "",
      "",
      "",
      "总金额(RMB)",
      "備註",
    ];

    // 动态生成子表头
    const subHeaders = [
      "",
      "",
      "",
      "",
      "單價(RMB)",
      "最低",
      "最高",
      "",
      "",
      `${targetYear}/${months[0].month}/2庫存`, // 第一个月库存
      `${targetYear}年${months[1].month}月份需求`, // 第二个月需求
      `${targetYear}/${months[1].month}/2庫存`, // 第二个月库存
      `${targetYear}年${months[2].month}月份需求`, // 第三个月需求
      `${targetYear}/${months[2].month}/2庫存`, // 第三个月库存
      `${targetYear}/${months[2].month}/19`, // 现阶段库存
      `${targetYear - 1}/${months[2].month}/25`, // 去年同期库存
      `${targetMonth}月M01`,
      `${targetMonth}月M02`,
      `${targetMonth}月M03`,
      `${targetMonth}月M04`, // 追料需求
      "",
      "",
    ];

    return { mainTitle, mainHeaders, subHeaders, months };
  };

  // 根据选择的月份生成表头
  const { mainTitle, mainHeaders, subHeaders, months } = generateB453Headers(
    selectedYear,
    selectedMonth,
  );

  // 测试新的日期工具函数
  const testDateUtils = () => {
    const results = {
      currentYearMonth,
      currentMonthKey: generateCurrentMonthKey(),
      chineseMonthKey: generateChineseMonthKey(),
      isoMonthKey: generateISOMonthKey(),
      offsetMonthKey: generateOffsetMonthKey(-1),
      multipleMonthKeys: generateMultipleMonthKeys(3),
      customFormat: generateCurrentMonthKey("${year}年${month}月22日", {
        monthPadding: false,
      }),
      customOffset: generateOffsetMonthKey(2, "${year}/${month}/15", {
        monthPadding: true,
      }),
      chineseOffset: generateChineseMonthKey("${year}年${month}月", {
        customYear: selectedYear,
        customMonth: selectedMonth,
      }),
    };

    return results;
  };

  const dateUtilsResults = testDateUtils();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">🔧 月份自适应功能测试</h1>
        </CardHeader>
        <CardBody>
          <p className="text-gray-600 mb-4">
            测试动态月份 key 生成功能，支持多种格式和偏移量
          </p>
        </CardBody>
      </Card>

      {/* 新的日期工具函数测试 */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">📅 新的日期工具函数演示</h2>
        </CardHeader>
        <CardBody className="space-y-6">
          {/* 当前年月信息 */}
          <div>
            <h3 className="text-md font-semibold mb-2">当前年月信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <Chip color="primary">
                当前年份: {dateUtilsResults.currentYearMonth.year}
              </Chip>
              <Chip color="secondary">
                当前月份: {dateUtilsResults.currentYearMonth.month}
              </Chip>
            </div>
          </div>

          {/* 基础格式测试 */}
          <div>
            <h3 className="text-md font-semibold mb-2">基础格式测试</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Chip color="default">
                默认格式: {dateUtilsResults.currentMonthKey}
              </Chip>
              <Chip color="default">
                中文格式: {dateUtilsResults.chineseMonthKey}
              </Chip>
              <Chip color="default">
                ISO格式: {dateUtilsResults.isoMonthKey}
              </Chip>
              <Chip color="default">
                上月偏移: {dateUtilsResults.offsetMonthKey}
              </Chip>
            </div>
          </div>

          {/* 自定义格式测试 */}
          <div>
            <h3 className="text-md font-semibold mb-2">自定义格式测试</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Chip color="success">
                自定义格式: {dateUtilsResults.customFormat}
              </Chip>
              <Chip color="success">
                自定义偏移: {dateUtilsResults.customOffset}
              </Chip>
              <Chip color="success">
                中文偏移: {dateUtilsResults.chineseOffset}
              </Chip>
            </div>
          </div>

          {/* 多月份生成测试 */}
          <div>
            <h3 className="text-md font-semibold mb-2">多月份生成测试</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {dateUtilsResults.multipleMonthKeys.map((key, index) => (
                <Chip key={index} color="warning" size="sm">
                  {key}
                </Chip>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 月份选择器 */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">🔧 月份自适应功能测试</h2>
        </CardHeader>
        <CardBody className="space-y-6">
          {/* 月份选择器 */}
          <div className="flex gap-4">
            <Select
              className="w-32"
              label="选择年份"
              selectedKeys={[selectedYear.toString()]}
              onSelectionChange={(keys: any) => {
                const key = Array.from(keys)[0] as string;

                setSelectedYear(parseInt(key));
              }}
            >
              <SelectItem key="2024" textValue="2024">
                2024年
              </SelectItem>
              <SelectItem key="2025" textValue="2025">
                2025年
              </SelectItem>
              <SelectItem key="2026" textValue="2026">
                2026年
              </SelectItem>
            </Select>

            <Select
              className="w-32"
              label="选择目标月份"
              selectedKeys={[selectedMonth.toString()]}
              onSelectionChange={(keys: any) => {
                const key = Array.from(keys)[0] as string;

                setSelectedMonth(parseInt(key));
              }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <SelectItem key={month.toString()} textValue={`${month}月`}>
                  {month}月
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* 动态生成的表头预览 */}
          <div>
            <h3 className="text-md font-semibold mb-2">动态生成的表头预览</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700">主标题</h4>
                <Chip color="primary">{mainTitle}</Chip>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700">主表头</h4>
                <div className="flex flex-wrap gap-2">
                  {mainHeaders.map((header, index) => (
                    <Chip key={index} color="default" size="sm">
                      {header}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700">子表头</h4>
                <div className="flex flex-wrap gap-2">
                  {subHeaders.map((header, index) => (
                    <Chip key={index} color="secondary" size="sm">
                      {header}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 月份信息 */}
          <div>
            <h3 className="text-md font-semibold mb-2">生成的月份信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {months.map((month, index) => (
                <Card key={index} className="bg-gray-50">
                  <CardBody className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {month.year}年{month.month}月
                    </div>
                    <div className="text-sm text-gray-600">
                      {index === 0
                        ? "第一个月"
                        : index === 1
                          ? "第二个月"
                          : "目标月"}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 动态申请表管理器 */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">📋 动态申请表管理器</h2>
        </CardHeader>
        <CardBody>
          <DynamicApplicationManager />
        </CardBody>
      </Card>
    </div>
  );
};

export default TestMonthlyFieldsPage;
