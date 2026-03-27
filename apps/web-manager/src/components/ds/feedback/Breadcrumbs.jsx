import React from 'react';
import { Icon } from '../foundation/Icon';

export const Breadcrumbs = ({
  items = [],
  onNavigate,
  className = '',
}) => {
  return (
    <nav className={`flex text-sm text-slate-500 font-medium ${className}`} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          
          return (
            <li key={item.id || idx} className="inline-flex items-center">
              {idx > 0 && (
                <Icon name="chevron_right" size="sm" className="text-slate-400 mx-1"  weight={300} />
              )}
              {isLast ? (
                <span className="text-slate-800 dark:text-slate-200" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <button
                  onClick={() => onNavigate && onNavigate(item)}
                  className="inline-flex items-center text-slate-500 hover:text-amber-600 dark:hover:text-amber-500 transition-colors focus:outline-hidden"
                >
                  {item.icon && <Icon name={item.icon} size="sm" className="mr-1"  weight={300} />}
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
