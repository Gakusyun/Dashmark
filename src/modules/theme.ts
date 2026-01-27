// ==================== 主题管理模块 ====================

import { getSettings, updateSettings } from '../storage.ts';

/**
 * 初始化主题
 */
export function initTheme(): void {
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
  const darkModeSelect = document.getElementById('dark-mode-select') as HTMLSelectElement;
  if (darkModeSelect) {
    darkModeSelect.value = darkMode;
    darkModeSelect.addEventListener('change', function () {
      const value = this.value as 'light' | 'dark' | 'auto';
      updateSettings({ darkMode: value });
      applyTheme(value);
    });
  }

  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getSettings().darkMode === 'auto') {
      applyTheme('auto');
    }
  });
}

/**
 * 应用主题
 */
export function applyTheme(darkMode: 'light' | 'dark' | 'auto'): void {
  if (darkMode === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', darkMode);
  }
}