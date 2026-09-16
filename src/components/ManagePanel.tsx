import React, { lazy, Suspense, useState } from 'react';
import { CloseIcon } from './Icons';

// 懒加载管理组件
const BookmarkManager = lazy(() =>
  import('./BookmarkManager').then((m) => ({ default: m.BookmarkManager }))
);
const GroupManager = lazy(() =>
  import('./GroupManager').then((m) => ({ default: m.GroupManager }))
);
const Settings = lazy(() => import('./Settings').then((m) => ({ default: m.Settings })));
const About = lazy(() => import('./About').then((m) => ({ default: m.About })));

interface ManagePanelProps {
  open: boolean;
  onClose: () => void;
  autoAdd?: number;
  onAutoAddConsumed?: () => void;
}

const tabs = ['收藏', '分组', '设置', '关于'] as const;

export const ManagePanel: React.FC<ManagePanelProps> = ({
  open,
  onClose,
  autoAdd,
  onAutoAddConsumed,
}) => {
  const [tabValue, setTabValue] = useState(0);

  if (!open) return null;

  const handleClose = () => {
    // 移除焦点以避免可访问性警告
    (document.activeElement as HTMLElement)?.blur();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9990]">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* 侧边抽屉 */}
      <div className="absolute right-0 top-0 flex h-full w-full flex-col bg-white shadow-2xl sm:w-[500px] md:w-[600px] dark:bg-[#1e1e1e]">
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">管理收藏</h2>
          <button
            onClick={handleClose}
            aria-label="关闭"
            className="rounded p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* 标签栏 */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              onClick={() => setTabValue(index)}
              className={`flex-1 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                tabValue === index
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-auto p-4">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />
              </div>
            }
          >
            {tabValue === 0 && (
              <BookmarkManager onClose={onClose} autoAdd={autoAdd} onAutoAddConsumed={onAutoAddConsumed} />
            )}
            {tabValue === 1 && <GroupManager onClose={onClose} />}
            {tabValue === 2 && <Settings />}
            {tabValue === 3 && <About />}
          </Suspense>
        </div>
      </div>
    </div>
  );
};
