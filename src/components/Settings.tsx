import React, { useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { getAllSearchEngines } from '../utils/storage';
import type { SearchEngine } from '../types';

export const Settings: React.FC = () => {
  const { data, updateSettings, addSearchEngine, updateSearchEngine, deleteSearchEngine } = useData();
  const { mode, setMode } = useTheme();
  const { showError } = useToast();
  const allEngines = getAllSearchEngines();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEngine, setEditingEngine] = useState<SearchEngine | null>(null);
  const [engineFormData, setEngineFormData] = useState({
    name: '',
    url: '',
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
    if (window.confirm('确定删除此搜索引擎吗？')) {
      deleteSearchEngine(id);
    }
  };

  const handleSaveEngine = () => {
    if (!engineFormData.name.trim() || !engineFormData.url.trim()) {
      showError('名称和URL不能为空');
      return;
    }

    if (editingEngine) {
      updateSearchEngine(editingEngine.id, engineFormData.name.trim(), engineFormData.url.trim());
    } else {
      addSearchEngine(engineFormData.name.trim(), engineFormData.url.trim());
    }

    setModalOpen(false);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        主题设置
      </Typography>
      <FormControl fullWidth sx={{ mb: 4 }}>
        <InputLabel>深色模式</InputLabel>
        <Select
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
        <InputLabel>默认搜索引擎</InputLabel>
        <Select
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

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingEngine ? '编辑搜索引擎' : '添加搜索引擎'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="名称"
            value={engineFormData.name}
            onChange={(e) => setEngineFormData({ ...engineFormData, name: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
            placeholder="例如：必应"
          />
          <TextField
            fullWidth
            label="搜索URL"
            value={engineFormData.url}
            onChange={(e) => setEngineFormData({ ...engineFormData, url: e.target.value })}
            placeholder="https://www.bing.com/search?q="
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            URL 中使用 {`{q}`} 作为搜索关键词的占位符，例如：https://example.com/search?q={`{q}`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>取消</Button>
          <Button onClick={handleSaveEngine} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
