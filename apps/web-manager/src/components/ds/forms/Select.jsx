import React, { useState, useRef, useEffect } from 'react';
import { FormField } from './FormField';
import { Icon } from '../foundation/Icon';
import { Typography } from '../foundation/Typography';

export const Select = ({
  label,
  description,
  error,
  required,
  options = [],
  className = '',
  disabled = false,
  value,
  onChange,
  placeholder = "Select option",
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    if (disabled || option.disabled) return;
    if (onChange) {
      onChange({ target: { value: option.value, name: props.name } });
    }
    setIsOpen(false);
  };

  return (
    <FormField label={label} description={description} error={error} required={required} className={className}>
      <div className="relative group" ref={containerRef}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`relative w-full pl-3.5 pr-10 h-10 text-[13px] font-medium text-left bg-slate-50 dark:bg-white/3 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-hidden transition-all flex items-center ${
            error 
              ? 'border-rose-500/50' 
              : isOpen 
                ? 'border-bk-yellow/50 dark:border-bk-yellow/50 bg-bk-yellow/2 dark:bg-bk-yellow/4' 
                : 'hover:border-slate-300/60 dark:hover:border-white/20'
          } ${
            disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <span className={`block truncate text-[13px] font-medium ${
            !selectedOption 
              ? 'text-slate-400 dark:text-slate-600' 
              : 'text-slate-900 dark:text-slate-100'
          }`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className={`absolute right-3.5 top-1/2 -translate-y-[52%] transition-transform duration-200 pointer-events-none ${isOpen ? 'rotate-180' : ''}`}>
             <Icon name="expand_more" size="sm" weight={300} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
          </div>
        </button>


        {isOpen && (
          <div className="absolute z-100 w-full mt-1 bg-white dark:bg-[#1A1C1E] border border-slate-200 dark:border-white/10 rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.3)] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="p-1 max-h-[220px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10 scrollbar-track-transparent flex flex-col gap-0.5">
              {options.length === 0 ? (
                <div className="px-3 py-2 text-[10px] text-slate-400 italic">No options available</div>
              ) : (
                options.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt)}
                    className={`flex items-center justify-between px-3 h-9 rounded-lg text-[13px] font-bold transition-all cursor-pointer group relative overflow-hidden ${
                      opt.value === value
                        ? 'bg-bk-yellow/10 text-bk-yellow shadow-xs border border-bk-yellow/20'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/6 hover:text-slate-900 dark:hover:text-white'
                    } ${
                      opt.disabled ? 'opacity-30 cursor-not-allowed' : ''
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {opt.value === value && (
                      <div className="w-1 h-3 rounded-full bg-bk-yellow" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </FormField>
  );
};
