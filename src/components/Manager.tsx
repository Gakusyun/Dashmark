import { lazy, Suspense, useState } from 'react';
import { CloseIcon } from './Icons';
import { cn } from '../utils/cn';
import { BookmarkTabIcon, GroupTabIcon, SettingsIcon, AboutTabIcon, SpinnerIcon } from './Icons';
import { Button } from './ui/Button';

const BookmarkManager = lazy(() =>
  import('./BookmarkManager').then((m) => ({ default: m.BookmarkManager }))
);
const GroupManager = lazy(() => import('./GroupManager').then((m) => ({ default: m.GroupManager })));
const SettingsPanel = lazy(() =>
  import('./SettingsPanel').then((m) => ({ default: m.SettingsPanel }))
);
const About = lazy(() => import('./About').then((m) => ({ default: m.About })));

export type ManagerTab = 'bookmarks' | 'groups' | 'settings' | 'about';

const NAV: { id: ManagerTab; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: 'bookmarks', label: '收藏', icon: <BookmarkTabIcon size={18} />, hint: '管理所有链接与文字记录' },
  { id: 'groups', label: '分组', icon: <GroupTabIcon size={18} />, hint: '管理分组与排序' },
  { id: 'settings', label: '设置', icon: <SettingsIcon size={18} />, hint: '外观、搜索引擎与数据' },
  { id: 'about', label: '关于', icon: <AboutTabIcon size={18} />, hint: '版本与开源信息' },
];

interface ManagerProps {
  open: boolean;
  initialTab?: ManagerTab;
  /** 打开时自动触发"新建收藏" */
  autoAdd?: boolean;
  autoAddNonce?: number;
  onAutoAddConsumed?: () => void;
  onClose: () => void;
}

/**
 * 管理台：整屏覆盖式界面。
 *
 * 旧版是 500px 侧边抽屉 + 4 个下划线 tab，空间局促。这里改为：
 * 左侧图标导航 + 右侧宽内容区，桌面端常驻导航，移动端顶部横向导航。
 */
export function Manager({
  open,
  initialTab = 'bookmarks',
  autoAdd = false,
  autoAddNonce = 0,
  onAutoAddConsumed,
  onClose,
}: ManagerProps) {
  const [tab, setTab] = useState<ManagerTab>(initialTab);
  const [lastInitial, setLastInitial] = useState<ManagerTab>(initialTab);

  // 外部请求切换初始标签页时同步
  if (open && initialTab !== lastInitial) {
    setLastInitial(initialTab);
    setTab(initialTab);
  }

  if (!open) return null;

  return (
    <div className="animate-fade-in fixed inset-0 z-[9980] flex flex-col bg-white dark:bg-black">
      {/* 顶栏 */}
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-black">
        <h2 className="flex-1 text-base font-semibold text-slate-900 dark:text-slate-100">管理</h2>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="关闭管理台">
          <CloseIcon size={18} />
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
        {/* 导航 */}
        <nav className="shrink-0 border-b border-slate-200 bg-white px-2 py-2 sm:w-56 sm:border-r sm:border-b-0 sm:py-4 dark:border-slate-700 dark:bg-black">
          <div className="scrollbar-none flex gap-1 overflow-x-auto sm:flex-col sm:overflow-visible">
            {NAV.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:w-full',
                    active
                      ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900'
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* 内容 */}
        <main className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">
            <Suspense
              fallback={
                <div className="flex justify-center py-20">
                  <SpinnerIcon size={22} className="animate-spin text-slate-400" />
                </div>
              }
            >
              {tab === 'bookmarks' && (
                <BookmarkManager
                  autoAdd={autoAdd}
                  autoAddNonce={autoAddNonce}
                  onAutoAddConsumed={onAutoAddConsumed}
                />
              )}
              {tab === 'groups' && <GroupManager />}
              {tab === 'settings' && <SettingsPanel />}
              {tab === 'about' && <About />}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
