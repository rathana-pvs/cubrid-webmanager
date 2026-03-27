import React from 'react';
import { Icon } from './Icon';

export const Spinner = ({
  size = 'md',
  color = 'current',
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center justify-center animate-spin ${className}`}>
      <Icon name="progress_activity" size={size} className={color === 'current' ? '' : `text-${color}`}  weight={300} />
    </div>
  );
};
