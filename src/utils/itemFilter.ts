import type { Link, TextRecord } from '../types';
import { calculateRelevanceScore, type PinyinModule } from './searchScorer';

// ==================== 主函数 ====================

/**
 * 根据搜索查询过滤链接和文字记录
 *
 * 功能：
 * - 如果查询为空，返回所有项目
 * - 计算每个项目的相关度分数
 * - 只保留分数 > 0 的项目
 * - 按分数降序排序
 *
 * @param items - 要过滤的项目列表（Link 或 TextRecord）
 * @param searchQuery - 搜索查询字符串
 * @param groupNames - 分组ID到名称的映射
 * @param pinyinModule - 拼音模块（可选）
 * @returns 过滤并排序后的项目列表
 */
export function filterItemsByQuery<T extends Link | TextRecord>(
  items: T[],
  searchQuery: string,
  groupNames: Map<string, string>,
  pinyinModule?: PinyinModule | null
): T[] {
  // 如果查询为空，返回所有项目
  if (!searchQuery.trim()) {
    return items;
  }

  // 为每个项目计算分数并过滤
  const scoredItems = items
    .map(item => ({
      item,
      score: calculateRelevanceScore(item, searchQuery, groupNames, pinyinModule)
    }))
    .filter(({ score }) => score > 0);

  // 按分数降序排序
  scoredItems.sort((a, b) => b.score - a.score);

  // 返回排序后的项目列表
  return scoredItems.map(({ item }) => item);
}

/**
 * 检查项目是否匹配搜索查询
 *
 * 这是一个轻量级的版本，只检查是否匹配，不计算分数
 * 用于需要快速判断的场景
 *
 * @param item - 要检查的项目
 * @param searchQuery - 搜索查询字符串
 * @param pinyinModule - 拼音模块（可选）
 * @returns 是否匹配
 */
export function isItemMatchQuery(
  item: Link | TextRecord,
  searchQuery: string,
  pinyinModule?: PinyinModule | null
): boolean {
  if (!searchQuery.trim()) {
    return true;
  }

  const lowerQuery = searchQuery.toLowerCase();
  const queryChars = lowerQuery.split('').filter(c => c.trim());

  // 辅助函数：检查文本是否包含所有搜索字符
  const containsAllChars = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    return queryChars.every(char => lowerText.includes(char));
  };

  // 辅助函数：检查文本的拼音是否包含所有搜索字符
  const containsAllCharsInPinyin = (text: string): boolean => {
    if (!pinyinModule) {
      return false;
    }
    const pinyinResult = pinyinModule.pinyin(text, { toneType: 'none', type: 'string' });
    const pinyinText = Array.isArray(pinyinResult) ? pinyinResult.join('') : pinyinResult;
    return queryChars.every(char => pinyinText.toLowerCase().includes(char));
  };

  // 判断项目类型并检查匹配
  const hasUrl = 'url' in item;

  if (hasUrl) {
    const link = item as Link;
    return (
      containsAllChars(link.title) ||
      containsAllChars(link.url) ||
      containsAllCharsInPinyin(link.title)
    );
  } else {
    const record = item as TextRecord;
    return (
      containsAllChars(record.title) ||
      containsAllChars(record.content) ||
      containsAllCharsInPinyin(record.title) ||
      containsAllCharsInPinyin(record.content)
    );
  }
}
