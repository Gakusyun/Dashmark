import { gzip, ungzip } from 'pako';
import { getVersion } from './version';
import { db, getAllData } from '../db';
import type { Data, SearchEngine } from '../types';

const V2_MIGRATION_KEY = 'dashmark_v2_migrated';
const V1_STORAGE_KEY = 'dashmark_data';

// ==================== 常量 ====================

export const DEFAULT_SEARCH_ENGINES: SearchEngine[] = [
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=' },
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=' },
  { id: 'quark', name: '夸克', url: 'https://ai.quark.cn/s?q=' },
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
    cookieConsent: null,
  },
};

// ==================== 工具函数 ====================

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// ==================== 存储操作 ====================

async function initDatabase(v1Data: Data): Promise<void> {
  try {
    const count = await db.bookmarks.count();
    if (count > 0) {
      console.log('[DashMark] 数据库已初始化，跳过迁移');
      return;
    }

    console.log('[DashMark] 开始迁移 v1.6 数据到 IndexedDB...');

    if (v1Data.bookmarks && Array.isArray(v1Data.bookmarks)) {
      const bookmarks = v1Data.bookmarks.map((b) => ({
        ...b,
        tags: b.tags || [],
        createdAt: b.createdAt || Date.now(),
        updatedAt: b.updatedAt || Date.now(),
      }));
      await db.bookmarks.bulkAdd(bookmarks);
      console.log(`[DashMark] 迁移了 ${bookmarks.length} 个书签`);
    }

    if (v1Data.groups && Array.isArray(v1Data.groups)) {
      await db.groups.bulkAdd(v1Data.groups);
      console.log(`[DashMark] 迁移了 ${v1Data.groups.length} 个分组`);
    }

    if (v1Data.searchEngines && Array.isArray(v1Data.searchEngines)) {
      await db.searchEngines.bulkAdd(v1Data.searchEngines);
      console.log(`[DashMark] 迁移了 ${v1Data.searchEngines.length} 个搜索引擎`);
    }

    if (v1Data.settings) {
      await db.settings.put({ ...v1Data.settings, key: 'main' });
      console.log('[DashMark] 迁移了设置');
    }

    console.log('[DashMark] ✅ 数据迁移完成！');
  } catch (error) {
    console.error('[DashMark] ❌ 数据迁移失败:', error);
    throw error;
  }
}

function loadV1Data(): Data {
  try {
    const json = localStorage.getItem(V1_STORAGE_KEY);
    if (!json) {
      return DEFAULT_DATA;
    }
    const data = JSON.parse(json) as Partial<Data>;

    return {
      version: data.version || getVersion(),
      groups: Array.isArray(data.groups) ? data.groups : [],
      bookmarks: Array.isArray(data.bookmarks) ? data.bookmarks : [],
      searchEngines: Array.isArray(data.searchEngines) ? data.searchEngines : [],
      settings: {
        searchEngine: data.settings?.searchEngine || 'baidu',
        darkMode: data.settings?.darkMode || 'auto',
        hideLegalInfo: data.settings?.hideLegalInfo || false,
        cookieConsent: data.settings?.cookieConsent ?? null,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error(`[DashMark] 数据加载失败: ${errorMessage}，已恢复默认设置`);

    try {
      localStorage.removeItem(V1_STORAGE_KEY);
      console.log('[DashMark] 已清理损坏的数据');
    } catch (cleanupError) {
      console.error('[DashMark] 清理数据失败:', cleanupError);
    }

    return DEFAULT_DATA;
  }
}

export async function loadData(): Promise<Data> {
  try {
    const migrated = localStorage.getItem(V2_MIGRATION_KEY);
    if (migrated === 'true') {
      const data = await getAllData();
      return {
        version: getVersion(),
        ...data,
      };
    }

    // 首次访问：从 v1.6 localStorage 迁移
    console.log('[DashMark] 检测到 v1.6 数据，开始迁移到 IndexedDB...');
    const v1Data = loadV1Data();
    await initDatabase(v1Data);
    localStorage.setItem(V2_MIGRATION_KEY, 'true');

    const migratedData = await getAllData();
    return {
      version: getVersion(),
      ...migratedData,
    };
  } catch (error) {
    console.error('[DashMark] IndexedDB 加载失败，回退到 localStorage:', error);
    return loadV1Data();
  }
}

export async function saveData(data: Data): Promise<void> {
  try {
    const dataToSave = {
      ...data,
      version: data.version || getVersion(),
    };

    await db.transaction(
      'rw',
      [db.bookmarks, db.groups, db.searchEngines, db.settings],
      async () => {
        await db.bookmarks.clear();
        await db.groups.clear();
        await db.searchEngines.clear();
        await db.settings.clear();

        if (dataToSave.bookmarks.length > 0) {
          await db.bookmarks.bulkPut(dataToSave.bookmarks);
        }
        if (dataToSave.groups.length > 0) {
          await db.groups.bulkPut(dataToSave.groups);
        }
        if (dataToSave.searchEngines.length > 0) {
          await db.searchEngines.bulkPut(dataToSave.searchEngines);
        }
        await db.settings.put({ ...dataToSave.settings, key: 'main' });
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error(`[DashMark] 数据保存失败: ${errorMessage}`);
    throw error;
  }
}

// ==================== 导出/导入 ====================

export async function exportData(): Promise<void> {
  const data = await loadData();

  const exportPayload = {
    version: data.version,
    groups: data.groups,
    bookmarks: data.bookmarks,
    searchEngines: data.searchEngines,
    settings: data.settings,
  };

  const json = JSON.stringify(exportPayload, null, 2);
  const compressed = gzip(json);
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
  onSuccess: (data: Data, warnings: string[]) => void,
  onError: (error: Error) => void,
  merge: boolean = false
): void {
  const isGzip = file.name.endsWith('.gz');

  const reader = new FileReader();
  reader.onload = async function (e) {
    try {
      let json: string;
      if (isGzip) {
        const result = e.target?.result;
        if (!(result instanceof ArrayBuffer)) {
          throw new Error('Invalid gzip file content');
        }
        const compressed = new Uint8Array(result);
        json = ungzip(compressed, { toText: true });
      } else {
        const result = e.target?.result;
        if (typeof result !== 'string') {
          throw new Error('Invalid JSON file content');
        }
        json = result;
      }
      await processData(json, onSuccess, onError, merge);
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

async function processData(
  json: string,
  onSuccess: (data: Data, warnings: string[]) => void,
  onError: (error: Error) => void,
  merge: boolean = false
): Promise<void> {
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
        for (const value of Object.values(obj as Record<string, unknown>)) {
          checkDepth(value, currentDepth + 1);
        }
      }
    };

    const data = JSON.parse(json) as Partial<Data>;
    checkDepth(data, 0);

    // ==================== 版本兼容性检查 ====================
    const warnings: string[] = [];
    const currentVersion = getVersion();
    const currentMajor = parseInt(currentVersion.split('.')[0], 10);
    const importedMajor = data.version ? parseInt(data.version.split('.')[0], 10) : NaN;

    if (!isNaN(importedMajor) && !isNaN(currentMajor) && importedMajor !== currentMajor) {
      warnings.push(
        `备份文件版本（v${data.version}）与当前版本（v${currentVersion}）主版本号不同，部分数据可能不兼容。`
      );
    }

    // ==================== 数组长度限制 ====================
    const MAX_GROUPS = 1000;
    const MAX_LINKS = 10000;
    const MAX_TEXT_RECORDS = 10000;

    if (data.groups && Array.isArray(data.groups) && data.groups.length > MAX_GROUPS) {
      throw new Error(`分组数量超出限制（最多 ${MAX_GROUPS} 个，实际 ${data.groups.length} 个）`);
    }

    if (data.bookmarks && Array.isArray(data.bookmarks)) {
      const linkCount = data.bookmarks.filter((b) => b.type === 'link').length;
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
      const linkBookmarks = data.bookmarks.filter((b) => b.type === 'link');
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

      const textBookmarks = data.bookmarks.filter((b) => b.type === 'text');
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

    const importedGroups = data.groups || [];
    const importedBookmarks = data.bookmarks || [];
    const importedEngines = data.searchEngines || [];

    let finalData: Data;

    if (merge) {
      // 合并模式：与现有数据合并，按 id 去重
      const existing = await loadData();

      const existingGroupIds = new Set(existing.groups.map((g) => g.id));
      const mergedGroups = [...existing.groups, ...importedGroups.filter((g) => !existingGroupIds.has(g.id))];

      const existingBookmarkIds = new Set(existing.bookmarks.map((b) => b.id));
      const mergedBookmarks = [
        ...existing.bookmarks,
        ...importedBookmarks.filter((b) => !existingBookmarkIds.has(b.id)),
      ];

      const existingEngineIds = new Set(existing.searchEngines.map((e) => e.id));
      const mergedEngines = [
        ...existing.searchEngines,
        ...importedEngines.filter((e) => !existingEngineIds.has(e.id)),
      ];

      finalData = {
        version: currentVersion,
        groups: mergedGroups,
        bookmarks: mergedBookmarks,
        searchEngines: mergedEngines,
        settings: existing.settings,
      };
    } else {
      finalData = {
        version: data.version || getVersion(),
        groups: importedGroups,
        bookmarks: importedBookmarks,
        searchEngines: importedEngines,
        settings: {
          searchEngine: data.settings?.searchEngine || 'baidu',
          darkMode: data.settings?.darkMode || 'auto',
          hideLegalInfo: data.settings?.hideLegalInfo || false,
          cookieConsent: data.settings?.cookieConsent ?? null,
        },
      };
    }

    await saveData(finalData);
    console.log(
      `[DashMark] 成功导入 ${finalData.bookmarks.length} 个收藏，${finalData.groups.length} 个分组`
    );
    onSuccess(finalData, warnings);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error(`[DashMark] 数据处理失败: ${errorMessage}`);
    onError(new Error(errorMessage));
  }
}

// ==================== 云同步：快照与历史 ====================

const HISTORY_LIMIT = 3; // 除当前版本外，最多保留的历史快照数

/** 将当前整包数据序列化并 gzip，作为一次快照 */
export async function snapshotCurrent(): Promise<Uint8Array> {
  const data = await loadData();
  const payload = {
    version: data.version,
    groups: data.groups,
    bookmarks: data.bookmarks,
    searchEngines: data.searchEngines,
    settings: data.settings,
  };
  return gzip(JSON.stringify(payload));
}

/** 把当前数据存入历史快照，超出上限的旧快照滚动淘汰 */
export async function saveHistorySnapshot(): Promise<void> {
  try {
    const payload = await snapshotCurrent();
    await db.syncHistory.add({
      id: generateId(),
      savedAt: Date.now(),
      payload,
    });

    // 只保留最新 HISTORY_LIMIT 条
    const all = await db.syncHistory.orderBy('savedAt').reverse().toArray();
    const stale = all.slice(HISTORY_LIMIT);
    if (stale.length > 0) {
      await db.syncHistory.bulkDelete(stale.map((e) => e.id));
    }
  } catch (error) {
    console.error('[DashMark] 保存历史快照失败:', error);
  }
}

/** 列出历史快照（新→旧） */
export async function listHistory(): Promise<{ id: string; savedAt: number }[]> {
  const all = await db.syncHistory.orderBy('savedAt').reverse().toArray();
  return all.map((e) => ({ id: e.id, savedAt: e.savedAt }));
}

/** 解析快照 JSON 为 Data（来自自身云端或历史快照，做基础校验与默认值填充） */
function parseSnapshot(json: string): Data {
  if (json.length > 50 * 1024 * 1024) {
    throw new Error('数据包过大（超过 50MB）');
  }
  const data = JSON.parse(json) as Partial<Data>;
  return {
    version: getVersion(),
    groups: Array.isArray(data.groups) ? data.groups : [],
    bookmarks: Array.isArray(data.bookmarks) ? data.bookmarks : [],
    searchEngines: Array.isArray(data.searchEngines) ? data.searchEngines : [],
    settings: {
      searchEngine: data.settings?.searchEngine || 'baidu',
      darkMode: data.settings?.darkMode || 'auto',
      hideLegalInfo: data.settings?.hideLegalInfo ?? false,
      cookieConsent: data.settings?.cookieConsent ?? null,
    },
  };
}

/** 用快照二进制（gzip JSON）覆盖本地数据 */
export async function applySnapshot(payload: Uint8Array): Promise<Data> {
  const json = ungzip(payload, { toText: true });
  const data = parseSnapshot(json);
  await saveData(data);
  return data;
}

/** 恢复某条历史快照到当前 */
export async function restoreHistory(id: string): Promise<Data> {
  const entry = await db.syncHistory.get(id);
  if (!entry) throw new Error('历史快照不存在');
  return applySnapshot(entry.payload);
}
