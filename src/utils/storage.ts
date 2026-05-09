import pako from 'pako';
import { getVersion } from './version';
import type {
  Data,
  SearchEngine,
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
    const data = JSON.parse(json) as Partial<Data>;

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
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error(`[DashMark] 数据加载失败: ${errorMessage}，已恢复默认设置`);

    // 尝试清理损坏的数据
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('[DashMark] 已清理损坏的数据');
    } catch (cleanupError) {
      console.error('[DashMark] 清理数据失败:', cleanupError);
    }

    return DEFAULT_DATA;
  }
}

export function saveData(data: Data): boolean {
  try {
    // 确保数据始终包含版本号
    const dataToSave = {
      ...data,
      version: data.version || getVersion()
    };

    // 检查数据大小（localStorage 限制通常为 5-10MB）
    const json = JSON.stringify(dataToSave);
    if (json.length > 5 * 1024 * 1024) { // 5MB
      throw new Error(`数据过大（${(json.length / 1024 / 1024).toFixed(2)}MB），超出 localStorage 限制`);
    }

    localStorage.setItem(STORAGE_KEY, json);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error(`[DashMark] 数据保存失败: ${errorMessage}`);

    // 如果是配额错误，给用户更友好的提示
    if (errorMessage.includes('quota') || errorMessage.includes('存储空间') || errorMessage.includes('数据过大')) {
      console.error('[DashMark] 提示：请删除部分收藏或导出备份后清理数据');
    }

    return false;
  }
}

export function exportData(): void {
  const data = loadData();

  const exportData = {
    version: data.version,
    groups: data.groups,
    bookmarks: data.bookmarks,
    searchEngines: data.searchEngines,
    settings: data.settings
  };

  const json = JSON.stringify(exportData, null, 2);
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
  const isGzip = file.name.endsWith('.gz');

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      if (isGzip) {
        const result = e.target?.result;
        if (!(result instanceof ArrayBuffer)) {
          throw new Error('Invalid gzip file content');
        }
        const compressed = new Uint8Array(result);
        const json = pako.ungzip(compressed, { to: 'string' });
        processData(json, onSuccess, onError);
      } else {
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
    console.error('[DashMark] 文件读取失败');
    onError(new Error('文件读取失败，请检查文件格式是否正确'));
  };

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
    if (json.length > 50 * 1024 * 1024) {
      throw new Error('导入文件过大（超过 50MB）');
    }

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

    const data = JSON.parse(json) as Partial<Data>;
    checkDepth(data, 0);

    // ==================== 数组长度限制 ====================
    const MAX_GROUPS = 1000;
    const MAX_LINKS = 10000;
    const MAX_TEXT_RECORDS = 10000;

    if (data.groups && Array.isArray(data.groups) && data.groups.length > MAX_GROUPS) {
      throw new Error(`分组数量超出限制（最多 ${MAX_GROUPS} 个，实际 ${data.groups.length} 个）`);
    }

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

    const importedData: Data = {
      version: data.version || getVersion(),
      groups: data.groups || [],
      bookmarks: data.bookmarks || [],
      searchEngines: data.searchEngines || [],
      settings: {
        searchEngine: data.settings?.searchEngine || 'baidu',
        darkMode: data.settings?.darkMode || 'auto',
        hideLegalInfo: data.settings?.hideLegalInfo || false,
        cookieConsent: data.settings?.cookieConsent ?? null
      }
    };

    if (saveData(importedData)) {
      console.log(`[DashMark] 成功导入 ${importedData.bookmarks.length} 个收藏，${importedData.groups.length} 个分组`);
      onSuccess(importedData);
    } else {
      onError(new Error('保存导入数据失败，请检查存储空间是否足够'));
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error(`[DashMark] 数据处理失败: ${errorMessage}`);
    onError(new Error(errorMessage));
  }
}

// ==================== 搜索引擎操作 ====================

export function getAllSearchEngines(): SearchEngine[] {
  const data = loadData();
  const allEngines: SearchEngine[] = [...DEFAULT_SEARCH_ENGINES];

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

  if (data.settings.searchEngine === id) {
    data.settings.searchEngine = 'baidu';
  }

  data.searchEngines = data.searchEngines.filter(e => e.id !== id);
  saveData(data);
  return true;
}
