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
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }
): string => {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return '无效日期';
    }
    return date.toLocaleString('zh-CN', options);
  } catch (error) {
    return '无效日期';
  }
};

/**
 * 格式化时间戳为日期字符串（仅日期）
 * @param timestamp - ISO时间戳字符串
 * @returns 格式化后的日期字符串
 */
export const formatDate = (timestamp: string): string => {
  return formatTimestamp(timestamp, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * 格式化时间戳为时间字符串（仅时间）
 * @param timestamp - ISO时间戳字符串
 * @returns 格式化后的时间字符串
 */
export const formatTime = (timestamp: string): string => {
  return formatTimestamp(timestamp, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
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
      return '刚刚';
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
    return '无效日期';
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
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
}; 