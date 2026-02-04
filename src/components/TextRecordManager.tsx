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
import type { TextRecord } from '../types';

interface TextRecordManagerProps {
  onClose?: () => void;
}

export const TextRecordManager: React.FC<TextRecordManagerProps> = () => {
  const { data, deleteTextRecord, updateTextRecord, addTextRecord, batchDeleteTextRecords, addGroup } = useData();
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
    items: data.textRecords,
    getItemId: (r) => r.id,
  });

  // 使用确认对话框 Hook
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TextRecord | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    groupIds: [] as string[],
  });

  const handleBatchDelete = () => {
    if (selectedCount === 0) return;

    confirm({
      title: `确定删除选中的 ${selectedCount} 条文字记录吗？`,
      onConfirm: () => {
        batchDeleteTextRecords(Array.from(selectedIds));
        clearSelection();
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
    confirm({
      title: `确定删除文字记录"${record.title}"吗？`,
      onConfirm: () => {
        deleteTextRecord(record.id);
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
          添加文字记录
        </Button>
        {selectedCount > 0 && (
          <Button variant="contained" color="error" onClick={handleBatchDelete}>
            批量删除 ({selectedCount})
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
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={selectAll}
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
            onToggleSelect={toggleSelect}
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