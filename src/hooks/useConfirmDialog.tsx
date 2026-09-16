import { useState, useCallback, useRef, type ReactNode } from 'react';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

export interface ConfirmOptions {
  title: string;
  content?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
}

const INITIAL: ConfirmState = {
  open: false,
  title: '',
  confirmText: '确定',
  cancelText: '取消',
  tone: 'danger',
  onConfirm: () => {},
};

/**
 * 命令式确认框。返回 `confirm` 触发函数与需要挂载的 `ConfirmDialog` 组件。
 */
export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmState>(INITIAL);
  // 持有最新回调，避免闭包捕获过期引用
  const confirmRef = useRef<() => void>(() => {});

  const confirm = useCallback((options: ConfirmOptions) => {
    confirmRef.current = options.onConfirm;
    setState({
      ...INITIAL,
      ...options,
      confirmText: options.confirmText ?? '确定',
      cancelText: options.cancelText ?? '取消',
      tone: options.tone ?? 'danger',
      open: true,
    });
  }, []);

  const close = useCallback(() => setState((prev) => ({ ...prev, open: false })), []);

  const ConfirmDialog = useCallback(
    () => (
      <Modal
        open={state.open}
        title={state.title}
        onClose={close}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              {state.cancelText}
            </Button>
            <Button
              variant={state.tone === 'danger' ? 'danger' : 'primary'}
              onClick={() => {
                close();
                confirmRef.current();
              }}
            >
              {state.confirmText}
            </Button>
          </>
        }
      >
        {typeof state.content === 'string' ? (
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {state.content}
          </p>
        ) : (
          state.content
        )}
      </Modal>
    ),
    [state, close]
  );

  return { confirm, ConfirmDialog };
}
