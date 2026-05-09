import React, { useState, useRef, useCallback } from 'react';
import {
  List,
  ListItem,
  IconButton,
  Typography,
  Checkbox,
} from '@mui/material';
import {
  DragHandle as DragHandleIcon,
} from '@mui/icons-material';

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

  if (items.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
        {emptyMessage}
      </Typography>
    );
  }

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
      // 重新排序数组
      const newItems = [...items];
      const draggedItem = newItems[dragIndex];
      newItems.splice(dragIndex, 1);
      newItems.splice(dropIndex, 0, draggedItem);
      
      // 获取重新排序后的ID列表
      const orderedIds = newItems.map(item => getItemId(item));
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
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchState.current) return;
    e.preventDefault(); // prevent scroll while dragging
    const touch = e.touches[0];
    const overIndex = findIndexAtPoint(touch.clientX, touch.clientY);
    if (overIndex !== null && overIndex !== touchState.current.currentOverIndex) {
      touchState.current.currentOverIndex = overIndex;
      setTouchOverIndex(overIndex);
    }
  }, [findIndexAtPoint]);

  // Touch end — finalize the reorder
  const handleTouchEnd = useCallback(() => {
    if (!touchState.current) return;
    const { startIndex, currentOverIndex } = touchState.current;
    if (currentOverIndex !== null && startIndex !== currentOverIndex) {
      const newItems = [...items];
      const dragged = newItems[startIndex];
      newItems.splice(startIndex, 1);
      newItems.splice(currentOverIndex, 0, dragged);
      const orderedIds = newItems.map(item => getItemId(item));
      onOrderChange(orderedIds);
    }
    touchState.current = null;
    setTouchDraggingIndex(null);
    setTouchOverIndex(null);
  }, [items, getItemId, onOrderChange]);

  return (
    <List>
      {items.map((item, index) => {
        const id = getItemId(item);
        const isSelected = selectedIds?.has(id);
        const isDragged = draggedItem === index;
        const isDragOver = dragOverIndex === index;
        const isTouchDragging = touchDraggingIndex === index;
        const isTouchOver = touchOverIndex === index && touchDraggingIndex !== index;

        return (
          <ListItem
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
            secondaryAction={
              <IconButton
                edge="end"
                onTouchStart={(e) => handleTouchStart(e, index)}
                sx={{
                  cursor: 'move',
                  opacity: (isDragged || isTouchDragging) ? 0.5 : 1,
                  touchAction: 'none',
                }}
              >
                <DragHandleIcon />
              </IconButton>
            }
            sx={{
              bgcolor: isSelected ? 'action.selected' : 'transparent',
              borderRadius: 1,
              opacity: (isDragged || isTouchDragging) ? 0.5 : 1,
              border: (isDragOver || isTouchOver) ? '2px dashed #1976d2' : 'none',
              transform: (isDragged || isTouchDragging) ? 'rotate(5deg)' : 'none',
              transition: touchDraggingIndex !== null ? 'border 0.15s ease, opacity 0.15s ease' : 'all 0.2s ease',
              cursor: 'grab',
              touchAction: touchDraggingIndex !== null ? 'none' : 'auto',
              '&:active': {
                cursor: 'grabbing',
              },
            }}
          >
            {selectedIds && onToggleSelect && (
              <Checkbox
                checked={isSelected}
                onChange={() => onToggleSelect(id)}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            {renderItem(item)}
          </ListItem>
        );
      })}
    </List>
  );
}