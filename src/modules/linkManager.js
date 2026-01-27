// ==================== 链接管理模块 ====================

import { getLinks, addLink, updateLink, deleteLink, batchDeleteLinks as batchDeleteLinksStorage } from '../storage.js';

let selectedLinks = new Set();

/**
 * 渲染链接列表
 */
export function renderLinksList() {
  const container = document.getElementById('links-list');
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

/**
 * 打开添加链接模态框
 */
export function openAddLinkModal() {
  openLinkModal();
}

/**
 * 打开编辑链接模态框
 */
export function openEditLinkModal(linkId) {
  const link = getLinks().find(l => l.id === linkId);
  if (link) {
    openLinkModal(link);
  }
}

/**
 * 打开链接模态框
 */
function openLinkModal(link = null) {
  const { getGroups, addGroup } = import('../storage.js').then(m => m);
  import('../storage.js').then(({ getGroups, addGroup }) => {
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
      // 如果点击的是已有的 checkbox-item 或其子元素,不处理
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
            import('./groupManager.js').then(m => m.renderGroupsList());
          } else {
            // 如果为空,移除输入框
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
  });
}

/**
 * 关闭链接模态框
 */
export function closeLinkModal() {
  document.getElementById('link-modal').classList.add('hidden');
  document.getElementById('link-form').reset();
}

/**
 * 保存链接
 */
function saveLink() {
  import('../storage.js').then(({ updateLink, addLink }) => {
    const id = document.getElementById('link-id').value;
    const title = document.getElementById('link-title').value.trim();
    let url = document.getElementById('link-url').value.trim();
    const groupIds = [];

    // 处理 URL:如果没有协议,自动添加 https://
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
    import('./bookmarks.js').then(m => m.renderBookmarks());
  });
}

/**
 * 确认删除链接
 */
function confirmDeleteLink(linkId) {
  if (confirm('确定要删除这个链接吗?')) {
    import('../storage.js').then(({ deleteLink }) => {
      deleteLink(linkId);
      renderLinksList();
      import('./bookmarks.js').then(m => m.renderBookmarks());
    });
  }
}

/**
 * 批量删除链接
 */
export function batchDeleteLinks() {
  if (selectedLinks.size === 0) {
    alert('请先选择要删除的链接');
    return;
  }

  if (confirm(`确定要删除选中的 ${selectedLinks.size} 个链接吗?`)) {
    batchDeleteLinksStorage(Array.from(selectedLinks));
    selectedLinks.clear();
    renderLinksList();
    import('./bookmarks.js').then(m => m.renderBookmarks());
  }
}