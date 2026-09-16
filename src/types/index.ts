export interface SearchEngine {
  id: string;
  name: string;
  url: string;
}

export interface Settings {
  searchEngine: string;
  /** 已废弃：主题固定跟随系统，仅保留字段以兼容旧数据与导入导出 */
  darkMode: 'light' | 'dark' | 'auto';
  hideLegalInfo?: boolean;
  cookieConsent?: boolean | null;
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

export interface TextRecord {
  id: string;
  title: string;
  content: string;
  groupIds: string[];
  order: number;
}

// 统一的收藏类型，可以是链接或文字记录
export type BookmarkType = 'link' | 'text';

export interface Bookmark {
  id: string;
  type: BookmarkType;
  title: string;
  groupIds: string[];
  order: number;
  // 链接特有属性
  url?: string;
  // 文字记录特有属性
  content?: string;
  // v2.0 新增字段
  tags?: string[]; // 标签
  createdAt?: number; // 创建时间
  updatedAt?: number; // 更新时间
}

export interface Data {
  version: string;
  groups: Group[];
  bookmarks: Bookmark[];
  searchEngines: SearchEngine[];
  settings: Settings;
}

export interface LinkWithGroups extends Link {
  groups: Group[];
}

export interface TextRecordWithGroups extends TextRecord {
  groups: Group[];
}
