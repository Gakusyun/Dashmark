// ==================== 书签展示模块 ====================

import { getGroups, getLinks } from '../storage.ts';
import type { Link, Group } from '../storage.ts';

let currentGroupId: string | null = null; // 当前全屏展示的分组ID,null 表示显示全部

/**
 * 初始化书签展示
 */
export function initBookmarks(): void {
  renderBookmarks();
}

/**
 * 创建链接卡片元素
 */
function createLinkCard(link: Link): HTMLElement {
  const card = document.createElement('a');
  card.className = 'link-card';
  card.href = link.url;
  card.target = '_blank';
  card.rel = 'noopener noreferrer';
  card.innerHTML = `
    <div class="link-title">${link.title}</div>
    <div class="link-url">${link.url}</div>
  `;
  return card;
}

/**
 * 创建链接网格
 */
function createLinksGrid(links: Link[]): HTMLElement {
  const grid = document.createElement('div');
  grid.className = 'links-grid';

  if (links.length === 0) {
    grid.innerHTML = '<div style="color: var(--text-secondary); font-size: 13px;">暂无链接</div>';
  } else {
    links.forEach(link => grid.appendChild(createLinkCard(link)));
  }

  return grid;
}

/**
 * 渲染书签
 */
export function renderBookmarks(): void {
  const container = document.getElementById('bookmarks-container') as HTMLElement;
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
      if (e.target && (e.target as HTMLElement).closest('.link-card')) {
        return;
      }
      currentGroupId = group.id;
      renderBookmarks();
    });

    const groupTitle = document.createElement('h3');
    groupTitle.className = 'group-title';
    groupTitle.textContent = group.name;

    groupSection.appendChild(groupTitle);
    groupSection.appendChild(createLinksGrid(groupLinks));
    container.appendChild(groupSection);
  });
}

/**
 * 渲染单个分组
 */
function renderSingleGroup(container: HTMLElement, group: Group, allLinks: Link[]): void {
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
  const linksGrid = createLinksGrid(groupLinks);
  linksGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(120px, 1fr))';
  if (groupLinks.length === 0) {
    linksGrid.innerHTML = '<div style="color: var(--text-secondary); font-size: 13px; grid-column: 1/-1;">暂无链接</div>';
  }
  container.appendChild(linksGrid);
}