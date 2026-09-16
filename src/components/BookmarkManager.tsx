import { useEffect, useMemo, useRef, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { useBatchSelection } from '../hooks/useBatchSelection';
import { BookmarkEditor } from './BookmarkEditor';
import { DraggableItemList } from './DraggableItemList';
import { Favicon } from './ui/Favicon';
import { Button } from './ui/Button';
import { Input } from './ui/Field';
import { Menu, type MenuItemSpec } from './ui/Menu';
import { getDisplayHost } from '../utils/urlDisplay';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  DragHandleIcon,
  SortIcon,
  CheckAllIcon,
  MoreIcon,
  TextIcon,
  CopyIcon,
  OpenExternalIcon,
  SearchIcon,
} from './Icons';
import { cn } from '../utils/cn';
import type { Bookmark } from '../types';

interface BookmarkManagerProps {
  autoAdd?: boolean;
  autoAddNonce?: number;
  onAutoAddConsumed?: () => void;
}

/**
 * 收藏管理：可搜索的列表，每行直接暴露常用操作；
 * 支持批量选择与拖拽排序，排序模式下切换为拖拽列表。
 */
export function BookmarkManager({ autoAdd, autoAddNonce, onAutoAddConsumed }: BookmarkManagerProps) {
  const { data, deleteBookmark, batchDeleteBookmarks, updateBookmarkOrder } = useData();
  const { showSuccess } = useToast();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Bookmark | null>(null);
  const [sorting, setSorting] = useState(false);
  const [filter, setFilter] = useState('');
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  const { confirm, ConfirmDialog } = useConfirmDialog();
  const consumedRef = useRef(0);

  const bookmarks = data.bookmarks;

  // 外部（顶部"添加"按钮）请求打开新建表单
  useEffect(() => {
    if (autoAdd && autoAddNonce !== undefined && autoAddNonce !== consumedRef.current) {
      consumedRef.current = autoAddNonce;
      setEditing(null);
      setEditorOpen(true);
      onAutoAddConsumed?.();
    }
  }, [autoAdd, autoAddNonce, onAutoAddConsumed]);

  const filtered = useMemo(() => {
    const sorted = bookmarks.slice().sort((a, b) => a.order - b.order);
    const q = filter.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        (b.url ?? '').toLowerCase().includes(q) ||
        (b.content ?? '').toLowerCase().includes(q)
    );
  }, [bookmarks, filter]);

  const {
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    selectedCount,
    isAllSelected,
  } = useBatchSelection({ items: filtered, getItemId: (b) => b.id });

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (bookmark: Bookmark) => {
    setEditing(bookmark);
    setEditorOpen(true);
  };

  const removeOne = (bookmark: Bookmark) => {
    confirm({
      title: `删除「${bookmark.title}」？`,
      content: '此操作无法撤销。',
      confirmText: '删除',
      onConfirm: () => deleteBookmark(bookmark.id),
    });
  };

  const removeSelected = () => {
    if (selectedCount === 0) return;
    confirm({
      title: `删除选中的 ${selectedCount} 项？`,
      content: '此操作无法撤销。',
      confirmText: '删除',
      onConfirm: () => {
        batchDeleteBookmarks(Array.from(selectedIds));
        clearSelection();
        showSuccess(`已删除 ${selectedCount} 项`);
      },
    });
  };

  if (bookmarks.length === 0) {
    return (
      <>
        <HeaderActions
          onAdd={openNew}
          sorting={sorting}
          onToggleSort={() => setSorting((s) => !s)}
          disabled
        />
        <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">还没有任何收藏</p>
          <Button variant="primary" icon={<PlusIcon size={15} />} className="mt-4" onClick={openNew}>
            新建收藏
          </Button>
        </div>
        <BookmarkEditor
          open={editorOpen}
          editing={editing}
          onClose={() => setEditorOpen(false)}
        />
        <ConfirmDialog />
      </>
    );
  }

  const menuBookmark = menu ? bookmarks.find((b) => b.id === menu.id) : null;
  const menuItems: MenuItemSpec[] = menuBookmark
    ? [
        ...(menuBookmark.type === 'link'
          ? [
              {
                key: 'open',
                label: '在新标签页打开',
                icon: <OpenExternalIcon size={15} />,
                onSelect: () =>
                  window.open(menuBookmark.url ?? '', '_blank', 'noopener,noreferrer'),
              },
            ]
          : []),
        {
          key: 'copy',
          label: menuBookmark.type === 'link' ? '复制链接' : '复制内容',
          icon: <CopyIcon size={15} />,
          onSelect: () => {
            navigator.clipboard.writeText(
              menuBookmark.type === 'link' ? (menuBookmark.url ?? '') : (menuBookmark.content ?? '')
            );
            showSuccess('已复制');
          },
        },
        {
          key: 'edit',
          label: '编辑',
          icon: <EditIcon size={15} />,
          onSelect: () => openEdit(menuBookmark),
        },
        {
          key: 'delete',
          label: '删除',
          icon: <TrashIcon size={15} />,
          danger: true,
          onSelect: () => removeOne(menuBookmark),
        },
      ]
    : [];

  return (
    <>
      <HeaderActions
        onAdd={openNew}
        sorting={sorting}
        onToggleSort={() => setSorting((s) => !s)}
      />

      {/* 搜索 + 批量操作 */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <SearchIcon
            size={15}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
          />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="按标题、网址或内容筛选…"
            className="pl-9"
          />
        </div>
        {!sorting && (
          <>
            <Button
              variant="secondary"
              size="md"
              icon={<CheckAllIcon size={15} />}
              onClick={selectAll}
            >
              {isAllSelected ? '取消全选' : '全选'}
            </Button>
            {selectedCount > 0 && (
              <Button variant="danger" size="md" icon={<TrashIcon size={15} />} onClick={removeSelected}>
                删除 {selectedCount} 项
              </Button>
            )}
          </>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-slate-400 dark:text-slate-500">
          没有匹配「{filter}」的收藏
        </p>
      ) : sorting ? (
        <DraggableItemList
          items={filtered}
          getItemId={(b) => b.id}
          emptyMessage="暂无收藏"
          onOrderChange={updateBookmarkOrder}
          renderItem={(bookmark) => <RowContent bookmark={bookmark} />}
        />
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-black">
          {filtered.map((bookmark) => {
            const selected = selectedIds.has(bookmark.id);
            return (
              <li
                key={bookmark.id}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 transition-colors',
                  selected ? 'bg-sky-50/60 dark:bg-sky-950/30' : 'hover:bg-slate-100 dark:hover:bg-slate-900'
                )}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleSelect(bookmark.id)}
                  aria-label={`选择 ${bookmark.title}`}
                  className="h-4 w-4 shrink-0 accent-sky-600"
                />

                {bookmark.type === 'link' ? (
                  <Favicon url={bookmark.url ?? ''} title={bookmark.title} size={28} />
                ) : (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    <TextIcon size={14} />
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                    {bookmark.title}
                  </p>
                  <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                    {bookmark.type === 'link'
                      ? getDisplayHost(bookmark.url ?? '')
                      : (bookmark.content ?? '').replace(/\s+/g, ' ').slice(0, 70)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    onClick={() => openEdit(bookmark)}
                    aria-label={`编辑 ${bookmark.title}`}
                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  >
                    <EditIcon size={16} />
                  </button>
                  <button
                    onClick={() => removeOne(bookmark)}
                    aria-label={`删除 ${bookmark.title}`}
                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                  >
                    <TrashIcon size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setMenu({ id: bookmark.id, x: rect.right - 8, y: rect.bottom + 4 });
                    }}
                    aria-label="更多操作"
                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  >
                    <MoreIcon size={16} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Menu items={menuItems} anchor={menu ? { x: menu.x, y: menu.y } : null} onClose={() => setMenu(null)} />

      <BookmarkEditor
        open={editorOpen}
        editing={editing}
        onClose={() => {
          setEditorOpen(false);
          setEditing(null);
        }}
      />

      <ConfirmDialog />
    </>
  );
}

function HeaderActions({
  onAdd,
  sorting,
  onToggleSort,
  disabled,
}: {
  onAdd: () => void;
  sorting: boolean;
  onToggleSort: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Button variant="primary" icon={<PlusIcon size={15} />} onClick={onAdd}>
        新建收藏
      </Button>
      <Button
        variant={sorting ? 'primary' : 'secondary'}
        icon={sorting ? <CheckAllIcon size={15} /> : <SortIcon size={15} />}
        onClick={onToggleSort}
        disabled={disabled}
      >
        {sorting ? '完成排序' : '调整顺序'}
      </Button>
      {sorting && (
        <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <DragHandleIcon size={13} />
          拖动左侧手柄排序
        </span>
      )}
    </div>
  );
}

/** 拖拽排序模式下的行内容 */
function RowContent({ bookmark }: { bookmark: Bookmark }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {bookmark.type === 'link' ? (
        <Favicon url={bookmark.url ?? ''} title={bookmark.title} size={26} />
      ) : (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
          <TextIcon size={13} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
          {bookmark.title}
        </p>
        <p className="truncate text-xs text-slate-400 dark:text-slate-500">
          {bookmark.type === 'link'
            ? getDisplayHost(bookmark.url ?? '')
            : (bookmark.content ?? '').replace(/\s+/g, ' ').slice(0, 60)}
        </p>
      </div>
    </div>
  );
}
