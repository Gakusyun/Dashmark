// ==================== 模态框管理模块 ====================

import * as groupManager from './groupManager.js';

/**
 * 初始化模态框
 */
export function initModals() {
  // 分组表单提交
  document.getElementById('group-form').addEventListener('submit', function (e) {
    e.preventDefault();
    groupManager.saveGroup();
  });

  // 点击模态框外部关闭
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });

  // ESC 键关闭模态框
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      modals.forEach(modal => modal.classList.add('hidden'));
    }
  });
}