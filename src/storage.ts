// ==================== 数据模型 ====================

const STORAGE_KEY = 'dashmark_data';

// ==================== 类型定义 ====================

export interface SearchEngine {
  id: string;
  name: string;
  url: string;
}

export interface Settings {
  searchEngine: string;
  darkMode: 'light' | 'dark' | 'auto';
}

export interface Group {
  id: string;
  name: string;
  order: number;
}

export interface Link {
  id: string;
  title: string;
  url: string;
  groupIds: string[];
  order: number;
}

export interface Data {
  groups: Group[];
  links: Link[];
  searchEngines: SearchEngine[];
  settings: Settings;
}

export interface LinkWithGroups extends Link {
  groups: Group[];
}

// ==================== 常量 ====================

export const DEFAULT_SEARCH_ENGINES: SearchEngine[] = [
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=' },
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=' },
  { id: 'quark', name: '夸克', url: 'https://ai.quark.cn/s?q=' }
];

export const DEFAULT_DATA: Data = {
  groups: [],
  links: [],
  searchEngines: [],
  settings: {
    searchEngine: 'baidu',
    darkMode: 'auto'
  }
};

// ==================== 存储操作 ====================

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * 从 localStorage 读取数据（同步）
 */
export function loadData(): Data {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) {
      return DEFAULT_DATA;
    }
    const data: Data = JSON.parse(json);

    // 数据迁移：将旧的搜索引擎名称转换为 ID
    let searchEngineId = data.settings?.searchEngine || 'google';
    const engineNameToId: Record<string, string> = {
      'Google': 'google',
      'Bing': 'bing',
      '百度': 'baidu',
      'DuckDuckGo': 'duckduckgo'
    };
    if (engineNameToId[searchEngineId]) {
      searchEngineId = engineNameToId[searchEngineId];
    }

    // 合并默认设置，确保数据结构完整
    return {
      groups: Array.isArray(data.groups) ? data.groups : [],
      links: Array.isArray(data.links) ? data.links : [],
      searchEngines: Array.isArray(data.searchEngines) ? data.searchEngines : [],
      settings: {
        searchEngine: searchEngineId,
        darkMode: data.settings?.darkMode || 'auto'
      }
    };
  } catch (error) {
    console.error('Failed to load data:', error);
    return DEFAULT_DATA;
  }
}

/**
 * 保存数据到 localStorage
 */
export function saveData(data: Data): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    // 触发自定义事件，通知数据已保存
    const event = new CustomEvent('data-saved');
    window.dispatchEvent(event);

    return true;
  } catch (error) {
    console.error('Failed to save data:', error);
    return false;
  }
}

/**
 * 导出数据为 JSON 文件
 */
export function exportData(): void {
  const data = loadData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dashmark_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export type ImportSuccessCallback = (data: Data) => void;
export type ImportErrorCallback = (error: Error) => void;

/**
 * 从 JSON 文件导入数据
 */
export function importData(
  file: File,
  onSuccess: ImportSuccessCallback,
  onError: ImportErrorCallback
): void {
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const result = e.target?.result;
      if (typeof result !== 'string') {
        throw new Error('Invalid file content');
      }

      const data: Data = JSON.parse(result);

      // 验证数据结构
      if (!Array.isArray(data.groups) || !Array.isArray(data.links)) {
        throw new Error('Invalid data structure');
      }

      // 验证分组数据
      for (const group of data.groups) {
        if (!group.id || !group.name) {
          throw new Error('Invalid group data');
        }
      }

      // 验证链接数据
      for (const link of data.links) {
        if (!link.id || !link.title || !link.url || !Array.isArray(link.groupIds)) {
          throw new Error('Invalid link data');
        }
      }

      // 保存导入的数据
      const importedData: Data = {
        groups: data.groups,
        links: data.links,
        searchEngines: data.searchEngines || [],
        settings: {
          searchEngine: data.settings?.searchEngine || 'google',
          darkMode: data.settings?.darkMode || 'auto'
        }
      };

      if (saveData(importedData)) {
        onSuccess(importedData);
      } else {
        onError(new Error('Failed to save imported data'));
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  };
  reader.onerror = function () {
    onError(new Error('Failed to read file'));
  };
  reader.readAsText(file);
}

// ==================== 分组操作 ====================

/**
 * 获取所有分组
 */
export function getGroups(): Group[] {
  return loadData().groups;
}

/**
 * 添加分组
 */
export function addGroup(name: string): Group {
  const data = loadData();
  const group: Group = {
    id: generateId(),
    name: name,
    order: data.groups.length
  };
  data.groups.push(group);
  saveData(data);
  return group;
}

/**
 * 更新分组
 */
export function updateGroup(id: string, name: string): boolean {
  const data = loadData();
  const index = data.groups.findIndex(g => g.id === id);
  if (index !== -1) {
    data.groups[index].name = name;
    saveData(data);
    return true;
  }
  return false;
}

/**
 * 删除分组
 */
export function deleteGroup(id: string): boolean {
  const data = loadData();
  // 删除分组
  data.groups = data.groups.filter(g => g.id !== id);
  // 从所有链接中移除该分组ID
  data.links.forEach(link => {
    link.groupIds = link.groupIds.filter(gid => gid !== id);
  });
  // 删除没有分组的链接（如果需要保留，可以去掉这一步）
  data.links = data.links.filter(link => link.groupIds.length > 0);
  saveData(data);
  return true;
}

// ==================== 链接操作 ====================

/**
 * 获取所有链接
 */
export function getLinks(): Link[] {
  return loadData().links;
}

/**
 * 根据分组ID获取链接
 */
export function getLinksByGroupId(groupId: string): Link[] {
  const data = loadData();
  return data.links.filter(link => link.groupIds.includes(groupId));
}

/**
 * 获取链接及其所属分组
 */
export function getLinksWithGroups(): LinkWithGroups[] {
  const data = loadData();
  return data.links.map(link => ({
    ...link,
    groups: data.groups.filter(g => link.groupIds.includes(g.id))
  }));
}

/**
 * 添加链接
 */
export function addLink(title: string, url: string, groupIds: string[]): Link {
  const data = loadData();
  const link: Link = {
    id: generateId(),
    title: title,
    url: url,
    groupIds: groupIds,
    order: data.links.length
  };
  data.links.push(link);
  saveData(data);
  return link;
}

/**
 * 更新链接
 */
export function updateLink(id: string, title: string, url: string, groupIds: string[]): boolean {
  const data = loadData();
  const index = data.links.findIndex(l => l.id === id);
  if (index !== -1) {
    data.links[index].title = title;
    data.links[index].url = url;
    data.links[index].groupIds = groupIds;
    saveData(data);
    return true;
  }
  return false;
}

/**
 * 删除链接
 */
export function deleteLink(id: string): boolean {
  const data = loadData();
  data.links = data.links.filter(l => l.id !== id);
  saveData(data);
  return true;
}

/**
 * 批量删除链接
 */
export function batchDeleteLinks(ids: string[]): boolean {
  const data = loadData();
  data.links = data.links.filter(l => !ids.includes(l.id));
  saveData(data);
  return true;
}

// ==================== 设置操作 ====================

/**
 * 获取设置
 */
export function getSettings(): Settings {
  return loadData().settings;
}

/**
 * 更新设置
 */
export function updateSettings(settings: Partial<Settings>): Settings {
  const data = loadData();
  data.settings = {
    ...data.settings,
    ...settings
  };
  saveData(data);
  return data.settings;
}

// ==================== 搜索引擎操作 ====================

/**
 * 获取所有搜索引擎（预设+用户自定义）
 */
export function getAllSearchEngines(): SearchEngine[] {
  const data = loadData();
  // 合并预设和用户自定义搜索引擎
  const allEngines: SearchEngine[] = [...DEFAULT_SEARCH_ENGINES];

  // 确保用户自定义搜索引擎有ID
  data.searchEngines.forEach((engine, index) => {
    if (!engine.id) {
      engine.id = 'custom_' + Date.now() + '_' + index;
    }
  });

  allEngines.push(...data.searchEngines);
  return allEngines;
}

/**
 * 获取搜索引擎配置
 */
export function getSearchEngineConfig(engineId: string): SearchEngine | undefined {
  const allEngines = getAllSearchEngines();
  return allEngines.find(e => e.id === engineId);
}

/**
 * 添加自定义搜索引擎
 */
export function addSearchEngine(name: string, url: string): SearchEngine {
  const data = loadData();
  const engine: SearchEngine = {
    id: 'custom_' + Date.now(),
    name: name,
    url: url
  };
  data.searchEngines.push(engine);
  saveData(data);
  return engine;
}

/**
 * 更新自定义搜索引擎
 */
export function updateSearchEngine(id: string, name: string, url: string): boolean {
  const data = loadData();
  const index = data.searchEngines.findIndex(e => e.id === id);
  if (index !== -1) {
    data.searchEngines[index].name = name;
    data.searchEngines[index].url = url;
    saveData(data);
    return true;
  }
  return false;
}

/**
 * 删除自定义搜索引擎
 */
export function deleteSearchEngine(id: string): boolean {
  const data = loadData();

  // 如果删除的是当前使用的搜索引擎，切换到默认的 Google
  if (data.settings.searchEngine === id) {
    data.settings.searchEngine = 'google';
  }

  data.searchEngines = data.searchEngines.filter(e => e.id !== id);
  saveData(data);
  return true;
}
