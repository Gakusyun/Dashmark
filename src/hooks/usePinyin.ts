import { useEffect, useState } from 'react';
import type { PinyinModule } from '../utils/searchScorer';

/**
 * 按需加载拼音库。
 *
 * 只有 `enabled` 为 true（即用户真的开始搜索）时才发起动态 import，
 * 避免首屏加载 ~300KB 的拼音数据。加载完成后把模块放在 state 中，
 * 以便依赖它的 useMemo 能正确重新计算。
 */
export function usePinyin(enabled: boolean): PinyinModule | null {
  const [module, setModule] = useState<PinyinModule | null>(null);

  useEffect(() => {
    if (!enabled || module) return;
    let cancelled = false;
    import('pinyin-pro')
      .then((mod) => {
        if (!cancelled) setModule(mod as unknown as PinyinModule);
      })
      .catch((error) => {
        console.warn('[DashMark] 拼音库加载失败，搜索将仅支持文本匹配:', error);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, module]);

  return module;
}
