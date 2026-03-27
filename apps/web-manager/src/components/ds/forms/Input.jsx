import React, { forwardRef } from 'react';
import { FormField } from './FormField';
import { Icon } from '../foundation/Icon';

export const Input = forwardRef(({
  label,
  labelExtra,
  description,
  error,
  required,
  type = 'text',
  className = '',
  disabled = false,
  icon,
  onChange,
  value,
  suffix,
  ...props
}, ref) => {
  const isNumber = type === 'number';

  const handleAdjust = (delta) => {
    if (disabled || !onChange) return;
    const currentVal = parseFloat(value) || 0;
    const nextVal = Math.max(0, currentVal + delta);
    onChange({ target: { value: nextVal.toString(), name: props.name } });
  };

  return (
    <FormField 
      label={label} 
      labelExtra={labelExtra} 
      description={description} 
      error={error} 
      required={required} 
      className={className}
    >
      <div className="relative group flex items-center">
        {icon && (
          <div className="absolute left-3.5 h-full flex items-center text-slate-400 group-focus-within:text-bk-yellow transition-colors pointer-events-none">
            <Icon name={icon} size="md" weight={300} />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          value={value}
          onChange={onChange}
          className={`w-full h-10 text-[13px] font-medium bg-slate-50 dark:bg-white/3 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-hidden focus:bg-bk-yellow/3 dark:focus:bg-bk-yellow/6 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield] ${
            icon ? 'pl-11' : 'pl-3.5'
          } ${
            isNumber && suffix ? 'pr-20' : (isNumber ? 'pr-9' : (suffix ? 'pr-12' : 'pr-3.5'))
          } ${
            error 
              ? 'border-rose-500/50 focus:border-rose-500' 
              : 'focus:border-bk-yellow/50 dark:focus:border-bk-yellow/50 hover:border-slate-300/60 dark:hover:border-white/20'
          } ${
            disabled ? 'opacity-60 cursor-not-allowed' : ''
          }`}
          style={{
            colorScheme: 'light dark',
            WebkitAppearance: 'none',
            MozAppearance: 'textfield'
          }}
          {...props}
        />

        {suffix && (
          <div className={`absolute select-none flex items-center justify-center animate-in fade-in duration-300 ${isNumber ? 'right-9' : 'right-3.5'}`}>
            {typeof suffix === 'string' ? (
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-white/5">
                {suffix}
              </span>
            ) : suffix}
          </div>
        )}

        {isNumber && !disabled && (
          <div className="absolute right-2 px-1 border-l border-slate-200/50 dark:border-white/5 flex flex-col items-center justify-center gap-0.5 h-6 my-auto pointer-events-none">
            <button
               type="button"
               onClick={() => (props.onStepChange ? props.onStepChange(1) : handleAdjust(1))}
               className="w-4 h-2.5 flex items-center justify-center text-slate-400 hover:text-bk-yellow transition-all active:scale-95 pointer-events-auto"
            >
              <Icon name="keyboard_arrow_up" size="14px" weight={700} />
            </button>
            <button
               type="button"
               onClick={() => (props.onStepChange ? props.onStepChange(-1) : handleAdjust(-1))}
               className="w-4 h-2.5 flex items-center justify-center text-slate-400 hover:text-bk-yellow transition-all active:scale-95 pointer-events-auto"
            >
              <Icon name="keyboard_arrow_down" size="14px" weight={700} />
            </button>
          </div>
        )}
      </div>
    </FormField>
  );
});

Input.displayName = 'Input';
