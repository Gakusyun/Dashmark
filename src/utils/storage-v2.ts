/**
 * Dashmark v2.0 - 存储层
 * 支持 IndexedDB + 自动从 v1.6 localStorage 迁移
 */
import { getVersion } from './version';
import { db, getAllData, initDatabase } from '../db';
import type { Data } from '../types';

const V2_MIGRATION_KEY = 'dashmark_v2_migrated';
const V1_STORAGE_KEY = 'dashmark_data';

/**
 * 加载数据（优先从 IndexedDB，首次访问则迁移）
 */
export async function loadData(): Promise<Data> {
  try {
    // 检查是否已完成 v2.0 迁移
    const migrated = localStorage.getItem(V2_MIGRATION_KEY);
    if (migrated === 'true') {
      console.log('[Dashmark v2.0] 从 IndexedDB 加载数据...');
      const data = await getAllData();
      return {
        version: '2.0.0',
        ...data
      };
    }

    // 首次访问：从 v1.6 localStorage 迁移
    console.log('[Dashmark v2.0] 检测到 v1.6 数据，开始迁移...');
    const v1Data = loadV1Data();

    // 初始化 IndexedDB 并迁移数据
    await initDatabase(v1Data);

    // 标记迁移完成
    localStorage.setItem(V2_MIGRATION_KEY, 'true');

    // 返回迁移后的数据
    const migratedData = await getAllData();
    return {
      version: '2.0.0',
      ...migratedData
    };
  } catch (error) {
    console.error('[Dashmark v2.0] IndexedDB 加载失败，回退到 localStorage:', error);
    // 降级到 v1.6 的 localStorage
    return loadV1Data();
  }
}

/**
 * 保存数据到 IndexedDB
 */
export async function saveData(data: Partial<Data>): Promise<void> {
  try {
    if (data.bookmarks) {
      await db.bookmarks.bulkPut(data.bookmarks);
    }
    if (data.groups) {
      await db.groups.bulkPut(data.groups);
    }
    if (data.searchEngines) {
      await db.searchEngines.bulkPut(data.searchEngines);
    }
    if (data.settings) {
      await db.settings.put({ ...data.settings, key: 'main' });
    }
    console.log('[Dashmark v2.0] 数据已保存到 IndexedDB');
  } catch (error) {
    console.error('[Dashmark v2.0] IndexedDB 保存失败:', error);
    throw error;
  }
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * 默认数据
 */
export const DEFAULT_DATA: Data = {
  version: '2.0.0',
  groups: [],
  bookmarks: [],
  searchEngines: [
    { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=' },
    { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=' },
    { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=' }
  ],
  settings: {
    searchEngine: 'google',
    darkMode: 'auto',
    hideLegalInfo: false,
    cookieConsent: null
  }
};

// ==================== 私有函数 ====================

/**
 * 从 v1.6 localStorage 加载数据（用于迁移和降级）
 */
function loadV1Data(): Data {
  try {
    const json = localStorage.getItem(V1_STORAGE_KEY);
    if (!json) {
      return DEFAULT_DATA;
    }
    const data = JSON.parse(json) as Partial<Data>;

    // 直接使用最新的数据结构
    const result: Data = {
      version: data.version || getVersion(),
      groups: Array.isArray(data.groups) ? data.groups : [],
      bookmarks: Array.isArray(data.bookmarks) ? data.bookmarks : [],
      searchEngines: Array.isArray(data.searchEngines) ? data.searchEngines : [],
      settings: {
        searchEngine: data.settings?.searchEngine || 'google',
        darkMode: data.settings?.darkMode || 'auto',
        hideLegalInfo: data.settings?.hideLegalInfo || false,
        cookieConsent: data.settings?.cookieConsent ?? null
      }
    };

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error(`[Dashmark] 数据加载失败: ${errorMessage}`);

    // 尝试清理损坏的数据
    try {
      localStorage.removeItem(V1_STORAGE_KEY);
      console.log('[Dashmark] 已清理损坏的数据');
    } catch (cleanupError) {
      console.error('[Dashmark] 清理数据失败:', cleanupError);
    }

    return DEFAULT_DATA;
  }
}

// ==================== 导出/导入（复用 v1.6 逻辑） ====================

// 为了简化，导出/导入功能暂时保留 v1.6 的实现
// TODO: 后续实现 IndexedDB 的导出/导入
export { exportData, importData } from './storage';
