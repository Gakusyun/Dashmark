// ==================== 搜索引擎管理模块 ====================

import { loadData, getSettings, updateSettings, getAllSearchEngines, addSearchEngine, updateSearchEngine, deleteSearchEngine } from '../storage.js';

/**
 * 渲染设置页面
 */
export function renderSettings() {
  const settings = getSettings();
  const data = loadData();

  // 渲染主题设置
  const darkModeSelect = document.getElementById('dark-mode-select');
  if (darkModeSelect) {
    darkModeSelect.value = settings.darkMode;
  }

  // 渲染默认搜索引擎
  const defaultSearchEngineSelect = document.getElementById('default-search-engine');
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
function renderSearchEnginesList() {
  const container = document.getElementById('search-engines-list');
  const data = loadData();
  const userEngines = data.searchEngines;

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
export function openAddSearchEngineModal() {
  openSearchEngineModal();
}

/**
 * 打开编辑搜索引擎模态框
 */
export function openEditSearchEngineModal(engineId) {
  const data = loadData();
  const engine = data.searchEngines.find(e => e.id === engineId);
  if (engine) {
    openSearchEngineModal(engine);
  }
}

/**
 * 打开搜索引擎模态框
 */
function openSearchEngineModal(engine = null) {
  const modal = document.getElementById('search-engine-modal');
  const title = document.getElementById('search-engine-modal-title');
  const form = document.getElementById('search-engine-form');

  title.textContent = engine ? '编辑搜索引擎' : '添加搜索引擎';

  document.getElementById('search-engine-id').value = engine ? engine.id : '';
  document.getElementById('search-engine-name').value = engine ? engine.name : '';
  document.getElementById('search-engine-url').value = engine ? engine.url : '';

  modal.classList.remove('hidden');

  form.onsubmit = function (e) {
    e.preventDefault();
    saveSearchEngine();
  };
}

/**
 * 关闭搜索引擎模态框
 */
export function closeSearchEngineModal() {
  document.getElementById('search-engine-modal').classList.add('hidden');
  document.getElementById('search-engine-form').reset();
}

/**
 * 保存搜索引擎
 */
function saveSearchEngine() {
  const id = document.getElementById('search-engine-id').value;
  const name = document.getElementById('search-engine-name').value.trim();
  const url = document.getElementById('search-engine-url').value.trim();

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
function confirmDeleteSearchEngine(engineId) {
  if (confirm('确定要删除这个搜索引擎吗?')) {
    deleteSearchEngine(engineId);
    renderSearchEnginesList();
    renderSettings(); // 更新默认搜索引擎下拉框
  }
}