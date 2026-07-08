import React from 'react';
import { Icon } from '../foundation/Icon';
import { Typography } from '../foundation/Typography';
import { useCM } from '../../../constants/useCM';

export const Alert = ({
  variant = 'info',
  title,
  children,
  onClose,
  className = '',
}) => {
  const CM = useCM();
  const variants = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      border: 'border-blue-200 dark:border-blue-500/30',
      text: 'text-blue-800 dark:text-blue-300',
      iconUrl: 'info',
      iconColor: 'text-blue-500 dark:text-blue-400',
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      border: 'border-emerald-200 dark:border-emerald-500/30',
      text: 'text-emerald-800 dark:text-emerald-300',
      iconUrl: 'check_circle',
      iconColor: 'text-emerald-500 dark:text-emerald-400',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      border: 'border-amber-200 dark:border-amber-500/30',
      text: 'text-amber-800 dark:text-amber-300',
      iconUrl: 'warning',
      iconColor: 'text-amber-500 dark:text-amber-400',
    },
    error: {
      bg: 'bg-rose-50 dark:bg-rose-900/30',
      border: 'border-rose-200 dark:border-rose-500/30',
      text: 'text-rose-800 dark:text-rose-300',
      iconUrl: 'error',
      iconColor: 'text-rose-500 dark:text-rose-400',
    },
  };

  const style = variants[variant] || variants.info;

  return (
    <div className={`flex p-4 rounded-lg border ${style.bg} ${style.border} ${className}`} role="alert">
      <div className="shrink-0 mr-3">
        <Icon name={style.iconUrl} size="md" className={style.iconColor}  weight={300} />
      </div>
      <div className={`flex-1 ${style.text}`}>
        {title && <Typography variant="h6" className="font-semibold text-sm mb-1">{title}</Typography>}
        <div className="text-sm">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`shrink-0 ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg focus:outline-hidden transition-colors ${style.iconColor} hover:bg-black/5 dark:hover:bg-white/10`}
          aria-label={CM.dismiss}
        >
          <Icon name="close" size="sm"  weight={300} />
        </button>
      )}
    </div>
  );
};
