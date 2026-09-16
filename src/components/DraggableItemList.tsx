import { useState, useRef, useCallback } from 'react';
import { DragHandleIcon } from './Icons';

export interface DraggableItemListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  emptyMessage?: string;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  getItemId: (item: T) => string;
  onOrderChange: (orderedIds: string[]) => void;
}

export function DraggableItemList<T>({
  items,
  renderItem,
  emptyMessage = '暂无数据',
  selectedIds,
  onToggleSelect,
  getItemId,
  onOrderChange,
}: DraggableItemListProps<T>) {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Touch drag state
  const [touchDraggingIndex, setTouchDraggingIndex] = useState<number | null>(null);
  const [touchOverIndex, setTouchOverIndex] = useState<number | null>(null);
  const touchState = useRef<{
    startIndex: number;
    currentOverIndex: number | null;
  } | null>(null);

  // 处理拖拽开始
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  // 处理拖拽进入
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  // 处理拖拽离开
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  // 处理放置
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);

    if (dragIndex !== dropIndex) {
      const newItems = [...items];
      const dragged = newItems[dragIndex];
      newItems.splice(dragIndex, 1);
      newItems.splice(dropIndex, 0, dragged);

      const orderedIds = newItems.map((item) => getItemId(item));
      onOrderChange(orderedIds);
    }

    setDraggedItem(null);
    setDragOverIndex(null);
  };

  // 处理拖拽结束
  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  // Find the item index at a given touch coordinate
  const findIndexAtPoint = useCallback((x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const item = el.closest('[data-drag-index]');
    if (!item) return null;
    const idx = parseInt(item.getAttribute('data-drag-index') ?? '', 10);
    return Number.isNaN(idx) ? null : idx;
  }, []);

  // Touch drag start (on the drag handle)
  const handleTouchStart = useCallback((_e: React.TouchEvent, index: number) => {
    touchState.current = {
      startIndex: index,
      currentOverIndex: index,
    };
    setTouchDraggingIndex(index);
    setTouchOverIndex(index);
  }, []);

  // Touch move — detect which item is under the finger
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchState.current) return;
      e.preventDefault(); // prevent scroll while dragging
      const touch = e.touches[0];
      const overIndex = findIndexAtPoint(touch.clientX, touch.clientY);
      if (overIndex !== null && overIndex !== touchState.current.currentOverIndex) {
        touchState.current.currentOverIndex = overIndex;
        setTouchOverIndex(overIndex);
      }
    },
    [findIndexAtPoint]
  );

  // Touch end — finalize the reorder
  const handleTouchEnd = useCallback(() => {
    if (!touchState.current) return;
    const { startIndex, currentOverIndex } = touchState.current;
    if (currentOverIndex !== null && startIndex !== currentOverIndex) {
      const newItems = [...items];
      const dragged = newItems[startIndex];
      newItems.splice(startIndex, 1);
      newItems.splice(currentOverIndex, 0, dragged);
      const orderedIds = newItems.map((item) => getItemId(item));
      onOrderChange(orderedIds);
    }
    touchState.current = null;
    setTouchDraggingIndex(null);
    setTouchOverIndex(null);
  }, [items, getItemId, onOrderChange]);

  if (items.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-slate-400 dark:text-slate-500">{emptyMessage}</p>
    );
  }

  return (
    <ul className="space-y-1.5">
      {items.map((item, index) => {
        const id = getItemId(item);
        const isSelected = selectedIds?.has(id);
        const isDragged = draggedItem === index;
        const isDragOver = dragOverIndex === index;
        const isTouchDragging = touchDraggingIndex === index;
        const isTouchOver = touchOverIndex === index && touchDraggingIndex !== index;

        return (
          <li
            key={id}
            data-drag-index={index}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`flex items-center gap-2 rounded-xl border-2 bg-white px-2.5 py-2 dark:bg-black ${
              isSelected ? 'bg-sky-50 dark:bg-sky-950/30' : ''
            } ${
              isDragOver || isTouchOver
                ? 'border-dashed border-sky-500'
                : 'border-transparent'
            } ${
              isDragged || isTouchDragging ? 'rotate-1 opacity-60' : ''
            } cursor-grab active:cursor-grabbing`}
            style={{
              touchAction: touchDraggingIndex !== null ? 'none' : 'auto',
              transition: touchDraggingIndex !== null ? 'border 0.15s ease, opacity 0.15s ease' : 'all 0.2s ease',
            }}
          >
            {selectedIds && onToggleSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(id)}
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4 accent-sky-600"
              />
            )}
            <div className="min-w-0 flex-1">{renderItem(item)}</div>
            <button
              aria-label="拖动排序"
              onTouchStart={(e) => handleTouchStart(e, index)}
              className={`shrink-0 cursor-move rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300 ${
                isDragged || isTouchDragging ? 'opacity-50' : ''
              }`}
              style={{ touchAction: 'none' }}
            >
              <DragHandleIcon size={18} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
