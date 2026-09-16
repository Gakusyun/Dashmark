import { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useData } from '../contexts/DataContext';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { CopyIcon, EditIcon, SaveIcon, TextIcon } from './Icons';
import type { Bookmark } from '../types';

interface TextRecordCardProps {
  bookmark: Bookmark;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}

/**
 * 文字记录卡片 + 阅读/编辑弹窗。
 *
 * 旧版使用整屏覆盖，容易迷失上下文；这里改为居中弹窗，
 * 保留页面背景，编辑与阅读在同一处切换。
 */
export function TextRecordCard({ bookmark, open, onOpen, onClose }: TextRecordCardProps) {
  const { showSuccess } = useToast();
  const { updateBookmark } = useData();

  const content = bookmark.content ?? '';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);

  /** 打开弹窗时重置为最新内容（由用户事件触发，避免在 effect 中同步 setState） */
  const handleOpen = () => {
    setDraft(content);
    setEditing(false);
    onOpen();
  };

  const close = () => {
    setEditing(false);
    onClose();
  };

  const copy = () => {
    navigator.clipboard.writeText(content);
    showSuccess('内容已复制');
  };

  const save = () => {
    if (!draft.trim()) return;
    updateBookmark(bookmark.id, 'text', bookmark.title, bookmark.groupIds, undefined, draft.trim());
    setEditing(false);
    showSuccess('已保存');
  };

  const preview = content.replace(/\s+/g, ' ').slice(0, 140);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpen();
          }
        }}
        className="group flex h-full min-h-[4.5rem] cursor-pointer flex-col rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md focus-visible:border-sky-400 dark:border-slate-700 dark:bg-black dark:shadow-none dark:hover:border-slate-600"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            <TextIcon size={16} />
          </span>
          <p className="min-w-0 flex-1 truncate pt-1.5 text-sm font-medium text-slate-900 dark:text-slate-100">
            {bookmark.title}
          </p>
        </div>
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {preview}
        </p>
      </div>

      <Modal
        open={open}
        title={bookmark.title}
        description={editing ? '编辑内容' : undefined}
        size="lg"
        onClose={close}
        footer={
          editing ? (
            <>
              <Button variant="ghost" onClick={() => setEditing(false)}>
                取消
              </Button>
              <Button variant="primary" icon={<SaveIcon size={15} />} onClick={save}>
                保存
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" icon={<CopyIcon size={15} />} onClick={copy}>
                复制
              </Button>
              <Button
                variant="secondary"
                icon={<EditIcon size={15} />}
                onClick={() => {
                  setDraft(content);
                  setEditing(true);
                }}
              >
                编辑
              </Button>
            </>
          )
        }
      >
        {editing ? (
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="scrollbar-thin h-[50vh] w-full resize-none rounded-md border border-slate-300 bg-white p-3.5 font-sans text-sm leading-relaxed text-slate-800 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:bg-black dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-400"
          />
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-slate-700 dark:text-slate-300">
            {content || <span className="text-slate-400">（空内容）</span>}
          </p>
        )}
      </Modal>
    </>
  );
}
