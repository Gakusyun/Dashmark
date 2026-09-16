import { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { Favicon } from './ui/Favicon';
import { Menu, type MenuItemSpec } from './ui/Menu';
import { getDisplayHost } from '../utils/urlDisplay';
import {
  OpenExternalIcon,
  CopyIcon,
  EditIcon,
  MoreIcon,
  TextIcon,
} from './Icons';
import type { Bookmark } from '../types';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit?: (bookmark: Bookmark) => void;
  onOpenText?: (bookmark: Bookmark) => void;
}

/**
 * 收藏卡片。
 *
 * 与旧版不同：显示 favicon + 域名而非完整 URL；hover/聚焦时露出操作按钮；
 * 同时支持右键菜单，使操作在鼠标与触摸设备上都可发现。
 */
export function BookmarkCard({ bookmark, onEdit, onOpenText }: BookmarkCardProps) {
  const { showSuccess, showError } = useToast();
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);

  const isLink = bookmark.type === 'link';
  const url = bookmark.url ?? '';

  const open = () => {
    if (isLink && url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      onOpenText?.(bookmark);
    }
  };

  const copy = () => {
    const value = isLink ? url : (bookmark.content ?? '');
    navigator.clipboard
      .writeText(value)
      .then(() => showSuccess(isLink ? '链接已复制' : '内容已复制'))
      .catch(() => showError('复制失败'));
  };

  const openMenuAt = (x: number, y: number) => setMenuAnchor({ x, y });

  const menuItems: MenuItemSpec[] = [
    ...(isLink
      ? [
          {
            key: 'open',
            label: '在新标签页打开',
            icon: <OpenExternalIcon size={15} />,
            onSelect: open,
          },
        ]
      : [
          {
            key: 'view',
            label: '查看内容',
            icon: <TextIcon size={15} />,
            onSelect: () => onOpenText?.(bookmark),
          },
        ]),
    { key: 'copy', label: isLink ? '复制链接' : '复制内容', icon: <CopyIcon size={15} />, onSelect: copy },
    ...(onEdit
      ? [{ key: 'edit', label: '编辑', icon: <EditIcon size={15} />, onSelect: () => onEdit(bookmark) }]
      : []),
  ];

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={open}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            open();
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          openMenuAt(e.clientX, e.clientY);
        }}
        className="group relative flex h-full min-h-[4.5rem] cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition-all hover:border-slate-300 hover:shadow-md hover:shadow-slate-900/5 focus-visible:border-indigo-400 dark:border-slate-700/70 dark:bg-slate-800/60 dark:hover:border-slate-600 dark:hover:bg-slate-800"
      >
        {isLink ? (
          <Favicon url={url} title={bookmark.title} size={32} />
        ) : (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
            <TextIcon size={16} />
          </span>
        )}

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
            {bookmark.title}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">
            {isLink ? getDisplayHost(url) : (bookmark.content ?? '').replace(/\s+/g, ' ').slice(0, 90)}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            openMenuAt(rect.right - 4, rect.bottom + 4);
          }}
          aria-label="更多操作"
          className="shrink-0 rounded-md p-1 text-slate-400 opacity-0 transition-all group-hover:opacity-100 focus-visible:opacity-100 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
        >
          <MoreIcon size={16} />
        </button>
      </div>

      <Menu items={menuItems} anchor={menuAnchor} onClose={() => setMenuAnchor(null)} />
    </>
  );
}
