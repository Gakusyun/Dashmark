import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import type { DialogProps } from '@mui/material';

interface FormDialogProps extends DialogProps {
  open: boolean;
  title: string;
  onSave: () => void;
  onClose: () => void;
  saveText?: string;
  cancelText?: string;
  children: React.ReactNode;
}

export const FormDialog: React.FC<FormDialogProps> = ({
  open,
  title,
  onSave,
  onClose,
  saveText = '保存',
  cancelText = '取消',
  children,
  maxWidth = 'sm',
  fullWidth = true,
  ...props
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth={fullWidth} {...props}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{cancelText}</Button>
        <Button onClick={onSave} variant="contained">
          {saveText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};