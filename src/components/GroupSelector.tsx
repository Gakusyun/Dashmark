import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Add as AddIcon, Check as CheckIcon } from '@mui/icons-material';
import type { Group } from '../types';

// ==================== Hook: useGroupSelector ====================

export interface UseGroupSelectorOptions {
  onGroupCreated?: (group: Group) => void;
}

export function useGroupSelector(options: UseGroupSelectorOptions = {}) {
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const startCreateGroup = useCallback(() => {
    setIsCreatingGroup(true);
    setNewGroupName('');
  }, []);

  const cancelCreateGroup = useCallback(() => {
    setIsCreatingGroup(false);
    setNewGroupName('');
  }, []);

  const handleNewGroupKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        return newGroupName.trim();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelCreateGroup();
      }
      return null;
    },
    [newGroupName, cancelCreateGroup]
  );

  const createGroup = useCallback(
    (name: string, createFn: (name: string) => Group) => {
      const trimmedName = name.trim();
      if (!trimmedName) return null;

      const group = createFn(trimmedName);
      setIsCreatingGroup(false);
      setNewGroupName('');

      if (options.onGroupCreated) {
        options.onGroupCreated(group);
      }

      return group;
    },
    [options]
  );

  return {
    isCreatingGroup,
    newGroupName,
    setNewGroupName,
    startCreateGroup,
    cancelCreateGroup,
    handleNewGroupKeyDown,
    createGroup,
  };
}

// ==================== Component: GroupSelector ====================

export interface GroupSelectorProps {
  groups: Group[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onCreateGroup: (name: string) => Group;
  onGroupCreated?: (group: Group) => void;
}

/**
 * 分组选择器组件
 *
 * 功能：
 * - 显示所有分组的 Checkbox 列表
 * - 支持"添加分组"按钮，点击后显示输入框
 * - 支持新建分组，输入名称后按 Enter 或点击确认按钮
 * - 支持按 Escape 取消新建分组
 * - 新建分组后自动选中
 *
 * @example
 * ```tsx
 * <GroupSelector
 *   groups={groups}
 *   selectedIds={formData.groupIds}
 *   onSelectionChange={(ids) => setFormData({ ...formData, groupIds: ids })}
 *   onCreateGroup={(name) => addGroup(name)}
 *   onGroupCreated={(group) => handleToggleGroup(group.id)}
 * />
 * ```
 */
export const GroupSelector: React.FC<GroupSelectorProps> = ({
  groups,
  selectedIds,
  onSelectionChange,
  onCreateGroup,
  onGroupCreated,
}) => {
  const {
    isCreatingGroup,
    newGroupName,
    setNewGroupName,
    startCreateGroup,
    handleNewGroupKeyDown,
    createGroup,
  } = useGroupSelector({ onGroupCreated });

  const handleToggleGroup = useCallback(
    (id: string) => {
      const newIds = selectedIds.includes(id)
        ? selectedIds.filter(groupId => groupId !== id)
        : [...selectedIds, id];
      onSelectionChange(newIds);
    },
    [selectedIds, onSelectionChange]
  );

  const handleNewGroupKeyDownWrapper = useCallback(
    (e: React.KeyboardEvent) => {
      const result = handleNewGroupKeyDown(e);
      if (result !== null && result.trim()) {
        const group = createGroup(result, onCreateGroup);
        if (group && onGroupCreated) {
          onGroupCreated(group);
        }
      }
    },
    [handleNewGroupKeyDown, createGroup, onCreateGroup, onGroupCreated]
  );

  const handleCreateGroup = useCallback(() => {
    const group = createGroup(newGroupName, onCreateGroup);
    if (group && onGroupCreated) {
      onGroupCreated(group);
    }
  }, [newGroupName, createGroup, onCreateGroup, onGroupCreated]);

  return (
    <>
      {/* 标题和添加按钮 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2">
          选择分组：
        </Typography>
        <IconButton
          size="small"
          onClick={startCreateGroup}
          title="添加分组"
        >
          <AddIcon />
        </IconButton>
      </Box>

      {/* 分组列表 */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', my: 2 }}>
        {groups.map(group => (
          <FormControlLabel
            key={group.id}
            control={
              <Checkbox
                checked={selectedIds.includes(group.id)}
                onChange={() => handleToggleGroup(group.id)}
              />
            }
            label={group.name}
          />
        ))}

        {/* 新建分组输入框 */}
        {isCreatingGroup && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              size="small"
              margin="none"
              placeholder="新建分组"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={handleNewGroupKeyDownWrapper}
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
    </>
  );
};
