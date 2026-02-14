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
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon, CloudUpload as UploadIcon, CloudDownload as DownloadIcon } from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { DialogBox } from './DialogBox';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { getAllSearchEngines } from '../utils/storage';
import type { SearchEngine } from '../types';
import { isValidUrl, normalizeUrl } from '../utils/urlValidator';

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

  // 使用确认对话框 Hook
  const { confirm, ConfirmDialog } = useConfirmDialog();

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
    confirm({
      title: `确定删除搜索引擎"${engine?.name}"吗？`,
      onConfirm: () => deleteSearchEngine(id),
    });
  };

  const handleSaveEngine = () => {
    if (!engineFormData.name.trim() || !engineFormData.url.trim()) {
      showError('名称和 URL 不能为空');
      return;
    }

    // 验证 URL 安全性
    const rawUrl = engineFormData.url.trim();
    if (!isValidUrl(rawUrl)) {
      showError('URL 格式无效或不安全，请检查输入');
      return;
    }

    // 规范化 URL（确保包含协议）
    const url = normalizeUrl(rawUrl);

    if (editingEngine) {
      updateSearchEngine(editingEngine.id, engineFormData.name.trim(), url);
    } else {
      addSearchEngine(engineFormData.name.trim(), url);
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

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <FormControlLabel
          control={
            <Switch
              checked={data.settings.hideLegalInfo || false}
              onChange={(e) => updateSettings({ hideLegalInfo: e.target.checked })}
            />
          }
          label="隐藏备案信息"
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <FormControlLabel
          control={
            <Switch
              checked={data.settings.cookieConsent === true}
              onChange={(e) => updateSettings({ cookieConsent: e.target.checked })}
            />
          }
          label="Cookie 同意状态"
        />
      </Box>
      
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



      <ConfirmDialog />
    </Box>
  );
};