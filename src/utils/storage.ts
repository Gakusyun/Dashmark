import pako from 'pako';
import type {
  Data,
  SearchEngine,
  Group,
  Link,
  TextRecord,
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
  groups: [],
  links: [],
  textRecords: [],
  searchEngines: [],
  settings: {
    searchEngine: 'baidu',
    darkMode: 'auto'
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
      textRecords: Array.isArray(data.textRecords) ? data.textRecords : [],
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

export function saveData(data: Data): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to save data:', error);
    return false;
  }
}

export function exportData(): void {
  const data = loadData();
  const json = JSON.stringify(data, null, 2);
  // 使用 gzip 压缩
  const compressed = pako.gzip(json);
  const blob = new Blob([compressed], { type: 'application/gzip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dashmark_backup_${new Date().toISOString().slice(0, 10)}.json.gz`;
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
    const data: Data = JSON.parse(json);

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

    // 保存导入的数据，兼容旧版数据格式
    const importedData: Data = {
      groups: data.groups,
      links: data.links,
      textRecords: data.textRecords || [], // 兼容旧版数据
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
  // 删除属于该分组的链接（只属于这一个分组的链接）
  data.links = data.links.filter(link => {
    const belongsToGroup = link.groupIds.includes(id);
    if (belongsToGroup) {
      link.groupIds = link.groupIds.filter(gid => gid !== id);
      // 如果链接不再属于任何分组，则删除该链接
      return link.groupIds.length > 0;
    }
    return true;
  });
  // 删除属于该分组的文字记录（只属于这一个分组的文字记录）
  data.textRecords = data.textRecords.filter(record => {
    const belongsToGroup = record.groupIds.includes(id);
    if (belongsToGroup) {
      record.groupIds = record.groupIds.filter(gid => gid !== id);
      // 如果文字记录不再属于任何分组，则删除该文字记录
      return record.groupIds.length > 0;
    }
    return true;
  });
  saveData(data);
  return true;
}

// ==================== 链接操作 ====================

export function getLinks(): Link[] {
  return loadData().links;
}

export function getLinksByGroupId(groupId: string): Link[] {
  const data = loadData();
  return data.links.filter(link => link.groupIds.includes(groupId));
}

export function getLinksWithGroups(): LinkWithGroups[] {
  const data = loadData();
  return data.links.map(link => ({
    ...link,
    groups: data.groups.filter(g => link.groupIds.includes(g.id))
  }));
}

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

export function deleteLink(id: string): boolean {
  const data = loadData();
  data.links = data.links.filter(l => l.id !== id);
  saveData(data);
  return true;
}

export function batchDeleteLinks(ids: string[]): boolean {
  const data = loadData();
  data.links = data.links.filter(l => !ids.includes(l.id));
  saveData(data);
  return true;
}

// ==================== 文字记录操作 ====================

export function getTextRecords(): TextRecord[] {
  return loadData().textRecords;
}

export function getTextRecordsByGroupId(groupId: string): TextRecord[] {
  const data = loadData();
  return data.textRecords.filter(record => record.groupIds.includes(groupId));
}

export function getTextRecordsWithGroups(): TextRecordWithGroups[] {
  const data = loadData();
  return data.textRecords.map(record => ({
    ...record,
    groups: data.groups.filter(g => record.groupIds.includes(g.id))
  }));
}

export function addTextRecord(title: string, content: string, groupIds: string[]): TextRecord {
  const data = loadData();
  const record: TextRecord = {
    id: generateId(),
    title: title,
    content: content,
    groupIds: groupIds,
    order: data.textRecords.length
  };
  data.textRecords.push(record);
  saveData(data);
  return record;
}

export function updateTextRecord(id: string, title: string, content: string, groupIds: string[]): boolean {
  const data = loadData();
  const index = data.textRecords.findIndex(r => r.id === id);
  if (index !== -1) {
    data.textRecords[index].title = title;
    data.textRecords[index].content = content;
    data.textRecords[index].groupIds = groupIds;
    saveData(data);
    return true;
  }
  return false;
}

export function deleteTextRecord(id: string): boolean {
  const data = loadData();
  data.textRecords = data.textRecords.filter(r => r.id !== id);
  saveData(data);
  return true;
}

export function batchDeleteTextRecords(ids: string[]): boolean {
  const data = loadData();
  data.textRecords = data.textRecords.filter(r => !ids.includes(r.id));
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
