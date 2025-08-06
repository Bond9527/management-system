import React, { useState } from 'react';

interface MaterialNameCellProps {
  materialName: string;
  unitPrice?: number;
  purchaser?: string;
  isMultiStation?: boolean;
  stationCount?: number;
}

const MaterialNameCell: React.FC<MaterialNameCellProps> = ({
  materialName,
  unitPrice = 0,
  purchaser = '',
  isMultiStation = false,
  stationCount = 1,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="max-w-xs">
      {/* 料材名稱 - 支持点击展开/收起 */}
      <div 
        className={`font-medium text-sm mb-1 cursor-pointer transition-all duration-200 ${
          isExpanded 
            ? 'text-clip whitespace-normal break-words' 
            : 'truncate hover:text-blue-600'
        }`}
        title={isExpanded ? undefined : materialName}
        onClick={handleClick}
        style={{
          display: isExpanded ? 'block' : '-webkit-box',
          WebkitLineClamp: isExpanded ? 'unset' : 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: '1.3',
          maxHeight: isExpanded ? 'none' : '2.6em',
        }}
      >
        {materialName}
        {!isExpanded && (
          <span className="text-blue-500 text-xs ml-1">
            {materialName.length > 30 ? '...' : ''}
          </span>
        )}
      </div>

      {/* 多站别项目的额外信息 - 只在合并单元格中显示 */}
      {isMultiStation && stationCount > 1 && (
        <div className="text-xs text-gray-500 space-y-1 border-t border-gray-100 pt-1 mt-1">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">单价:</span>
            <span className="font-medium text-green-600">
              ¥{unitPrice.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">采购员:</span>
            <span className="font-medium text-blue-600">
              {purchaser || "未指定"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">站别:</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
              {stationCount}站
            </span>
          </div>
        </div>
      )}

      {/* 单站别项目的简化信息 */}
      {!isMultiStation && (
        <div className="text-xs text-gray-400 mt-1">
          <span className="text-gray-400">单价: ¥{unitPrice.toLocaleString()}</span>
          {purchaser && (
            <span className="ml-2 text-gray-400">采购: {purchaser}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default MaterialNameCell; 