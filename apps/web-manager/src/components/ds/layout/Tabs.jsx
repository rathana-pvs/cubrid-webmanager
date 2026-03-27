import React from 'react';

export const Tabs = ({
  tabs = [],
  activeTab,
  onChange,
  variant = 'line',
  className = '',
}) => {
  const isPills = variant === 'pills';

  return (
    <div className={`w-full ${className}`}>
      <div className={`flex items-center gap-1 ${isPills ? 'bg-slate-100 dark:bg-bk-main/50 p-1 rounded-sm' : 'border-b border-slate-100 dark:border-slate-800'}`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          if (isPills) {
            return (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className={`flex-1 px-4 py-1.5 text-[11px] font-semibold rounded transition-all ${
                  isActive
                    ? 'bg-white dark:bg-bk-side text-slate-900 dark:text-bk-yellow shadow-xs border border-slate-200 dark:border-white/5'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`px-4 py-1.5 text-[12px] font-semibold border-b-2 transition-all ${
                isActive
                  ? 'border-bk-yellow text-slate-900 dark:text-bk-yellow'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-200 dark:hover:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="pt-4">
        {tabs.find((t) => t.id === activeTab)?.content}
      </div>
    </div>
  );
};
