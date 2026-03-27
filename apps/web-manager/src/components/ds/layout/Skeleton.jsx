import React from 'react';

export const Skeleton = ({
  variant = 'rect',
  width = '100%',
  height = '1rem',
  className = '',
}) => {
  const baseClasses = 'bg-slate-200 dark:bg-slate-800 animate-pulse';
  
  const variants = {
    text: 'rounded-xs',
    rect: 'rounded-md',
    circle: 'rounded-full',
  };

  return (
    <div
      className={`${baseClasses} ${variants[variant]} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
};
