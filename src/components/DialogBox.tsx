import { type ReactNode, type ButtonHTMLAttributes } from 'react';

export interface DialogBoxProps {
  open: boolean;
  title: string;
  content?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onClose: () => void;
  confirmColor?: 'primary' | 'error' | 'warning' | 'success' | 'info';
  confirmVariant?: 'solid' | 'outline' | 'ghost';
  cancelVariant?: 'solid' | 'outline' | 'ghost';
  showCancel?: boolean;
  children?: ReactNode;
  maxWidth?: string;
  confirmButtonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  cancelButtonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
}

const confirmColorClasses: Record<string, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  error: 'bg-red-600 hover:bg-red-700 text-white',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  info: 'bg-sky-600 hover:bg-sky-700 text-white',
};

const variantClasses: Record<string, string> = {
  solid: 'bg-blue-600 hover:bg-blue-700 text-white',
  outline:
    'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700',
  ghost: 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700',
};

export const DialogBox: React.FC<DialogBoxProps> = ({
  open,
  title,
  content,
  confirmText = '确定',
  cancelText = '取消',
  onConfirm,
  onClose,
  confirmColor = 'primary',
  confirmVariant = 'solid',
  cancelVariant = 'ghost',
  showCancel = true,
  children,
  maxWidth = 'max-w-md',
  confirmButtonProps,
  cancelButtonProps,
}) => {
  if (!open) return null;

  const confirmCls = confirmVariant === 'solid'
    ? confirmColorClasses[confirmColor] || confirmColorClasses.primary
    : variantClasses[confirmVariant] || variantClasses.ghost;

  const cancelCls = variantClasses[cancelVariant] || variantClasses.ghost;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${maxWidth} rounded-lg bg-white shadow-xl dark:bg-slate-800`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 pt-4 text-lg font-semibold text-slate-900 dark:text-white">
          {title}
        </div>
        <div className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
          {typeof content === 'string' ? <p>{content}</p> : content}
          {children}
        </div>
        <div className="flex justify-end gap-2 px-4 pb-4 pt-1">
          {showCancel && (
            <button
              type="button"
              onClick={onClose}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${cancelCls}`}
              {...cancelButtonProps}
            >
              {cancelText}
            </button>
          )}
          {onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${confirmCls}`}
              {...confirmButtonProps}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
