import { useState, useCallback } from 'react';

export function useFormDialog<T>(initialFormData: T) {
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [formData, setFormData] = useState<T>(initialFormData);

  const openAdd = useCallback(() => {
    setEditingItem(null);
    setFormData(initialFormData);
    setOpen(true);
  }, [initialFormData]);

  const openEdit = useCallback((item: T) => {
    setEditingItem(item);
    setFormData(item);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const updateFormData = useCallback((updates: Partial<T> | ((prev: T) => T)) => {
    setFormData(prev => {
      if (typeof updates === 'function') {
        return updates(prev);
      }
      return { ...prev, ...updates };
    });
  }, []);

  const isEditing = editingItem !== null;

  return {
    open,
    editingItem,
    formData,
    isEditing,
    openAdd,
    openEdit,
    close,
    updateFormData,
  };
}