import React from 'react';
import { Icon } from '../foundation/Icon';

export const SearchInput = ({
  value = '',
  onChange,
  onClear,
  placeholder = 'Search...',
  className = '',
}) => {
  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <div className="absolute left-3 text-slate-400 dark:text-slate-500 flex items-center pointer-events-none">
        <Icon name="search" size="sm"  weight={300} />
      </div>
      
      <input
        type="text"
        className="w-full pl-9 pr-8 py-1.5 text-sm bg-slate-50/50 dark:bg-bk-main/20 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-bk-yellow/50 hover:border-slate-300/60 dark:hover:border-white/20 transition-all duration-200"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
      />
      
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center justify-center rounded-full p-0.5"
          aria-label="Clear search"
        >
          <Icon name="close" size="sm"  weight={300} />
        </button>
      )}
    </div>
  );
};
