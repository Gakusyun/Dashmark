import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  ListItemText,
  Typography,
} from '@mui/material';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { DialogBox } from './DialogBox';
import { ItemList } from './ItemList';
import { DraggableItemList } from './DraggableItemList';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import type { Group } from '../types';

interface GroupManagerProps {
  onClose?: () => void;
}

export const GroupManager: React.FC<GroupManagerProps> = () => {
  const { data, addGroup, updateGroup, deleteGroup, updateGroupOrder } = useData();
  const { showError } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Group>({
    id: '',
    name: '',
    order: 0
  });
  
  // 添加排序模式状态
  const [isSortingMode, setIsSortingMode] = useState(false);

  // 使用确认对话框 Hook
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const handleDelete = (group: Group) => {
    const linkCount = data.bookmarks.filter(b => b.type === 'link' && b.groupIds.includes(group.id)).length;
    const textCount = data.bookmarks.filter(b => b.type === 'text' && b.groupIds.includes(group.id)).length;

    const itemsDescription = [];
    if (linkCount > 0) {
      itemsDescription.push(`${linkCount} 个链接`);
    }
    if (textCount > 0) {
      itemsDescription.push(`${textCount} 条文字记录`);
    }

    const itemsText = itemsDescription.join(' 和 ');
    const title = itemsText
      ? `分组"${group.name}"包含 ${itemsText}，删除分组将同时删除这些内容。确定要删除吗？`
      : `确定删除分组"${group.name}"吗？`;

    confirm({
      title: title,
      onConfirm: () => deleteGroup(group.id),
    });
  };

  const openAdd = () => {
    setIsEditing(false);
    setFormData({ id: '', name: '', order: 0 });
    setModalOpen(true);
  };

  const openEdit = (group: Group) => {
    setIsEditing(true);
    setFormData({ ...group });
    setModalOpen(true);
  };

  const close = () => {
    setModalOpen(false);
  };

  const updateFormData = (updates: Partial<Group>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      showError('分组名称不能为空');
      return;
    }

    if (isEditing) {
      updateGroup(formData.id, formData.name.trim());
    } else {
      addGroup(formData.name.trim());
    }

    close();
  };
  
  // 切换排序模式
  const toggleSortingMode = () => {
    setIsSortingMode(!isSortingMode);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button variant="contained" onClick={openAdd}>
          添加分组
        </Button>
        <Button variant="outlined" onClick={toggleSortingMode}>
          {isSortingMode ? '完成排序' : '修改次序'}
        </Button>
      </Box>

      {data.groups.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          暂无分组，点击"添加分组"开始添加
        </Typography>
      ) : isSortingMode ? (
        <DraggableItemList
          items={data.groups.sort((a, b) => a.order - b.order)}
          getItemId={(group) => group.id}
          emptyMessage='暂无分组，点击"添加分组"开始添加'
          onOrderChange={updateGroupOrder}
          renderItem={(group) => {
            const linkCount = data.bookmarks.filter(b => b.type === 'link' && b.groupIds.includes(group.id)).length;
            const textCount = data.bookmarks.filter(b => b.type === 'text' && b.groupIds.includes(group.id)).length;
            
            const counts = [];
            if (linkCount > 0) counts.push(`${linkCount} 个链接`);
            if (textCount > 0) counts.push(`${textCount} 条文字`);
            
            const secondaryText = counts.length > 0 ? counts.join(', ') : '暂无内容';
            
            return (
              <ListItemText
                primary={group.name}
                secondary={secondaryText}
              />
            );
          }}
        />
      ) : (
        <ItemList
          items={data.groups.sort((a, b) => a.order - b.order)}
          getItemId={(group) => group.id}
          emptyMessage='暂无分组，点击"添加分组"开始添加'
          onEdit={openEdit}
          onDelete={handleDelete}
          renderItem={(group) => {
            const linkCount = data.bookmarks.filter(b => b.type === 'link' && b.groupIds.includes(group.id)).length;
            const textCount = data.bookmarks.filter(b => b.type === 'text' && b.groupIds.includes(group.id)).length;
            
            const counts = [];
            if (linkCount > 0) counts.push(`${linkCount} 个链接`);
            if (textCount > 0) counts.push(`${textCount} 条文字`);
            
            const secondaryText = counts.length > 0 ? counts.join(', ') : '暂无内容';
            
            return (
              <ListItemText
                primary={group.name}
                secondary={secondaryText}
              />
            );
          }}
        />
      )}

      <DialogBox
        open={modalOpen}
        title={isEditing ? '编辑分组' : '添加分组'}
        confirmText="保存"
        onConfirm={handleSave}
        onClose={close}
      >
        <TextField
          autoFocus
          fullWidth
          label="分组名称"
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
          sx={{ mt: 1 }}
        />
      </DialogBox>

      <ConfirmDialog />
    </Box>
  );
};