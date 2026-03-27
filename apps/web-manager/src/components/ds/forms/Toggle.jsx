import React from 'react';
import { Typography } from '../foundation/Typography';

export const Toggle = ({
  label,
  checked = false,
  onChange,
  disabled = false,
  className = '',
}) => {
  return (
    <label className={`flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange && onChange(e.target.checked)}
          disabled={disabled}
        />
        <div className={`block w-8 h-4.5 rounded-full transition-all ${checked ? 'bg-bk-yellow' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
        <div className={`dot absolute left-0.5 top-0.5 bg-white dark:bg-slate-100 w-3.5 h-3.5 rounded-full transition-all shadow-xs ${checked ? 'transform translate-x-3.5' : ''}`}></div>
      </div>
      {label && <Typography variant="label" className="select-none text-[12px] font-medium text-slate-700 dark:text-slate-300 tracking-tight">{label}</Typography>}
    </label>
  );
};
