// ==================== 主题管理模块 ====================

import { getSettings, updateSettings } from '../storage.js';

/**
 * 初始化主题
 */
export function initTheme() {
  const settings = getSettings();
  const darkMode = settings.darkMode;

  if (darkMode === 'auto') {
    // 跟随系统
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    // 手动设置
    document.documentElement.setAttribute('data-theme', darkMode);
  }

  // 初始化主题设置下拉框
  const darkModeSelect = document.getElementById('dark-mode-select');
  if (darkModeSelect) {
    darkModeSelect.value = darkMode;
    darkModeSelect.addEventListener('change', function () {
      updateSettings({ darkMode: this.value });
      applyTheme(this.value);
    });
  }

  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (getSettings().darkMode === 'auto') {
      applyTheme('auto');
    }
  });
}

/**
 * 应用主题
 */
export function applyTheme(darkMode) {
  if (darkMode === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', darkMode);
  }
}