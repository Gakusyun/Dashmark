// ==================== 搜索引擎管理模块 ====================

import { loadData, getSettings, updateSettings, getAllSearchEngines, addSearchEngine, updateSearchEngine, deleteSearchEngine } from '../storage.ts';
import type { SearchEngine } from '../storage.ts';

/**
 * 渲染设置页面
 */
export function renderSettings(): void {
  const settings = getSettings();

  // 渲染主题设置
  const darkModeSelect = document.getElementById('dark-mode-select') as HTMLSelectElement;
  if (darkModeSelect) {
    darkModeSelect.value = settings.darkMode;
  }

  // 渲染默认搜索引擎
  const defaultSearchEngineSelect = document.getElementById('default-search-engine') as HTMLSelectElement;
  const allEngines = getAllSearchEngines();
  defaultSearchEngineSelect.innerHTML = '';
  allEngines.forEach(engine => {
    const option = document.createElement('option');
    option.value = engine.id;
    option.textContent = engine.name;
    if (engine.id === settings.searchEngine) {
      option.selected = true;
    }
    defaultSearchEngineSelect.appendChild(option);
  });

  // 监听默认搜索引擎切换
  defaultSearchEngineSelect.addEventListener('change', function () {
    updateSettings({ searchEngine: this.value });
  });

  // 渲染搜索引擎列表
  renderSearchEnginesList();
}

/**
 * 渲染搜索引擎列表
 */
function renderSearchEnginesList(): void {
  const container = document.getElementById('search-engines-list') as HTMLElement;
  const loadedData = loadData();
  const userEngines = loadedData.searchEngines;

  if (userEngines.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">暂无自定义搜索引擎</div>';
    return;
  }

  container.innerHTML = '';

  userEngines.forEach(engine => {
    const item = document.createElement('div');
    item.className = 'manage-item';

    const info = document.createElement('div');
    info.className = 'manage-item-info';

    const title = document.createElement('div');
    title.className = 'manage-item-title';
    title.textContent = engine.name;

    const subtitle = document.createElement('div');
    subtitle.className = 'manage-item-subtitle';
    subtitle.textContent = engine.url;

    info.appendChild(title);
    info.appendChild(subtitle);

    const actions = document.createElement('div');
    actions.className = 'manage-item-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-secondary';
    editBtn.textContent = '编辑';
    editBtn.addEventListener('click', () => openEditSearchEngineModal(engine.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-danger';
    deleteBtn.textContent = '删除';
    deleteBtn.addEventListener('click', () => confirmDeleteSearchEngine(engine.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(info);
    item.appendChild(actions);
    container.appendChild(item);
  });
}

/**
 * 打开添加搜索引擎模态框
 */
export function openAddSearchEngineModal(): void {
  openSearchEngineModal();
}

/**
 * 打开编辑搜索引擎模态框
 */
export function openEditSearchEngineModal(engineId: string): void {
  const loadedData = loadData();
  const engine = loadedData.searchEngines.find(e => e.id === engineId);
  if (engine) {
    openSearchEngineModal(engine);
  }
}

/**
 * 打开搜索引擎模态框
 */
function openSearchEngineModal(engine: SearchEngine | null = null): void {
  const modal = document.getElementById('search-engine-modal') as HTMLElement;
  const title = document.getElementById('search-engine-modal-title') as HTMLElement;
  const form = document.getElementById('search-engine-form') as HTMLFormElement;

  title.textContent = engine ? '编辑搜索引擎' : '添加搜索引擎';

  (document.getElementById('search-engine-id') as HTMLInputElement).value = engine ? engine.id : '';
  (document.getElementById('search-engine-name') as HTMLInputElement).value = engine ? engine.name : '';
  (document.getElementById('search-engine-url') as HTMLInputElement).value = engine ? engine.url : '';

  modal.classList.remove('hidden');

  form.onsubmit = function (e) {
    e.preventDefault();
    saveSearchEngine();
  };
}

/**
 * 关闭搜索引擎模态框
 */
export function closeSearchEngineModal(): void {
  const modal = document.getElementById('search-engine-modal') as HTMLElement;
  modal.classList.add('hidden');
  (document.getElementById('search-engine-form') as HTMLFormElement).reset();
}

/**
 * 保存搜索引擎
 */
function saveSearchEngine(): void {
  const id = (document.getElementById('search-engine-id') as HTMLInputElement).value;
  const name = (document.getElementById('search-engine-name') as HTMLInputElement).value.trim();
  const url = (document.getElementById('search-engine-url') as HTMLInputElement).value.trim();

  if (id) {
    updateSearchEngine(id, name, url);
  } else {
    addSearchEngine(name, url);
  }

  closeSearchEngineModal();
  renderSearchEnginesList();
  renderSettings(); // 更新默认搜索引擎下拉框
}

/**
 * 确认删除搜索引擎
 */
function confirmDeleteSearchEngine(engineId: string): void {
  if (confirm('确定要删除这个搜索引擎吗?')) {
    deleteSearchEngine(engineId);
    renderSearchEnginesList();
    renderSettings(); // 更新默认搜索引擎下拉框
  }
}