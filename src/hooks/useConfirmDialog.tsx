import { useState, useCallback, useMemo, type ButtonHTMLAttributes } from 'react';
import { DialogBox } from '../components/DialogBox';

/**
 * 确认对话框选项
 */
export interface ConfirmOptions {
  title: string;
  content?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'error' | 'primary' | 'warning' | 'success' | 'info';
  confirmVariant?: 'solid' | 'outline' | 'ghost';
  cancelVariant?: 'solid' | 'outline' | 'ghost';
  confirmButtonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  cancelButtonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
}

interface ConfirmDialogState {
  open: boolean;
  title: string;
  content: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText: string;
  cancelText: string;
  confirmColor: ConfirmOptions['confirmColor'];
  confirmVariant: ConfirmOptions['confirmVariant'];
  cancelVariant: ConfirmOptions['cancelVariant'];
  confirmButtonProps: ButtonHTMLAttributes<HTMLButtonElement> | undefined;
  cancelButtonProps: ButtonHTMLAttributes<HTMLButtonElement> | undefined;
}

interface UseConfirmDialogReturn {
  confirm: (options: ConfirmOptions) => void;
  ConfirmDialog: React.ComponentType;
}

/**
 * 确认对话框Hook
 */
export function useConfirmDialog(): UseConfirmDialogReturn {
  const [state, setState] = useState<ConfirmDialogState>({
    open: false,
    title: '',
    content: '',
    onConfirm: () => {},
    confirmText: '删除',
    cancelText: '取消',
    confirmColor: 'error',
    confirmVariant: 'solid',
    cancelVariant: 'outline',
    confirmButtonProps: undefined,
    cancelButtonProps: undefined,
  });

  const confirm = useCallback((options: ConfirmOptions) => {
    setState({
      open: true,
      title: options.title,
      content: options.content || '',
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
      confirmText: options.confirmText || '删除',
      cancelText: options.cancelText || '取消',
      confirmColor: options.confirmColor || 'error',
      confirmVariant: options.confirmVariant || 'solid',
      cancelVariant: options.cancelVariant || 'outline',
      confirmButtonProps: options.confirmButtonProps,
      cancelButtonProps: options.cancelButtonProps,
    });
  }, []);

  const handleClose = useCallback((callCancel: boolean = true) => {
    setState((prev) => {
      if (callCancel && prev.onCancel) {
        setTimeout(() => {
          if (prev.onCancel) {
            prev.onCancel();
          }
        }, 0);
      }
      return { ...prev, open: false };
    });
  }, []);

  const ConfirmDialog = useMemo(() => {
    return () => (
      <DialogBox
        open={state.open}
        title={state.title}
        content={state.content}
        confirmText={state.confirmText}
        cancelText={state.cancelText}
        confirmColor={state.confirmColor}
        confirmVariant={state.confirmVariant}
        cancelVariant={state.cancelVariant}
        confirmButtonProps={state.confirmButtonProps}
        cancelButtonProps={state.cancelButtonProps}
        onConfirm={() => {
          setTimeout(() => state.onConfirm(), 0);
          handleClose(false);
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
