import React from 'react';
import { Typography } from '../foundation/Typography';

export const FormField = ({
  label,
  labelExtra,
  description,
  error,
  required = false,
  className = '',
  children,
}) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <div className="flex justify-between items-center mb-0.5 ml-0.5">
          <div className="flex items-center gap-1.5">
            <Typography variant="label" className="text-[11px] font-medium text-slate-500 dark:text-slate-300 font-sans">
              {label}
            </Typography>
            {required && <span className="text-rose-500 text-[10px]" title="Required">*</span>}
            {labelExtra && (
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal italic leading-none pt-0.5">
                {labelExtra}
              </span>
            )}
          </div>
        </div>
      )}
      {description && (
        <Typography variant="p" className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5 ml-0.5 font-medium leading-tight">
          {description}
        </Typography>
      )}
      
      {children}
      
      {error && (
        <Typography variant="p" className="mt-1 text-[9px] text-rose-500 font-medium tracking-tight ml-0.5">
          {error}
        </Typography>
      )}
    </div>
  );
};
