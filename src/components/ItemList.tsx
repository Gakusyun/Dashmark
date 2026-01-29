import React from 'react';
import { List, ListItem, IconButton, Typography, Checkbox } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';

export interface ItemListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  emptyMessage?: string;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  getItemId: (item: T) => string;
}

export function ItemList<T>({
  items,
  renderItem,
  emptyMessage = '暂无数据',
  onEdit,
  onDelete,
  selectedIds,
  onToggleSelect,
  getItemId,
}: ItemListProps<T>) {
  if (items.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <List>
      {items.map(item => {
        const id = getItemId(item);
        const isSelected = selectedIds?.has(id);
        return (
          <ListItem
            key={id}
            secondaryAction={
              <>
                {onEdit && (
                  <IconButton edge="end" onClick={() => onEdit(item)}>
                    <EditIcon />
                  </IconButton>
                )}
                {onDelete && (
                  <IconButton edge="end" onClick={() => onDelete(item)}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </>
            }
            sx={{
              bgcolor: isSelected ? 'action.selected' : 'transparent',
              borderRadius: 1,
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