import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  TextField,
  Alert,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon, CloudUpload as UploadIcon, CloudDownload as DownloadIcon } from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { DialogBox } from './DialogBox';
import { getAllSearchEngines } from '../utils/storage';
import type { SearchEngine } from '../types';

export const Settings: React.FC = () => {
  const { data, updateSettings, addSearchEngine, updateSearchEngine, deleteSearchEngine, exportData, importData, refreshData } = useData();
  const { mode, setMode } = useTheme();
  const { showError, showSuccess } = useToast();
  const allEngines = getAllSearchEngines();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEngine, setEditingEngine] = useState<SearchEngine | null>(null);
  const [engineFormData, setEngineFormData] = useState({
    name: '',
    url: '',
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    onConfirm: () => { },
  });

  const customEngines = data.searchEngines;

  const handleAddEngine = () => {
    setEditingEngine(null);
    setEngineFormData({ name: '', url: '' });
    setModalOpen(true);
  };

  const handleEditEngine = (engine: SearchEngine) => {
    setEditingEngine(engine);
    setEngineFormData({ name: engine.name, url: engine.url });
    setModalOpen(true);
  };

  const handleDeleteEngine = (id: string) => {
    const engine = customEngines.find(e => e.id === id);
    setConfirmDialog({
      open: true,
      title: `确定删除搜索引擎“${engine?.name}”吗？`,
      content: '',
      onConfirm: () => {
        deleteSearchEngine(id);
        setConfirmDialog(prev => ({ ...prev, open: false }));
      },
    });
  };

  const handleSaveEngine = () => {
    if (!engineFormData.name.trim() || !engineFormData.url.trim()) {
      showError('名称和 URL 不能为空');
      return;
    }

    if (editingEngine) {
      updateSearchEngine(editingEngine.id, engineFormData.name.trim(), engineFormData.url.trim());
    } else {
      addSearchEngine(engineFormData.name.trim(), engineFormData.url.trim());
    }

    setModalOpen(false);
  };

  const handleExport = () => {
    exportData();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importData(
      file,
      () => {
        showSuccess('数据导入成功');
        refreshData();
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      (error) => {
        showError(`导入失败：${error.message}`);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        主题设置
      </Typography>
      <FormControl fullWidth sx={{ mb: 4 }}>
        <InputLabel id="theme-mode-label">深色模式</InputLabel>
        <Select
          id="theme-mode"
          labelId="theme-mode-label"
          value={mode}
          label="深色模式"
          onChange={(e) => setMode(e.target.value as 'light' | 'dark' | 'auto')}
        >
          <MenuItem value="auto">跟随系统</MenuItem>
          <MenuItem value="light">浅色</MenuItem>
          <MenuItem value="dark">深色</MenuItem>
        </Select>
      </FormControl>

      <Typography variant="h6" gutterBottom>
        搜索引擎设置
      </Typography>
      <FormControl fullWidth sx={{ mb: 4 }}>
        <InputLabel id="search-engine-label">默认搜索引擎</InputLabel>
        <Select
          id="search-engine"
          labelId="search-engine-label"
          value={data.settings.searchEngine}
          label="默认搜索引擎"
          onChange={(e) => updateSettings({ searchEngine: e.target.value })}
        >
          {allEngines.map(engine => (
            <MenuItem key={engine.id} value={engine.id}>
              {engine.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleAddEngine}
        sx={{ mb: 2 }}
      >
        添加搜索引擎
      </Button>

      <List>
        {customEngines.map(engine => (
          <ListItem
            key={engine.id}
            secondaryAction={
              <>
                <IconButton edge="end" onClick={() => handleEditEngine(engine)}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => handleDeleteEngine(engine.id)}>
                  <DeleteIcon />
                </IconButton>
              </>
            }
          >
            <ListItemText
              primary={engine.name}
              secondary={engine.url}
            />
          </ListItem>
        ))}
      </List>

      <DialogBox
        open={modalOpen}
        title={editingEngine ? '编辑搜索引擎' : '添加搜索引擎'}
        confirmText="保存"
        onConfirm={handleSaveEngine}
        onClose={() => setModalOpen(false)}
      >
        <TextField
          id="engine-name"
          autoFocus
          fullWidth
          label="名称"
          value={engineFormData.name}
          onChange={(e) => setEngineFormData({ ...engineFormData, name: e.target.value })}
          sx={{ mb: 2, mt: 1 }}
          placeholder="例如：必应"
        />
        <TextField
          id="engine-url"
          fullWidth
          label="搜索URL"
          value={engineFormData.url}
          onChange={(e) => setEngineFormData({ ...engineFormData, url: e.target.value })}
          placeholder="https://www.bing.com/search?q="
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          URL 中使用 {`{q}`} 作为搜索关键词的占位符，例如：https://example.com/search?q={`{q}`}
        </Typography>
      </DialogBox>

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        数据备份
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
        >
          导出数据
        </Button>
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={handleImportClick}
        >
          导入数据
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json,.json.gz"
          style={{ display: 'none' }}
        />
      </Box>
      <Alert severity="info">
        数据以 JSON 格式存储在本地浏览器中。建议定期备份数据以防丢失。
      </Alert>

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