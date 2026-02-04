import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
  ListItemText,
} from '@mui/material';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { DialogBox } from './DialogBox';
import { ItemList } from './ItemList';
import { GroupSelector } from './GroupSelector';
import { useBatchSelection } from '../hooks/useBatchSelection';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import type { Link } from '../types';
import { isValidUrl, normalizeUrl } from '../utils/urlValidator';

interface LinkManagerProps {
  onClose?: () => void;
}

export const LinkManager: React.FC<LinkManagerProps> = () => {
  const { data, deleteLink, updateLink, addLink, batchDeleteLinks, addGroup } = useData();
  const { showError, showWarning } = useToast();

  // 使用批量选择 Hook
  const {
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    selectedCount,
    isAllSelected,
    isIndeterminate,
  } = useBatchSelection({
    items: data.links,
    getItemId: (link) => link.id,
  });

  // 使用确认对话框 Hook
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    groupIds: [] as string[],
  });

  const handleBatchDelete = () => {
    confirm({
      title: `确定删除选中的 ${selectedCount} 个链接吗？`,
      onConfirm: () => {
        batchDeleteLinks(Array.from(selectedIds));
        clearSelection();
      },
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
    confirm({
      title: `确定删除链接"${link.title}"吗`,
      onConfirm: () => deleteLink(link.id),
    });
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

    // 验证 URL 安全性
    const rawUrl = formData.url.trim();
    if (!isValidUrl(rawUrl)) {
      showError('URL 格式无效或不安全，请检查输入');
      return;
    }

    // 规范化 URL（确保包含协议）
    const url = normalizeUrl(rawUrl);

    if (editingLink) {
      updateLink(editingLink.id, formData.title.trim(), url, formData.groupIds);
    } else {
      addLink(formData.title.trim(), url, formData.groupIds);
    }

    setModalOpen(false);
  };

  const handleGroupCreated = useCallback((group: { id: string }) => {
    setFormData(prev => ({
      ...prev,
      groupIds: [...prev.groupIds, group.id],
    }));
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button variant="contained" onClick={handleAdd}>
          添加链接
        </Button>
        {selectedCount > 0 && (
          <Button variant="contained" color="error" onClick={handleBatchDelete}>
            批量删除 ({selectedCount})
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
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={selectAll}
                />
              }
              label="全选"
            />
          </Box>
          <ItemList
            items={data.links}
            getItemId={(link) => link.id}
            emptyMessage='暂无链接，点击"添加链接"开始添加'
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
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
        <GroupSelector
          groups={data.groups}
          selectedIds={formData.groupIds}
          onSelectionChange={(ids) => setFormData({ ...formData, groupIds: ids })}
          onCreateGroup={(name) => addGroup(name)}
          onGroupCreated={handleGroupCreated}
        />
      </DialogBox>

      <ConfirmDialog />
    </Box>
  );
};