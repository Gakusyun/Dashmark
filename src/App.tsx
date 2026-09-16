import { useState, useEffect, useRef } from 'react';
import Clarity from '@microsoft/clarity';
import { useData } from './contexts/DataContext';
import { SearchBox } from './components/SearchBox';
import { GroupSection, AllBookmarks } from './components/GroupSection';
import { ManagePanel } from './components/ManagePanel';
import { useConfirmDialog } from './hooks/useConfirmDialog';
import { SettingsIcon, CloseIcon, AddIcon } from './components/Icons';

type ViewMode = 'all' | 'group' | null;
type SelectedGroup = string | 'all' | null;

const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID || 'vay8fvwhta';

// 防止重复初始化 Clarity
let clarityInitialized = false;

const App: React.FC = () => {
  const { data, loading, updateSettings } = useData();
  const [managePanelOpen, setManagePanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(null);
  const [selectedGroup, setSelectedGroup] = useState<SelectedGroup>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConsent, setShowConsent] = useState(false);
  const [autoAdd, setAutoAdd] = useState(0);
  const { confirm, ConfirmDialog } = useConfirmDialog();

  // 创建一个ref来存储updateSettings函数，避免在useEffect依赖中引起循环
  const updateSettingsRef = useRef(updateSettings);
  useEffect(() => {
    updateSettingsRef.current = updateSettings;
  }, [updateSettings]);

  // Cookie同意对话框逻辑
  useEffect(() => {
    if (loading) return;

    if (data.settings.cookieConsent === null) {
      const timer = setTimeout(() => {
        setShowConsent(true);
      }, 0);
      return () => clearTimeout(timer);
    } else if (data.settings.cookieConsent === true) {
      if (!clarityInitialized) {
        try {
          Clarity.init(projectId);
          clarityInitialized = true;
          console.log('[DashMark] Clarity 分析已初始化');
        } catch (error) {
          console.warn('[DashMark] Clarity 初始化失败（可能是广告拦截器）:', error);
        }
      }
    }
  }, [data.settings.cookieConsent, loading]);

  // 全局键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K: 聚焦页内搜索
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('dashmark-search')?.focus();
        return;
      }

      // /: 聚焦页内搜索（仅当焦点不在输入框中时）
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        document.getElementById('dashmark-search')?.focus();
        return;
      }

      // Escape: 关闭管理面板
      if (e.key === 'Escape') {
        if (managePanelOpen) {
          setManagePanelOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [managePanelOpen]);

  useEffect(() => {
    if (showConsent) {
      const handleConfirm = () => {
        updateSettingsRef.current({ cookieConsent: true });
        if (!clarityInitialized) {
          try {
            Clarity.init(projectId);
            clarityInitialized = true;
            console.log('[DashMark] Clarity 分析已初始化');
          } catch (error) {
            console.warn('[DashMark] Clarity 初始化失败（可能是广告拦截器）:', error);
          }
        }
        setShowConsent(false);
      };

      const handleCancel = () => {
        updateSettingsRef.current({ cookieConsent: false });
        setShowConsent(false);
      };

      const timer = setTimeout(() => {
        confirm({
          title: 'Cookie 同意',
          content:
            '我们使用 Microsoft Clarity 来分析网站使用情况，以改善用户体验。是否同意使用 Cookie 进行分析？（可在设置中随时关闭）',
          confirmText: '同意',
          cancelText: '拒绝',
          confirmColor: 'primary',
          confirmVariant: 'solid',
          cancelVariant: 'outline',
          onConfirm: handleConfirm,
          onCancel: handleCancel,
        });
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [showConsent, confirm]);

  const handleGroupClick = (groupId: string) => {
    setSelectedGroup(groupId);
    setViewMode('group');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAllClick = () => {
    setSelectedGroup('all');
    setViewMode('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setViewMode(null);
    setSelectedGroup(null);
  };

  const handleFabClick = () => {
    setAutoAdd((prev) => prev + 1);
    setManagePanelOpen(true);
  };

  const renderContent = () => {
    // 搜索结果视图
    if (searchQuery.trim()) {
      return <AllBookmarks isFullscreen={false} searchQuery={searchQuery} />;
    }

    // 单分组视图
    if (viewMode === 'group' && selectedGroup && selectedGroup !== 'all') {
      const group = data.groups.find((g) => g.id === selectedGroup);
      if (group) {
        return <GroupSection group={group} isFullscreen onBack={handleBack} />;
      }
    }

    // 所有收藏视图
    if (viewMode === 'all' || selectedGroup === 'all') {
      return <AllBookmarks isFullscreen onBack={handleBack} />;
    }

    // 默认视图
    if (data.groups.length === 0) {
      return (
        <div className="py-16 text-center">
          <p className="mb-1 text-slate-500 dark:text-slate-400">暂无分组和链接</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">点击右上角设置按钮开始添加</p>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.groups.map((group) => (
            <GroupSection key={group.id} group={group} onClick={() => handleGroupClick(group.id)} />
          ))}
        </div>
        <div className="mt-4">
          <AllBookmarks onClick={handleAllClick} />
        </div>
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />
        <p className="text-slate-500 dark:text-slate-400">正在加载数据...</p>
      </div>
    );
  }

  return (
    <>
      {/* 顶部导航栏 */}
      <header className="mb-8 border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-[#121212]">
        <div className="mx-auto flex max-w-[1200px] items-center gap-4 px-4 py-3">
          <h1 className="flex-1 cursor-pointer text-2xl font-medium text-slate-900 dark:text-white">
            DashMark
          </h1>
          <div className="flex items-center gap-1 border-b border-slate-300 transition-colors focus-within:border-blue-500 dark:border-slate-600">
            <input
              id="dashmark-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="页内搜索"
              className="w-[180px] bg-transparent px-1 py-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="清除搜索"
                className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <CloseIcon size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setManagePanelOpen(true)}
            aria-label="设置"
            className="rounded p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <SettingsIcon size={22} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 pb-8">
        <SearchBox />
        <div className="min-h-[50vh]">{renderContent()}</div>

        {!data.settings.hideLegalInfo && (
          <footer className="mt-8 border-t border-slate-200 pt-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              鄂 ICP 备 2024069158 号
            </a>
            <div className="mt-1 flex items-center justify-center gap-1.5">
              <img src="/police.webp" alt="备案图标" className="h-[16.5px]" />
              <a
                href="https://beian.mps.gov.cn/#/query/webSearch?code=42050002420933"
                rel="noreferrer"
                target="_blank"
                className="hover:underline"
              >
                鄂公网安备 42050002420933 号
              </a>
            </div>
          </footer>
        )}
      </main>

      {/* 悬浮添加按钮 */}
      <button
        aria-label="添加收藏"
        onClick={handleFabClick}
        className="fixed bottom-4 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-colors hover:bg-blue-700"
      >
        <AddIcon size={24} />
      </button>

      <ManagePanel
        open={managePanelOpen}
        onClose={() => setManagePanelOpen(false)}
        autoAdd={autoAdd}
        onAutoAddConsumed={() => setAutoAdd(0)}
      />
      <ConfirmDialog />
    </>
  );
};

export default App;
