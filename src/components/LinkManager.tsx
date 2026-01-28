import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import type { Link } from '../types';

interface LinkManagerProps {
  onClose?: () => void;
}

export const LinkManager: React.FC<LinkManagerProps> = () => {
  const { data, deleteLink, updateLink, addLink, batchDeleteLinks } = useData();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    groupIds: [] as string[],
  });

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
    if (window.confirm(`确定删除选中的 ${selectedIds.size} 个链接吗？`)) {
      batchDeleteLinks(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
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

  const handleDelete = (id: string) => {
    if (window.confirm('确定删除此链接吗？')) {
      deleteLink(id);
    }
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.url.trim()) {
      alert('标题和URL不能为空');
      return;
    }
    if (formData.groupIds.length === 0) {
      alert('请至少选择一个分组');
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
          暂无链接，点击"添加链接"开始添加
        </Typography>
      ) : (
        <>
          <Box sx={{ mb: 1 }}>
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
          <List>
            {data.links.map(link => (
              <ListItem
                key={link.id}
                secondaryAction={
                  <>
                    <IconButton edge="end" onClick={() => handleEdit(link)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDelete(link.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </>
                }
                sx={{
                  bgcolor: selectedIds.has(link.id) ? 'action.selected' : 'transparent',
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <Checkbox
                  checked={selectedIds.has(link.id)}
                  onChange={() => handleToggleSelect(link.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <ListItemText
                  primary={link.title}
                  secondary={link.url}
                  sx={{ ml: 1 }}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingLink ? '编辑链接' : '添加链接'}</DialogTitle>
        <DialogContent>
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
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            选择分组：
          </Typography>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>取消</Button>
          <Button onClick={handleSave} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
