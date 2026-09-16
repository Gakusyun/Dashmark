import { useState, useCallback, useMemo } from 'react';

/**
 * 批量选择Hook的选项
 */
interface UseBatchSelectionOptions<T> {
  items: T[];
  getItemId: (item: T) => string;
}

/**
 * 批量选择Hook的返回值
 */
interface UseBatchSelectionReturn {
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  selectedCount: number;
  isAllSelected: boolean;
  isIndeterminate: boolean;
}

/**
 * 批量选择Hook
 */
export function useBatchSelection<T>({
  items,
  getItemId,
}: UseBatchSelectionOptions<T>): UseBatchSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allIds = items.map(getItemId);
      if (prev.size === allIds.length) {
        return new Set();
      }
      return new Set(allIds);
    });
  }, [items, getItemId]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (id: string) => {
      return selectedIds.has(id);
    },
    [selectedIds]
  );

  const selectedCount = useMemo(() => {
    return selectedIds.size;
  }, [selectedIds]);

  const isAllSelected = useMemo(() => {
    return items.length > 0 && selectedIds.size === items.length;
  }, [items.length, selectedIds.size]);

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
