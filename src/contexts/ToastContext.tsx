import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export type ToastSeverity = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  severity: ToastSeverity;
  autoHideDuration?: number;
}

interface ToastContextType {
  showToast: (message: string, severity?: ToastSeverity, autoHideDuration?: number) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const severityClasses: Record<ToastSeverity, string> = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  warning: 'bg-amber-500 text-white',
  info: 'bg-blue-600 text-white',
};

const severityIcons: Record<ToastSeverity, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback(
    (message: string, severity: ToastSeverity = 'info', autoHideDuration: number = 4000) => {
      const id = Date.now().toString();
      setToast({ id, message, severity, autoHideDuration });
    },
    []
  );

  const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const showError = useCallback((message: string) => showToast(message, 'error'), [showToast]);
  const showWarning = useCallback((message: string) => showToast(message, 'warning'), [showToast]);
  const showInfo = useCallback((message: string) => showToast(message, 'info'), [showToast]);

  const handleClose = useCallback(() => {
    setToast(null);
  }, []);

  const value: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[10000] -translate-x-1/2">
          <div
            key={toast.id}
            className={`flex items-center gap-2 rounded-md px-4 py-3 text-sm font-medium shadow-lg ${severityClasses[toast.severity]}`}
            role="alert"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
              {severityIcons[toast.severity]}
            </span>
            <span>{toast.message}</span>
            <button
              onClick={handleClose}
              className="ml-2 rounded p-0.5 opacity-70 hover:opacity-100"
              aria-label="关闭"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {toast && <AutoCloseToast duration={toast.autoHideDuration || 4000} onClose={handleClose} />}
    </ToastContext.Provider>
  );
};

function AutoCloseToast({ duration, onClose }: { duration: number; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);
  return null;
}
