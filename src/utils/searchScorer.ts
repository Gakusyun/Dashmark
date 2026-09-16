import type { Bookmark, Group } from '../types';

export interface PinyinOptions {
  toneType?: 'none' | 'symbol' | 'num';
  pattern?: 'pinyin' | 'initial' | 'final' | 'head' | 'tail';
  type?: 'array' | 'string';
  multiple?: boolean;
}

export interface PinyinModule {
  pinyin(text: string, options?: PinyinOptions): string | string[];
}

export interface SearchHit {
  bookmark: Bookmark;
  score: number;
  /** 命中的字段，用于排序权重与高亮提示 */
  matchedTitle: boolean;
}

function toPinyin(text: string, module: PinyinModule | null): string {
  if (!module) return '';
  const result = module.pinyin(text, { toneType: 'none', type: 'string' });
  return (Array.isArray(result) ? result.join('') : result).toLowerCase();
}

/** 查询词按空白拆分，全部子串都必须命中（AND 语义） */
function tokensOf(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

/**
 * 为一个收藏计算相关性得分。0 表示不匹配。
 *
 * 打分策略（从高到低）：
 *   标题精确 120 / 标题前缀 90 / 标题子串 70 / 标题拼音 40
 *   URL 子串 45 / 域名子串 35
 *   正文子串 30 / 正文拼音 15
 *   分组名命中 +20
 */
export function scoreBookmark(
  bookmark: Bookmark,
  query: string,
  groups: Group[],
  pinyin: PinyinModule | null
): number {
  const tokens = tokensOf(query);
  if (tokens.length === 0) return 0;

  const title = bookmark.title.toLowerCase();
  const url = (bookmark.url ?? '').toLowerCase();
  const content = (bookmark.content ?? '').toLowerCase();

  const titlePinyin = pinyin ? toPinyin(bookmark.title, pinyin) : '';
  const contentPinyin = pinyin && bookmark.type === 'text' ? toPinyin(bookmark.content ?? '', pinyin) : '';

  const groupNames = groups
    .filter((g) => bookmark.groupIds.includes(g.id))
    .map((g) => g.name.toLowerCase());

  let total = 0;

  for (const token of tokens) {
    let best = 0;

    if (title === token) best = 120;
    else if (title.startsWith(token)) best = 90;
    else if (title.includes(token)) best = 70;
    else if (titlePinyin && titlePinyin.includes(token)) best = 40;

    if (best < 45 && url && url.includes(token)) best = 45;
    if (best < 30 && content && content.includes(token)) best = 30;
    if (best < 15 && contentPinyin && contentPinyin.includes(token)) best = 15;

    if (best === 0 && groupNames.some((name) => name.includes(token))) best = 20;

    // 任一 token 完全不命中则整体不匹配
    if (best === 0) return 0;
    total += best;
  }

  return total;
}

export interface SearchResult {
  hits: SearchHit[];
  /** 标题命中的数量，用于界面提示 */
  titleMatches: number;
}

/** 在全量收藏中检索并按得分排序 */
export function searchBookmarks(
  bookmarks: Bookmark[],
  query: string,
  groups: Group[],
  pinyin: PinyinModule | null
): SearchResult {
  const trimmed = query.trim();
  if (!trimmed) return { hits: [], titleMatches: 0 };

  const hits: SearchHit[] = [];
  let titleMatches = 0;

  for (const bookmark of bookmarks) {
    const score = scoreBookmark(bookmark, trimmed, groups, pinyin);
    if (score > 0) {
      const matchedTitle = bookmark.title.toLowerCase().includes(trimmed.toLowerCase());
      if (matchedTitle) titleMatches++;
      hits.push({ bookmark, score, matchedTitle });
    }
  }

  hits.sort((a, b) => b.score - a.score || a.bookmark.order - b.bookmark.order);
  return { hits, titleMatches };
}
