/**
 * Dashmark v2.0 - IndexedDB 数据库
 * 使用 Dexie.js 简化操作
 */
import Dexie, { type Table } from 'dexie';
import type { Bookmark, Group, SearchEngine, Settings } from '../types';

export class DashmarkDB extends Dexie {
  bookmarks!: Table<Bookmark, string>;
  groups!: Table<Group, string>;
  searchEngines!: Table<SearchEngine, string>;
  settings!: Table<Settings & { key: string }, string>;

  constructor() {
    super('DashmarkDB');

    // 定义数据库表结构
    this.version(1).stores({
      bookmarks: 'id, type, title, *groupIds, *tags, createdAt, updatedAt',
      groups: 'id, name, order',
      searchEngines: 'id, name',
      settings: 'key'
    });
  }
}

export const db = new DashmarkDB();

/**
 * 初始化数据库（从 v1.6 迁移数据）
 */
export async function initDatabase(v1Data: any): Promise<void> {
  try {
    // 检查是否已初始化
    const count = await db.bookmarks.count();
    if (count > 0) {
      console.log('[Dashmark] 数据库已初始化，跳过迁移');
      return;
    }

    console.log('[Dashmark] 开始迁移 v1.6 数据到 v2.0...');

    // 迁移书签（添加 v2.0 新字段）
    if (v1Data.bookmarks && Array.isArray(v1Data.bookmarks)) {
      const bookmarks = v1Data.bookmarks.map((b: any) => ({
        ...b,
        tags: b.tags || [],
        createdAt: b.createdAt || Date.now(),
        updatedAt: b.updatedAt || Date.now()
      }));
      await db.bookmarks.bulkAdd(bookmarks);
      console.log(`[Dashmark] 迁移了 ${bookmarks.length} 个书签`);
    }

    // 迁移分组
    if (v1Data.groups && Array.isArray(v1Data.groups)) {
      await db.groups.bulkAdd(v1Data.groups);
      console.log(`[Dashmark] 迁移了 ${v1Data.groups.length} 个分组`);
    }

    // 迁移搜索引擎
    if (v1Data.searchEngines && Array.isArray(v1Data.searchEngines)) {
      await db.searchEngines.bulkAdd(v1Data.searchEngines);
      console.log(`[Dashmark] 迁移了 ${v1Data.searchEngines.length} 个搜索引擎`);
    }

    // 迁移设置
    if (v1Data.settings) {
      await db.settings.put({ ...v1Data.settings, key: 'main' });
      console.log('[Dashmark] 迁移了设置');
    }

    console.log('[Dashmark] ✅ 数据迁移完成！');
  } catch (error) {
    console.error('[Dashmark] ❌ 数据迁移失败:', error);
    throw error;
  }
}

/**
 * 获取所有数据
 */
export async function getAllData(): Promise<{
  bookmarks: Bookmark[];
  groups: Group[];
  searchEngines: SearchEngine[];
  settings: Settings;
}> {
  const [bookmarks, groups, searchEngines, settings] = await Promise.all([
    db.bookmarks.toArray(),
    db.groups.toArray(),
    db.searchEngines.toArray(),
    db.settings.get('main')
  ]);

  return {
    bookmarks,
    groups,
    searchEngines,
    settings: settings || {
      searchEngine: 'google',
      darkMode: 'auto',
      hideLegalInfo: false,
      cookieConsent: null
    }
  };
}

/**
 * 清空数据库（用于测试或重置）
 */
export async function clearDatabase(): Promise<void> {
  await db.bookmarks.clear();
  await db.groups.clear();
  await db.searchEngines.clear();
  await db.settings.clear();
  console.log('[Dashmark] 数据库已清空');
}
