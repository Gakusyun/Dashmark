// ==================== 导入 storage 模块 ====================

import {
  generateId,
  loadData,
  saveData,
  exportData,
  importData,
  getGroups,
  addGroup,
  updateGroup,
  deleteGroup,
  getLinks,
  getLinksByGroupId,
  getLinksWithGroups,
  addLink,
  updateLink,
  deleteLink,
  batchDeleteLinks as batchDeleteLinksStorage,
  getSettings,
  updateSettings,
  getAllSearchEngines,
  getSearchEngineConfig,
  addSearchEngine,
  updateSearchEngine,
  deleteSearchEngine
} from './storage.js';

// ==================== 状态管理 ====================

let currentTab = 'links';
let selectedLinks = new Set();
let currentGroupId = null; // 当前全屏展示的分组ID，null 表示显示全部

// ==================== 初始化 ====================

document.addEventListener('DOMContentLoaded', function () {
  initTheme();
  initSearch();
  initBookmarks();
  initManagePanel();
  initModals();
  initTabs();
});

// ==================== 主题管理 ====================

function initTheme() {
  const settings = getSettings();
  const darkMode = settings.darkMode;

  if (darkMode === 'auto') {
    // 跟随系统
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    // 手动设置
    document.documentElement.setAttribute('data-theme', darkMode);
  }

  // 初始化主题设置下拉框
  const darkModeSelect = document.getElementById('dark-mode-select');
  if (darkModeSelect) {
    darkModeSelect.value = darkMode;
    darkModeSelect.addEventListener('change', function () {
      updateSettings({ darkMode: this.value });
      applyTheme(this.value);
    });
  }

  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (getSettings().darkMode === 'auto') {
      applyTheme('auto');
    }
  });
}

function applyTheme(darkMode) {
  if (darkMode === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', darkMode);
  }
}

// ==================== 搜索功能 ====================

function initSearch() {
  // 监听搜索表单提交
  const searchForm = document.getElementById('search-form');
  searchForm.addEventListener('submit', function (e) {
    e.preventDefault();
    performSearch();
  });

  // 搜索框仅在 Enter 时触发（由表单提交处理）
  // 输入过程不触发任何行为
  // 失焦不触发任何行为
}

function performSearch() {
  const searchInput = document.getElementById('search-input');
  const query = searchInput.value.trim();

  if (!query) {
    return;
  }

  const settings = getSettings();
  const engine = getSearchEngineConfig(settings.searchEngine);

  if (!engine) {
    alert('搜索引擎配置错误，请重新选择');
    return;
  }

  // 替换 URL 中的 {q} 占位符
  let searchUrl = engine.url;
  if (searchUrl.includes('{q}')) {
    searchUrl = searchUrl.replace('{q}', encodeURIComponent(query));
  } else {
    searchUrl = searchUrl + encodeURIComponent(query);
  }

  window.open(searchUrl, '_blank');
  searchInput.value = '';
}

// ==================== 书签展示 ====================

function initBookmarks() {
  renderBookmarks();
}

function renderBookmarks() {
  const container = document.getElementById('bookmarks-container');
  const groups = getGroups();
  const links = getLinks();

  container.innerHTML = '';

  if (groups.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
        <p>点击 Dashmark 按钮添加分组和链接</p>
      </div>
    `;
    return;
  }

  // 如果是单分组视图
  if (currentGroupId) {
    const group = groups.find(g => g.id === currentGroupId);
    if (group) {
      renderSingleGroup(container, group, links);
    }
    return;
  }

  // 显示所有分组
  groups.forEach(group => {
    const groupLinks = links.filter(link => link.groupIds.includes(group.id));

    const groupSection = document.createElement('div');
    groupSection.className = 'group-section';
    groupSection.style.cursor = 'pointer';
    groupSection.addEventListener('click', (e) => {
      // 如果点击的是链接卡片，不触发分组跳转
      if (e.target.closest('.link-card')) {
        return;
      }
      currentGroupId = group.id;
      renderBookmarks();
    });

    const groupTitle = document.createElement('h3');
    groupTitle.className = 'group-title';
    groupTitle.textContent = group.name;

    const linksGrid = document.createElement('div');
    linksGrid.className = 'links-grid';

    groupLinks.forEach(link => {
      const linkCard = document.createElement('a');
      linkCard.className = 'link-card';
      linkCard.href = link.url;
      linkCard.target = '_blank';
      linkCard.rel = 'noopener noreferrer';

      const linkTitle = document.createElement('div');
      linkTitle.className = 'link-title';
      linkTitle.textContent = link.title;

      const linkUrl = document.createElement('div');
      linkUrl.className = 'link-url';
      linkUrl.textContent = link.url;

      linkCard.appendChild(linkTitle);
      linkCard.appendChild(linkUrl);
      linksGrid.appendChild(linkCard);
    });

    if (groupLinks.length === 0) {
      linksGrid.innerHTML = '<div style="color: var(--text-secondary); font-size: 13px;">暂无链接</div>';
    }

    groupSection.appendChild(groupTitle);
    groupSection.appendChild(linksGrid);
    container.appendChild(groupSection);
  });
}

function renderSingleGroup(container, group, allLinks) {
  const groupLinks = allLinks.filter(link => link.groupIds.includes(group.id));

  // 返回按钮
  const backBtn = document.createElement('button');
  backBtn.className = 'btn-secondary';
  backBtn.textContent = '← 返回全部';
  backBtn.style.marginBottom = '20px';
  backBtn.addEventListener('click', () => {
    currentGroupId = null;
    renderBookmarks();
  });
  container.appendChild(backBtn);

  // 分组标题
  const groupTitle = document.createElement('h2');
  groupTitle.className = 'group-title';
  groupTitle.style.fontSize = '24px';
  groupTitle.textContent = group.name;
  container.appendChild(groupTitle);

  // 链接网格
  const linksGrid = document.createElement('div');
  linksGrid.className = 'links-grid';
  linksGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(120px, 1fr))';

  groupLinks.forEach(link => {
    const linkCard = document.createElement('a');
    linkCard.className = 'link-card';
    linkCard.href = link.url;
    linkCard.target = '_blank';
    linkCard.rel = 'noopener noreferrer';

    const linkTitle = document.createElement('div');
    linkTitle.className = 'link-title';
    linkTitle.textContent = link.title;

    const linkUrl = document.createElement('div');
    linkUrl.className = 'link-url';
    linkUrl.textContent = link.url;

    linkCard.appendChild(linkTitle);
    linkCard.appendChild(linkUrl);
    linksGrid.appendChild(linkCard);
  });

  if (groupLinks.length === 0) {
    linksGrid.innerHTML = '<div style="color: var(--text-secondary); font-size: 13px; grid-column: 1/-1;">暂无链接</div>';
  }

  container.appendChild(linksGrid);
}

// ==================== 管理面板 ====================

function initManagePanel() {
  const btnManage = document.querySelector('.btn-manage');
  const btnClosePanel = document.getElementById('btn-close-panel');
  const managePanel = document.getElementById('manage-panel');

  // 点击 Dashmark 打开/关闭管理面板
  btnManage.addEventListener('click', function (e) {
    e.stopPropagation();
    if (managePanel.classList.contains('active')) {
      // 面板已打开，关闭它
      managePanel.classList.remove('active');
      setTimeout(() => managePanel.classList.add('hidden'), 300);
    } else {
      // 面板未打开，打开它
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

  // 默认搜索引擎切换
  const defaultSearchEngineSelect = document.getElementById('default-search-engine');
  defaultSearchEngineSelect.addEventListener('change', function () {
    updateSettings({ searchEngine: this.value });
  });

  // 导出数据按钮
  document.getElementById('btn-export').addEventListener('click', exportData);

  // 导入数据按钮
  const btnImport = document.getElementById('btn-import');
  const importFile = document.getElementById('import-file');
  btnImport.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', handleImport);
}

function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      const tab = this.getAttribute('data-tab');
      switchTab(tab);
    });
  });
}

function switchTab(tab) {
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

function renderManageContent() {
  if (currentTab === 'links') {
    renderLinksList();
  } else if (currentTab === 'groups') {
    renderGroupsList();
  } else if (currentTab === 'settings') {
    renderSettings();
  }
  // 数据标签页不需要动态渲染
}

function renderSettings() {
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

  // 渲染搜索引擎列表
  renderSearchEnginesList();
}

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

// ==================== 搜索引擎管理 ====================

function openAddSearchEngineModal() {
  openSearchEngineModal();
}

function openEditSearchEngineModal(engineId) {
  const data = loadData();
  const engine = data.searchEngines.find(e => e.id === engineId);
  if (engine) {
    openSearchEngineModal(engine);
  }
}

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

function closeSearchEngineModal() {
  document.getElementById('search-engine-modal').classList.add('hidden');
  document.getElementById('search-engine-form').reset();
}

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

function confirmDeleteSearchEngine(engineId) {
  if (confirm('确定要删除这个搜索引擎吗？')) {
    deleteSearchEngine(engineId);
    renderSearchEnginesList();
    renderSettings(); // 更新默认搜索引擎下拉框
  }
}

// ==================== 链接管理 ====================

function renderLinksList() {
  const container = document.getElementById('links-list');
  const links = getLinks();
  const groups = getGroups();
  selectedLinks.clear();

  if (links.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">暂无链接</div>';
    return;
  }

  container.innerHTML = '';

  links.forEach(link => {
    const item = document.createElement('div');
    item.className = 'manage-item';
    item.setAttribute('data-link-id', link.id);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'item-checkbox';
    checkbox.addEventListener('change', function () {
      if (this.checked) {
        selectedLinks.add(link.id);
        item.classList.add('selected');
      } else {
        selectedLinks.delete(link.id);
        item.classList.remove('selected');
      }
    });

    const info = document.createElement('div');
    info.className = 'manage-item-info';

    const title = document.createElement('div');
    title.className = 'manage-item-title';
    title.textContent = link.title;

    const subtitle = document.createElement('div');
    subtitle.className = 'manage-item-subtitle';
    subtitle.textContent = link.url;

    info.appendChild(title);
    info.appendChild(subtitle);

    const actions = document.createElement('div');
    actions.className = 'manage-item-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-secondary';
    editBtn.textContent = '编辑';
    editBtn.addEventListener('click', () => openEditLinkModal(link.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-danger';
    deleteBtn.textContent = '删除';
    deleteBtn.addEventListener('click', () => confirmDeleteLink(link.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(checkbox);
    item.appendChild(info);
    item.appendChild(actions);
    container.appendChild(item);
  });
}

function openAddLinkModal() {
  openLinkModal();
}

function openEditLinkModal(linkId) {
  const link = getLinks().find(l => l.id === linkId);
  if (link) {
    openLinkModal(link);
  }
}

function openLinkModal(link = null) {
  const modal = document.getElementById('link-modal');
  const title = document.getElementById('link-modal-title');
  const form = document.getElementById('link-form');
  const groups = getGroups();

  // 设置标题
  title.textContent = link ? '编辑链接' : '添加链接';

  // 填充表单
  document.getElementById('link-id').value = link ? link.id : '';
  document.getElementById('link-title').value = link ? link.title : '';
  document.getElementById('link-url').value = link ? link.url : '';

  // 渲染分组复选框
  const checkboxGroup = document.getElementById('link-groups');
  // 克隆元素以移除所有旧的事件监听器
  const newCheckboxGroup = checkboxGroup.cloneNode(false);
  checkboxGroup.parentNode.replaceChild(newCheckboxGroup, checkboxGroup);
  newCheckboxGroup.innerHTML = '';

  if (groups.length === 0) {
    newCheckboxGroup.innerHTML = '<p style="color: var(--text-secondary);">点击此处可添加分组</p>';
    document.getElementById('link-form').querySelector('button[type="submit"]').disabled = true;
  } else {
    document.getElementById('link-form').querySelector('button[type="submit"]').disabled = false;
    groups.forEach(group => {
      const label = document.createElement('label');
      label.className = 'checkbox-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = group.id;
      if (link && link.groupIds.includes(group.id)) {
        checkbox.checked = true;
      }

      const text = document.createElement('span');
      text.textContent = group.name;

      label.appendChild(checkbox);
      label.appendChild(text);
      newCheckboxGroup.appendChild(label);
    });
  }

  // 添加空白处点击事件来创建新分组
  newCheckboxGroup.addEventListener('click', function (e) {
    // 如果点击的是已有的 checkbox-item 或其子元素，不处理
    if (e.target.closest('.checkbox-item') || e.target.closest('.new-group-input')) {
      return;
    }

    // 创建新分组输入框
    e.preventDefault();
    e.stopPropagation();

    const inputDiv = document.createElement('div');
    inputDiv.className = 'checkbox-item new-group-input';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '输入新分组名称...';
    input.className = 'new-group-text-input';

    inputDiv.appendChild(input);

    // 插入到复选框组的末尾
    newCheckboxGroup.appendChild(inputDiv);

    // 自动聚焦输入框
    input.focus();
    input.select();

    // 处理回车键
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const groupName = input.value.trim();

        if (groupName) {
          // 创建新分组
          const newGroup = addGroup(groupName);

          // 移除输入框
          inputDiv.remove();

          // 创建新的复选框项
          const label = document.createElement('label');
          label.className = 'checkbox-item';

          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.value = newGroup.id;
          checkbox.checked = true;

          const text = document.createElement('span');
          text.textContent = groupName;

          label.appendChild(checkbox);
          label.appendChild(text);

          // 添加到复选框组
          newCheckboxGroup.appendChild(label);

          // 启用保存按钮
          document.getElementById('link-form').querySelector('button[type="submit"]').disabled = false;

          // 重新渲染分组列表以反映更新
          renderGroupsList();
        } else {
          // 如果为空，移除输入框
          inputDiv.remove();
        }
      } else if (e.key === 'Escape') {
        // 按 ESC 取消
        inputDiv.remove();
      }
    });

    // 失焦时如果为空则移除输入框
    input.addEventListener('blur', function () {
      setTimeout(() => {
        if (input.value.trim() === '' && inputDiv.parentNode === newCheckboxGroup) {
          inputDiv.remove();
        }
      }, 200);
    });
  });

  modal.classList.remove('hidden');

  // 表单提交
  form.onsubmit = function (e) {
    e.preventDefault();
    saveLink();
  };
}

function closeLinkModal() {
  document.getElementById('link-modal').classList.add('hidden');
  document.getElementById('link-form').reset();
}

function saveLink() {
  const id = document.getElementById('link-id').value;
  const title = document.getElementById('link-title').value.trim();
  let url = document.getElementById('link-url').value.trim();
  const groupIds = [];

  // 处理 URL：如果没有协议，自动添加 https://
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  // 获取选中的分组
  const checkboxes = document.querySelectorAll('#link-groups input[type="checkbox"]:checked');
  checkboxes.forEach(cb => groupIds.push(cb.value));

  // 验证至少选择一个分组
  if (groupIds.length === 0) {
    alert('请至少选择一个分组');
    return;
  }

  if (id) {
    // 更新链接
    updateLink(id, title, url, groupIds);
  } else {
    // 添加链接
    addLink(title, url, groupIds);
  }

  closeLinkModal();
  renderLinksList();
  renderBookmarks();
}

function confirmDeleteLink(linkId) {
  if (confirm('确定要删除这个链接吗？')) {
    deleteLink(linkId);
    renderLinksList();
    renderBookmarks();
  }
}

function batchDeleteLinks() {
  if (selectedLinks.size === 0) {
    alert('请先选择要删除的链接');
    return;
  }

  if (confirm(`确定要删除选中的 ${selectedLinks.size} 个链接吗？`)) {
    batchDeleteLinksStorage(Array.from(selectedLinks));
    selectedLinks.clear();
    renderLinksList();
    renderBookmarks();
  }
}

// ==================== 分组管理 ====================

function renderGroupsList() {
  const container = document.getElementById('groups-list');
  const groups = getGroups();
  const links = getLinks();

  if (groups.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">暂无分组</div>';
    return;
  }

  container.innerHTML = '';

  groups.forEach(group => {
    const groupLinks = links.filter(link => link.groupIds.includes(group.id));

    const item = document.createElement('div');
    item.className = 'manage-item';

    const info = document.createElement('div');
    info.className = 'manage-item-info';

    const title = document.createElement('div');
    title.className = 'manage-item-title';
    title.textContent = group.name;

    const subtitle = document.createElement('div');
    subtitle.className = 'manage-item-subtitle';
    subtitle.textContent = `${groupLinks.length} 个链接`;

    info.appendChild(title);
    info.appendChild(subtitle);

    const actions = document.createElement('div');
    actions.className = 'manage-item-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-secondary';
    editBtn.textContent = '编辑';
    editBtn.addEventListener('click', () => openEditGroupModal(group.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-danger';
    deleteBtn.textContent = '删除';
    deleteBtn.addEventListener('click', () => confirmDeleteGroup(group.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(info);
    item.appendChild(actions);
    container.appendChild(item);
  });
}

function openAddGroupModal() {
  openGroupModal();
}

function openEditGroupModal(groupId) {
  const group = getGroups().find(g => g.id === groupId);
  if (group) {
    openGroupModal(group);
  }
}

function openGroupModal(group = null) {
  const modal = document.getElementById('group-modal');
  const title = document.getElementById('group-modal-title');

  title.textContent = group ? '编辑分组' : '添加分组';

  document.getElementById('group-id').value = group ? group.id : '';
  document.getElementById('group-name').value = group ? group.name : '';

  modal.classList.remove('hidden');
}

function closeGroupModal() {
  document.getElementById('group-modal').classList.add('hidden');
  document.getElementById('group-form').reset();
}

function saveGroup() {
  const id = document.getElementById('group-id').value;
  const name = document.getElementById('group-name').value.trim();

  if (id) {
    updateGroup(id, name);
  } else {
    addGroup(name);
  }

  closeGroupModal();
  renderGroupsList();
  renderBookmarks();
}

function confirmDeleteGroup(groupId) {
  const links = getLinksByGroupId(groupId);

  if (links.length > 0) {
    if (!confirm(`该分组下有 ${links.length} 个链接，删除分组将同时删除这些链接。确定要删除吗？`)) {
      return;
    }
  } else {
    if (!confirm('确定要删除这个分组吗？')) {
      return;
    }
  }

  deleteGroup(groupId);
  renderGroupsList();
  renderBookmarks();
}

// ==================== 数据导入导出 ====================

function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  importData(
    file,
    function (data) {
      alert('数据导入成功');
      e.target.value = ''; // 重置文件输入
      renderBookmarks();
      renderManageContent();
    },
    function (error) {
      alert('导入失败：' + error.message);
      e.target.value = ''; // 重置文件输入
    }
  );
}

// ==================== 模态框初始化 ====================

function initModals() {
  // 分组表单提交
  document.getElementById('group-form').addEventListener('submit', function (e) {
    e.preventDefault();
    saveGroup();
  });

  // 点击模态框外部关闭
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });

  // ESC 键关闭模态框
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      modals.forEach(modal => modal.classList.add('hidden'));
    }
  });
}

// ==================== 将函数暴露给全局（用于HTML中的onclick） ====================

window.closeLinkModal = closeLinkModal;
window.closeGroupModal = closeGroupModal;
window.closeSearchEngineModal = closeSearchEngineModal;
