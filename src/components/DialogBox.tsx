import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, type DialogProps } from '@mui/material';

export interface DialogBoxProps extends Omit<DialogProps, 'content'> {
  open: boolean;
  title: string;
  content?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onClose: () => void;
  confirmColor?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  confirmVariant?: 'text' | 'outlined' | 'contained';
  cancelVariant?: 'text' | 'outlined' | 'contained';
  showCancel?: boolean;
  children?: React.ReactNode;
}

export const DialogBox: React.FC<DialogBoxProps> = ({
  open,
  title,
  content,
  confirmText = '确定',
  cancelText = '取消',
  onConfirm,
  onClose,
  confirmColor = 'primary',
  confirmVariant = 'contained',
  cancelVariant = 'text',
  showCancel = true,
  children,
  maxWidth = 'sm',
  fullWidth = true,
  ...props
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth={fullWidth} {...props}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {typeof content === 'string' ? <Typography>{content}</Typography> : content}
        {children}
      </DialogContent>
      <DialogActions>
        {showCancel && <Button onClick={onClose} variant={cancelVariant}>{cancelText}</Button>}
        {onConfirm && (
          <Button onClick={onConfirm} color={confirmColor} variant={confirmVariant}>
            {confirmText}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};