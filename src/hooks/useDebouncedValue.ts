import { useState, useEffect } from 'react';

/**
 * 防抖值 Hook
 *
 * 延迟更新值，直到用户停止输入指定时间后
 * 用于搜索输入框等场景，减少不必要的计算和渲染
 *
 * @param value - 需要防抖的值
 * @param delay - 延迟时间（毫秒），默认 300ms
 * @returns 防抖后的值
 *
 * @example
 * ```tsx
 * const [searchText, setSearchText] = useState('');
 * const debouncedSearchText = useDebouncedValue(searchText, 300);
 *
 * // debouncedSearchText 会在 searchText 停止变化 300ms 后更新
 * useEffect(() => {
 *   performSearch(debouncedSearchText);
 * }, [debouncedSearchText]);
 * ```
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 设置定时器
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 清理函数：如果 value 在 delay 时间内变化，取消之前的定时器
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
