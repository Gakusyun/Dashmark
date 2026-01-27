// ==================== 管理面板模块 ====================

import { openAddLinkModal, batchDeleteLinks } from './linkManager.js';
import { openAddGroupModal } from './groupManager.js';
import { openAddSearchEngineModal, renderSettings as renderSearchEngineSettings } from './searchEngineManager.js';
import { exportData, importData } from '../storage.js';

let currentTab = 'links';

/**
 * 初始化管理面板
 */
export function initManagePanel() {
  const btnManage = document.querySelector('.btn-manage');
  const btnClosePanel = document.getElementById('btn-close-panel');
  const managePanel = document.getElementById('manage-panel');

  // 点击 Dashmark 打开/关闭管理面板
  btnManage.addEventListener('click', function (e) {
    e.stopPropagation();
    if (managePanel.classList.contains('active')) {
      // 面板已打开,关闭它
      managePanel.classList.remove('active');
      setTimeout(() => managePanel.classList.add('hidden'), 300);
    } else {
      // 面板未打开,打开它
      managePanel.classList.remove('hidden');
      setTimeout(() => managePanel.classList.add('active'), 10);
      renderManageContent();
    }
  });

  // 关闭管理面板
  btnClosePanel.addEventListener('click', function () {
    managePanel.classList.remove('active');
    setTimeout(() => managePanel.classList.add('hidden'), 300);
  });

  // 添加链接按钮
  document.getElementById('btn-add-link').addEventListener('click', openAddLinkModal);

  // 批量删除按钮
  document.getElementById('btn-batch-delete').addEventListener('click', batchDeleteLinks);

  // 添加分组按钮
  document.getElementById('btn-add-group').addEventListener('click', openAddGroupModal);

  // 添加搜索引擎按钮
  document.getElementById('btn-add-search-engine').addEventListener('click', openAddSearchEngineModal);

  // 导出数据按钮
  document.getElementById('btn-export').addEventListener('click', exportData);

  // 导入数据按钮
  const btnImport = document.getElementById('btn-import');
  const importFile = document.getElementById('import-file');
  btnImport.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', handleImport);
}

/**
 * 初始化标签页
 */
export function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      const tab = this.getAttribute('data-tab');
      switchTab(tab);
    });
  });
}

/**
 * 切换标签页
 */
export function switchTab(tab) {
  currentTab = tab;

  // 更新标签按钮状态
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-tab') === tab) {
      btn.classList.add('active');
    }
  });

  // 更新标签内容显示
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`tab-${tab}`).classList.add('active');

  // 渲染对应内容
  renderManageContent();
}

/**
 * 渲染管理面板内容
 */
export function renderManageContent() {
  if (currentTab === 'links') {
    renderLinksList();
  } else if (currentTab === 'groups') {
    renderGroupsList();
  } else if (currentTab === 'settings') {
    renderSettings();
  }
}

/**
 * 渲染链接列表
 */
export function renderLinksList() {
  // 延迟加载以避免循环依赖
  import('./linkManager.js').then(module => {
    module.renderLinksList();
  });
}

/**
 * 渲染分组列表
 */
export function renderGroupsList() {
  // 延迟加载以避免循环依赖
  import('./groupManager.js').then(module => {
    module.renderGroupsList();
  });
}

/**
 * 渲染设置页面
 */
function renderSettings() {
  renderSearchEngineSettings();
}

/**
 * 处理数据导入
 */
function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  importData(
    file,
    function (data) {
      alert('数据导入成功');
      e.target.value = ''; // 重置文件输入
      renderManageContent();
    },
    function (error) {
      alert('导入失败:' + error.message);
      e.target.value = ''; // 重置文件输入
    }
  );
}