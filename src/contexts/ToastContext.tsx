import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';

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

interface ToastProviderProps {
  children: React.ReactNode;
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
        <Snackbar
          open={true}
          autoHideDuration={toast.autoHideDuration}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{ zIndex: 10000 }}
        >
          <Alert
            onClose={handleClose}
            severity={toast.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      )}
    </ToastContext.Provider>
  );
};
