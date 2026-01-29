import { useState, useCallback } from 'react';

export interface ConfirmDialogState {
  open: boolean;
  title: string;
  content: string;
  onConfirm: () => void;
}

export function useConfirmDialog() {
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    title: '',
    content: '',
    onConfirm: () => {},
  });

  const showConfirm = useCallback((title: string, content: string, onConfirm: () => void) => {
    setConfirmDialog({
      open: true,
      title,
      content,
      onConfirm: () => {
        onConfirm();
        closeConfirm();
      },
    });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmDialog(prev => ({ ...prev, open: false }));
  }, []);

  return {
    confirmDialog,
    showConfirm,
    closeConfirm,
  };
}