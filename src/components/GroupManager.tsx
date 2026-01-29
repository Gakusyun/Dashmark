import React from 'react';
import {
  Box,
  Button,
  TextField,
  ListItemText,
} from '@mui/material';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { DialogBox } from './DialogBox';
import { ItemList } from './ItemList';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { useFormDialog } from '../hooks/useFormDialog';
import type { Group } from '../types';

interface GroupManagerProps {
  onClose?: () => void;
}

export const GroupManager: React.FC<GroupManagerProps> = () => {
  const { data, addGroup, updateGroup, deleteGroup } = useData();
  const { showError } = useToast();
  const { confirmDialog, showConfirm, closeConfirm } = useConfirmDialog();
  const { open, isEditing, formData, openAdd, openEdit, close, updateFormData } = useFormDialog<Group>({
    id: '',
    name: '',
    order: 0
  });

  const handleDelete = (group: Group) => {
    const linkCount = data.links.filter(link => link.groupIds.includes(group.id)).length;
    const title = linkCount > 0
      ? `分组“${group.name}”包含 ${linkCount} 个链接，删除分组将同时删除这些链接。确定要删除吗？`
      : `确定删除分组“${group.name}”吗？`;
    showConfirm(title, '', () => deleteGroup(group.id));
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

  return (
    <Box>
      <Button variant="contained" onClick={openAdd} sx={{ mb: 2 }}>
        添加分组
      </Button>

      <ItemList
        items={data.groups}
        getItemId={(group) => group.id}
        emptyMessage='暂无分组，点击“添加分组”开始添加'
        onEdit={openEdit}
        onDelete={handleDelete}
        renderItem={(group) => {
          const linkCount = data.links.filter(link => link.groupIds.includes(group.id)).length;
          return (
            <ListItemText
              primary={group.name}
              secondary={`${linkCount} 个链接`}
            />
          );
        }}
      />

      <DialogBox
        open={open}
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

      <DialogBox
        open={confirmDialog.open}
        title={confirmDialog.title}
        content={confirmDialog.content}
        confirmText="删除"
        confirmColor="error"
        onConfirm={confirmDialog.onConfirm}
        onClose={closeConfirm}
      />
    </Box>
  );
};
