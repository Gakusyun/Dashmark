// ==================== 同步服务模块 ====================
// 处理 WebDAV 数据同步逻辑

import {
  loadData,
  saveData,
  loadWebDAVConfig,
  saveWebDAVConfig,
  type Data,
  type WebDAVConfig
} from '../storage.ts';
import {
  downloadFile,
  uploadFile,
  listFiles,
  deleteFile,
  testConnection as testWebDAVConnection,
  type WebDAVError
} from './webdav.ts';

let syncTimeoutId: number | null = null;

// ==================== 公共 API ====================

/**
 * 检查是否需要自动同步（在页面加载时调用）
 */
export function checkAndAutoSync(): void {
  const config = loadWebDAVConfig();

  // 如果未启用 WebDAV 或未开启自动同步，则不处理
  if (!config.enabled || !config.autoSync) {
    return;
  }

  const now = Date.now();
  const elapsed = now - config.lastSyncTime;

  // 如果距离上次同步超过设定间隔，则执行同步
  if (elapsed >= config.syncInterval) {
    performSync('auto');
  }
}

/**
 * 数据修改后，延迟检查是否需要同步
 * 延迟 10 秒，避免连续修改频繁触发
 */
export function scheduleAutoSync(): void {
  const config = loadWebDAVConfig();

  // 如果未启用 WebDAV 或未开启自动同步，则不处理
  if (!config.enabled || !config.autoSync) {
    return;
  }

  // 清除之前的定时器
  if (syncTimeoutId !== null) {
    clearTimeout(syncTimeoutId);
  }

  // 延迟 10 秒后检查
  syncTimeoutId = window.setTimeout(() => {
    checkAndAutoSync();
    syncTimeoutId = null;
  }, 10000);
}

/**
 * 手动触发同步
 */
export function manualSync(): void {
  performSync('manual');
}

/**
 * 清理云端文件（保留最近10次）
 */
export async function cleanupCloudFiles(): Promise<void> {
  console.log('========== CLEANUP START ==========');

  const config = loadWebDAVConfig();

  if (!config.enabled) {
    console.log('[cleanup] WebDAV not enabled');
    alert('请先启用 WebDAV');
    return;
  }

  if (!confirm('确定要清理云端旧文件吗？只会保留最近10次同步的文件。')) {
    console.log('[cleanup] User cancelled cleanup');
    return;
  }

  try {
    console.log('[cleanup] Getting cloud file list...');
    const files = await listFiles(config);
    console.log('[cleanup] Found', files.length, 'files');

    if (files.length <= 10) {
      console.log('[cleanup] No files to delete (<= 10 files)');
      alert('云端文件数量不超过10个，无需清理');
      return;
    }

    // 删除超过10个的文件
    const filesToDelete = files.slice(10);
    console.log('[cleanup] Deleting', filesToDelete.length, 'old files...');

    for (const file of filesToDelete) {
      console.log('[cleanup] Deleting:', file.name);
      await deleteFile(config, file.name);
      console.log('[cleanup] Deleted:', file.name);
    }

    console.log('[cleanup] Cleanup completed, deleted', filesToDelete.length, 'files');
    alert(`成功清理 ${filesToDelete.length} 个旧文件`);
  } catch (error) {
    console.error('[cleanup] Cleanup failed:', error);
    alert('清理失败：' + (error instanceof Error ? error.message : '未知错误'));
  }

  console.log('========== CLEANUP END ==========');
}

/**
 * 测试 WebDAV 连接
 */
export async function testConnection(): Promise<boolean> {
  const config = loadWebDAVConfig();

  if (!config.enabled) {
    return false;
  }

  try {
    return await testWebDAVConnection(config);
  } catch (error) {
    console.error('Test connection failed:', error);
    return false;
  }
}

// ==================== 内部函数 ====================

/**
 * 执行同步
 */
async function performSync(type: 'auto' | 'manual'): Promise<void> {
  const config = loadWebDAVConfig();

  // 更新状态为同步中
  config.lastSyncStatus = 'syncing';
  saveWebDAVConfig(config);

  // 通知 UI 更新
  notifyStatusUpdate();

  try {
    // 执行实际的同步操作
    await syncData(config, type);

    // 同步成功，更新时间戳
    config.lastSyncTime = Date.now();
    config.lastSyncStatus = 'success';
    config.lastSyncError = undefined;
    saveWebDAVConfig(config);

    // 如果是手动同步，显示成功提示
    if (type === 'manual') {
      alert('同步成功');
    }

  } catch (error) {
    // 同步失败
    config.lastSyncStatus = 'error';
    config.lastSyncError = error instanceof Error ? error.message : '未知错误';
    saveWebDAVConfig(config);

    // 如果是手动同步，显示错误提示
    if (type === 'manual') {
      alert('同步失败：' + config.lastSyncError);
    }
  }

  // 通知 UI 更新
  notifyStatusUpdate();
}

/**
 * 执行数据同步逻辑
 */
async function syncData(config: WebDAVConfig, syncType: 'auto' | 'manual'): Promise<void> {
  console.log('========== SYNC START ==========');
  console.log('[syncData] Starting sync...');
  console.log('  - Sync type:', syncType);
  console.log('  - Last sync time:', config.lastSyncTime, new Date(config.lastSyncTime).toISOString());

  // 获取云端文件列表
  let cloudFiles: { name: string; size: number; lastModified: number }[];
  try {
    console.log('[syncData] Step 1: Getting cloud file list...');
    cloudFiles = await listFiles(config);
    console.log('[syncData] Step 1: Cloud file list obtained, found', cloudFiles.length, 'files');
  } catch (error) {
    console.log('[syncData] Step 1: Failed to get cloud file list');
    const webdavError = error as WebDAVError;
    console.log('[syncData] Error:', webdavError);

    // 如果目录不存在（首次同步），直接上传本地数据
    if (webdavError.code === 409) {
      console.log('[syncData] Directory not found, uploading local data as first sync...');
      const localData = loadData();
      const filename = `data_${Date.now()}.json`;
      await uploadFile(config, filename, JSON.stringify(localData, null, 2));
      console.log('[syncData] First sync completed');
      return;
    }
    throw error;
  }

  // 获取本地数据
  console.log('[syncData] Step 2: Loading local data...');
  const localData = loadData();
  const localJSON = JSON.stringify(localData, null, 2);
  console.log('[syncData] Local data loaded:', localData.groups.length, 'groups,', localData.links.length, 'links');

  // 判断本地是否为空白（没有分组和链接）
  const isLocalEmpty = localData.groups.length === 0 && localData.links.length === 0;
  console.log('[syncData] Is local empty?', isLocalEmpty);

  // 如果云端没有文件，直接上传本地数据
  if (cloudFiles.length === 0) {
    console.log('[syncData] No files found on cloud, uploading local data...');
    const filename = `data_${Date.now()}.json`;
    await uploadFile(config, filename, localJSON);
    console.log('[syncData] Sync completed (first upload)');
    return;
  }

  // 获取最新的云端文件
  const latestCloudFile = cloudFiles[0];
  console.log('[syncData] Step 3: Latest cloud file:', latestCloudFile.name);
  console.log('  - Last modified:', new Date(latestCloudFile.lastModified).toISOString());
  console.log('  - Size:', latestCloudFile.size, 'bytes');

  // 下载最新的云端文件
  console.log('[syncData] Step 4: Downloading latest cloud file...');
  const cloudDataJSON = await downloadFile(config, latestCloudFile.name);
  const cloudData: Data = JSON.parse(cloudDataJSON);
  console.log('[syncData] Cloud data loaded:', cloudData.groups.length, 'groups,', cloudData.links.length, 'links');

  // 如果本地是空白，直接从云端下载
  if (isLocalEmpty) {
    console.log('[syncData] Local is empty, downloading from cloud...');
    saveData(cloudData);
    console.log('[syncData] Cloud data saved to local');
    console.log('[syncData] Sync completed (downloaded from cloud)');
    return;
  }

  // 计算文件差异
  console.log('[syncData] Step 5: Calculating similarity...');
  const similarity = calculateSimilarity(localData, cloudData);
  console.log('[syncData] Similarity score:', (similarity * 100).toFixed(2) + '%');

  // 如果完全相同（100%相似），跳过上传
  if (similarity === 1) {
    console.log('[syncData] Data is identical (100% similarity), skipping upload');
    console.log('[syncData] Sync completed (no changes)');
    return;
  }

  // 判断同步策略
  if (similarity >= 0.5) {
    console.log('[syncData] Similarity >= 50%, using merge strategy');

    // 差异在50%以内
    if (latestCloudFile.lastModified > config.lastSyncTime) {
      console.log('[syncData] Cloud is newer, downloading and merging...');
      // 云端较新，下载并合并
      const mergedData = mergeData(localData, cloudData);
      saveData(mergedData);
      console.log('[syncData] Merged data saved to local');

      // 上传合并后的数据
      const filename = `data_${Date.now()}.json`;
      await uploadFile(config, filename, JSON.stringify(mergedData, null, 2));
      console.log('[syncData] Merged data uploaded to cloud');
    } else {
      console.log('[syncData] Local is newer, uploading local data...');
      // 本地较新，直接上传
      const filename = `data_${Date.now()}.json`;
      await uploadFile(config, filename, localJSON);
      console.log('[syncData] Local data uploaded to cloud');
    }
  } else {
    console.log('[syncData] Similarity < 50%, using conflict resolution strategy');
    // 差异超过50%，需要用户确认
    console.log('[syncData] Asking user to choose between local and cloud...');
    const choice = await askUserChoice(latestCloudFile.lastModified, config.lastSyncTime);
    console.log('[syncData] User choice:', choice);

    if (choice === 'cloud') {
      console.log('[syncData] User chose cloud data');
      // 使用云端数据
      saveData(cloudData);
      // 上传云端数据（作为新的备份）
      const filename = `data_${Date.now()}.json`;
      await uploadFile(config, filename, cloudDataJSON);
      console.log('[syncData] Cloud data saved and uploaded');
    } else if (choice === 'local') {
      console.log('[syncData] User chose local data');
      // 使用本地数据
      const filename = `data_${Date.now()}.json`;
      await uploadFile(config, filename, localJSON);
      console.log('[syncData] Local data uploaded');
    } else {
      console.log('[syncData] User cancelled sync');
      // 用户取消
      throw new Error('同步已取消');
    }
  }

  console.log('========== SYNC END ==========');
}

/**
 * 计算两个数据的相似度（0-1）
 */
function calculateSimilarity(data1: Data, data2: Data): number {
  // 比较分组
  const groupIds1 = new Set(data1.groups.map(g => g.id));
  const groupIds2 = new Set(data2.groups.map(g => g.id));
  const groupIntersection = new Set([...groupIds1].filter(id => groupIds2.has(id)));
  const groupUnion = new Set([...groupIds1, ...groupIds2]);
  const groupSimilarity = groupUnion.size === 0 ? 1 : groupIntersection.size / groupUnion.size;

  // 比较链接
  const linkIds1 = new Set(data1.links.map(l => l.id));
  const linkIds2 = new Set(data2.links.map(l => l.id));
  const linkIntersection = new Set([...linkIds1].filter(id => linkIds2.has(id)));
  const linkUnion = new Set([...linkIds1, ...linkIds2]);
  const linkSimilarity = linkUnion.size === 0 ? 1 : linkIntersection.size / linkUnion.size;

  // 综合相似度（分组和链接各占50%权重）
  return (groupSimilarity + linkSimilarity) / 2;
}

/**
 * 合并数据（服务器优先）
 */
function mergeData(local: Data, cloud: Data): Data {
  // 合并分组
  const mergedGroups = mergeGroups(local.groups, cloud.groups);

  // 合并链接
  const mergedLinks = mergeLinks(local.links, cloud.links);

  // 合并搜索引擎
  const mergedSearchEngines = mergeSearchEngines(local.searchEngines, cloud.searchEngines);

  // 合并设置
  const mergedSettings = {
    ...cloud.settings,
    searchEngine: cloud.settings.searchEngine || local.settings.searchEngine
  };

  return {
    groups: mergedGroups,
    links: mergedLinks,
    searchEngines: mergedSearchEngines,
    settings: mergedSettings
  };
}

/**
 * 合并分组数据（服务器优先）
 */
function mergeGroups(local: Data['groups'], server: Data['groups']): Data['groups'] {
  const serverMap = new Map(server.map(g => [g.id, g]));
  const localMap = new Map(local.map(g => [g.id, g]));

  const allIds = new Set([...serverMap.keys(), ...localMap.keys()]);
  const merged: Data['groups'] = [];

  allIds.forEach(id => {
    const group = serverMap.get(id) || localMap.get(id);
    if (group) {
      merged.push(group);
    }
  });

  return merged.sort((a, b) => a.order - b.order);
}

/**
 * 合并链接数据（服务器优先）
 */
function mergeLinks(local: Data['links'], server: Data['links']): Data['links'] {
  const serverMap = new Map(server.map(l => [l.id, l]));
  const localMap = new Map(local.map(l => [l.id, l]));

  const allIds = new Set([...serverMap.keys(), ...localMap.keys()]);
  const merged: Data['links'] = [];

  allIds.forEach(id => {
    const link = serverMap.get(id) || localMap.get(id);
    if (link) {
      merged.push(link);
    }
  });

  return merged.sort((a, b) => a.order - b.order);
}

/**
 * 合并搜索引擎数据（服务器优先）
 */
function mergeSearchEngines(local: Data['searchEngines'], server: Data['searchEngines']): Data['searchEngines'] {
  const serverMap = new Map(server.map(e => [e.id, e]));
  const localMap = new Map(local.map(e => [e.id, e]));

  const allIds = new Set([...serverMap.keys(), ...localMap.keys()]);
  const merged: Data['searchEngines'] = [];

  allIds.forEach(id => {
    const engine = serverMap.get(id) || localMap.get(id);
    if (engine) {
      merged.push(engine);
    }
  });

  return merged;
}

/**
 * 询问用户选择
 */
function askUserChoice(cloudTime: number, localTime: number): Promise<'cloud' | 'local' | 'cancel'> {
  return new Promise((resolve) => {
    const cloudDate = new Date(cloudTime).toLocaleString('zh-CN');
    const localDate = new Date(localTime || Date.now()).toLocaleString('zh-CN');

    const message = `检测到本地和云端数据差异较大，请选择要保留的数据：

云端数据时间：${cloudDate}
本地数据时间：${localTime > 0 ? localDate : '未知'}

请选择：
• 确定 - 使用云端数据
• 取消 - 使用本地数据`;

    if (confirm(message)) {
      resolve('cloud');
    } else {
      // 第二次确认（使用本地数据）
      if (confirm('确定要使用本地数据吗？点击"确定"使用本地数据，点击"取消"将取消同步。')) {
        resolve('local');
      } else {
        resolve('cancel');
      }
    }
  });
}

/**
 * 通知 UI 更新同步状态
 */
function notifyStatusUpdate(): void {
  const event = new CustomEvent('webdav-status-update');
  window.dispatchEvent(event);
}