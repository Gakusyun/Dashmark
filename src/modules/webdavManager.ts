// ==================== WebDAV 管理器模块 ====================
// 处理 WebDAV 设置的 UI 交互

import {
  loadWebDAVConfig,
  saveWebDAVConfig,
  exportWebDAVConfig
} from '../storage.ts';
import { validateWebDAVConfig } from './webdav.ts';
import { manualSync, testConnection, cleanupCloudFiles } from './syncService.ts';

/**
 * 初始化 WebDAV 管理器
 */
export function initWebDAVManager(): void {
  // 绑定启用开关事件
  const enabledCheckbox = document.getElementById('webdav-enabled') as HTMLInputElement;
  if (enabledCheckbox) {
    enabledCheckbox.addEventListener('change', handleEnabledChange);
  }

  // 绑定测试连接按钮
  const testBtn = document.getElementById('btn-test-webdav');
  if (testBtn) {
    testBtn.addEventListener('click', handleTestConnection);
  }

  // 绑定立即同步按钮
  const syncBtn = document.getElementById('btn-sync-now');
  if (syncBtn) {
    syncBtn.addEventListener('click', handleManualSync);
  }

  // 绑定清理云端文件按钮
  const cleanupBtn = document.getElementById('btn-cleanup-cloud');
  if (cleanupBtn) {
    cleanupBtn.addEventListener('click', handleCleanupCloudFiles);
  }

  // 绑定导出 WebDAV 设置按钮
  const exportWebDAVBtn = document.getElementById('btn-export-webdav');
  if (exportWebDAVBtn) {
    exportWebDAVBtn.addEventListener('click', () => {
      exportWebDAVConfig();
    });
  }

  // 监听同步状态更新事件
  window.addEventListener('webdav-status-update', updateSyncStatusUI);
}

/**
 * 打开设置标签页时加载配置
 */
export function loadWebDAVSettings(): void {
  const config = loadWebDAVConfig();

  // 填充表单
  const enabledCheckbox = document.getElementById('webdav-enabled') as HTMLInputElement;
  const urlInput = document.getElementById('webdav-url') as HTMLInputElement;
  const usernameInput = document.getElementById('webdav-username') as HTMLInputElement;
  const passwordInput = document.getElementById('webdav-password') as HTMLInputElement;
  const pathInput = document.getElementById('webdav-path') as HTMLInputElement;
  const autoSyncCheckbox = document.getElementById('webdav-auto-sync') as HTMLInputElement;
  const syncIntervalSelect = document.getElementById('webdav-sync-interval') as HTMLSelectElement;

  if (enabledCheckbox) enabledCheckbox.checked = config.enabled;
  if (urlInput) urlInput.value = config.url;
  if (usernameInput) usernameInput.value = config.username;
  if (passwordInput) passwordInput.value = config.password;
  if (pathInput) pathInput.value = config.path;
  if (autoSyncCheckbox) autoSyncCheckbox.checked = config.autoSync;
  if (syncIntervalSelect) syncIntervalSelect.value = config.syncInterval.toString();

  // 显示/隐藏配置表单
  toggleConfigForm(config.enabled);

  // 更新同步状态显示
  updateSyncStatusUI();
}

/**
 * 保存 WebDAV 设置
 */
export function saveWebDAVSettings(): boolean {
  const config = loadWebDAVConfig();

  // 获取表单值
  const enabledCheckbox = document.getElementById('webdav-enabled') as HTMLInputElement;
  const urlInput = document.getElementById('webdav-url') as HTMLInputElement;
  const usernameInput = document.getElementById('webdav-username') as HTMLInputElement;
  const passwordInput = document.getElementById('webdav-password') as HTMLInputElement;
  const pathInput = document.getElementById('webdav-path') as HTMLInputElement;
  const autoSyncCheckbox = document.getElementById('webdav-auto-sync') as HTMLInputElement;
  const syncIntervalSelect = document.getElementById('webdav-sync-interval') as HTMLSelectElement;

  // 更新配置
  config.enabled = enabledCheckbox.checked;
  config.url = urlInput.value.trim();
  config.username = usernameInput.value.trim();
  config.password = passwordInput.value;
  config.path = pathInput.value.trim();
  config.autoSync = autoSyncCheckbox.checked;
  config.syncInterval = parseInt(syncIntervalSelect.value, 10);

  // 如果启用了 WebDAV，验证配置
  if (config.enabled) {
    const validation = validateWebDAVConfig(config);
    if (!validation.valid) {
      alert(validation.error);
      return false;
    }
  }

  // 保存配置
  if (saveWebDAVConfig(config)) {
    // 显示/隐藏配置表单
    toggleConfigForm(config.enabled);
    return true;
  }

  return false;
}

// ==================== 事件处理器 ====================

/**
 * 处理启用开关变化
 */
function handleEnabledChange(): void {
  const enabledCheckbox = document.getElementById('webdav-enabled') as HTMLInputElement;
  const enabled = enabledCheckbox.checked;

  if (enabled) {
    // 显示配置表单
    toggleConfigForm(true);
  } else {
    // 隐藏配置表单
    toggleConfigForm(false);
    // 保存配置（禁用状态）
    saveWebDAVSettings();
  }
}

/**
 * 处理测试连接按钮点击
 */
async function handleTestConnection(): Promise<void> {
  // 先保存当前配置
  if (!saveWebDAVSettings()) {
    return;
  }

  const testBtn = document.getElementById('btn-test-webdav') as HTMLButtonElement;
  const originalText = testBtn.textContent;

  try {
    testBtn.textContent = '测试中...';
    testBtn.disabled = true;

    const success = await testConnection();

    if (success) {
      alert('连接成功！');
    } else {
      alert('连接失败，请检查配置');
    }
  } catch (error) {
    console.error('Test connection error:', error);
    alert('连接失败：' + (error instanceof Error ? error.message : '未知错误'));
  } finally {
    testBtn.textContent = originalText;
    testBtn.disabled = false;
  }
}

/**
 * 处理手动同步按钮点击
 */
function handleManualSync(): void {
  // 先保存当前配置
  if (!saveWebDAVSettings()) {
    return;
  }

  const config = loadWebDAVConfig();
  if (!config.enabled) {
    alert('请先启用 WebDAV');
    return;
  }

  manualSync();
}

/**
 * 处理清理云端文件按钮点击
 */
async function handleCleanupCloudFiles(): Promise<void> {
  // 先保存当前配置
  if (!saveWebDAVSettings()) {
    return;
  }

  const config = loadWebDAVConfig();
  if (!config.enabled) {
    alert('请先启用 WebDAV');
    return;
  }

  await cleanupCloudFiles();
}

// ==================== UI 辅助函数 ====================

/**
 * 切换配置表单显示/隐藏
 */
function toggleConfigForm(show: boolean): void {
  const configForm = document.getElementById('webdav-config-form');
  if (configForm) {
    if (show) {
      configForm.classList.remove('hidden');
    } else {
      configForm.classList.add('hidden');
    }
  }
}

/**
 * 更新同步状态 UI
 */
function updateSyncStatusUI(): void {
  const config = loadWebDAVConfig();
  const statusText = document.getElementById('sync-status-text');
  const statusTime = document.getElementById('sync-status-time');

  if (!statusText || !statusTime) {
    return;
  }

  if (!config.enabled) {
    statusText.textContent = '未启用';
    statusText.className = '';
    statusTime.textContent = '';
    return;
  }

  // 显示状态
  switch (config.lastSyncStatus) {
    case 'syncing':
      statusText.textContent = '同步中...';
      statusText.className = 'syncing';
      statusTime.textContent = '';
      break;
    case 'success':
      statusText.textContent = '同步成功';
      statusText.className = 'success';
      if (config.lastSyncTime > 0) {
        const time = new Date(config.lastSyncTime).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        statusTime.textContent = `上次同步：${time}`;
      } else {
        statusTime.textContent = '';
      }
      break;
    case 'error':
      statusText.textContent = '同步失败';
      statusText.className = 'error';
      statusTime.textContent = config.lastSyncError || '未知错误';
      break;
    default:
      statusText.textContent = '未同步';
      statusText.className = '';
      statusTime.textContent = '';
  }
}