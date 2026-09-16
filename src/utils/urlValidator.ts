/**
 * URL 验证工具函数
 *
 * 用于验证 URL 的安全性和格式正确性，防止伪协议攻击（如 javascript:）
 */

/**
 * 验证 URL 是否安全且格式正确
 *
 * 只允许 http: 和 https: 协议，拒绝 javascript:、data:、file: 等危险协议。
 */
export function isValidUrl(url: string): boolean {
  try {
    // 如果 URL 不以 http 开头，尝试添加 https:// 前缀
    const normalizedUrl = url.startsWith('http') ? url : 'https://' + url;
    const parsed = new URL(normalizedUrl);

    // 只允许 http 和 https 协议
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    // URL 解析失败，说明格式不正确
    return false;
  }
}

/**
 * 规范化 URL（确保包含协议）
 *
 * 如果 URL 不包含协议前缀，自动添加 https://
 */
export function normalizeUrl(url: string): string {
  if (!isValidUrl(url)) {
    throw new Error(`Invalid URL: ${url}`);
  }

  return url.startsWith('http') ? url : 'https://' + url;
}
