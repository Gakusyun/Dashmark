import React, { useState } from 'react';
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

  return (
    <List>
      {items.map((item, index) => {
        const id = getItemId(item);
        const isSelected = selectedIds?.has(id);
        const isDragged = draggedItem === index;
        const isDragOver = dragOverIndex === index;
        
        return (
          <ListItem
            key={id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            secondaryAction={
              <IconButton
                edge="end"
                sx={{
                  cursor: 'move',
                  opacity: isDragged ? 0.5 : 1,
                }}
              >
                <DragHandleIcon />
              </IconButton>
            }
            sx={{
              bgcolor: isSelected ? 'action.selected' : 'transparent',
              borderRadius: 1,
              opacity: isDragged ? 0.5 : 1,
              border: isDragOver ? '2px dashed #1976d2' : 'none',
              transform: isDragged ? 'rotate(5deg)' : 'none',
              transition: 'all 0.2s ease',
              cursor: 'grab',
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