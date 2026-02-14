import pako from 'pako';
import { getVersion } from './version';
import type {
  Data,
  SearchEngine,
  Group,
  Link,
  TextRecord,
  Bookmark,
  Settings,
  LinkWithGroups,
  TextRecordWithGroups
} from '../types';

const STORAGE_KEY = 'dashmark_data';

// ==================== 常量 ====================

export const DEFAULT_SEARCH_ENGINES: SearchEngine[] = [
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=' },
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=' },
  { id: 'quark', name: '夸克', url: 'https://ai.quark.cn/s?q=' }
];

export const DEFAULT_DATA: Data = {
  version: getVersion(),
  groups: [],
  bookmarks: [],
  searchEngines: [],
  settings: {
    searchEngine: 'baidu',
    darkMode: 'auto',
    hideLegalInfo: false,
    cookieConsent: null
  }
};

// ==================== 工具函数 ====================

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// ==================== 存储操作 ====================



export function loadData(): Data {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) {
      return DEFAULT_DATA;
    }
    const data: any = JSON.parse(json);

    // 直接使用最新的数据结构
    const result: Data = {
      version: data.version || getVersion(),
      groups: Array.isArray(data.groups) ? data.groups : [],
      bookmarks: Array.isArray(data.bookmarks) ? data.bookmarks : [],
      searchEngines: Array.isArray(data.searchEngines) ? data.searchEngines : [],
      settings: {
        searchEngine: data.settings?.searchEngine || 'baidu',
        darkMode: data.settings?.darkMode || 'auto',
        hideLegalInfo: data.settings?.hideLegalInfo || false,
        cookieConsent: data.settings?.cookieConsent ?? null
      }
    };

    return result;
  } catch (error) {
    console.error('Failed to load data:', error);
    return DEFAULT_DATA;
  }
}

export function saveData(data: Data): boolean {
  try {
    // 确保数据始终包含版本号
    const saveData = {
      ...data,
      version: data.version || getVersion()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    return true;
  } catch (error) {
    console.error('Failed to save data:', error);
    return false;
  }
}

export function exportData(): void {
  const data = loadData();
  
  // 创建导出的数据对象，只导出新的bookmarks数据结构
  const exportData = {
    version: data.version,
    groups: data.groups,
    bookmarks: data.bookmarks,
    searchEngines: data.searchEngines,
    settings: data.settings
  };
  
  const json = JSON.stringify(exportData, null, 2);
  // 使用 gzip 压缩
  const compressed = pako.gzip(json);
  const blob = new Blob([compressed], { type: 'application/gzip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dashmark_backup_v${data.version}_${new Date().toISOString().slice(0, 10)}.json.gz`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importData(
  file: File,
  onSuccess: (data: Data) => void,
  onError: (error: Error) => void
): void {
  // 检查是否为 gzip 文件（通过文件扩展名判断）
  const isGzip = file.name.endsWith('.gz');

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      if (isGzip) {
        // gzip 文件：读取为 ArrayBuffer
        const result = e.target?.result;
        if (!(result instanceof ArrayBuffer)) {
          throw new Error('Invalid gzip file content');
        }
        const compressed = new Uint8Array(result);
        const json = pako.ungzip(compressed, { to: 'string' });
        processData(json, onSuccess, onError);
      } else {
        // 普通 JSON 文件：读取为文本
        const result = e.target?.result;
        if (typeof result !== 'string') {
          throw new Error('Invalid JSON file content');
        }
        processData(result, onSuccess, onError);
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  };
  reader.onerror = function () {
    onError(new Error('Failed to read file'));
  };

  // 根据文件类型选择读取方式
  if (isGzip) {
    reader.readAsArrayBuffer(file);
  } else {
    reader.readAsText(file);
  }
}

function processData(
  json: string,
  onSuccess: (data: Data) => void,
  onError: (error: Error) => void
): void {
  try {
    // 验证 JSON 大小（防止超大文件攻击）
    if (json.length > 50 * 1024 * 1024) {
      // 50MB 限制
      throw new Error('导入文件过大（超过 50MB）');
    }

    // 验证嵌套深度（使用递归检查）
    const maxDepth = 100;
    const checkDepth = (obj: unknown, currentDepth: number): void => {
      if (currentDepth > maxDepth) {
        throw new Error('数据嵌套层级过深，可能存在恶意构造');
      }
      if (typeof obj === 'object' && obj !== null) {
        for (const value of Object.values(obj)) {
          checkDepth(value, currentDepth + 1);
        }
      }
    };

    const data: any = JSON.parse(json);
    checkDepth(data, 0);

    // ==================== 验证数据结构 ====================
    // ==================== 数组长度限制 ====================
    const MAX_GROUPS = 1000;
    const MAX_LINKS = 10000;
    const MAX_TEXT_RECORDS = 10000;

    if (data.groups && Array.isArray(data.groups) && data.groups.length > MAX_GROUPS) {
      throw new Error(`分组数量超出限制（最多 ${MAX_GROUPS} 个，实际 ${data.groups.length} 个）`);
    }
    
    // 验证书签数量（包含链接和文字记录）
    if (data.bookmarks && Array.isArray(data.bookmarks)) {
      const linkCount = data.bookmarks.filter((b: { type?: string }) => b.type === 'link').length;
      if (linkCount > MAX_LINKS) {
        throw new Error(`链接数量超出限制（最多 ${MAX_LINKS} 个，实际 ${linkCount} 个）`);
      }
    }

    // ==================== 字段长度限制常量 ====================
    const MAX_GROUP_NAME_LENGTH = 100;
    const MAX_LINK_TITLE_LENGTH = 200;
    const MAX_LINK_URL_LENGTH = 2048;
    const MAX_TEXT_RECORD_TITLE_LENGTH = 200;
    const MAX_TEXT_RECORD_CONTENT_LENGTH = 10000;

    // ==================== 验证分组数据 ====================
    if (data.groups !== undefined && !Array.isArray(data.groups)) {
      throw new Error('分组数据格式错误：应为数组');
    }

    if (data.groups) {
      for (const group of data.groups) {
        if (typeof group !== 'object' || group === null) {
          throw new Error('分组数据格式错误：应为对象');
        }
        if (!group.id || typeof group.id !== 'string') {
          throw new Error('分组数据格式错误：缺少有效的 id 字段');
        }
        if (!group.name || typeof group.name !== 'string') {
          throw new Error('分组数据格式错误：缺少有效的 name 字段');
        }
        if (group.name.length > MAX_GROUP_NAME_LENGTH) {
          throw new Error(
            `分组名称过长（最多 ${MAX_GROUP_NAME_LENGTH} 字符，实际 ${group.name.length} 字符）`
          );
        }
        if (typeof group.order !== 'number') {
          throw new Error('分组数据格式错误：order 字段应为数字');
        }
      }
    }

    // ==================== 验证收藏数据 ====================
    if (data.bookmarks !== undefined && !Array.isArray(data.bookmarks)) {
      throw new Error('收藏数据格式错误：应为数组');
    }

    if (data.bookmarks) {
      // 验证bookmarks数组中的链接类型数据
      const linkBookmarks = data.bookmarks.filter((b: { type?: string }) => b.type === 'link');
      for (const link of linkBookmarks) {
        if (typeof link !== 'object' || link === null) {
          throw new Error('链接数据格式错误：应为对象');
        }
        if (!link.id || typeof link.id !== 'string') {
          throw new Error('链接数据格式错误：缺少有效的 id 字段');
        }
        if (!link.title || typeof link.title !== 'string') {
          throw new Error('链接数据格式错误：缺少有效的 title 字段');
        }
        if (link.title.length > MAX_LINK_TITLE_LENGTH) {
          throw new Error(
            `链接标题过长（最多 ${MAX_LINK_TITLE_LENGTH} 字符，实际 ${link.title.length} 字符）`
          );
        }
        if (!link.url || typeof link.url !== 'string') {
          throw new Error('链接数据格式错误：缺少有效的 url 字段');
        }
        if (link.url && link.url.length > MAX_LINK_URL_LENGTH) {
          throw new Error(
            `链接 URL 过长（最多 ${MAX_LINK_URL_LENGTH} 字符，实际 ${link.url.length} 字符）`
          );
        }
        if (!Array.isArray(link.groupIds)) {
          throw new Error('链接数据格式错误：groupIds 字段应为数组');
        }
        if (typeof link.order !== 'number') {
          throw new Error('链接数据格式错误：order 字段应为数字');
        }
      }

      // 验证bookmarks数组中的文字记录类型数据
      const textBookmarks = data.bookmarks.filter((b: { type?: string }) => b.type === 'text');
      const textRecordsCount = textBookmarks.length;

      if (textRecordsCount > MAX_TEXT_RECORDS) {
        throw new Error(
          `文字记录数量超出限制（最多 ${MAX_TEXT_RECORDS} 个，实际 ${textRecordsCount} 个）`
        );
      }

      for (const record of textBookmarks) {
        if (typeof record !== 'object' || record === null) {
          throw new Error('文字记录数据格式错误：应为对象');
        }
        if (!record.id || typeof record.id !== 'string') {
          throw new Error('文字记录数据格式错误：缺少有效的 id 字段');
        }
        if (!record.title || typeof record.title !== 'string') {
          throw new Error('文字记录数据格式错误：缺少有效的 title 字段');
        }
        if (record.title.length > MAX_TEXT_RECORD_TITLE_LENGTH) {
          throw new Error(
            `文字记录标题过长（最多 ${MAX_TEXT_RECORD_TITLE_LENGTH} 字符，实际 ${record.title.length} 字符）`
          );
        }
        if (!record.content || typeof record.content !== 'string') {
          throw new Error('文字记录数据格式错误：缺少有效的 content 字段');
        }
        if (record.content && record.content.length > MAX_TEXT_RECORD_CONTENT_LENGTH) {
          throw new Error(
            `文字记录内容过长（最多 ${MAX_TEXT_RECORD_CONTENT_LENGTH} 字符，实际 ${record.content.length} 字符）`
          );
        }
        if (!Array.isArray(record.groupIds)) {
          throw new Error('文字记录数据格式错误：groupIds 字段应为数组');
        }
        if (typeof record.order !== 'number') {
          throw new Error('文字记录数据格式错误：order 字段应为数字');
        }
      }
    }

    // ==================== 验证搜索引擎数据 ====================
    const searchEngines = data.searchEngines || [];
    if (!Array.isArray(searchEngines)) {
      throw new Error('搜索引擎数据格式错误：应为数组');
    }

    for (const engine of searchEngines) {
      if (typeof engine !== 'object' || engine === null) {
        throw new Error('搜索引擎数据格式错误：应为对象');
      }
      if (!engine.id || typeof engine.id !== 'string') {
        throw new Error('搜索引擎数据格式错误：缺少有效的 id 字段');
      }
      if (!engine.name || typeof engine.name !== 'string') {
        throw new Error('搜索引擎数据格式错误：缺少有效的 name 字段');
      }
      if (!engine.url || typeof engine.url !== 'string') {
        throw new Error('搜索引擎数据格式错误：缺少有效的 url 字段');
      }
    }

    // ==================== 验证设置数据 ====================
    if (data.settings && typeof data.settings !== 'object') {
      throw new Error('设置数据格式错误：应为对象');
    }

    // 保存导入的数据
    const importedData: Data = {
      version: data.version || getVersion(),
      groups: data.groups || [],
      bookmarks: data.bookmarks || [],
      searchEngines: searchEngines,
      settings: {
        searchEngine: data.settings?.searchEngine || 'baidu',
        darkMode: data.settings?.darkMode || 'auto',
        hideLegalInfo: data.settings?.hideLegalInfo || false,
        cookieConsent: data.settings?.cookieConsent ?? null
      }
    };

    if (saveData(importedData)) {
      onSuccess(importedData);
    } else {
      onError(new Error('保存导入数据失败'));
    }
  } catch (error) {
    onError(error instanceof Error ? error : new Error('未知错误'));
  }
}

// ==================== 分组操作 ====================

export function getGroups(): Group[] {
  return loadData().groups;
}

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

export function deleteGroup(id: string): boolean {
  const data = loadData();
  // 删除分组
  data.groups = data.groups.filter(g => g.id !== id);
  // 更新属于该分组的收藏的groupIds
  data.bookmarks = data.bookmarks.map(bookmark => ({
    ...bookmark,
    groupIds: bookmark.groupIds.filter(gid => gid !== id)
  })).filter(bookmark => bookmark.groupIds.length > 0); // 移除不再属于任何分组的收藏
  saveData(data);
  return true;
}

// ==================== 链接操作 ====================

export function getLinks(): Link[] {
  const data = loadData();
  return data.bookmarks
    .filter(b => b.type === 'link')
    .map(b => ({
      id: b.id,
      title: b.title,
      url: b.url || '',
      groupIds: b.groupIds,
      order: b.order
    }));
}

export function getLinksByGroupId(groupId: string): Link[] {
  const data = loadData();
  return data.bookmarks
    .filter(b => b.type === 'link' && b.groupIds.includes(groupId))
    .map(b => ({
      id: b.id,
      title: b.title,
      url: b.url || '',
      groupIds: b.groupIds,
      order: b.order
    }));
}

export function getLinksWithGroups(): LinkWithGroups[] {
  const data = loadData();
  return data.bookmarks
    .filter(b => b.type === 'link')
    .map(b => ({
      id: b.id,
      title: b.title,
      url: b.url || '',
      groupIds: b.groupIds,
      order: b.order,
      groups: data.groups.filter(g => b.groupIds.includes(g.id))
    }));
}

export function addLink(title: string, url: string, groupIds: string[]): Link {
  const data = loadData();
  const newBookmark: Bookmark = {
    id: generateId(),
    type: 'link',
    title: title,
    url: url,
    groupIds: groupIds,
    order: data.bookmarks.length
  };
  data.bookmarks.push(newBookmark);
  saveData(data);
  return {
    id: newBookmark.id,
    title: newBookmark.title,
    url: newBookmark.url || '',
    groupIds: newBookmark.groupIds,
    order: newBookmark.order
  };
}

export function updateLink(id: string, title: string, url: string, groupIds: string[]): boolean {
  const data = loadData();
  const index = data.bookmarks.findIndex(b => b.id === id && b.type === 'link');
  if (index === -1) return false;
  
  data.bookmarks[index].title = title;
  data.bookmarks[index].url = url;
  data.bookmarks[index].groupIds = groupIds;
  
  saveData(data);
  return true;
}

export function deleteLink(id: string): boolean {
  const data = loadData();
  data.bookmarks = data.bookmarks.filter(b => !(b.id === id && b.type === 'link'));
  saveData(data);
  return true;
}

export function batchDeleteLinks(ids: string[]): boolean {
  const data = loadData();
  data.bookmarks = data.bookmarks.filter(b => !(ids.includes(b.id) && b.type === 'link'));
  saveData(data);
  return true;
}

// ==================== 文字记录操作 ====================

export function getTextRecords(): TextRecord[] {
  const data = loadData();
  return data.bookmarks
    .filter(b => b.type === 'text')
    .map(b => ({
      id: b.id,
      title: b.title,
      content: b.content || '',
      groupIds: b.groupIds,
      order: b.order
    }));
}

export function getTextRecordsByGroupId(groupId: string): TextRecord[] {
  const data = loadData();
  return data.bookmarks
    .filter(b => b.type === 'text' && b.groupIds.includes(groupId))
    .map(b => ({
      id: b.id,
      title: b.title,
      content: b.content || '',
      groupIds: b.groupIds,
      order: b.order
    }));
}

export function getTextRecordsWithGroups(): TextRecordWithGroups[] {
  const data = loadData();
  return data.bookmarks
    .filter(b => b.type === 'text')
    .map(b => ({
      id: b.id,
      title: b.title,
      content: b.content || '',
      groupIds: b.groupIds,
      order: b.order,
      groups: data.groups.filter(g => b.groupIds.includes(g.id))
    }));
}

export function addTextRecord(title: string, content: string, groupIds: string[]): TextRecord {
  const data = loadData();
  const newBookmark: Bookmark = {
    id: generateId(),
    type: 'text',
    title: title,
    content: content,
    groupIds: groupIds,
    order: data.bookmarks.length
  };
  data.bookmarks.push(newBookmark);
  saveData(data);
  return {
    id: newBookmark.id,
    title: newBookmark.title,
    content: newBookmark.content || '',
    groupIds: newBookmark.groupIds,
    order: newBookmark.order
  };
}

export function updateTextRecord(id: string, title: string, content: string, groupIds: string[]): boolean {
  const data = loadData();
  const index = data.bookmarks.findIndex(b => b.id === id && b.type === 'text');
  if (index !== -1) {
    data.bookmarks[index].title = title;
    data.bookmarks[index].content = content;
    data.bookmarks[index].groupIds = groupIds;
    saveData(data);
    return true;
  }
  return false;
}

export function deleteTextRecord(id: string): boolean {
  const data = loadData();
  data.bookmarks = data.bookmarks.filter(b => !(b.id === id && b.type === 'text'));
  saveData(data);
  return true;
}

export function batchDeleteTextRecords(ids: string[]): boolean {
  const data = loadData();
  data.bookmarks = data.bookmarks.filter(b => !(ids.includes(b.id) && b.type === 'text'));
  saveData(data);
  return true;
}

// ==================== 设置操作 ====================

export function getSettings(): Settings {
  return loadData().settings;
}

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

export function getSearchEngineConfig(engineId: string): SearchEngine | undefined {
  const allEngines = getAllSearchEngines();
  return allEngines.find(e => e.id === engineId);
}

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
