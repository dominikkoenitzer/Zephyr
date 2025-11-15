import { useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  };

  const styles = {
    success: 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400',
    error: 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400',
  };

  const Icon = icons[type] || icons.success;

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm',
        styles[type]
      )}
      style={{
        animation: 'slideInBottomRight 0.3s ease-out',
      }}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={onClose}
        className="ml-2 p-1 rounded hover:bg-background/20 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Toast;

