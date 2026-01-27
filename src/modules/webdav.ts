// ==================== WebDAV 客户端模块 ====================
// 使用原生 Fetch API 实现 WebDAV 协议

import type { WebDAVConfig } from '../storage.ts';

// 检测是否在开发环境
const isDev = import.meta.env.DEV;

/**
 * 获取 WebDAV 基础 URL
 * 在开发环境中使用代理，生产环境直接连接
 */
function getBaseURL(config: WebDAVConfig): string {
  if (isDev && config.url.includes('jianguoyun.com')) {
    // 开发环境使用 Vite 代理
    return '/webdav-proxy';
  }
  // 生产环境或非坚果云，直接使用原 URL
  return config.url;
}

export interface WebDAVError {
  type: 'network' | 'auth' | 'not_found' | 'permission' | 'unknown';
  message: string;
  code?: number;
}

/**
 * 生成 Basic Auth 头
 */
function getAuthHeader(username: string, password: string): string {
  const credentials = `${username}:${password}`;
  return `Basic ${btoa(credentials)}`;
}

/**
 * 构建 WebDAV 文件完整 URL
 */
function buildFileURL(config: WebDAVConfig, filename: string): string {
  // 确保路径以 / 开头和结尾
  let path = config.path;
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  if (!path.endsWith('/')) {
    path = path + '/';
  }

  // 在开发环境使用代理
  const baseURL = getBaseURL(config);

  // 如果使用代理（相对路径）
  if (baseURL.startsWith('/')) {
    // 对于代理，WebDAV 路径格式：/dav/路径
    // 用户名通过 Authorization 头传递，不包含在 URL 路径中
    const davPath = '/dav';
    // 构建完整路径：/webdav-proxy + /dav + /dashmark/ + filename
    return baseURL + davPath + path + filename;
  }

  // 否则使用 URL 构造器
  const url = new URL(path + filename, baseURL);
  return url.toString();
}

/**
 * 测试 WebDAV 连接
 */
export async function testConnection(config: WebDAVConfig): Promise<boolean> {
  try {
    const url = buildFileURL(config, 'data.json');
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'Authorization': getAuthHeader(config.username, config.password)
      }
    });

    // 404 表示连接成功但文件不存在，这也是正常的
    return response.status === 200 || response.status === 404;
  } catch (error) {
    console.error('WebDAV connection test failed:', error);
    return false;
  }
}

/**
 * 从 WebDAV 下载文件
 */
export async function downloadFile(config: WebDAVConfig, filename: string): Promise<string> {
  const url = buildFileURL(config, filename);

  console.log('[downloadFile] Downloading file from WebDAV:');
  console.log('  - Filename:', filename);
  console.log('  - URL:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(config.username, config.password)
      }
    });

    console.log('  - Response status:', response.status);

    if (!response.ok) {
      const responseText = await response.text();
      console.log('  - Response body:', responseText);

      if (response.status === 401) {
        throw createError('auth', '认证失败，请检查用户名和密码', response.status);
      } else if (response.status === 404) {
        throw createError('not_found', '文件不存在', response.status);
      } else if (response.status === 403) {
        throw createError('permission', '没有访问权限', response.status);
      } else {
        throw createError('unknown', `下载失败 (HTTP ${response.status})`, response.status);
      }
    }

    const text = await response.text();
    console.log('  - Downloaded successfully, content length:', text.length);
    return text;
  } catch (error) {
    console.log('  - Download error:', error);
    // 检查是否是 WebDAVError（通过 type 属性）
    if (error && typeof error === 'object' && 'type' in error) {
      throw error;
    }
    throw createError('network', '网络连接失败');
  }
}

/**
 * 创建 WebDAV 目录
 */
async function createDirectory(config: WebDAVConfig, dirPath: string): Promise<void> {
  const baseURL = getBaseURL(config);

  let url: string;
  if (baseURL.startsWith('/')) {
    // 使用代理
    // 坚果云 WebDAV 路径格式：/dav/路径
    // 用户名通过 Authorization 头传递
    const davPath = '/dav';
    url = baseURL + davPath + dirPath;
  } else {
    // 直接连接
    url = new URL(dirPath, baseURL).toString();
  }

  // 移除末尾的斜杠
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }

  const response = await fetch(url, {
    method: 'MKCOL',
    headers: {
      'Authorization': getAuthHeader(config.username, config.password)
    }
  });

  if (!response.ok && response.status !== 405) {
    // 405 Method Not Allowed 表示目录已存在，这是正常的
    throw createError('unknown', `创建目录失败 (HTTP ${response.status})`, response.status);
  }
}

/**
 * 获取云端文件列表
 */
export async function listFiles(config: WebDAVConfig): Promise<{ name: string; size: number; lastModified: number }[]> {
  const baseURL = getBaseURL(config);
  let url: string;

  if (baseURL.startsWith('/')) {
    const davPath = '/dav';
    url = baseURL + davPath + config.path;
  } else {
    url = new URL(config.path, baseURL).toString();
  }

  // 移除末尾的斜杠
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }

  console.log('[listFiles] Listing files from WebDAV:');
  console.log('  - URL:', url);
  console.log('  - Method: PROPFIND');

  const response = await fetch(url, {
    method: 'PROPFIND',
    headers: {
      'Authorization': getAuthHeader(config.username, config.password),
      'Depth': '1',
      'Content-Type': 'application/xml; charset=utf-8'
    },
    body: `<?xml version="1.0" encoding="utf-8" ?>
      <D:propfind xmlns:D="DAV:">
        <D:prop>
          <D:getlastmodified/>
          <D:getcontentlength/>
          <D:resourcetype/>
          <D:displayname/>
        </D:prop>
      </D:propfind>`
  });

  console.log('  - Response status:', response.status);

  if (!response.ok) {
    const responseText = await response.text();
    console.log('  - Response body:', responseText);
    throw createError('unknown', `获取文件列表失败 (HTTP ${response.status})`, response.status);
  }

  const text = await response.text();
  console.log('  - Response text length:', text.length);

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, 'text/xml');
  const responses = xmlDoc.getElementsByTagNameNS('DAV:', 'response');

  console.log('  - Number of responses:', responses.length);

  const files: { name: string; size: number; lastModified: number }[] = [];

  for (let i = 0; i < responses.length; i++) {
    const response = responses[i];
    const displayname = response.getElementsByTagNameNS('DAV:', 'displayname')[0]?.textContent || '';
    const size = parseInt(response.getElementsByTagNameNS('DAV:', 'getcontentlength')[0]?.textContent || '0', 10);
    const lastModified = response.getElementsByTagNameNS('DAV:', 'getlastmodified')[0]?.textContent || '';
    const resourceType = response.getElementsByTagNameNS('DAV:', 'resourcetype')[0];

    console.log(`  - Item ${i}: displayname="${displayname}", size=${size}, type=${resourceType ? 'directory' : 'file'}`);

    // 跳过目录和当前目录
    if (resourceType && resourceType.getElementsByTagNameNS('DAV:', 'collection').length > 0) {
      console.log('    → Skipping (directory)');
      continue;
    }

    // 只处理 data_ 开头的文件
    if (displayname && displayname.startsWith('data_') && displayname.endsWith('.json')) {
      const date = new Date(lastModified);
      files.push({
        name: displayname,
        size,
        lastModified: date.getTime()
      });
      console.log(`    → Added: ${displayname} (${size} bytes, ${date.toISOString()})`);
    }
  }

  // 按修改时间降序排序
  const sorted = files.sort((a, b) => b.lastModified - a.lastModified);
  console.log('  - Final file list:', sorted.map(f => f.name).join(', '));

  return sorted;
}

/**
 * 删除云端文件
 */
export async function deleteFile(config: WebDAVConfig, filename: string): Promise<void> {
  const url = buildFileURL(config, filename);

  console.log('[deleteFile] Deleting file from WebDAV:');
  console.log('  - Filename:', filename);
  console.log('  - URL:', url);

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': getAuthHeader(config.username, config.password)
    }
  });

  console.log('  - Response status:', response.status);

  if (!response.ok) {
    const responseText = await response.text();
    console.log('  - Response body:', responseText);
    throw createError('unknown', `删除文件失败 (HTTP ${response.status})`, response.status);
  }

  console.log('  - File deleted successfully');
}

/**
 * 上传文件到 WebDAV
 */
export async function uploadFile(config: WebDAVConfig, filename: string, content: string): Promise<void> {
  const url = buildFileURL(config, filename);

  console.log('[uploadFile] Uploading file to WebDAV:');
  console.log('  - Filename:', filename);
  console.log('  - URL:', url);
  console.log('  - Content length:', content.length);

  try {
    // 先尝试创建目录
    console.log('  - Step 1: Creating directory...');
    await createDirectory(config, config.path);
    console.log('  - Step 2: Directory created, uploading file...');

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': getAuthHeader(config.username, config.password),
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: content
    });

    console.log('  - Upload response status:', response.status);

    if (!response.ok) {
      const responseText = await response.text();
      console.log('  - Upload response body:', responseText);

      if (response.status === 401) {
        throw createError('auth', '认证失败，请检查用户名和密码', response.status);
      } else if (response.status === 403) {
        throw createError('permission', '没有写入权限', response.status);
      } else if (response.status === 404) {
        throw createError('not_found', '服务器路径不存在，请检查存储路径', response.status);
      } else {
        throw createError('unknown', `上传失败 (HTTP ${response.status})`, response.status);
      }
    }

    console.log('  - Upload successful!');
  } catch (error) {
    console.log('  - Upload error:', error);
    // 检查是否是 WebDAVError（通过 type 属性）
    if (error && typeof error === 'object' && 'type' in error) {
      throw error;
    }
    throw createError('network', '网络连接失败');
  }
}

/**
 * 创建 WebDAV 错误对象
 */
function createError(type: WebDAVError['type'], message: string, code?: number): WebDAVError {
  return { type, message, code };
}

/**
 * 验证 WebDAV 配置
 */
export function validateWebDAVConfig(config: WebDAVConfig): { valid: boolean; error?: string } {
  if (!config.url) {
    return { valid: false, error: '服务器地址不能为空' };
  }

  // 验证 URL 格式
  try {
    new URL(config.url);
  } catch {
    return { valid: false, error: '服务器地址格式不正确' };
  }

  if (!config.username || !config.password) {
    return { valid: false, error: '用户名和密码不能为空' };
  }

  // 路径必须以 / 开头和结尾
  if (!config.path.startsWith('/') || !config.path.endsWith('/')) {
    return { valid: false, error: '存储路径必须以 / 开头和结尾' };
  }

  if (config.syncInterval < 60000) {
    return { valid: false, error: '同步间隔不能少于 1 分钟' };
  }

  return { valid: true };
}