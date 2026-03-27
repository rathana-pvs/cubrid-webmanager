import React from 'react';
import { Icon } from '../foundation/Icon';

export const DatePicker = ({
  value,
  onChange,
  placeholder = 'Select date',
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        disabled={disabled}
        className={`w-full pl-3 pr-10 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:border-amber-500 dark:text-slate-200 transition-shadow ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50' : ''}`}
        placeholder={placeholder}
      />
      <div className="absolute right-3 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center border-l pl-2 border-slate-200 dark:border-slate-800 h-2/3">
        <Icon name="calendar_today" size="sm"  weight={300} />
      </div>
    </div>
  );
};
