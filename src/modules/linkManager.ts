// ==================== 链接管理模块 ====================

import { getGroups, getLinks, addLink, updateLink, deleteLink, batchDeleteLinks as batchDeleteLinksStorage, addGroup } from '../storage.ts';
import type { Link } from '../storage.ts';
import { renderGroupsList } from './groupManager.ts';

// 刷新书签显示的辅助函数
function refreshBookmarks(): void {
  if (window.refreshBookmarks) {
    window.refreshBookmarks();
  }
}

let selectedLinks = new Set<string>();

/**
 * 获取表单元素的辅助函数
 */
function getFormValue(id: string): string {
  return (document.getElementById(id) as HTMLInputElement).value;
}

/**
 * 渲染链接列表
 */
export function renderLinksList(): void {
  const container = document.getElementById('links-list') as HTMLElement;
  const links = getLinks();
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
      const isChecked = this.checked;
      isChecked ? selectedLinks.add(link.id) : selectedLinks.delete(link.id);
      item.classList.toggle('selected', isChecked);
    });

    const info = document.createElement('div');
    info.className = 'manage-item-info';
    info.innerHTML = `
      <div class="manage-item-title">${link.title}</div>
      <div class="manage-item-subtitle">${link.url}</div>
    `;

    const actions = document.createElement('div');
    actions.className = 'manage-item-actions';
    actions.innerHTML = `
      <button class="btn-secondary">编辑</button>
      <button class="btn-danger">删除</button>
    `;

    actions.querySelector('.btn-secondary')?.addEventListener('click', () => openEditLinkModal(link.id));
    actions.querySelector('.btn-danger')?.addEventListener('click', () => confirmDeleteLink(link.id));

    item.appendChild(checkbox);
    item.appendChild(info);
    item.appendChild(actions);
    container.appendChild(item);
  });
}

/**
 * 打开添加链接模态框
 */
export function openAddLinkModal(): void {
  openLinkModal();
}

/**
 * 打开编辑链接模态框
 */
export function openEditLinkModal(linkId: string): void {
  const link = getLinks().find(l => l.id === linkId);
  if (link) {
    openLinkModal(link);
  }
}

/**
 * 打开链接模态框
 */
function openLinkModal(link: Link | null = null): void {
  const modal = document.getElementById('link-modal') as HTMLElement;
  const title = document.getElementById('link-modal-title') as HTMLElement;
  const form = document.getElementById('link-form') as HTMLFormElement;
  const groups = getGroups();

  // 设置标题和表单值
  title.textContent = link ? '编辑链接' : '添加链接';
  (document.getElementById('link-id') as HTMLInputElement).value = link?.id || '';
  (document.getElementById('link-title') as HTMLInputElement).value = link?.title || '';
  (document.getElementById('link-url') as HTMLInputElement).value = link?.url || '';

  // 渲染分组复选框
  const checkboxGroup = document.getElementById('link-groups') as HTMLElement;
  const newCheckboxGroup = checkboxGroup.cloneNode(false) as HTMLElement;
  checkboxGroup.parentNode?.replaceChild(newCheckboxGroup, checkboxGroup);
  newCheckboxGroup.innerHTML = '';

  const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;

  if (groups.length === 0) {
    newCheckboxGroup.innerHTML = '<p style="color: var(--text-secondary);">点击此处可添加分组</p>';
    submitBtn.disabled = true;
  } else {
    submitBtn.disabled = false;
    groups.forEach(group => {
      const label = document.createElement('label');
      label.className = 'checkbox-item';
      label.innerHTML = `
        <input type="checkbox" value="${group.id}" ${link?.groupIds.includes(group.id) ? 'checked' : ''}>
        <span>${group.name}</span>
      `;
      newCheckboxGroup.appendChild(label);
    });
  }

  // 添加空白处点击事件来创建新分组
  newCheckboxGroup.addEventListener('click', function (e) {
    if ((e.target as HTMLElement).closest('.checkbox-item') || (e.target as HTMLElement).closest('.new-group-input')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const inputDiv = document.createElement('div');
    inputDiv.className = 'checkbox-item new-group-input';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '输入新分组名称...';
    input.className = 'new-group-text-input';

    inputDiv.appendChild(input);
    newCheckboxGroup.appendChild(inputDiv);
    input.focus();
    input.select();

    // 处理回车键和失焦
    const handleInputSubmit = () => {
      const groupName = input.value.trim();
      if (groupName) {
        const newGroup = addGroup(groupName);
        inputDiv.remove();

        const label = document.createElement('label');
        label.className = 'checkbox-item';
        label.innerHTML = `
          <input type="checkbox" value="${newGroup.id}" checked>
          <span>${groupName}</span>
        `;
        newCheckboxGroup.appendChild(label);
        submitBtn.disabled = false;
        renderGroupsList();
        refreshBookmarks();
      } else {
        inputDiv.remove();
      }
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleInputSubmit();
      } else if (e.key === 'Escape') {
        inputDiv.remove();
      }
    });

    input.addEventListener('blur', () => {
      setTimeout(() => {
        if (input.value.trim() === '' && inputDiv.parentNode === newCheckboxGroup) {
          inputDiv.remove();
        }
      }, 200);
    });
  });

  modal.classList.remove('hidden');
  form.onsubmit = (e) => {
    e.preventDefault();
    saveLink();
  };
}

/**
 * 关闭链接模态框
 */
export function closeLinkModal(): void {
  const modal = document.getElementById('link-modal') as HTMLElement;
  modal.classList.add('hidden');
  (document.getElementById('link-form') as HTMLFormElement).reset();
}

/**
 * 保存链接
 */
function saveLink(): void {
  const id = getFormValue('link-id');
  const title = getFormValue('link-title').trim();
  let url = getFormValue('link-url').trim();

  // 处理 URL:如果没有协议,自动添加 https://
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  // 获取选中的分组
  const groupIds: string[] = Array.from(
    document.querySelectorAll('#link-groups input[type="checkbox"]:checked')
  ).map(cb => (cb as HTMLInputElement).value);

  // 验证至少选择一个分组
  if (groupIds.length === 0) {
    alert('请至少选择一个分组');
    return;
  }

  id ? updateLink(id, title, url, groupIds) : addLink(title, url, groupIds);

  closeLinkModal();
  renderLinksList();
}

/**
 * 确认删除链接
 */
function confirmDeleteLink(linkId: string): void {
  if (confirm('确定要删除这个链接吗?')) {
    deleteLink(linkId);
    renderLinksList();
  }
}

/**
 * 批量删除链接
 */
export function batchDeleteLinks(): void {
  if (selectedLinks.size === 0) {
    alert('请先选择要删除的链接');
    return;
  }

  if (confirm(`确定要删除选中的 ${selectedLinks.size} 个链接吗?`)) {
    batchDeleteLinksStorage(Array.from(selectedLinks));
    selectedLinks.clear();
    renderLinksList();
  }
}