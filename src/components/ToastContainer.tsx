import React from 'react';
import Toast from './Toast';
import { useToast } from '../hooks/useToast';

const ToastContainer: React.FC = () => {
  const { toasts, hideToast } = useToast();

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => hideToast(toast.id)}
            duration={toast.duration}
          />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;