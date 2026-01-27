// ==================== 分组管理模块 ====================

import { getGroups, getLinks, getLinksByGroupId, addGroup, updateGroup, deleteGroup } from '../storage.js';

/**
 * 渲染分组列表
 */
export function renderGroupsList() {
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

/**
 * 打开添加分组模态框
 */
export function openAddGroupModal() {
  openGroupModal();
}

/**
 * 打开编辑分组模态框
 */
export function openEditGroupModal(groupId) {
  const group = getGroups().find(g => g.id === groupId);
  if (group) {
    openGroupModal(group);
  }
}

/**
 * 打开分组模态框
 */
function openGroupModal(group = null) {
  const modal = document.getElementById('group-modal');
  const title = document.getElementById('group-modal-title');

  title.textContent = group ? '编辑分组' : '添加分组';

  document.getElementById('group-id').value = group ? group.id : '';
  document.getElementById('group-name').value = group ? group.name : '';

  modal.classList.remove('hidden');
}

/**
 * 关闭分组模态框
 */
export function closeGroupModal() {
  document.getElementById('group-modal').classList.add('hidden');
  document.getElementById('group-form').reset();
}

/**
 * 保存分组
 */
export function saveGroup() {
  const id = document.getElementById('group-id').value;
  const name = document.getElementById('group-name').value.trim();

  if (id) {
    updateGroup(id, name);
  } else {
    addGroup(name);
  }

  closeGroupModal();
  renderGroupsList();
  import('./bookmarks.js').then(m => m.renderBookmarks());
}

/**
 * 确认删除分组
 */
function confirmDeleteGroup(groupId) {
  const links = getLinksByGroupId(groupId);

  if (links.length > 0) {
    if (!confirm(`该分组下有 ${links.length} 个链接,删除分组将同时删除这些链接。确定要删除吗?`)) {
      return;
    }
  } else {
    if (!confirm('确定要删除这个分组吗?')) {
      return;
    }
  }

  deleteGroup(groupId);
  renderGroupsList();
  import('./bookmarks.js').then(m => m.renderBookmarks());
}