// ==================== 分组管理模块 ====================

import { getGroups, getLinks, getLinksByGroupId, addGroup, updateGroup, deleteGroup } from '../storage.ts';
import type { Group } from '../storage.ts';

// 刷新书签显示的辅助函数
function refreshBookmarks(): void {
  if (window.refreshBookmarks) {
    window.refreshBookmarks();
  }
}

/**
 * 获取表单元素的辅助函数
 */
function getFormValue(id: string): string {
  return (document.getElementById(id) as HTMLInputElement).value;
}

/**
 * 渲染分组列表
 */
export function renderGroupsList(): void {
  const container = document.getElementById('groups-list') as HTMLElement;
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
    item.innerHTML = `
      <div class="manage-item-info">
        <div class="manage-item-title">${group.name}</div>
        <div class="manage-item-subtitle">${groupLinks.length} 个链接</div>
      </div>
      <div class="manage-item-actions">
        <button class="btn-secondary">编辑</button>
        <button class="btn-danger">删除</button>
      </div>
    `;

    item.querySelector('.btn-secondary')?.addEventListener('click', () => openEditGroupModal(group.id));
    item.querySelector('.btn-danger')?.addEventListener('click', () => confirmDeleteGroup(group.id));

    container.appendChild(item);
  });
}

/**
 * 打开添加分组模态框
 */
export function openAddGroupModal(): void {
  openGroupModal();
}

/**
 * 打开编辑分组模态框
 */
export function openEditGroupModal(groupId: string): void {
  const group = getGroups().find(g => g.id === groupId);
  if (group) {
    openGroupModal(group);
  }
}

/**
 * 打开分组模态框
 */
function openGroupModal(group: Group | null = null): void {
  const modal = document.getElementById('group-modal') as HTMLElement;
  const title = document.getElementById('group-modal-title') as HTMLElement;

  title.textContent = group ? '编辑分组' : '添加分组';
  (document.getElementById('group-id') as HTMLInputElement).value = group?.id || '';
  (document.getElementById('group-name') as HTMLInputElement).value = group?.name || '';

  modal.classList.remove('hidden');
}

/**
 * 关闭分组模态框
 */
export function closeGroupModal(): void {
  const modal = document.getElementById('group-modal') as HTMLElement;
  modal.classList.add('hidden');
  (document.getElementById('group-form') as HTMLFormElement).reset();
}

/**
 * 保存分组
 */
export function saveGroup(): void {
  const id = getFormValue('group-id');
  const name = getFormValue('group-name').trim();

  id ? updateGroup(id, name) : addGroup(name);

  closeGroupModal();
  renderGroupsList();
  refreshBookmarks();
}

/**
 * 确认删除分组
 */
function confirmDeleteGroup(groupId: string): void {
  const links = getLinksByGroupId(groupId);
  const confirmMsg = links.length > 0
    ? `该分组下有 ${links.length} 个链接,删除分组将同时删除这些链接。确定要删除吗?`
    : '确定要删除这个分组吗?';

  if (confirm(confirmMsg)) {
    deleteGroup(groupId);
    renderGroupsList();
    refreshBookmarks();
  }
}