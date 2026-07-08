import React from 'react';
import { Icon } from '../foundation/Icon';
import { Typography } from '../foundation/Typography';
import { useCM } from '../../../constants/useCM';

export const EmptyState = ({
  icon = 'inbox',
  title = null,
  description,
  action,
  className = '',
}) => {
  const CM = useCM();
  const resolvedTitle = title ?? CM.noDataTitle;
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/50">
        <Icon name={icon} size="xl" className="text-slate-400 dark:text-slate-500"  weight={300} />
      </div>
      <Typography variant="h5" className="mb-1">
        {resolvedTitle}
      </Typography>
      {description && (
        <Typography variant="p" className="mb-6 max-w-sm mx-auto text-slate-500 dark:text-slate-400">
          {description}
        </Typography>
      )}
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
};
