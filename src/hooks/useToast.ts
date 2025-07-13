import { useState, useCallback } from 'react';
import { ToastType } from '../components/Toast';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface UseToastReturn {
  toasts: ToastMessage[];
  showToast: (type: ToastType, message: string, duration?: number) => void;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
}

export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: ToastType, message: string, duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastMessage = {
      id,
      type,
      message,
      duration
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    hideToast,
    clearAllToasts
  };
};