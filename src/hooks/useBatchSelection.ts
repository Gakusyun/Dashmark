import { useState, useCallback, useMemo } from 'react';

/**
 * 批量选择Hook的选项
 * @template T - 项目类型
 */
interface UseBatchSelectionOptions<T> {
  /** 项目列表 */
  items: T[];
  /** 获取项目ID的函数 */
  getItemId: (item: T) => string;
}

/**
 * 批量选择Hook的返回值
 */
interface UseBatchSelectionReturn {
  /** 当前选中的ID集合 */
  selectedIds: Set<string>;
  /** 切换项目的选中状态 */
  toggleSelect: (id: string) => void;
  /** 全选所有项目 */
  selectAll: () => void;
  /** 清除所有选中 */
  clearSelection: () => void;
  /** 检查项目是否被选中 */
  isSelected: (id: string) => boolean;
  /** 选中的项目数量 */
  selectedCount: number;
  /** 是否所有项目都被选中 */
  isAllSelected: boolean;
  /** 是否部分项目被选中（用于显示半选状态） */
  isIndeterminate: boolean;
}

/**
 * 批量选择Hook
 *
 * 用于管理列表项的批量选择状态，支持全选、取消全选、切换选择等功能。
 * 适用于链接管理、文字记录管理等需要批量操作的组件。
 *
 * @example
 * ```tsx
 * const { selectedIds, toggleSelect, selectAll, clearSelection, isSelected, selectedCount, isAllSelected, isIndeterminate } = useBatchSelection({
 *   items: data.links,
 *   getItemId: (link) => link.id,
 * });
 * ```
 *
 * @param options - Hook配置选项
 * @returns 批量选择的状态和方法
 */
export function useBatchSelection<T>({
  items,
  getItemId,
}: UseBatchSelectionOptions<T>): UseBatchSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /**
   * 切换项目的选中状态
   */
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /**
   * 全选所有项目
   */
  const selectAll = useCallback(() => {
    const allIds = items.map(getItemId);
    setSelectedIds(new Set(allIds));
  }, [items, getItemId]);

  /**
   * 清除所有选中
   */
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  /**
   * 检查项目是否被选中
   */
  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  /**
   * 选中的项目数量
   */
  const selectedCount = useMemo(() => {
    return selectedIds.size;
  }, [selectedIds]);

  /**
   * 是否所有项目都被选中
   */
  const isAllSelected = useMemo(() => {
    return items.length > 0 && selectedIds.size === items.length;
  }, [items.length, selectedIds.size]);

  /**
   * 是否部分项目被选中（用于显示半选状态）
   */
  const isIndeterminate = useMemo(() => {
    return selectedIds.size > 0 && selectedIds.size < items.length;
  }, [selectedIds.size, items.length]);

  return {
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    isSelected,
    selectedCount,
    isAllSelected,
    isIndeterminate,
  };
}
