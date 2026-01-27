// ==================== 书签展示模块 ====================

import { getGroups, getLinks } from '../storage.js';

let currentGroupId = null; // 当前全屏展示的分组ID,null 表示显示全部

/**
 * 初始化书签展示
 */
export function initBookmarks() {
  renderBookmarks();
}

/**
 * 渲染书签
 */
export function renderBookmarks() {
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
      // 如果点击的是链接卡片,不触发分组跳转
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

/**
 * 渲染单个分组
 */
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