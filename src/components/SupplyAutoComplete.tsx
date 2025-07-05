import React, { useState, useEffect, useRef } from 'react';
import { 
  Input, 
  Card, 
  CardBody, 
  Spinner, 
  Badge, 
  Chip,
  ScrollShadow 
} from '@heroui/react';
import { MagnifyingGlassIcon, CubeIcon } from '@heroicons/react/24/outline';
import { suppliesApi, SupplyItem } from '../services/supplies';

interface SupplyAutoCompleteProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSupplySelect?: (supply: SupplyItem) => void;
  disabled?: boolean;
  description?: string;
  isRequired?: boolean;
  className?: string;
}

const SupplyAutoComplete: React.FC<SupplyAutoCompleteProps> = ({
  label = "耗材名称",
  placeholder = "请输入耗材名称进行搜索...",
  value = "",
  onChange,
  onSupplySelect,
  disabled = false,
  description,
  isRequired = false,
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const [suggestions, setSuggestions] = useState<SupplyItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 防抖搜索
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length >= 1) {
        searchSupplies(searchTerm.trim());
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // 搜索耗材
  const searchSupplies = async (term: string) => {
    setIsLoading(true);
    try {
      const results = await suppliesApi.getSupplies({ search: term });
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('搜索耗材失败:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange?.(newValue);
  };

  // 选择耗材
  const handleSupplySelect = (supply: SupplyItem) => {
    setSearchTerm(supply.name);
    setShowSuggestions(false);
    setSuggestions([]);
    onChange?.(supply.name);
    onSupplySelect?.(supply);
  };

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSupplySelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // 点击外部关闭建议列表
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 格式化库存状态
  const getStockStatus = (supply: SupplyItem) => {
    if (supply.current_stock <= supply.min_stock) {
      return { color: 'danger', label: '库存不足' };
    } else if (supply.current_stock <= supply.safety_stock) {
      return { color: 'warning', label: '低库存' };
    } else {
      return { color: 'success', label: '库存充足' };
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Input
        ref={inputRef}
        label={label}
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        disabled={disabled}
        description={description}
        isRequired={isRequired}
        startContent={
          isLoading ? (
            <Spinner size="sm" />
          ) : (
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
          )
        }
        endContent={
          searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                onChange?.("");
                setSuggestions([]);
                setShowSuggestions(false);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )
        }
      />

      {/* 建议列表 */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden"
        >
          <ScrollShadow className="max-h-64">
            {suggestions.map((supply, index) => {
              const stockStatus = getStockStatus(supply);
              return (
                <div
                  key={supply.id}
                  onClick={() => handleSupplySelect(supply)}
                  className={`px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                    index === selectedIndex 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CubeIcon className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-gray-900">
                          {supply.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                        <span>分类: {supply.category}</span>
                        <span>单位: {supply.unit}</span>
                        <span>采购员: {supply.purchaser || '未指定'}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <Badge 
                          color={stockStatus.color as any}
                          variant="flat"
                          size="sm"
                        >
                          {stockStatus.label}
                        </Badge>
                        <Chip 
                          color="primary" 
                          variant="flat" 
                          size="sm"
                        >
                          库存: {supply.current_stock.toLocaleString()}
                        </Chip>
                      </div>
                      <div className="text-sm text-gray-500">
                        单价: ¥{parseFloat(supply.unit_price).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </ScrollShadow>
        </div>
      )}

      {/* 无搜索结果提示 */}
      {showSuggestions && suggestions.length === 0 && searchTerm.trim() && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="px-4 py-3 text-center text-gray-500">
            未找到匹配的耗材
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplyAutoComplete; 