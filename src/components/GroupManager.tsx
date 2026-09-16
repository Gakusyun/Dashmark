import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { DraggableItemList } from './DraggableItemList';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Field, Input } from './ui/Field';
import { EditIcon, PlusIcon, TrashIcon, SortIcon, CheckAllIcon } from './Icons';
import type { Group } from '../types';

/**
 * 分组管理：列表 + 内联编辑弹窗 + 拖拽排序。
 */
export function GroupManager() {
  const { data, addGroup, updateGroup, deleteGroup, updateGroupOrder } = useData();
  const { showError } = useToast();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [name, setName] = useState('');
  const [sorting, setSorting] = useState(false);

  const groups = data.groups.slice().sort((a, b) => a.order - b.order);

  const countsFor = (groupId: string) => {
    const links = data.bookmarks.filter((b) => b.type === 'link' && b.groupIds.includes(groupId)).length;
    const texts = data.bookmarks.filter((b) => b.type === 'text' && b.groupIds.includes(groupId)).length;
    return { links, texts };
  };

  const openNew = () => {
    setEditing(null);
    setName('');
    setEditorOpen(true);
  };

  const openEdit = (group: Group) => {
    setEditing(group);
    setName(group.name);
    setEditorOpen(true);
  };

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return showError('请填写分组名称');
    const duplicate = data.groups.some((g) => g.name === trimmed && g.id !== editing?.id);
    if (duplicate) return showError('已存在同名分组');

    if (editing) {
      updateGroup(editing.id, trimmed);
    } else {
      addGroup(trimmed);
    }
    setEditorOpen(false);
  };

  const remove = (group: Group) => {
    const { links, texts } = countsFor(group.id);
    const parts: string[] = [];
    if (links) parts.push(`${links} 个链接`);
    if (texts) parts.push(`${texts} 条文字记录`);
    const detail = parts.length
      ? `该分组包含 ${parts.join(' 和 ')}。仅属于此分组的收藏会一并删除，同时属于其他分组的收藏会保留。`
      : '该分组目前没有内容。';

    confirm({
      title: `删除分组「${group.name}」？`,
      content: detail,
      confirmText: '删除',
      onConfirm: () => deleteGroup(group.id),
    });
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button variant="primary" icon={<PlusIcon size={15} />} onClick={openNew}>
          新建分组
        </Button>
        <Button
          variant={sorting ? 'primary' : 'secondary'}
          icon={sorting ? <CheckAllIcon size={15} /> : <SortIcon size={15} />}
          onClick={() => setSorting((s) => !s)}
          disabled={groups.length < 2}
        >
          {sorting ? '完成排序' : '调整顺序'}
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">还没有分组</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            分组用于把收藏归类，一个收藏可以属于多个分组
          </p>
          <Button variant="primary" icon={<PlusIcon size={15} />} className="mt-4" onClick={openNew}>
            新建分组
          </Button>
        </div>
      ) : sorting ? (
        <DraggableItemList
          items={groups}
          getItemId={(g) => g.id}
          emptyMessage="暂无分组"
          onOrderChange={updateGroupOrder}
          renderItem={(group) => <GroupRow group={group} counts={countsFor(group.id)} />}
        />
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-black">
          {groups.map((group) => (
            <li
              key={group.id}
              className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              <div className="min-w-0 flex-1">
                <GroupRow group={group} counts={countsFor(group.id)} />
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  onClick={() => openEdit(group)}
                  aria-label={`编辑分组 ${group.name}`}
                  className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                >
                  <EditIcon size={16} />
                </button>
                <button
                  onClick={() => remove(group)}
                  aria-label={`删除分组 ${group.name}`}
                  className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={editorOpen}
        title={editing ? '编辑分组' : '新建分组'}
        onClose={() => setEditorOpen(false)}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditorOpen(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={save}>
              {editing ? '保存' : '创建'}
            </Button>
          </>
        }
      >
        <Field label="分组名称">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
            }}
            placeholder="例如：开发工具"
            maxLength={100}
          />
        </Field>
      </Modal>

      <ConfirmDialog />
    </>
  );
}

function GroupRow({
  group,
  counts,
}: {
  group: Group;
  counts: { links: number; texts: number };
}) {
  const parts: string[] = [];
  if (counts.links) parts.push(`${counts.links} 个链接`);
  if (counts.texts) parts.push(`${counts.texts} 条文字`);

  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{group.name}</p>
      <p className="truncate text-xs text-slate-400 dark:text-slate-500">
        {parts.length ? parts.join(' · ') : '暂无内容'}
      </p>
    </div>
  );
}
