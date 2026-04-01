import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  size = 'md',
  disabled = false,
  value,
  onChange,
  placeholder = "Select option",
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const buttonRef = useRef(null);
  const containerRef = useRef(null);
  const isSm = size === 'sm';

  const selectedOption = options.find(opt => opt.value === value);

  // Compute position from button's screen rect before opening
  const openDropdown = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
    setIsOpen(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current && !containerRef.current.contains(event.target) &&
        // also check the portal dropdown (rendered outside containerRef)
        !document.getElementById('select-portal-root')?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on scroll (the trigger button moves but the portal stays fixed)
  useEffect(() => {
    const handleScroll = () => setIsOpen(false);
    if (isOpen) {
      window.addEventListener('scroll', handleScroll, true);
    }
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  const handleSelect = (option) => {
    if (disabled || option.disabled) return;
    if (onChange) {
      onChange({ target: { value: option.value, name: props.name } });
    }
    setIsOpen(false);
  };

  const dropdownEl = isOpen ? createPortal(
    <div
      id="select-portal-root"
      style={dropdownStyle}
      className="bg-white dark:bg-[#1A1C1E] border border-slate-200 dark:border-white/10 rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.35)] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
    >
      <div className="p-1 max-h-[220px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10 scrollbar-track-transparent flex flex-col gap-0.5">
        {options.length === 0 ? (
          <div className="px-3 py-2 text-[10px] text-slate-400 italic">No options available</div>
        ) : (
          options.map((opt) => (
            <div
              key={opt.value}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(opt); }}
              className={`flex items-center justify-between px-3 h-9 rounded-lg text-[13px] font-medium transition-all cursor-pointer group relative overflow-hidden ${
                opt.value === value
                  ? 'bg-amber-500/10 text-amber-500 shadow-xs border border-amber-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/6 hover:text-slate-900 dark:hover:text-white'
              } ${
                opt.disabled ? 'opacity-30 cursor-not-allowed' : ''
              }`}
            >
              <span className="truncate">{opt.label}</span>
            </div>
          ))
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <FormField label={label} description={description} error={error} required={required} className={className}>
      <div className="relative group" ref={containerRef}>
        <button
          ref={buttonRef}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && (isOpen ? setIsOpen(false) : openDropdown())}
          className={`relative w-full pl-3.5 pr-10 ${isSm ? 'h-8 text-[12px]' : 'h-10 text-[13px]'} font-medium text-left bg-slate-50 dark:bg-white/3 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-hidden transition-all flex items-center ${
            error
              ? 'border-rose-500/50'
              : isOpen
                ? 'border-amber-500/50 dark:border-amber-500/50 bg-amber-500/2 dark:bg-amber-500/4'
                : 'hover:border-slate-300/60 dark:hover:border-white/20'
          } ${
            disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <span className={`block truncate ${isSm ? 'text-[12px]' : 'text-[13px]'} font-medium ${
            !selectedOption
              ? 'text-slate-400 dark:text-slate-600'
              : 'text-slate-900 dark:text-slate-100'
          }`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center ${isSm ? 'w-6 h-6' : 'w-7 h-7'} pointer-events-none`}>
            <Icon
              name="expand_more"
              size="14px"
              weight={700}
              className={`text-slate-400 group-hover:text-amber-500 transition-all duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </button>
        {dropdownEl}
      </div>
    </FormField>
  );
};
