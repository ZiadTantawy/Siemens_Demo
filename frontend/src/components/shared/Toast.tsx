/**
 * Toast notification component
 */

import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useUI } from '../../contexts/UIContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUI();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

interface ToastProps {
  toast: {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  };
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle
  };

  const colors = {
    success: 'bg-green-500/10 border-green-500/20 text-green-500',
    error: 'bg-red-500/10 border-red-500/20 text-red-500',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={`
        flex items-center gap-3 p-4 rounded-modern border backdrop-blur-glass
        ${colors[toast.type]}
        animate-fade-in shadow-glass min-w-[300px] max-w-[400px]
      `}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={onClose}
        className="p-1 hover:bg-background/20 rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};


