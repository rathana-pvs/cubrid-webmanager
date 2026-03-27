import React, { useState } from 'react';
import { Icon } from '../foundation/Icon';
import { Typography } from '../foundation/Typography';

export const Accordion = ({
  items = [],
  allowMultiple = false,
  defaultIndex = [],
  className = '',
}) => {
  const [openIndexes, setOpenIndexes] = useState(Array.isArray(defaultIndex) ? defaultIndex : [defaultIndex]);

  const toggleItem = (index) => {
    if (allowMultiple) {
      if (openIndexes.includes(index)) {
        setOpenIndexes(openIndexes.filter((i) => i !== index));
      } else {
        setOpenIndexes([...openIndexes, index]);
      }
    } else {
      if (openIndexes.includes(index)) {
        setOpenIndexes([]);
      } else {
        setOpenIndexes([index]);
      }
    }
  };

  return (
    <div className={`w-full divide-y divide-slate-200 dark:divide-slate-800 border-y border-slate-200 dark:border-slate-800 ${className}`}>
      {items.map((item, idx) => {
        const isOpen = openIndexes.includes(idx);
        return (
          <div key={idx} className="bg-white dark:bg-slate-900">
            <button
              className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors focus:outline-hidden"
              onClick={() => toggleItem(idx)}
            >
              <div className="flex items-center gap-3">
                {item.icon && <Icon name={item.icon} size="md" className="text-slate-400"  weight={300} />}
                <Typography variant="span" className="font-medium text-sm text-slate-800 dark:text-slate-200">
                  {item.title}
                </Typography>
              </div>
              <Icon 
                name="expand_more" 
                size="md" 
                className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
               weight={300} />
            </button>
            
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className="px-4 pb-4 pt-1 text-sm text-slate-600 dark:text-slate-400">
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
