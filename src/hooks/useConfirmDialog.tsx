import React, { useState, useCallback, useMemo } from 'react';
import { DialogBox } from '../components/DialogBox';

/**
 * 确认对话框选项
 */
export interface ConfirmOptions {
  /** 对话框标题 */
  title: string;
  /** 对话框内容（可选） */
  content?: string;
  /** 确认按钮的回调函数 */
  onConfirm: () => void;
  /** 确认按钮文本（默认："确定"） */
  confirmText?: string;
  /** 确认按钮颜色（默认："error"） */
  confirmColor?: 'error' | 'primary' | 'warning' | 'success' | 'info';
  /** 确认按钮变体（默认："text"） */
  confirmVariant?: 'text' | 'outlined' | 'contained';
  /** 取消按钮变体（默认："contained"） */
  cancelVariant?: 'text' | 'outlined' | 'contained';
}

/**
 * 确认对话框状态
 */
interface ConfirmDialogState {
  /** 对话框是否打开 */
  open: boolean;
  /** 对话框标题 */
  title: string;
  /** 对话框内容 */
  content: string;
  /** 确认回调 */
  onConfirm: () => void;
  /** 确认按钮文本 */
  confirmText: string;
  /** 确认按钮颜色 */
  confirmColor: ConfirmOptions['confirmColor'];
  /** 确认按钮变体 */
  confirmVariant: ConfirmOptions['confirmVariant'];
  /** 取消按钮变体 */
  cancelVariant: ConfirmOptions['cancelVariant'];
}

/**
 * 确认对话框Hook的返回值
 */
interface UseConfirmDialogReturn {
  /**
   * 触发确认对话框
   * @param options - 对话框配置选项
   */
  confirm: (options: ConfirmOptions) => void;
  /**
   * 确认对话框组件
   * 直接渲染在JSX中即可
   */
  ConfirmDialog: React.ComponentType;
}

/**
 * 确认对话框Hook
 *
 * 用于管理确认对话框的状态和渲染。提供统一的确认对话框UI，
 * 支持自定义标题、内容、按钮文本和样式。
 *
 * @example
 * ```tsx
 * const { confirm, ConfirmDialog } = useConfirmDialog();
 *
 * const handleDelete = (item: Item) => {
 *   confirm({
 *     title: `确定删除"${item.name}"吗？`,
 *     onConfirm: () => deleteItem(item.id),
 *   });
 * };
 *
 * return (
 *   <>
 *     <Button onClick={() => handleDelete(item)}>删除</Button>
 *     <ConfirmDialog />
 *   </>
 * );
 * ```
 *
 * @returns 确认对话框的方法和组件
 */
export function useConfirmDialog(): UseConfirmDialogReturn {
  const [state, setState] = useState<ConfirmDialogState>({
    open: false,
    title: '',
    content: '',
    onConfirm: () => { },
    confirmText: '删除',
    confirmColor: 'error',
    confirmVariant: 'text',
    cancelVariant: 'contained',
  });

  /**
   * 触发确认对话框
   */
  const confirm = useCallback((options: ConfirmOptions) => {
    setState({
      open: true,
      title: options.title,
      content: options.content || '',
      onConfirm: options.onConfirm,
      confirmText: options.confirmText || '删除',
      confirmColor: options.confirmColor || 'error',
      confirmVariant: options.confirmVariant || 'text',
      cancelVariant: options.cancelVariant || 'contained',
    });
  }, []);

  /**
   * 关闭对话框
   */
  const handleClose = useCallback(() => {
    setState(prev => ({ ...prev, open: false }));
  }, []);

  /**
   * 确认对话框组件
   */
  const ConfirmDialog = useMemo(() => {
    return () => (
      <DialogBox
        open={state.open}
        title={state.title}
        content={state.content}
        confirmText={state.confirmText}
        confirmColor={state.confirmColor}
        confirmVariant={state.confirmVariant}
        cancelVariant={state.cancelVariant}
        onConfirm={() => {
          state.onConfirm();
          handleClose();
        }}
        onClose={handleClose}
      />
    );
  }, [state, handleClose]);

  return {
    confirm,
    ConfirmDialog,
  };
}
