import React from 'react';
import { Typography } from '../foundation/Typography';

export const Radio = ({
  label,
  value,
  checked = false,
  onChange,
  disabled = false,
  name,
  className = '',
}) => {
  return (
    <label className={`flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative flex items-center justify-center">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={(e) => onChange && onChange(e.target.value)}
          disabled={disabled}
          className="peer sr-only"
        />
        <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-800 transition-all peer-checked:border-bk-yellow/50 bg-slate-50 dark:bg-bk-main/30 shadow-xs"></div>
        <div className={`absolute w-1.5 h-1.5 rounded-full bg-bk-yellow transition-transform scale-0 peer-checked:scale-100 flex items-center justify-center shadow-xs shadow-bk-yellow/20`}></div>
      </div>
      {label && <Typography variant="label" className="select-none text-[11px] font-medium text-slate-700 dark:text-slate-200 tracking-wide">{label}</Typography>}
    </label>
  );
};

export const RadioGroup = ({
  options = [],
  value,
  onChange,
  name,
  direction = 'col',
  className = '',
}) => {
  return (
    <div className={`flex ${direction === 'row' ? 'flex-row gap-4' : 'flex-col gap-2'} ${className}`}>
      {options.map((opt) => (
        <Radio
          key={opt.value}
          name={name}
          label={opt.label}
          value={opt.value}
          checked={value === opt.value}
          onChange={onChange}
          disabled={opt.disabled}
        />
      ))}
    </div>
  );
};
