import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { updatePreferences } from '../userSlice';

import { Icon } from '../../../components/ds/foundation/Icon';

export default function MonitoringSettingsPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);
  const dispatch = useDispatch();
  const { preferences, preferencesLoading } = useSelector((state) => state.user, shallowEqual);
  
  const [localPrefs, setLocalPrefs] = useState(preferences);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = () => {
    dispatch(updatePreferences(localPrefs));
    setIsOpen(false);
  };

  const intervals = [
    { label: 'Off', value: 0 },
    { label: '10s', value: 10 },
    { label: '30s', value: 30 },
    { label: '1m', value: 60 },
    { label: '5m', value: 300 },
  ];

  return (
    <div className="relative" ref={popoverRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all active:scale-[0.98] relative group
          ${isOpen 
            ? 'bg-amber-500/10 text-amber-600 dark:text-bk-yellow border-amber-500/50 dark:border-bk-yellow/50 shadow-xs' 
            : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 hover:border-amber-500/50 hover:bg-white dark:hover:bg-white/5 shadow-xs'
          }`}
        title="Monitoring Settings"
      >
        <Icon name="timer" size="18px" weight={300} />

        {(preferences.dashboardInterval > 0 || preferences.brokerStatusInterval > 0) && (
          <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-amber-500 rounded-full border border-white dark:border-bk-side ring-2 ring-amber-500/20"></div>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 w-72 bg-white dark:bg-bk-side border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-110 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="px-4 py-3 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">Monitoring Settings</h3>
          </div>
          
          <div className="p-4 space-y-5">
            {/* Dashboard Interval */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Dashboard</label>
                <span className="text-[9px] text-slate-400 font-mono">{localPrefs.dashboardInterval > 0 ? `${localPrefs.dashboardInterval}s` : 'Manual'}</span>
              </div>
              <div className="flex p-0.5 bg-slate-100 dark:bg-black/20 rounded-lg">
                {intervals.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setLocalPrefs(prev => ({ ...prev, dashboardInterval: opt.value }))}
                    className={`flex-1 py-1.5 text-[10px] font-medium rounded-md transition-all
                      ${localPrefs.dashboardInterval === opt.value 
                        ? 'bg-white dark:bg-slate-700 text-bk-yellow shadow-xs' 
                        : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-slate-400 italic leading-snug">Refreshes database activity and disk volumes.</p>
            </div>

            {/* Broker Interval */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Broker Infrastructure</label>
                <span className="text-[9px] text-slate-400 font-mono">{localPrefs.brokerStatusInterval > 0 ? `${localPrefs.brokerStatusInterval}s` : 'Manual'}</span>
              </div>
              <div className="flex p-0.5 bg-slate-100 dark:bg-black/20 rounded-lg">
                {intervals.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setLocalPrefs(prev => ({ ...prev, brokerStatusInterval: opt.value }))}
                    className={`flex-1 py-1.5 text-[10px] font-medium rounded-md transition-all
                      ${localPrefs.brokerStatusInterval === opt.value 
                        ? 'bg-white dark:bg-slate-700 text-bk-yellow shadow-xs' 
                        : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-slate-400 italic leading-snug">Refreshes individual broker status and query loads.</p>
            </div>
          </div>

          <div className="px-4 py-3 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button 
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={preferencesLoading}
              className="px-4 py-1.5 bg-bk-yellow text-bk-side text-[10px] font-bold rounded-md hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {preferencesLoading ? 'Saving...' : 'Apply Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
