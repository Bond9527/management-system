/**
 * 日期格式化工具函数
 */

/**
 * 格式化时间戳为本地时间字符串
 * @param timestamp - ISO时间戳字符串
 * @param options - 格式化选项
 * @returns 格式化后的时间字符串
 */
export const formatTimestamp = (
  timestamp: string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  },
): string => {
  try {
    const date = new Date(timestamp);

    if (isNaN(date.getTime())) {
      return "无效日期";
    }

    return date.toLocaleString("zh-CN", options);
  } catch (error) {
    return "无效日期";
  }
};

/**
 * 格式化时间戳为日期字符串（仅日期）
 * @param timestamp - ISO时间戳字符串
 * @returns 格式化后的日期字符串
 */
export const formatDate = (timestamp: string): string => {
  return formatTimestamp(timestamp, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

/**
 * 格式化时间戳为时间字符串（仅时间）
 * @param timestamp - ISO时间戳字符串
 * @returns 格式化后的时间字符串
 */
export const formatTime = (timestamp: string): string => {
  return formatTimestamp(timestamp, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

/**
 * 格式化相对时间（如：3分钟前、1小时前等）
 * @param timestamp - ISO时间戳字符串
 * @returns 相对时间字符串
 */
export const formatRelativeTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "刚刚";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);

      return `${minutes}分钟前`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);

      return `${hours}小时前`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);

      return `${days}天前`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);

      return `${months}个月前`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);

      return `${years}年前`;
    }
  } catch (error) {
    return "无效日期";
  }
};

/**
 * 获取当前时间戳
 * @returns 当前时间的ISO字符串
 */
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * 格式化当前日期为文件名友好的格式
 * @returns 格式化的日期字符串
 */
export const getCurrentDateForFilename = (): string => {
  return new Date()
    .toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, "-");
};

/**
 * 获取当前年份和月份
 * @returns 包含当前年份和月份的对象
 */
export const getCurrentYearMonth = (): { year: number; month: number } => {
  const now = new Date();

  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1, // getMonth() 返回 0-11，需要 +1
  };
};

/**
 * 根据当前月份生成格式化的 key
 * @param format - 格式化模板，支持 ${year} 和 ${month} 占位符
 * @param options - 选项配置
 * @returns 格式化后的 key
 */
export const generateCurrentMonthKey = (
  format: string = "${year}/${month}/22",
  options: {
    monthPadding?: boolean; // 是否对月份进行补零
    customYear?: number; // 自定义年份
    customMonth?: number; // 自定义月份
  } = {},
): string => {
  const { monthPadding = true, customYear, customMonth } = options;

  let year: number;
  let month: number;

  if (customYear !== undefined && customMonth !== undefined) {
    year = customYear;
    month = customMonth;
  } else {
    const current = getCurrentYearMonth();

    year = current.year;
    month = current.month;
  }

  const monthStr = monthPadding
    ? String(month).padStart(2, "0")
    : String(month);

  return format
    .replace(/\${year}/g, String(year))
    .replace(/\${month}/g, monthStr);
};

/**
 * 生成中文格式的月份 key
 * @param format - 格式化模板，支持 ${year}年 和 ${month}月 占位符
 * @param options - 选项配置
 * @returns 格式化后的 key
 */
export const generateChineseMonthKey = (
  format: string = "${year}年${month}月",
  options: {
    monthPadding?: boolean;
    customYear?: number;
    customMonth?: number;
  } = {},
): string => {
  const { monthPadding = false, customYear, customMonth } = options;

  let year: number;
  let month: number;

  if (customYear !== undefined && customMonth !== undefined) {
    year = customYear;
    month = customMonth;
  } else {
    const current = getCurrentYearMonth();

    year = current.year;
    month = current.month;
  }

  const monthStr = monthPadding
    ? String(month).padStart(2, "0")
    : String(month);

  return format
    .replace(/\${year}年/g, `${year}年`)
    .replace(/\${month}月/g, `${monthStr}月`);
};

/**
 * 生成 ISO 格式的月份 key (YYYY-MM)
 * @param options - 选项配置
 * @returns ISO 格式的月份 key
 */
export const generateISOMonthKey = (
  options: {
    customYear?: number;
    customMonth?: number;
  } = {},
): string => {
  const { customYear, customMonth } = options;

  let year: number;
  let month: number;

  if (customYear !== undefined && customMonth !== undefined) {
    year = customYear;
    month = customMonth;
  } else {
    const current = getCurrentYearMonth();

    year = current.year;
    month = current.month;
  }

  return `${year}-${String(month).padStart(2, "0")}`;
};

/**
 * 生成指定偏移月份的 key
 * @param monthOffset - 月份偏移量（正数为未来，负数为过去）
 * @param format - 格式化模板
 * @param options - 选项配置
 * @returns 格式化后的 key
 */
export const generateOffsetMonthKey = (
  monthOffset: number = 0,
  format: string = "${year}/${month}/22",
  options: {
    monthPadding?: boolean;
    baseYear?: number;
    baseMonth?: number;
  } = {},
): string => {
  const { monthPadding = true, baseYear, baseMonth } = options;

  let year: number;
  let month: number;

  if (baseYear !== undefined && baseMonth !== undefined) {
    year = baseYear;
    month = baseMonth;
  } else {
    const current = getCurrentYearMonth();

    year = current.year;
    month = current.month;
  }

  // 计算偏移后的年月
  let targetMonth = month + monthOffset;
  let targetYear = year;

  while (targetMonth > 12) {
    targetMonth -= 12;
    targetYear += 1;
  }

  while (targetMonth < 1) {
    targetMonth += 12;
    targetYear -= 1;
  }

  const monthStr = monthPadding
    ? String(targetMonth).padStart(2, "0")
    : String(targetMonth);

  return format
    .replace(/\${year}/g, String(targetYear))
    .replace(/\${month}/g, monthStr);
};

/**
 * 生成多个月份的 key 数组
 * @param count - 生成的月份数量
 * @param format - 格式化模板
 * @param options - 选项配置
 * @returns 月份 key 数组
 */
export const generateMultipleMonthKeys = (
  count: number = 3,
  format: string = "${year}/${month}/22",
  options: {
    monthPadding?: boolean;
    startOffset?: number; // 起始偏移量
    includeCurrent?: boolean; // 是否包含当前月
  } = {},
): string[] => {
  const {
    monthPadding = true,
    startOffset = 0,
    includeCurrent = true,
  } = options;

  const keys: string[] = [];
  const startMonth = includeCurrent ? startOffset : startOffset + 1;

  for (let i = 0; i < count; i++) {
    const offset = startMonth + i;

    keys.push(generateOffsetMonthKey(offset, format, { monthPadding }));
  }

  return keys;
};
