/**
 * URL 展示辅助工具：提取域名、生成 favicon 地址、生成稳定配色。
 */

/** 解析 URL，失败返回 null（不抛异常） */
function tryParse(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    try {
      return new URL('https://' + url);
    } catch {
      return null;
    }
  }
}

/** 提取用于展示的域名（去掉 www. 前缀） */
export function getDisplayHost(url: string): string {
  const parsed = tryParse(url);
  if (!parsed) return url;
  return parsed.hostname.replace(/^www\./, '');
}

/**
 * 生成 favicon URL。
 *
 * 使用 Google s2 服务，尺寸 64。若图片加载失败，调用方应回退到首字母。
 * 对非 http(s) URL 返回空串。
 */
export function getFaviconUrl(url: string, size: number = 64): string {
  const parsed = tryParse(url);
  if (!parsed) return '';
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(parsed.hostname)}&sz=${size}`;
}

/** 首字母：优先取域名首字符，其次标题首字符 */
export function getInitial(title: string, url: string): string {
  const host = getDisplayHost(url).replace(/^[^a-z0-9\u4e00-\u9fa5]+/i, '');
  const source = host || title || '?';
  return source.charAt(0).toUpperCase();
}

/** 基于字符串生成稳定的柔和色相（0-359） */
export function getHue(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}
