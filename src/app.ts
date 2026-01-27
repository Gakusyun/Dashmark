// ==================== 主应用入口 ====================
// 该文件负责初始化所有模块并暴露全局函数

import { initTheme } from './modules/theme.ts';
import { initSearch } from './modules/search.ts';
import { initBookmarks, renderBookmarks } from './modules/bookmarks.ts';
import { initManagePanel, initTabs } from './modules/managePanel.ts';
import { initModals } from './modules/modals.ts';
import * as linkManager from './modules/linkManager.ts';
import * as groupManager from './modules/groupManager.ts';
import * as searchEngineManager from './modules/searchEngineManager.ts';
import { initWebDAVManager } from './modules/webdavManager.ts';
import { checkAndAutoSync, scheduleAutoSync } from './modules/syncService.ts';

// 扩展 Window 接口以包含全局函数
declare global {
  interface Window {
    closeLinkModal: () => void;
    closeGroupModal: () => void;
    closeSearchEngineModal: () => void;
    refreshBookmarks: () => void;
  }
}

// ==================== 应用初始化 ====================

document.addEventListener('DOMContentLoaded', function () {
  initTheme();
  initSearch();
  initBookmarks();
  initManagePanel();
  initTabs();
  initModals();
  initWebDAVManager();

  // 检查是否需要自动同步
  checkAndAutoSync();

  // 监听数据保存事件，触发自动同步
  window.addEventListener('data-saved', () => {
    scheduleAutoSync();
  });
});

// ==================== 将函数暴露给全局 (用于 HTML 中的 onclick) ====================

window.closeLinkModal = linkManager.closeLinkModal;
window.closeGroupModal = groupManager.closeGroupModal;
window.closeSearchEngineModal = searchEngineManager.closeSearchEngineModal;

// 暴露书签刷新函数供其他模块调用
window.refreshBookmarks = renderBookmarks;