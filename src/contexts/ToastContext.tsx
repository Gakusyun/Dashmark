/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../utils/cn';
import { CheckIcon, CloseIcon, ErrorIcon, InfoIcon, WarningIcon } from '../components/Icons';

export type ToastSeverity = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  severity: ToastSeverity;
  duration: number;
}

interface ToastContextType {
  showToast: (message: string, severity?: ToastSeverity, duration?: number) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

const severityStyles: Record<ToastSeverity, { icon: ReactNode; ring: string }> = {
  success: { icon: <CheckIcon size={15} />, ring: 'text-emerald-600 dark:text-emerald-400' },
  error: { icon: <ErrorIcon size={15} />, ring: 'text-rose-600 dark:text-rose-400' },
  warning: { icon: <WarningIcon size={15} />, ring: 'text-amber-600 dark:text-amber-400' },
  info: { icon: <InfoIcon size={15} />, ring: 'text-sky-600 dark:text-sky-400' },
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, severity: ToastSeverity = 'info', duration: number = 3200) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev.slice(-2), { id, message, severity, duration }]);
    },
    []
  );

  const value = useMemo<ToastContextType>(
    () => ({
      showToast,
      showSuccess: (m) => showToast(m, 'success'),
      showError: (m) => showToast(m, 'error'),
      showWarning: (m) => showToast(m, 'warning'),
      showInfo: (m) => showToast(m, 'info'),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[9999] flex flex-col items-center gap-2 p-4">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const { icon, ring } = severityStyles[toast.severity];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div
      role="status"
      className="animate-rise pointer-events-auto flex max-w-md items-center gap-2.5 rounded-xl border border-slate-200 bg-white py-2.5 pr-2 pl-3.5 shadow-lg shadow-slate-900/10 dark:border-slate-700 dark:bg-black dark:shadow-none"
    >
      <span className={cn('shrink-0', ring)}>{icon}</span>
      <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="关闭提示"
        className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
      >
        <CloseIcon size={14} />
      </button>
    </div>
  );
}
