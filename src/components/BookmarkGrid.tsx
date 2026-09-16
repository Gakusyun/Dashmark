import { useMemo, useState } from 'react';
import { BookmarkCard } from './BookmarkCard';
import { TextRecordCard } from './TextRecordCard';
import { PlusIcon, SearchIcon } from './Icons';
import { Button } from './ui/Button';
import type { Bookmark } from '../types';

interface BookmarkGridProps {
  bookmarks: Bookmark[];
  /** 当前是否有搜索词（影响空状态文案） */
  searching: boolean;
  onEdit: (bookmark: Bookmark) => void;
  onAdd: () => void;
}

/**
 * 收藏网格。
 *
 * 排序规则：链接优先于文字记录，各自按 order 升序 —— 让可点击的入口
 * 排在前面，符合"起始页"的使用直觉。
 */
export function BookmarkGrid({ bookmarks, searching, onEdit, onAdd }: BookmarkGridProps) {
  const [openTextId, setOpenTextId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return bookmarks
      .slice()
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'link' ? -1 : 1;
        return a.order - b.order;
      });
  }, [bookmarks]);

  if (sorted.length === 0) {
    return <EmptyState searching={searching} onAdd={onAdd} />;
  }

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
      {sorted.map((bookmark) =>
        bookmark.type === 'link' ? (
          <BookmarkCard key={bookmark.id} bookmark={bookmark} onEdit={onEdit} />
        ) : (
          <TextRecordCard
            key={bookmark.id}
            bookmark={bookmark}
            open={openTextId === bookmark.id}
            onOpen={() => setOpenTextId(bookmark.id)}
            onClose={() => setOpenTextId(null)}
          />
        )
      )}
    </div>
  );
}

function EmptyState({ searching, onAdd }: { searching: boolean; onAdd: () => void }) {
  if (searching) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-700">
        <SearchIcon size={26} className="mb-3 text-slate-300 dark:text-slate-600" />
        <p className="text-sm text-slate-500 dark:text-slate-400">没有找到匹配的收藏</p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          试试其他关键词，或按 Enter 直接搜索网络
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-700">
      <p className="text-sm text-slate-500 dark:text-slate-400">这里还是空的</p>
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
        添加第一个收藏，开始整理你的链接
      </p>
      <Button variant="primary" icon={<PlusIcon size={15} />} className="mt-4" onClick={onAdd}>
        新建收藏
      </Button>
    </div>
  );
}
