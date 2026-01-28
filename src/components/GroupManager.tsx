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
  Typography,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import type { Group } from '../types';

interface GroupManagerProps {
  onClose?: () => void;
}

export const GroupManager: React.FC<GroupManagerProps> = () => {
  const { data, addGroup, updateGroup, deleteGroup } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState('');

  const handleAdd = () => {
    setEditingGroup(null);
    setGroupName('');
    setModalOpen(true);
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setModalOpen(true);
  };

  const handleDelete = (group: Group) => {
    const linkCount = data.links.filter(link => link.groupIds.includes(group.id)).length;
    if (linkCount > 0) {
      const confirmed = window.confirm(
        `分组"${group.name}"包含 ${linkCount} 个链接，删除分组将同时删除这些链接。确定要删除吗？`
      );
      if (!confirmed) return;
    }
    deleteGroup(group.id);
  };

  const handleSave = () => {
    if (!groupName.trim()) {
      alert('分组名称不能为空');
      return;
    }

    if (editingGroup) {
      updateGroup(editingGroup.id, groupName.trim());
    } else {
      addGroup(groupName.trim());
    }

    setModalOpen(false);
  };

  return (
    <Box>
      <Button variant="contained" onClick={handleAdd} sx={{ mb: 2 }}>
        添加分组
      </Button>

      {data.groups.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          暂无分组，点击"添加分组"开始添加
        </Typography>
      ) : (
        <List>
          {data.groups.map(group => {
            const linkCount = data.links.filter(link => link.groupIds.includes(group.id)).length;
            return (
              <ListItem
                key={group.id}
                secondaryAction={
                  <Box>
                    <IconButton edge="end" onClick={() => handleEdit(group)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDelete(group)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={group.name}
                  secondary={`${linkCount} 个链接`}
                />
              </ListItem>
            );
          })}
        </List>
      )}

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingGroup ? '编辑分组' : '添加分组'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="分组名称"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            sx={{ mt: 1 }}
          />
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
