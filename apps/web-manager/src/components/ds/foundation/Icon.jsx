import React from 'react';

export const Icon = ({ name, size = '16px', weight = 300, className = '', ...props }) => {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontVariationSettings: `'wght' ${weight}`,
        fontSize: size === 'sm' ? '14px' : size === 'md' ? '16px' : size === 'lg' ? '20px' : size === 'xl' ? '24px' : size,
      }}
      {...props}
    >
      {name}
    </span>
  );
};
