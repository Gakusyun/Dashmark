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
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import type { Link } from '../types';

interface LinkManagerProps {
  onClose?: () => void;
}

export const LinkManager: React.FC<LinkManagerProps> = () => {
  const { data, deleteLink, updateLink, addLink, batchDeleteLinks, addGroup } = useData();
  const { showError, showWarning } = useToast();
  const { confirmDialog, showConfirm, closeConfirm } = useConfirmDialog();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
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
    if (selectedIds.size === data.links.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.links.map(l => l.id)));
    }
  };

  const handleBatchDelete = () => {
    showConfirm(`确定删除选中的 ${selectedIds.size} 个链接吗？`, '', () => {
      batchDeleteLinks(Array.from(selectedIds));
      setSelectedIds(new Set());
    });
  };

  const handleAdd = () => {
    setEditingLink(null);
    setFormData({ title: '', url: '', groupIds: [] });
    setModalOpen(true);
  };

  const handleEdit = (link: Link) => {
    setEditingLink(link);
    setFormData({
      title: link.title,
      url: link.url,
      groupIds: [...link.groupIds],
    });
    setModalOpen(true);
  };

  const handleDelete = (link: Link) => {
    showConfirm(`确定删除链接“${link.title}”吗？`, '', () => deleteLink(link.id));
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.url.trim()) {
      showError('标题和URL不能为空');
      return;
    }
    if (formData.groupIds.length === 0) {
      showWarning('请至少选择一个分组');
      return;
    }

    let url = formData.url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    if (editingLink) {
      updateLink(editingLink.id, formData.title.trim(), url, formData.groupIds);
    } else {
      addLink(formData.title.trim(), url, formData.groupIds);
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

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button variant="contained" onClick={handleAdd}>
          添加链接
        </Button>
        {selectedIds.size > 0 && (
          <Button variant="contained" color="error" onClick={handleBatchDelete}>
            批量删除 ({selectedIds.size})
          </Button>
        )}
      </Box>

      {data.links.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          暂无链接，点击“添加链接”开始添加
        </Typography>
      ) : (
        <>
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedIds.size === data.links.length && data.links.length > 0}
                  indeterminate={selectedIds.size > 0 && selectedIds.size < data.links.length}
                  onChange={handleSelectAll}
                />
              }
              label="全选"
            />
          </Box>
          <ItemList
            items={data.links}
            getItemId={(link) => link.id}
            emptyMessage='暂无链接，点击“添加链接”开始添加'
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onEdit={handleEdit}
            onDelete={handleDelete}
            renderItem={(link) => (
              <ListItemText
                primary={link.title}
                secondary={link.url}
                sx={{ ml: 1 }}
              />
            )}
          />
        </>
      )}

      <DialogBox
        open={modalOpen}
        title={editingLink ? '编辑链接' : '添加链接'}
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
          label="URL"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          placeholder="example.com 或 https://example.com"
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
        onConfirm={confirmDialog.onConfirm}
        onClose={closeConfirm}
      />
    </Box>
  );
};
