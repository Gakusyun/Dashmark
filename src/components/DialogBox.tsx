import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, type DialogProps, type ButtonProps } from '@mui/material';

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
  confirmButtonProps?: ButtonProps;
  cancelButtonProps?: ButtonProps;
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
  confirmButtonProps,
  cancelButtonProps,
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
        {showCancel && <Button onClick={onClose} variant={cancelVariant} {...cancelButtonProps}>{cancelText}</Button>}
        {onConfirm && (
          <Button onClick={onConfirm} color={confirmColor} variant={confirmVariant} {...confirmButtonProps}>
            {confirmText}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};