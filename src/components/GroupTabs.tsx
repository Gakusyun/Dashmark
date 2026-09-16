import { useRef, useEffect } from 'react';
import { cn } from '../utils/cn';
import type { Group } from '../types';

export type GroupFilter = 'all' | string;

interface GroupTabsProps {
  groups: Group[];
  active: GroupFilter;
  counts: Map<string, number>;
  totalCount: number;
  onChange: (value: GroupFilter) => void;
}

/**
 * 分组切换条。
 *
 * 取代旧版"点击卡片跳转到全屏视图"的模式：分组始终在顶部可见，
 * 切换零跳转、零返回。移动端横向滚动。
 */
export function GroupTabs({ groups, active, counts, totalCount, onChange }: GroupTabsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // 选中项滚动进视野（键盘切换或刷新后）
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [active]);

  const tabs: { id: GroupFilter; label: string; count: number }[] = [
    { id: 'all', label: '全部', count: totalCount },
    ...groups
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((g) => ({ id: g.id, label: g.name, count: counts.get(g.id) ?? 0 })),
  ];

  return (
    <div
      ref={scrollerRef}
      className="scrollbar-none -mx-1 flex items-center gap-1 overflow-x-auto px-1 py-1"
      role="tablist"
      aria-label="分组"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            ref={isActive ? activeRef : undefined}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
              isActive
                ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200'
            )}
          >
            {tab.label}
            <span
              className={cn(
                'rounded-full px-1.5 text-[10px] tabular-nums',
                isActive
                  ? 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-500'
              )}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
