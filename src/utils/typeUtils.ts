import type { Bookmark, Link, TextRecord, Group } from '../types';

// 定义联合类型，可以接受链接、文字记录或收藏
export type Item = (Link | TextRecord) | (Omit<Bookmark, 'content'> & { content: string }) | (Omit<Bookmark, 'url'> & { url: string }) | Bookmark;

/**
 * 判断项目是否为链接类型
 */
export function isLink(item: Item): item is (Link | Bookmark) {
  if ('type' in item) {
    // 这是新的收藏类型
    return (item as Bookmark).type === 'link';
  } else {
    // 这是旧的链接或文字记录类型
    return 'url' in item;
  }
}

/**
 * 判断项目是否为文字记录类型
 */
export function isTextRecord(item: Item): item is (TextRecord | Bookmark) {
  if ('type' in item) {
    // 这是新的收藏类型
    return (item as Bookmark).type === 'text';
  } else {
    // 这是旧的链接或文字记录类型
    return 'content' in item && !('url' in item);
  }
}

// 导出原始类型以供使用
export type { Bookmark, Link, TextRecord, Group };