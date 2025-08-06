import React from 'react';
import * as XLSX from 'xlsx-js-style';

export default function TestExcelExport() {
  const testExport = () => {
    // 创建简单的工作簿
    const wb = XLSX.utils.book_new();
    
    // 创建简单的数据
    const data = [
      ['序号', '名称', '数量', '单价', '金额'],
      [1, '测试项目1', 10, 100, 1000],
      [2, '测试项目2', 20, 200, 4000],
      [3, '测试项目3', 30, 300, 9000],
      [4, '测试项目4', 40, 400, 16000],
      [5, '测试项目5', 50, 500, 25000],
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // 设置页面属性
    ws['!pageSetup'] = {
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      orientation: 'landscape',
      paperSize: 9,
      margins: {
        top: 0.393055555555556,
        bottom: 0.393055555555556,
        left: 0.393055555555556,
        right: 0.393055555555556,
        header: 0.393055555555556,
        footer: 0.393055555555556
      }
    };
    
    // 设置列宽
    ws['!cols'] = [
      { wch: 8 },
      { wch: 20 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 }
    ];
    
    // 设置行高
    ws['!rows'] = [
      { hpt: 25 },
      { hpt: 20 },
      { hpt: 20 },
      { hpt: 20 },
      { hpt: 20 },
      { hpt: 20 }
    ];
    
    // 设置打印区域
    ws['!printArea'] = 'A1:E6';
    
    // 添加工作表
    XLSX.utils.book_append_sheet(wb, ws, "测试页面");
    
    // 导出文件
    XLSX.writeFile(wb, 'test_excel_export.xlsx');
    
    // 输出调试信息
    console.log("🔧 测试页面设置：");
    console.log("页面设置:", ws['!pageSetup']);
    console.log("列宽设置:", ws['!cols']);
    console.log("行高设置:", ws['!rows']);
    console.log("打印区域:", ws['!printArea']);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Excel导出测试页面</h1>
      <p className="mb-4">这个页面用于测试Excel页面设置是否生效</p>
      <button 
        onClick={testExport}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        导出测试Excel文件
      </button>
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">测试说明：</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>导出的Excel文件应该只有1页</li>
          <li>页边距应该是最小的（0.1英寸）</li>
          <li>打印方向应该是横向</li>
          <li>表格应该适应页面大小</li>
        </ul>
      </div>
    </div>
  );
} 