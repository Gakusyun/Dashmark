import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { CloseIcon } from '../Icons';
import { isTopEscapeLayer, popEscapeLayer, pushEscapeLayer } from '../../utils/escapeStack';

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

/**
 * 通用模态框：portal 渲染、Esc 关闭、点击遮罩关闭、聚焦管理。
 */
export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const layer = pushEscapeLayer();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // 仅最上层响应该按键，避免同时关闭嵌套的两层浮层
      if (!isTopEscapeLayer(layer)) return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey, true);
      popEscapeLayer(layer);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9995] flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'animate-rise w-full rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl dark:bg-slate-800',
          sizes[size]
        )}
      >
        <header className="flex items-start gap-3 px-5 pt-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
            {description && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="-mr-1 -mt-1 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            <CloseIcon size={18} />
          </button>
        </header>

        <div className="scrollbar-thin max-h-[65vh] overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <footer className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3.5 dark:border-slate-700">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
}
