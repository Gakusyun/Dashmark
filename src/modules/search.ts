// ==================== 搜索功能模块 ====================

import { getSettings, getSearchEngineConfig } from '../storage.ts';

/**
 * 初始化搜索功能
 */
export function initSearch(): void {
  // 监听搜索表单提交
  const searchForm = document.getElementById('search-form') as HTMLFormElement;
  searchForm.addEventListener('submit', function (e) {
    e.preventDefault();
    performSearch();
  });

  // 搜索框仅在 Enter 时触发（由表单提交处理）
  // 输入过程不触发任何行为
  // 失焦不触发任何行为
}

/**
 * 执行搜索
 */
export function performSearch(): void {
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  const query = searchInput.value.trim();

  if (!query) {
    return;
  }

  const settings = getSettings();
  const engine = getSearchEngineConfig(settings.searchEngine);

  if (!engine) {
    alert('搜索引擎配置错误,请重新选择');
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