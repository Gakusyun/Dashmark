import { useEffect, useMemo, useRef, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Field, Input, Textarea } from './ui/Field';
import { GroupPicker } from './GroupPicker';
import { LinkIcon, TextIcon } from './Icons';
import { isValidUrl, normalizeUrl } from '../utils/urlValidator';
import { getDisplayHost } from '../utils/urlDisplay';
import type { Bookmark } from '../types';

export interface BookmarkDraft {
  type: 'link' | 'text';
  title: string;
  url: string;
  content: string;
  groupIds: string[];
}

const EMPTY: BookmarkDraft = { type: 'link', title: '', url: '', content: '', groupIds: [] };

interface BookmarkEditorProps {
  open: boolean;
  /** 为空表示新建 */
  editing: Bookmark | null;
  /** 新建时的预选分组 */
  defaultGroupIds?: string[];
  onClose: () => void;
}

/**
 * 收藏编辑器：链接与文字记录共用同一套表单。
 * 顶部用分段控件切换类型，分组用可点选的标签块。
 */
/**
 * 收藏编辑器：链接与文字记录共用同一套表单。
 *
 * 拆分为外层 BookmarkEditor（控制挂载）与内层 EditorForm（持有表单状态）。
 * 通过 `key` 在每次打开时重新挂载表单，从而自然地重置状态，
 * 避免在 effect 中同步 setState。
 */
export function BookmarkEditor({ open, editing, defaultGroupIds, onClose }: BookmarkEditorProps) {
  if (!open) return null;
  // 用目标 id + 预选分组作为 key，切换编辑对象时重置表单
  const key = `${editing?.id ?? 'new'}:${(defaultGroupIds ?? []).join(',')}`;
  return <EditorForm key={key} editing={editing} defaultGroupIds={defaultGroupIds} onClose={onClose} />;
}

function EditorForm({ editing, defaultGroupIds, onClose }: Omit<BookmarkEditorProps, 'open'>) {
  const { data, addBookmark, updateBookmark } = useData();
  const { showError } = useToast();
  const [draft, setDraft] = useState<BookmarkDraft>(() =>
    editing
      ? {
          type: editing.type,
          title: editing.title,
          url: editing.url ?? '',
          content: editing.content ?? '',
          groupIds: [...editing.groupIds],
        }
      : { ...EMPTY, groupIds: defaultGroupIds?.length ? [...defaultGroupIds] : [] }
  );
  const titleRef = useRef<HTMLInputElement>(null);

  // 挂载后聚焦标题
  useEffect(() => {
    const timer = setTimeout(() => titleRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  const patch = (updates: Partial<BookmarkDraft>) => setDraft((prev) => ({ ...prev, ...updates }));

  const hostPreview = useMemo(() => {
    if (draft.type !== 'link' || !draft.url.trim()) return '';
    try {
      return getDisplayHost(isValidUrl(draft.url.trim()) ? normalizeUrl(draft.url.trim()) : draft.url);
    } catch {
      return '';
    }
  }, [draft.type, draft.url]);

  const handleSave = () => {
    const title = draft.title.trim();
    if (!title) return showError('请填写标题');
    if (draft.type === 'link' && !draft.url.trim()) return showError('请填写网址');
    if (draft.type === 'text' && !draft.content.trim()) return showError('请填写内容');
    if (draft.groupIds.length === 0) return showError('请至少选择一个分组');

    let url: string | undefined;
    if (draft.type === 'link') {
      const raw = draft.url.trim();
      if (!isValidUrl(raw)) return showError('网址格式无效或不安全');
      url = normalizeUrl(raw);
    }

    const content = draft.type === 'text' ? draft.content.trim() : undefined;

    if (editing) {
      updateBookmark(editing.id, draft.type, title, draft.groupIds, url, content);
    } else {
      addBookmark(draft.type, title, draft.groupIds, url, content);
    }
    onClose();
  };

  return (
    <Modal
      open
      title={editing ? '编辑收藏' : '新建收藏'}
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {editing ? '保存修改' : '添加'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* 类型切换 */}
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { type: 'link', label: '网址链接', icon: <LinkIcon size={16} /> },
              { type: 'text', label: '文字记录', icon: <TextIcon size={16} /> },
            ] as const
          ).map((opt) => (
            <button
              key={opt.type}
              type="button"
              onClick={() => patch({ type: opt.type })}
              className={
                'flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ' +
                (draft.type === opt.type
                  ? 'border-sky-500 bg-sky-50 text-sky-600 dark:border-sky-500 dark:bg-sky-950/40 dark:text-sky-400'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-900')
              }
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>

        <Field label="标题">
          <Input
            ref={titleRef}
            value={draft.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder={draft.type === 'link' ? '例如：GitHub' : '例如：常用命令备忘'}
            maxLength={200}
          />
        </Field>

        {draft.type === 'link' ? (
          <Field label="网址" hint={hostPreview ? `将保存为 ${hostPreview} 的链接` : undefined}>
            <Input
              value={draft.url}
              onChange={(e) => patch({ url: e.target.value })}
              placeholder="example.com 或 https://example.com"
              inputMode="url"
              autoComplete="off"
            />
          </Field>
        ) : (
          <Field label="内容">
            <Textarea
              rows={6}
              value={draft.content}
              onChange={(e) => patch({ content: e.target.value })}
              placeholder="粘贴或输入要保存的文字…"
            />
          </Field>
        )}

        <Field label="所属分组">
          <GroupPicker
            groups={data.groups}
            selectedIds={draft.groupIds}
            onChange={(ids) => patch({ groupIds: ids })}
          />
        </Field>
      </div>
    </Modal>
  );
}
