import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
  IconButton,
  ListItemText,
} from '@mui/material';
import { Add as AddIcon, Check as CheckIcon } from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { DialogBox } from './DialogBox';
import { ItemList } from './ItemList';
import type { TextRecord } from '../types';

interface TextRecordManagerProps {
  onClose?: () => void;
}

export const TextRecordManager: React.FC<TextRecordManagerProps> = () => {
  const { data, deleteTextRecord, updateTextRecord, addTextRecord, batchDeleteTextRecords, addGroup } = useData();
  const { showError, showWarning } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TextRecord | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    groupIds: [] as string[],
  });
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === data.textRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.textRecords.map(r => r.id)));
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;

    setConfirmDialog({
      open: true,
      title: `确定删除选中的 ${selectedIds.size} 条文字记录吗？`,
      content: '',
      onConfirm: () => {
        batchDeleteTextRecords(Array.from(selectedIds));
        setSelectedIds(new Set());
        setConfirmDialog(prev => ({ ...prev, open: false }));
      },
    });
  };

  const handleAdd = () => {
    setEditingRecord(null);
    setFormData({ title: '', content: '', groupIds: [] });
    setModalOpen(true);
  };

  const handleEdit = (record: TextRecord) => {
    setEditingRecord(record);
    setFormData({
      title: record.title,
      content: record.content,
      groupIds: [...record.groupIds],
    });
    setModalOpen(true);
  };

  const handleDelete = (record: TextRecord) => {
    setConfirmDialog({
      open: true,
      title: `确定删除文字记录"${record.title}"吗？`,
      content: '',
      onConfirm: () => {
        deleteTextRecord(record.id);
        setConfirmDialog(prev => ({ ...prev, open: false }));
      },
    });
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      showError('标题和内容不能为空');
      return;
    }
    if (formData.groupIds.length === 0) {
      showWarning('请至少选择一个分组');
      return;
    }

    if (editingRecord) {
      updateTextRecord(editingRecord.id, formData.title.trim(), formData.content.trim(), formData.groupIds);
    } else {
      addTextRecord(formData.title.trim(), formData.content.trim(), formData.groupIds);
    }

    setModalOpen(false);
  };

  const handleToggleGroup = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      groupIds: prev.groupIds.includes(groupId)
        ? prev.groupIds.filter(id => id !== groupId)
        : [...prev.groupIds, groupId],
    }));
  };

  const handleStartCreateGroup = () => {
    if (isCreatingGroup) {
      setIsCreatingGroup(false);
      setNewGroupName('');
    } else {
      setIsCreatingGroup(true);
      setNewGroupName('');
    }
  };

  const handleCreateGroup = () => {
    const trimmedName = newGroupName.trim();
    if (!trimmedName) {
      showError('分组名称不能为空');
      return;
    }
    const newGroup = addGroup(trimmedName);
    setFormData(prev => ({
      ...prev,
      groupIds: [...prev.groupIds, newGroup.id],
    }));
    setIsCreatingGroup(false);
    setNewGroupName('');
  };

  const handleNewGroupKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateGroup();
    } else if (e.key === 'Escape') {
      setIsCreatingGroup(false);
      setNewGroupName('');
    }
  };

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    onConfirm: () => { },
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button variant="contained" onClick={handleAdd}>
          添加文字记录
        </Button>
        {selectedIds.size > 0 && (
          <Button variant="contained" color="error" onClick={handleBatchDelete}>
            批量删除 ({selectedIds.size})
          </Button>
        )}
      </Box>

      {data.textRecords.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          暂无文字记录，点击"添加文字记录"开始添加
        </Typography>
      ) : (
        <>
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedIds.size === data.textRecords.length && data.textRecords.length > 0}
                  indeterminate={selectedIds.size > 0 && selectedIds.size < data.textRecords.length}
                  onChange={handleSelectAll}
                />
              }
              label="全选"
            />
          </Box>
          <ItemList
            items={data.textRecords}
            getItemId={(record) => record.id}
            emptyMessage='暂无文字记录，点击"添加文字记录"开始添加'
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onEdit={handleEdit}
            onDelete={handleDelete}
            renderItem={(record) => (
              <ListItemText
                primary={record.title}
                secondary={record.content.substring(0, 50) + (record.content.length > 50 ? '...' : '')}
                sx={{ ml: 1 }}
              />
            )}
          />
        </>
      )}

      <DialogBox
        open={modalOpen}
        title={editingRecord ? '编辑文字记录' : '添加文字记录'}
        confirmText="保存"
        onConfirm={handleSave}
        onClose={() => setModalOpen(false)}
      >
        <TextField
          autoFocus
          fullWidth
          label="标题"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          sx={{ mb: 2, mt: 1 }}
        />
        <TextField
          fullWidth
          label="内容"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="输入要保存的文字内容"
          multiline
          rows={4}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2">
            选择分组：
          </Typography>
          <IconButton
            size="small"
            onClick={handleStartCreateGroup}
            title="添加分组"
          >
            <AddIcon />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', my: 2 }}>
          {data.groups.map(group => (
            <FormControlLabel
              key={group.id}
              control={
                <Checkbox
                  checked={formData.groupIds.includes(group.id)}
                  onChange={() => handleToggleGroup(group.id)}
                />
              }
              label={group.name}
            />
          ))}
          {isCreatingGroup && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, }}>
              <TextField
                size="small"
                margin="none"
                placeholder="新建分组"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={handleNewGroupKeyDown}
                autoFocus
                variant="standard"
              />
              <IconButton
                size="small"
                onClick={handleCreateGroup}
                title="完成"
              >
                <CheckIcon />
              </IconButton>
            </Box>
          )}
        </Box>
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