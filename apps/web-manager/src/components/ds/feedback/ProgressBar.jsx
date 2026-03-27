import React from 'react';

export const ProgressBar = ({
  value = 0,
  max = 100,
  variant = 'primary',
  size = 'md',
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const variants = {
    primary: 'bg-amber-500',
    success: 'bg-emerald-500',
    danger: 'bg-rose-500',
    warning: 'bg-amber-400',
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ${sizes[size]} ${className}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div
        className={`h-full transition-all duration-300 ease-out ${variants[variant]}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
