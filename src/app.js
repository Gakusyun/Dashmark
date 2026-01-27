// ==================== 主应用入口 ====================
// 该文件负责初始化所有模块并暴露全局函数

import { initTheme } from './modules/theme.js';
import { initSearch } from './modules/search.js';
import { initBookmarks, renderBookmarks } from './modules/bookmarks.js';
import { initManagePanel, initTabs } from './modules/managePanel.js';
import { initModals } from './modules/modals.js';
import * as linkManager from './modules/linkManager.js';
import * as groupManager from './modules/groupManager.js';
import * as searchEngineManager from './modules/searchEngineManager.js';

// ==================== 应用初始化 ====================

document.addEventListener('DOMContentLoaded', function () {
  initTheme();
  initSearch();
  initBookmarks();
  initManagePanel();
  initTabs();
  initModals();
});

// ==================== 将函数暴露给全局 (用于 HTML 中的 onclick) ====================

window.closeLinkModal = linkManager.closeLinkModal;
window.closeGroupModal = groupManager.closeGroupModal;
window.closeSearchEngineModal = searchEngineManager.closeSearchEngineModal;

// 暴露书签刷新函数供其他模块调用
window.refreshBookmarks = renderBookmarks;