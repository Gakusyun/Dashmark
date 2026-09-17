/**
 * Dashmark - IndexedDB 数据库
 * 使用 Dexie.js 简化操作
 */
import Dexie, { type Table } from 'dexie';
import type { Bookmark, Group, SearchEngine, Settings } from '../types';

/** 云同步历史快照：仅保存被云端覆盖前的本地版本，供撤回 */
export interface SyncHistoryEntry {
  id: string;
  savedAt: number;
  payload: Uint8Array; // gzip 后的整包 JSON
}

export class DashmarkDB extends Dexie {
  bookmarks!: Table<Bookmark, string>;
  groups!: Table<Group, string>;
  searchEngines!: Table<SearchEngine, string>;
  settings!: Table<Settings & { key: string }, string>;
  syncHistory!: Table<SyncHistoryEntry, string>;

  constructor() {
    super('DashmarkDB');

    // 定义数据库表结构
    this.version(1).stores({
      bookmarks: 'id, type, title, *groupIds, *tags, createdAt, updatedAt',
      groups: 'id, name, order',
      searchEngines: 'id, name',
      settings: 'key',
    });

    // v2：新增云同步历史快照表
    this.version(2).stores({
      bookmarks: 'id, type, title, *groupIds, *tags, createdAt, updatedAt',
      groups: 'id, name, order',
      searchEngines: 'id, name',
      settings: 'key',
      syncHistory: 'id, savedAt',
    });
  }
}

export const db = new DashmarkDB();

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
    db.settings.get('main'),
  ]);

  return {
    bookmarks,
    groups,
    searchEngines,
    settings: settings || {
      searchEngine: 'baidu',
      darkMode: 'auto',
      hideLegalInfo: false,
      cookieConsent: null,
    },
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
  console.log('[DashMark] 数据库已清空');
}
