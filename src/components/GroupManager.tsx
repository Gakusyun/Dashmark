import React, { useState } from 'react';
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
import type { Group } from '../types';

interface GroupManagerProps {
  onClose?: () => void;
}

export const GroupManager: React.FC<GroupManagerProps> = () => {
  const { data, addGroup, updateGroup, deleteGroup } = useData();
  const { showError } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Group>({
    id: '',
    name: '',
    order: 0
  });

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    onConfirm: () => { },
  });

  const handleDelete = (group: Group) => {
    const linkCount = data.links.filter(link => link.groupIds.includes(group.id)).length;
    const textRecordCount = data.textRecords.filter(record => record.groupIds.includes(group.id)).length;
    
    const itemsDescription = [];
    if (linkCount > 0) {
      itemsDescription.push(`${linkCount} 个链接`);
    }
    if (textRecordCount > 0) {
      itemsDescription.push(`${textRecordCount} 条文字记录`);
    }
    
    const itemsText = itemsDescription.join(' 和 ');
    const title = itemsText
      ? `分组“${group.name}”包含 ${itemsText}，删除分组将同时删除这些内容。确定要删除吗？`
      : `确定删除分组“${group.name}”吗？`;
      
    setConfirmDialog({
      open: true,
      title: title,
      content: '',
      onConfirm: () => {
        deleteGroup(group.id);
        setConfirmDialog(prev => ({ ...prev, open: false }));
      },
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
          const textRecordCount = data.textRecords.filter(record => record.groupIds.includes(group.id)).length;
          
          let secondaryText = '';
          if (linkCount > 0 && textRecordCount > 0) {
            secondaryText = `${linkCount} 个链接, ${textRecordCount} 条文字`;
          } else if (linkCount > 0) {
            secondaryText = `${linkCount} 个链接`;
          } else if (textRecordCount > 0) {
            secondaryText = `${textRecordCount} 条文字`;
          } else {
            secondaryText = '暂无内容';
          }
          
          return (
            <ListItemText
              primary={group.name}
              secondary={secondaryText}
            />
          );
        }}
      />

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

      <DialogBox
        open={confirmDialog.open}
        title={confirmDialog.title}
        content={confirmDialog.content}
        confirmText="删除"
        confirmColor="error"
        confirmVariant="text"
        cancelVariant="contained"
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      />
    </Box>
  );
};