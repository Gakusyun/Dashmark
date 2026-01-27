// ==================== 主应用入口 ====================
// 该文件负责初始化所有模块并暴露全局函数

import { initTheme } from './modules/theme.js';
import { initSearch } from './modules/search.js';
import { initBookmarks } from './modules/bookmarks.js';
import { initManagePanel, initTabs } from './modules/managePanel.js';
import { initModals } from './modules/modals.js';
import { closeLinkModal } from './modules/linkManager.js';
import { closeGroupModal } from './modules/groupManager.js';
import { closeSearchEngineModal } from './modules/searchEngineManager.js';

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

window.closeLinkModal = closeLinkModal;
window.closeGroupModal = closeGroupModal;
window.closeSearchEngineModal = closeSearchEngineModal;