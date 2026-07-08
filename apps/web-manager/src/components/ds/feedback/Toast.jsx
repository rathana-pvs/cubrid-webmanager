import React, { useEffect } from 'react';
import { Icon } from '../foundation/Icon';
import { Typography } from '../foundation/Typography';
import { useCM } from '../../../constants/useCM';

export const Toast = ({
  id,
  message,
  variant = 'info',
  duration = 3000,
  onClose,
}) => {
  const CM = useCM();
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onClose(id), duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const variants = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'info',
      iconColor: 'text-blue-500',
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-900/30',
      border: 'border-green-200 dark:border-green-800',
      icon: 'check_circle',
      iconColor: 'text-green-500',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/30',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: 'warning',
      iconColor: 'text-yellow-500',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/30',
      border: 'border-red-200 dark:border-red-800',
      icon: 'error',
      iconColor: 'text-red-500',
    },
  };

  const style = variants[variant] || variants.info;

  return (
    <div
      className={`flex items-start p-4 mb-3 border rounded-lg shadow-lg pointer-events-auto transition-all transform duration-300 ease-in-out ${style.bg} ${style.border}`}
      role="alert"
    >
      <Icon name={style.icon} className={`mr-3 mt-0.5 ${style.iconColor}`}  weight={300} />
      <div className="flex-1 mr-4">
        <Typography variant="p" className="text-sm font-medium">
          {message}
        </Typography>
      </div>
      <button
        type="button"
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        onClick={() => onClose(id)}
      >
        <span className="sr-only">{CM.close}</span>
        <Icon name="close" size="sm"  weight={300} />
      </button>
    </div>
  );
};
