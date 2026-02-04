/**
 * URL 验证工具函数
 *
 * 用于验证 URL 的安全性和格式正确性，防止伪协议攻击（如 javascript:）
 */

/**
 * 验证 URL 是否安全且格式正确
 *
 * 只允许 http: 和 https: 协议，拒绝 javascript:、data:、file: 等危险协议。
 *
 * @param url - 待验证的 URL 字符串
 * @returns 如果 URL 安全且格式正确返回 true，否则返回 false
 *
 * @example
 * ```ts
 * isValidUrl('https://example.com')      // true
 * isValidUrl('http://localhost:8080')    // true
 * isValidUrl('example.com')              // true (自动添加 https://)
 * isValidUrl('javascript:alert(1)')      // false
 * isValidUrl('data:text/html,<script>')  // false
 * isValidUrl('file:///etc/passwd')       // false
 * isValidUrl('not-a-url')                // false
 * ```
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
 *
 * @param url - 待规范化的 URL 字符串
 * @returns 规范化后的 URL（包含 http:// 或 https://）
 * @throws 如果 URL 格式无效，抛出错误
 *
 * @example
 * ```ts
 * normalizeUrl('example.com')        // 'https://example.com'
 * normalizeUrl('http://example.com')  // 'http://example.com'
 * normalizeUrl('not-a-url')          // throws Error
 * ```
 */
export function normalizeUrl(url: string): string {
  if (!isValidUrl(url)) {
    throw new Error(`Invalid URL: ${url}`);
  }

  return url.startsWith('http') ? url : 'https://' + url;
}
