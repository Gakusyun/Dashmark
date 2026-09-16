import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Clarity from '@microsoft/clarity';
import { useData } from './contexts/DataContext';
import { useConfirmDialog } from './hooks/useConfirmDialog';
import { usePinyin } from './hooks/usePinyin';
import { searchBookmarks } from './utils/searchScorer';
import { isTopEscapeLayer, popEscapeLayer, pushEscapeLayer } from './utils/escapeStack';
import { CommandBar } from './components/CommandBar';
import { GroupTabs, type GroupFilter } from './components/GroupTabs';
import { BookmarkGrid } from './components/BookmarkGrid';
import { BookmarkEditor } from './components/BookmarkEditor';
import { Manager, type ManagerTab } from './components/Manager';
import {
  SettingsIcon,
  PlusIcon,
  SpinnerIcon,
  BookmarkTabIcon,
} from './components/Icons';
import { Button } from './components/ui/Button';
import { SunIcon, MoonIcon } from './components/Icons';
import { cn } from './utils/cn';
import { useTheme } from './contexts/ThemeContext';
import type { Bookmark } from './types';

const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID || 'vay8fvwhta';

// 防止重复初始化 Clarity
let clarityInitialized = false;

function initClarity() {
  if (clarityInitialized) return;
  try {
    Clarity.init(projectId);
    clarityInitialized = true;
  } catch (error) {
    console.warn('[DashMark] Clarity 初始化失败（可能是广告拦截器）:', error);
  }
}

const App: React.FC = () => {
  const { data, loading, updateSettings } = useData();

  const [query, setQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState<GroupFilter>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Bookmark | null>(null);
  const [managerOpen, setManagerOpen] = useState(false);
  const [managerTab, setManagerTab] = useState<ManagerTab>('bookmarks');
  const [addNonce, setAddNonce] = useState(0);
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);

  const { confirm, ConfirmDialog } = useConfirmDialog();

  const updateSettingsRef = useRef(updateSettings);
  useEffect(() => {
    updateSettingsRef.current = updateSettings;
  }, [updateSettings]);

  const trimmedQuery = query.trim();
  const pinyin = usePinyin(trimmedQuery.length > 0);

  // ==================== Cookie 同意 ====================
  const consentAsked = useRef(false);
  useEffect(() => {
    if (loading || consentAsked.current) return;
    if (data.settings.cookieConsent === true) {
      initClarity();
      return;
    }
    if (data.settings.cookieConsent === null) {
      consentAsked.current = true;
      const timer = setTimeout(() => {
        confirm({
          title: '是否允许匿名统计？',
          content:
            '我们使用 Microsoft Clarity 了解功能使用情况以持续改进。不会收集书签内容，你也可以随时在设置中关闭。',
          confirmText: '允许',
          cancelText: '不允许',
          tone: 'primary',
          onConfirm: () => {
            updateSettingsRef.current({ cookieConsent: true });
            initClarity();
          },
          onCancel: () => updateSettingsRef.current({ cookieConsent: false }),
        });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [loading, data.settings.cookieConsent, confirm]);

  // ==================== 分组计数 ====================
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const bookmark of data.bookmarks) {
      for (const gid of bookmark.groupIds) {
        map.set(gid, (map.get(gid) ?? 0) + 1);
      }
    }
    return map;
  }, [data.bookmarks]);

  // ==================== 当前展示的收藏 ====================
  // 搜索优先：跨分组检索全部收藏。若当前分组已被删除，则退回到"全部"。
  const effectiveGroup: GroupFilter =
    activeGroup === 'all' || data.groups.some((g) => g.id === activeGroup) ? activeGroup : 'all';

  const visible = useMemo(() => {
    if (trimmedQuery) {
      return searchBookmarks(data.bookmarks, trimmedQuery, data.groups, pinyin).hits.map(
        (h) => h.bookmark
      );
    }
    if (effectiveGroup === 'all') return data.bookmarks;
    return data.bookmarks.filter((b) => b.groupIds.includes(effectiveGroup));
  }, [data.bookmarks, data.groups, trimmedQuery, effectiveGroup, pinyin]);

  const openNewEditor = useCallback(() => {
    setEditing(null);
    setEditorOpen(true);
  }, []);

  const openEditEditor = useCallback((bookmark: Bookmark) => {
    setEditing(bookmark);
    setEditorOpen(true);
  }, []);

  const openManager = useCallback((tab: ManagerTab) => {
    setManagerTab(tab);
    setManagerOpen(true);
  }, []);

  // Esc 关闭管理台。
  // 若其中打开了弹窗（如收藏编辑器），该弹窗会成为更上层，
  // 此时管理台不应响应 Esc，否则会一次关掉两层。
  useEffect(() => {
    if (!managerOpen) return;
    const layer = pushEscapeLayer();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (!isTopEscapeLayer(layer)) return;
      setManagerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      popEscapeLayer(layer);
    };
  }, [managerOpen]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <SpinnerIcon size={24} className="animate-spin text-slate-400" />
        <p className="text-sm text-slate-400 dark:text-slate-500">正在加载数据…</p>
      </div>
    );
  }

  const isEmpty = data.bookmarks.length === 0 && data.groups.length === 0;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-slate-50/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4">
          <button
            onClick={() => {
              setQuery('');
              setActiveGroup('all');
            }}
            className="flex shrink-0 items-center gap-2 text-base font-semibold text-slate-900 transition-opacity hover:opacity-70 dark:text-white"
            aria-label="回到首页"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <BookmarkTabIcon size={16} />
            </span>
            <span className="hidden md:inline">DashMark</span>
          </button>

          <div className="min-w-0 flex-1">
            <CommandBar
              query={query}
              onQueryChange={setQuery}
              onPanelOpenChange={setSearchPanelOpen}
            />
          </div>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            {/* 新建：移动端由右下角悬浮按钮承担，避免顶栏拥挤 */}
            <span className="hidden sm:inline-flex">
              <Button
                variant="ghost"
                size="icon"
                onClick={openNewEditor}
                aria-label="新建收藏"
                title="新建收藏"
              >
                <PlusIcon size={18} />
              </Button>
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openManager('settings')}
              aria-label="设置"
              title="设置"
            >
              <SettingsIcon size={18} />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-5">
        {/* 搜索建议展开时弱化下方内容，把注意力集中到结果上。
            使用模糊 + 降低不透明度，在浅色与深色下都能形成清晰的前后层次。 */}
        <div
          className={cn(
            'transition-[opacity,filter] duration-200',
            searchPanelOpen && trimmedQuery
              ? 'pointer-events-none opacity-30 blur-[2px] select-none'
              : 'opacity-100 blur-0'
          )}
          aria-hidden={searchPanelOpen && Boolean(trimmedQuery)}
        >
          {isEmpty ? (
            <WelcomeEmpty onCreate={openNewEditor} onManage={() => openManager('groups')} />
          ) : (
            <>
              <div className="mb-4 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <GroupTabs
                    groups={data.groups}
                    active={effectiveGroup}
                    counts={counts}
                    totalCount={data.bookmarks.length}
                    onChange={setActiveGroup}
                  />
                </div>
                <span className="hidden shrink-0 sm:inline-flex">
                  <Button variant="ghost" size="sm" onClick={() => openManager('bookmarks')}>
                    管理
                  </Button>
                </span>
              </div>

              {trimmedQuery && (
                <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
                  找到 {visible.length} 个匹配「{trimmedQuery}」的收藏
                </p>
              )}

              <BookmarkGrid
                bookmarks={visible}
                searching={Boolean(trimmedQuery)}
                onEdit={openEditEditor}
                onAdd={openNewEditor}
              />
            </>
          )}
        </div>

        {/* 页脚不参与搜索时的弱化处理，始终保持可读；mt-auto 使其贴住视口底部 */}
        <div className="mt-auto pt-10">
          {!data.settings.hideLegalInfo && <Footer />}
        </div>
      </main>

      <BookmarkEditor
        open={editorOpen}
        editing={editing}
        defaultGroupIds={effectiveGroup === 'all' ? [] : [effectiveGroup]}
        onClose={() => {
          setEditorOpen(false);
          setEditing(null);
        }}
      />

      <Manager
        open={managerOpen}
        initialTab={managerTab}
        autoAdd={addNonce > 0}
        autoAddNonce={addNonce}
        onAutoAddConsumed={() => setAddNonce(0)}
        onClose={() => setManagerOpen(false)}
      />

      {/* 移动端悬浮新建按钮 */}
      {!isEmpty && (
        <button
          onClick={openNewEditor}
          aria-label="新建收藏"
          className="fixed right-4 bottom-4 z-20 flex h-13 w-13 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 transition-transform hover:scale-105 active:scale-95 sm:hidden"
          style={{ height: '3.25rem', width: '3.25rem' }}
        >
          <PlusIcon size={22} />
        </button>
      )}

      <ConfirmDialog />
    </>
  );
};

/** 顶栏主题快捷切换：在浅色 / 深色之间切换，跟随系统状态保留在设置里 */
function ThemeToggle() {
  const { actualMode, setMode } = useTheme();
  const isDark = actualMode === 'dark';
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setMode(isDark ? 'light' : 'dark')}
      aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
      title={isDark ? '切换到浅色模式' : '切换到深色模式'}
    >
      {isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
    </Button>
  );
}

function WelcomeEmpty({
  onCreate,
  onManage,
}: {
  onCreate: () => void;
  onManage: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
        <BookmarkTabIcon size={26} />
      </span>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">欢迎使用 DashMark</h2>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        把常用的链接收进分组，用 Ctrl/⌘ + K 随时唤出命令栏，几秒内抵达任何地方。
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button variant="primary" size="lg" icon={<PlusIcon size={16} />} onClick={onCreate}>
          添加第一个收藏
        </Button>
        <Button variant="secondary" size="lg" onClick={onManage}>
          先创建分组
        </Button>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 pt-5 pb-2 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
      <div className="flex flex-col items-center gap-1">
        <a
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-slate-600 dark:hover:text-slate-300"
        >
          鄂 ICP 备 2024069158 号
        </a>
        <a
          href="https://beian.mps.gov.cn/#/query/webSearch?code=42050002420933"
          rel="noreferrer"
          target="_blank"
          className="inline-flex items-center gap-1.5 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
        >
          <img src="/police.webp" alt="" className="h-3.5" />
          鄂公网安备 42050002420933 号
        </a>
      </div>
    </footer>
  );
}

export default App;
