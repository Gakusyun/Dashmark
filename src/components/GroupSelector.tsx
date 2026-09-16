import { useState, useCallback } from 'react';
import { AddIcon, CheckIcon } from './Icons';
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
    async (name: string, createFn: (name: string) => Group | Promise<Group>) => {
      const trimmedName = name.trim();
      if (!trimmedName) return null;

      const group = await createFn(trimmedName);
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
  onCreateGroup: (name: string) => Group | Promise<Group>;
  onGroupCreated?: (group: Group) => void;
}

/**
 * 分组选择器组件
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
        ? selectedIds.filter((groupId) => groupId !== id)
        : [...selectedIds, id];
      onSelectionChange(newIds);
    },
    [selectedIds, onSelectionChange]
  );

  const handleNewGroupKeyDownWrapper = useCallback(
    async (e: React.KeyboardEvent) => {
      const result = handleNewGroupKeyDown(e);
      if (result !== null && result.trim()) {
        const group = await createGroup(result, onCreateGroup);
        if (group && onGroupCreated) {
          onGroupCreated(group);
        }
      }
    },
    [handleNewGroupKeyDown, createGroup, onCreateGroup, onGroupCreated]
  );

  const handleCreateGroup = useCallback(async () => {
    const group = await createGroup(newGroupName, onCreateGroup);
    if (group && onGroupCreated) {
      onGroupCreated(group);
    }
  }, [newGroupName, createGroup, onCreateGroup, onGroupCreated]);

  return (
    <>
      {/* 标题和添加按钮 */}
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">选择分组：</span>
        <button
          onClick={startCreateGroup}
          title="添加分组"
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          <AddIcon size={18} />
        </button>
      </div>

      {/* 分组列表 */}
      <div className="my-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        {groups.map((group) => (
          <label
            key={group.id}
            className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-200"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(group.id)}
              onChange={() => handleToggleGroup(group.id)}
              className="h-4 w-4 accent-blue-600"
            />
            {group.name}
          </label>
        ))}

        {/* 新建分组输入框 */}
        {isCreatingGroup && (
          <div className="flex items-center gap-1">
            <input
              placeholder="新建分组"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={handleNewGroupKeyDownWrapper}
              autoFocus
              className="border-b border-slate-300 bg-transparent px-1 py-0.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:text-white"
            />
            <button
              onClick={handleCreateGroup}
              title="完成"
              className="rounded p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              <CheckIcon size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  );
};
