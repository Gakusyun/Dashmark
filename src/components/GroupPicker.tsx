import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { CheckIcon, PlusIcon } from './Icons';
import { cn } from '../utils/cn';
import type { Group } from '../types';

interface GroupPickerProps {
  groups: Group[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

/**
 * 分组多选：以可点选标签呈现，支持就地新建分组并自动选中。
 */
export function GroupPicker({ groups, selectedIds, onChange }: GroupPickerProps) {
  const { addGroup } = useData();
  const { showError } = useToast();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id) ? selectedIds.filter((g) => g !== id) : [...selectedIds, id]
    );
  };

  const commitNewGroup = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setCreating(false);
      setName('');
      return;
    }
    if (groups.some((g) => g.name === trimmed)) {
      showError('已存在同名分组');
      return;
    }
    const group = await addGroup(trimmed);
    onChange([...selectedIds, group.id]);
    setName('');
    setCreating(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {groups.map((group) => {
        const active = selectedIds.includes(group.id);
        return (
          <button
            key={group.id}
            type="button"
            onClick={() => toggle(group.id)}
            aria-pressed={active}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
              active
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300'
                : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700/50'
            )}
          >
            {active && <CheckIcon size={12} />}
            {group.name}
          </button>
        );
      })}

      {creating ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-indigo-400 px-2 py-0.5 dark:border-indigo-500">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitNewGroup();
              } else if (e.key === 'Escape') {
                setCreating(false);
                setName('');
              }
            }}
            onBlur={commitNewGroup}
            placeholder="新分组名"
            maxLength={100}
            className="w-24 bg-transparent py-0.5 text-xs text-slate-800 outline-none dark:text-slate-100"
          />
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-600 dark:text-slate-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
        >
          <PlusIcon size={12} />
          新建分组
        </button>
      )}
    </div>
  );
}
