import React from 'react';

/**
 * Divider component to separate content blocks with a standardized horizontal or vertical rule.
 * 
 * @param {('horizontal'|'vertical')} orientation - Use horizontal (default) or vertical divider
 * @param {string} className - Additional CSS classes for custom spacing/margins
 * @param {boolean} dashed - If true, applies a dashed border style
 */
export const Divider = ({ 
  orientation = 'horizontal', 
  className = '', 
  dashed = false,
  ...props 
}) => {
  const baseStyles = "bg-slate-200 dark:bg-white/10 shrink-0 border-none transition-colors duration-200";
  const dashedStyles = dashed ? "border-t border-dashed bg-transparent border-slate-300 dark:border-white/20" : "";
  
  if (orientation === 'vertical') {
    return (
      <div 
        className={`${baseStyles} ${dashedStyles} w-px h-full ${className}`} 
        {...props} 
      />
    );
  }

  return (
    <hr 
      className={`${baseStyles} ${dashedStyles} h-px w-full my-4 ${className}`} 
      {...props} 
    />
  );
};
