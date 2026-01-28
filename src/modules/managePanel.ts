// ==================== 管理面板模块 ====================

import { openAddLinkModal, batchDeleteLinks, renderLinksList } from './linkManager.ts';
import { openAddGroupModal, renderGroupsList } from './groupManager.ts';
import { openAddSearchEngineModal, renderSettings as renderSearchEngineSettings } from './searchEngineManager.ts';
import { exportData, importData } from '../storage.ts';
import type { ImportSuccessCallback, ImportErrorCallback } from '../storage.ts';

let currentTab: string = 'links';

/**
 * 切换管理面板状态
 */
function toggleManagePanel(panel: HTMLElement): void {
  if (panel.classList.contains('active')) {
    panel.classList.remove('active');
    setTimeout(() => panel.classList.add('hidden'), 300);
  } else {
    panel.classList.remove('hidden');
    setTimeout(() => panel.classList.add('active'), 10);
    renderManageContent();
  }
}

/**
 * 初始化管理面板
 */
export function initManagePanel(): void {
  const btnManage = document.querySelector('.btn-manage') as HTMLElement;
  const btnClosePanel = document.getElementById('btn-close-panel') as HTMLElement;
  const managePanel = document.getElementById('manage-panel') as HTMLElement;

  // 点击 Dashmark 打开/关闭管理面板
  btnManage.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleManagePanel(managePanel);
  });

  // 关闭管理面板
  btnClosePanel.addEventListener('click', () => {
    managePanel.classList.remove('active');
    setTimeout(() => managePanel.classList.add('hidden'), 300);
  });

  // 绑定按钮事件
  const buttonHandlers: Record<string, () => void> = {
    'btn-add-link': openAddLinkModal,
    'btn-batch-delete': batchDeleteLinks,
    'btn-add-group': openAddGroupModal,
    'btn-add-search-engine': openAddSearchEngineModal,
    'btn-export': exportData
  };

  Object.entries(buttonHandlers).forEach(([id, handler]) => {
    document.getElementById(id)?.addEventListener('click', handler);
  });

  // 导入数据按钮
  const btnImport = document.getElementById('btn-import') as HTMLElement;
  const importFile = document.getElementById('import-file') as HTMLInputElement;
  btnImport.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', handleImport);
}

/**
 * 初始化标签页
 */
export function initTabs(): void {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function (this: HTMLElement) {
      const tab = this.getAttribute('data-tab');
      if (tab) {
        switchTab(tab);
      }
    });
  });
}

/**
 * 切换标签页
 */
export function switchTab(tab: string): void {
  currentTab = tab;

  // 更新标签按钮状态
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
  });

  // 更新标签内容显示
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `tab-${tab}`);
  });

  // 渲染对应内容
  renderManageContent();
}

/**
 * 渲染管理面板内容
 */
export function renderManageContent(): void {
  const renderers: Record<string, () => void> = {
    links: renderLinksList,
    groups: renderGroupsList,
    settings: renderSettings,
    data: renderData
  };

  renderers[currentTab]?.();
}

/**
 * 渲染数据页面
 */
function renderData(): void {
  // 数据页面无需额外渲染
}

/**
 * 渲染设置页面
 */
function renderSettings(): void {
  renderSearchEngineSettings();
}

/**
 * 处理数据导入
 */
function handleImport(e: Event): void {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const onSuccess: ImportSuccessCallback = function () {
    alert('数据导入成功');
    target.value = '';
    renderManageContent();
  };

  const onError: ImportErrorCallback = function (error: Error) {
    alert('导入失败:' + error.message);
    target.value = '';
  };

  importData(file, onSuccess, onError);
}