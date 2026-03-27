import React from 'react';
import { Icon } from '../foundation/Icon';

export const Steps = ({
  steps = [],
  currentStep = 0,
  className = '',
}) => {
  return (
    <div className={`flex items-center w-full ${className}`}>
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isActive = idx === currentStep;
        
        return (
          <React.Fragment key={idx}>
            <div className="flex flex-col items-center relative group">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                  isCompleted
                    ? 'bg-amber-600 border-amber-600 text-white'
                    : isActive
                    ? 'border-amber-600 text-amber-600 bg-white dark:bg-slate-900 shadow-[0_0_0_4px_rgba(217,119,6,0.1)] dark:shadow-[0_0_0_4px_rgba(217,119,6,0.2)]'
                    : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900'
                }`}
              >
                {isCompleted ? (
                  <Icon name="check" size="sm" className="font-bold"  weight={300} />
                ) : (
                  <span className="text-sm font-semibold">{idx + 1}</span>
                )}
              </div>
              <span
                className={`absolute top-10 whitespace-nowrap text-xs font-medium ${
                  isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {step}
              </span>
            </div>
            
            {idx < steps.length - 1 && (
              <div className="flex-1 mx-4 h-[2px]">
                <div 
                  className={`h-full transition-all duration-300 ${
                    idx < currentStep ? 'bg-amber-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
