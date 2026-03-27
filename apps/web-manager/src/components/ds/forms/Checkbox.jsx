import React, { forwardRef } from 'react';
import { Typography } from '../foundation/Typography';

export const Checkbox = forwardRef(({
  label,
  description,
  error,
  className = '',
  disabled = false,
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col gap-1 w-fit ${className}`}>
      <label className={`flex items-start gap-2 cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <div className="relative flex items-center justify-center pt-0.5">
          <input
            ref={ref}
            type="checkbox"
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <div className="w-4.5 h-4.5 bg-slate-50 dark:bg-bk-main/30 border border-slate-300 dark:border-slate-800 rounded-md flex shrink-0 justify-center items-center peer-checked:bg-bk-yellow peer-checked:border-bk-yellow/50 transition-all shadow-xs">
            <svg 
              className="w-3.5 h-3.5 text-bk-side pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        </div>
        
        {label && (
          <div className="flex flex-col">
            <Typography variant="label" className="select-none text-[11px] font-medium text-slate-700 dark:text-slate-200 tracking-wide">
              {label}
            </Typography>
            {description && (
              <Typography variant="p" className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                {description}
              </Typography>
            )}
          </div>
        )}
      </label>
      {error && (
        <Typography variant="p" className="ml-5.5 mt-0.5 text-[9px] text-rose-500 font-medium tracking-tight">
          {error}
        </Typography>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';
