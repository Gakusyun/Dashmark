import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
  ListItemText,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
} from '@mui/material';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { DialogBox } from './DialogBox';
import { DraggableItemList } from './DraggableItemList';
import { ItemList } from './ItemList';
import { GroupSelector } from './GroupSelector';
import { useBatchSelection } from '../hooks/useBatchSelection';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import type { Bookmark } from '../types';
import { isValidUrl, normalizeUrl } from '../utils/urlValidator';

interface BookmarkManagerProps {
  onClose?: () => void;
}

export const BookmarkManager: React.FC<BookmarkManagerProps> = () => {
  const { data, deleteBookmark, updateBookmark, addBookmark, batchDeleteBookmarks, addGroup, updateBookmarkOrder } = useData();
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
    items: data.bookmarks || [],
    getItemId: (bookmark) => bookmark.id,
  });

  // 使用确认对话框 Hook
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [formData, setFormData] = useState({
    type: 'link' as 'link' | 'text',
    title: '',
    url: '',
    content: '',
    groupIds: [] as string[],
  });
  
  // 添加排序模式状态
  const [isSortingMode, setIsSortingMode] = useState(false);

  const handleBatchDelete = () => {
    if (selectedCount === 0) return;

    confirm({
      title: `确定删除选中的 ${selectedCount} 个收藏吗？`,
      onConfirm: () => {
        batchDeleteBookmarks(Array.from(selectedIds));
        clearSelection();
      },
    });
  };

  const handleAdd = () => {
    setEditingBookmark(null);
    setFormData({
      type: 'link',
      title: '',
      url: '',
      content: '',
      groupIds: [],
    });
    setModalOpen(true);
  };

  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setFormData({
      type: bookmark.type,
      title: bookmark.title,
      url: bookmark.url || '',
      content: bookmark.content || '',
      groupIds: [...bookmark.groupIds],
    });
    setModalOpen(true);
  };

  const handleDelete = (bookmark: Bookmark) => {
    confirm({
      title: `确定删除收藏"${bookmark.title}"吗？`,
      onConfirm: () => deleteBookmark(bookmark.id),
    });
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      showError('标题不能为空');
      return;
    }

    if (formData.type === 'link' && !formData.url.trim()) {
      showError('URL不能为空');
      return;
    }

    if (formData.type === 'text' && !formData.content.trim()) {
      showError('内容不能为空');
      return;
    }

    if (formData.groupIds.length === 0) {
      showWarning('请至少选择一个分组');
      return;
    }

    // 如果是链接类型，验证 URL 安全性
    if (formData.type === 'link') {
      const rawUrl = formData.url.trim();
      if (!isValidUrl(rawUrl)) {
        showError('URL 格式无效或不安全，请检查输入');
        return;
      }
    }

    // 规范化 URL（确保包含协议）
    const url = formData.type === 'link' ? normalizeUrl(formData.url.trim()) : undefined;

    if (editingBookmark) {
      updateBookmark(
        editingBookmark.id,
        formData.type,
        formData.title.trim(),
        formData.groupIds,
        url,
        formData.type === 'text' ? formData.content.trim() : undefined
      );
    } else {
      addBookmark(
        formData.type,
        formData.title.trim(),
        formData.groupIds,
        url,
        formData.type === 'text' ? formData.content.trim() : undefined
      );
    }

    setModalOpen(false);
  };

  const handleGroupCreated = useCallback((group: { id: string }) => {
    setFormData(prev => ({
      ...prev,
      groupIds: [...prev.groupIds, group.id],
    }));
  }, []);

  const handleTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      type: event.target.value as 'link' | 'text',
    });
  };

  // 根据类型生成显示文本
  const getSecondaryText = (bookmark: Bookmark) => {
    if (bookmark.type === 'link') {
      return bookmark.url || '';
    } else {
      const content = bookmark.content || '';
      return content.substring(0, 50) + (content.length > 50 ? '...' : '');
    }
  };

  // 切换排序模式
  const toggleSortingMode = () => {
    setIsSortingMode(!isSortingMode);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button variant="contained" onClick={handleAdd}>
          添加收藏
        </Button>
        <Button variant="outlined" onClick={toggleSortingMode}>
          {isSortingMode ? '完成排序' : '修改次序'}
        </Button>
        {selectedCount > 0 && (
          <Button variant="contained" color="error" onClick={handleBatchDelete}>
            批量删除 ({selectedCount})
          </Button>
        )}
      </Box>

      {(data.bookmarks?.length ?? 0) === 0 ? (
        <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          暂无收藏，点击"添加收藏"开始添加
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
          {isSortingMode ? (
            <DraggableItemList
              items={(data.bookmarks || []).sort((a, b) => a.order - b.order)}
              getItemId={(bookmark) => bookmark.id}
              emptyMessage='暂无收藏，点击"添加收藏"开始添加'
              onOrderChange={updateBookmarkOrder}
              renderItem={(bookmark) => (
                <ListItemText
                  primary={bookmark.title}
                  secondary={getSecondaryText(bookmark)}
                  sx={{ ml: 1 }}
                />
              )}
            />
          ) : (
            <ItemList
              items={(data.bookmarks || []).sort((a, b) => a.order - b.order)}
              getItemId={(bookmark) => bookmark.id}
              emptyMessage='暂无收藏，点击"添加收藏"开始添加'
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onEdit={handleEdit}
              onDelete={handleDelete}
              renderItem={(bookmark) => (
                <ListItemText
                  primary={bookmark.title}
                  secondary={getSecondaryText(bookmark)}
                  sx={{ ml: 1 }}
                />
              )}
            />
          )}
        </>
      )}

      <DialogBox
        open={modalOpen}
        title={editingBookmark ? '编辑收藏' : '添加收藏'}
        confirmText="保存"
        onConfirm={handleSave}
        onClose={() => setModalOpen(false)}
      >
        <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
          <FormLabel sx={{ mb: 1 }}>收藏类型</FormLabel>
          <RadioGroup
            row
            value={formData.type}
            onChange={handleTypeChange}
          >
            <FormControlLabel value="link" control={<Radio />} label="链接" />
            <FormControlLabel value="text" control={<Radio />} label="文字记录" />
          </RadioGroup>
        </FormControl>

        <TextField
          autoFocus
          fullWidth
          label="标题"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          sx={{ mb: 2 }}
        />

        {formData.type === 'link' ? (
          <TextField
            fullWidth
            label="URL"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder="example.com 或 https://example.com"
            sx={{ mb: 2 }}
          />
        ) : (
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
        )}

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