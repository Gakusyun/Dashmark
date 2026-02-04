import type { Link, TextRecord } from '../types';

// ==================== 类型定义 ====================

interface PinyinOptions {
  toneType?: 'none' | 'symbol' | 'num';
  pattern?: 'pinyin' | 'initial' | 'final' | 'head' | 'tail';
  type?: 'array' | 'string';
  multiple?: boolean;
}

export interface PinyinModule {
  pinyin(text: string, options?: PinyinOptions): string | string[];
}

// ==================== 辅助函数 ====================

/**
 * 将文本转换为拼音字符串
 */
function convertToPinyin(text: string, pinyinModule: PinyinModule | null): string {
  if (!pinyinModule) {
    return '';
  }
  const pinyinResult = pinyinModule.pinyin(text, { toneType: 'none', type: 'string' });
  return Array.isArray(pinyinResult) ? pinyinResult.join('') : pinyinResult;
}

/**
 * 检查文本是否包含所有搜索字符（原文匹配）
 */
function containsAllChars(text: string, queryChars: string[]): boolean {
  const lowerText = text.toLowerCase();
  return queryChars.every(char => lowerText.includes(char));
}

/**
 * 检查文本的拼音是否包含所有搜索字符（拼音匹配）
 */
function containsAllCharsInPinyin(text: string, queryChars: string[], pinyinModule: PinyinModule | null): boolean {
  if (!pinyinModule) {
    return false;
  }
  const pinyinText = convertToPinyin(text, pinyinModule);
  return queryChars.every(char => pinyinText.toLowerCase().includes(char));
}

// ==================== 主函数 ====================

/**
 * 计算搜索查询与项目内容的匹配度分数
 *
 * 评分规则：
 * - 标题完全匹配：100分
 * - 标题包含完整搜索词：80分
 * - 标题包含所有字符：60分
 * - URL/内容包含完整搜索词：50分
 * - URL/内容包含所有字符：30分
 * - 拼音匹配：20分（标题）/ 10分（内容）
 *
 * @param item - 要评分的项目（Link 或 TextRecord）
 * @param query - 搜索查询字符串
 * @param groupNames - 分组ID到名称的映射
 * @param pinyinModule - 拼音模块（可选）
 * @returns 相关度分数（0-100）
 */
export function calculateRelevanceScore(
  item: Link | TextRecord,
  query: string,
  _groupNames: Map<string, string>,
  pinyinModule?: PinyinModule | null
): number {
  if (!query.trim()) {
    return 0;
  }

  let score = 0;
  const lowerQuery = query.toLowerCase();
  const queryChars = lowerQuery.split('').filter(c => c.trim());

  // 判断项目类型
  const hasUrl = 'url' in item;

  if (hasUrl) {
    // ==================== Link 类型 ====================
    const link = item as Link;

    // 标题完全匹配（最高优先级）
    if (link.title.toLowerCase() === lowerQuery) {
      score += 100;
    }
    // 标题包含完整搜索词
    else if (link.title.toLowerCase().includes(lowerQuery)) {
      score += 80;
    }
    // 标题包含所有字符
    else if (containsAllChars(link.title, queryChars)) {
      score += 60;
    }

    // URL 包含完整搜索词
    if (link.url.toLowerCase().includes(lowerQuery)) {
      score += 50;
    }
    // URL 包含所有字符
    else if (containsAllChars(link.url, queryChars)) {
      score += 30;
    }

    // 拼音匹配（较低优先级）
    if (pinyinModule && containsAllCharsInPinyin(link.title, queryChars, pinyinModule)) {
      score += 20;
    }
  } else {
    // ==================== TextRecord 类型 ====================
    const record = item as TextRecord;

    // 标题完全匹配
    if (record.title.toLowerCase() === lowerQuery) {
      score += 100;
    }
    // 标题包含完整搜索词
    else if (record.title.toLowerCase().includes(lowerQuery)) {
      score += 80;
    }
    // 标题包含所有字符
    else if (containsAllChars(record.title, queryChars)) {
      score += 60;
    }

    // 内容包含完整搜索词
    if (record.content.toLowerCase().includes(lowerQuery)) {
      score += 50;
    }
    // 内容包含所有字符
    else if (containsAllChars(record.content, queryChars)) {
      score += 30;
    }

    // 拼音匹配
    if (pinyinModule) {
      if (containsAllCharsInPinyin(record.title, queryChars, pinyinModule)) {
        score += 20;
      }
      if (containsAllCharsInPinyin(record.content, queryChars, pinyinModule)) {
        score += 10;
      }
    }
  }

  return score;
}
