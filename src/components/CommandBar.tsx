import { useEffect, useMemo, useRef, useState, useCallback } from 'react';import { useData } from '../contexts/DataContext';
import { usePinyin } from '../hooks/usePinyin';
import { searchBookmarks } from '../utils/searchScorer';
import { getDisplayHost } from '../utils/urlDisplay';
import { Favicon } from './ui/Favicon';
import { SearchIcon, CloseIcon, EnterIcon, GlobeIcon, TextIcon } from './Icons';
import { cn } from '../utils/cn';
import type { Bookmark } from '../types';

interface CommandBarProps {
  /** 由 App 持有的查询状态，便于其他区域联动过滤 */
  query: string;
  onQueryChange: (query: string) => void;
  /** 搜索建议面板展开时通知外层，用于弱化下方内容 */
  onPanelOpenChange?: (open: boolean) => void;
}

const MAX_RESULTS = 8;

/**
 * 统一命令栏。
 *
 * 一个输入框同时承担两件事：
 *  - 实时检索本地收藏；有结果时 ↑/↓ 选择，Enter 打开
 *  - 无结果或按 Cmd/Ctrl+Enter 时，用默认搜索引擎搜索网络
 */
export function CommandBar({ query, onQueryChange, onPanelOpenChange }: CommandBarProps) {
  const { data, allSearchEngines } = useData();
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [focused, setFocused] = useState(false);

  const trimmed = query.trim();
  const pinyin = usePinyin(trimmed.length > 0);

  const engine = useMemo(
    () => allSearchEngines.find((e) => e.id === data.settings.searchEngine),
    [allSearchEngines, data.settings.searchEngine]
  );

  const hits = useMemo(() => {
    if (!trimmed) return [];
    return searchBookmarks(data.bookmarks, trimmed, data.groups, pinyin).hits.slice(0, MAX_RESULTS);
  }, [data.bookmarks, data.groups, trimmed, pinyin]);

  const handleQueryChange = (value: string) => {
    onQueryChange(value);
    // 新输入时回到第一条结果
    setActiveIndex(0);
  };

  // 全局快捷键：Cmd/Ctrl+K 或 / 聚焦
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }
      if (e.key === '/' && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openWebSearch = useCallback(
    (term: string) => {
      if (!term || !engine) return;
      const url = engine.url.includes('{q}')
        ? engine.url.replace('{q}', encodeURIComponent(term))
        : engine.url + encodeURIComponent(term);
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    [engine]
  );

  const openBookmark = useCallback((bookmark: Bookmark) => {
    if (bookmark.type === 'link' && bookmark.url) {
      window.open(bookmark.url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (hits.length ? (i + 1) % hits.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (hits.length ? (i - 1 + hits.length) % hits.length : 0));
    } else if (e.key === 'Escape') {
      if (query) {
        e.preventDefault();
        onQueryChange('');
      } else {
        inputRef.current?.blur();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const webIntent = e.metaKey || e.ctrlKey || e.shiftKey;
      const active = hits[activeIndex];

      if (!webIntent && active) {
        openBookmark(active.bookmark);
        onQueryChange('');
      } else {
        openWebSearch(trimmed);
      }
    }
  };

  const showPanel = focused && trimmed.length > 0;
  // 占位文案保持简短，避免在窄屏被截断成半句话
  const placeholder = `搜索收藏或用「${engine?.name ?? '网络'}」搜索`;

  // 把面板的展开状态同步给外层
  useEffect(() => {
    onPanelOpenChange?.(showPanel);
  }, [showPanel, onPanelOpenChange]);

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      {/*
        焦点样式说明：
        全局 `:focus-visible` 会对可聚焦元素加上 outline，若这里再叠一层 ring，
        就会出现“双框”。因此输入框自身用 `focus:outline-none` 关掉原生轮廓，
        由容器统一表达焦点状态（单一边框变色 + 一层极淡 ring）。
      */}
      <div
        className={cn(
          'flex h-10 items-center gap-2 rounded-xl border bg-white px-3 shadow-sm transition-[border-color,box-shadow] duration-150 sm:h-11 sm:gap-2.5 sm:px-3.5 dark:bg-black',
          focused
            ? 'border-sky-500 ring-2 ring-sky-500/15 dark:border-sky-400'
            : 'border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500'
        )}
      >
        <SearchIcon
          size={17}
          className={cn(
            'shrink-0 transition-colors',
            focused ? 'text-sky-500' : 'text-slate-400'
          )}
        />
        <input
          ref={inputRef}
          id="dashmark-search"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          aria-label="搜索收藏或搜索网络"
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:outline-none focus-visible:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        {query ? (
          <button
            onClick={() => {
              onQueryChange('');
              setActiveIndex(0);
              inputRef.current?.focus();
            }}
            aria-label="清空搜索"
            className="-mr-1 shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-900 dark:hover:text-slate-200"
          >
            <CloseIcon size={15} />
          </button>
        ) : (
          <kbd className="hidden shrink-0 rounded border border-slate-300 px-1.5 py-0.5 font-sans text-[10px] font-medium text-slate-400 sm:block dark:border-slate-600 dark:text-slate-500">
            ⌘K
          </kbd>
        )}
      </div>

      {showPanel && (
        <div className="animate-rise absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-black dark:shadow-none">
          {hits.length > 0 && (
            <ul className="max-h-[min(60vh,20rem)] overflow-y-auto p-1.5 scrollbar-thin">
              {hits.map((hit, index) => (
                <li key={hit.bookmark.id}>
                  <button
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      openBookmark(hit.bookmark);
                      onQueryChange('');
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors',
                      index === activeIndex ? 'bg-sky-50 dark:bg-sky-950/40' : ''
                    )}
                  >
                    {hit.bookmark.type === 'link' ? (
                      <Favicon url={hit.bookmark.url ?? ''} title={hit.bookmark.title} size={26} />
                    ) : (
                      <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                        <TextIcon size={14} />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                        {hit.bookmark.title}
                      </span>
                      <span className="block truncate text-xs text-slate-400 dark:text-slate-500">
                        {hit.bookmark.type === 'link'
                          ? getDisplayHost(hit.bookmark.url ?? '')
                          : (hit.bookmark.content ?? '').replace(/\s+/g, ' ')}
                      </span>
                    </span>
                    {index === activeIndex && (
                      <EnterIcon size={14} className="shrink-0 text-slate-400" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {hits.length === 0 && (
            <p className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500">
              没有匹配的收藏
            </p>
          )}

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => openWebSearch(trimmed)}
            className="flex w-full items-center gap-3 border-t border-slate-200 px-3.5 py-2.5 text-left transition-colors hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900"
          >
            <GlobeIcon size={16} className="shrink-0 text-slate-400" />
            <span className="min-w-0 flex-1 truncate text-sm text-slate-600 dark:text-slate-400">
              用 <span className="font-medium">{engine?.name ?? '网络'}</span> 搜索「{trimmed}」
            </span>
            <span className="hidden shrink-0 text-[10px] text-slate-400 sm:block">
              ⌘↵
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
