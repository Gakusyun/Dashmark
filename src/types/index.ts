export interface SearchEngine {
  id: string;
  name: string;
  url: string;
}

export interface Settings {
  searchEngine: string;
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
