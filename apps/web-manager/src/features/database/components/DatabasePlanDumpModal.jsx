import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closePlanDumpModal, fetchDatabasePlanDump } from '../databaseSlice';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import ErrorOverlay from '../../../components/common/ErrorOverlay';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Typography } from '../../../components/ds/foundation/Typography';

/**
 * DatabasePlanDumpModal follows the "Check Database" style.
 * Study from d-cms (PlanDumpDialog.java) and implemented for w-cms.
 */
export default function DatabasePlanDumpModal() {
  const dispatch = useDispatch();
  const { isPlanDumpModalOpen, selectedDatabase, planDumpData, planDumpLoading, planDumpError, activeDatabases } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);

  const [step, setStep] = useState('setup'); // 'setup' or 'results'
  const [planDrop, setPlanDrop] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isPlanDumpModalOpen) {
      setStep('setup');
      setPlanDrop(false);
    }
  }, [isPlanDumpModalOpen]);

  if (!isPlanDumpModalOpen) return null;

  const handleRunDump = () => {
    if (selectedHostUid && selectedDatabase) {
      dispatch(fetchDatabasePlanDump({ 
        hostUid: selectedHostUid, 
        dbname: selectedDatabase, 
        plandrop: planDrop ? 'y' : 'n' 
      })).unwrap().then(() => {
        setStep('results');
      });
    }
  };

  const handleClose = () => {
    dispatch(closePlanDumpModal());
  };

  const results = planDumpData[selectedDatabase] || {};
  
  // Parse the lines from the provided response structure: results.log[0].line
  let lines = [];
  if (results.log && Array.isArray(results.log) && results.log.length > 0) {
    lines = results.log[0].line || [];
  } else if (results.lines) {
    lines = results.lines;
  } else if (Array.isArray(results)) {
    lines = results;
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-bk-main/40 backdrop-blur-xs animate-in fade-in duration-200 font-sans text-left">
      <div className={`bg-white dark:bg-bk-side w-full transition-all duration-200 ${step === 'setup' ? 'max-w-[460px]' : 'max-w-[750px]'} rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col relative text-left ${step === 'setup' ? 'h-auto' : 'h-[650px]'}`}>
        
        {/* Subtle Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-bk-yellow/60"></div>

        <LoadingOverlay 
            isVisible={planDumpLoading} 
            title="Processing Plan Dump" 
            subtitle="Dumping query plan cache..." 
        />
        <ErrorOverlay 
          isVisible={!!planDumpError} 
          error={planDumpError} 
          onRetry={handleRunDump}
          onClose={() => handleClose()}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-bk-main/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-bk-yellow/10 flex items-center justify-center border border-bk-yellow/20">
              <Icon name="schema" size="sm" weight={300} className="text-bk-yellow text-xl" />
            </div>
            <div>
              <Typography variant="h3" className="text-[13px] font-bold text-slate-900 dark:text-white leading-none tracking-tight">Plan Cache Dump</Typography>
              {step === 'setup' && <Typography variant="caption" className="text-[11px] text-slate-500 mt-1">Check out the query plan values</Typography>}
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="w-7 h-7 rounded-md hover:bg-slate-200 dark:hover:bg-white/5 transition-all text-slate-400 dark:text-slate-500 flex items-center justify-center group"
          >
            <Icon name="close" size="sm" weight={300} className="text-lg group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {step === 'setup' ? (
            <div className="p-6 space-y-6">
              {/* Database Name Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <Typography variant="label" className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Database name:</Typography>
                </div>
                <div className="w-full h-10 px-4 flex items-center bg-slate-50/80 dark:bg-bk-main/40 border border-slate-200 dark:border-slate-800 rounded-lg select-none">
                  <Typography variant="p" className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{selectedDatabase}</Typography>
                </div>
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <Typography variant="label" className="text-[11px] font-bold text-slate-700 dark:text-slate-300 px-1">Description</Typography>
                <div className="w-full p-4 bg-bk-yellow/3 border border-bk-yellow/10 rounded-lg">
                  <Typography variant="p" className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium italic">
                    This utility is used to display the query plans currently stored in the server's plan cache. It helps analyze how queries are being executed and optimized by the database engine.
                  </Typography>
                </div>
              </div>

              {/* Checkbox */}
              <label className="flex items-center gap-3 p-4 bg-slate-50/50 dark:bg-bk-main/20 border border-slate-100 dark:border-white/5 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-all group active:scale-[0.99] mt-2">
                <input 
                  type="checkbox" 
                  checked={planDrop}
                  onChange={(e) => setPlanDrop(e.target.checked)}
                  className="w-4.5 h-4.5 cursor-pointer rounded-sm border-slate-300 dark:border-slate-700 bg-white dark:bg-bk-main text-bk-yellow focus:ring-bk-yellow/50 accent-bk-yellow"
                />
                <div className="flex flex-col">
                  <Typography variant="p" className="text-[12px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-bk-yellow transition-colors tracking-tight">Drop all plans in server's cache</Typography>
                </div>
              </label>
            </div>
          ) : (
            /* Results View */
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              {/* Header Info */}
              <div className="px-5 py-2 flex items-center justify-between bg-slate-50/80 dark:bg-bk-main/40 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Typography variant="label" className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Plan Cache For:</Typography>
                  <Typography variant="span" className="text-[12px] font-black text-bk-yellow underline decoration-bk-yellow/20 underline-offset-4">{selectedDatabase}</Typography>
                </div>
                <div className="flex items-center gap-2">
                   <div className="px-2 py-0.5 rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-300/30 dark:border-white/5">
                      <Typography variant="label" className="text-[9px] font-bold text-slate-500 uppercase">XASL Cache</Typography>
                   </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                {/* 1. Stats Grid */}
                {(() => {
                  const stats = {};
                  lines.forEach(l => {
                    if (l.includes(':') && !l.includes('sql info')) {
                      const [k, v] = l.split(':');
                      if (k && v) stats[k.trim()] = v.trim();
                    }
                  });
                  
                  if (Object.keys(stats).length === 0) return null;

                  const hitRatio = stats['Hits'] && stats['Lookups'] 
                    ? ((parseInt(stats['Hits']) / parseInt(stats['Lookups']) || 0) * 100).toFixed(1) 
                    : '0.0';

                  return (
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-white dark:bg-bk-main/20 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-transform hover:scale-[1.02]">
                        <Typography variant="label" className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1.5">
                          <Icon name="adjust" size="sm" weight={300} className="text-bk-yellow" />
                          Hit Ratio
                        </Typography>
                        <Typography variant="h2" className="text-xl font-black text-slate-900 dark:text-white">{hitRatio}%</Typography>
                      </div>
                      <div className="bg-white dark:bg-bk-main/20 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-transform hover:scale-[1.02]">
                        <Typography variant="label" className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1.5">
                          <Icon name="check_circle" size="sm" weight={300} className="text-emerald-500" />
                          Hits
                        </Typography>
                        <Typography variant="h2" className="text-xl font-black text-slate-900 dark:text-white">{stats['Hits'] || '0'}</Typography>
                      </div>
                      <div className="bg-white dark:bg-bk-main/20 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-transform hover:scale-[1.02]">
                        <Typography variant="label" className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1.5">
                          <Icon name="error" size="sm" weight={300} className="text-rose-500" />
                          Misses
                        </Typography>
                        <Typography variant="h2" className="text-xl font-black text-slate-900 dark:text-white">{stats['Miss'] || '0'}</Typography>
                      </div>
                       <div className="bg-white dark:bg-bk-main/20 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-transform hover:scale-[1.02]">
                        <Typography variant="label" className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1.5">
                          <Icon name="layers" size="sm" weight={300} className="text-sky-500" />
                          Entry Count
                        </Typography>
                        <Typography variant="h2" className="text-xl font-black text-slate-900 dark:text-white">{stats['Current entry count'] || '0'}</Typography>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. Structured Entries List */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Icon name="list_alt" size="sm" weight={300} className="text-bk-yellow" />
                    <Typography variant="label" className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Query Plan Entries</Typography>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
                  </div>

                  <div className="bg-white dark:bg-bk-main/10 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                       {lines.length > 0 ? (
                         <div className="flex flex-col">
                            {lines.map((line, idx) => {
                              const isHeader = line.includes('XASL_ID') || line.includes('SQL_ID');
                              const isPlanLine = line.startsWith(' ') && line.trim() && !isHeader;
                              
                              if (!line.trim()) return null;

                              return (
                                <div 
                                  key={idx} 
                                  className={`px-5 py-2.5 border-b border-slate-100 dark:border-slate-800/50 flex transition-colors ${isHeader ? 'bg-slate-50/50 dark:bg-white/5' : 'hover:bg-bk-yellow/2'}`}
                                >
                                  <Typography variant="span" className="shrink-0 w-8 text-[9px] font-mono text-slate-400 mt-1">{(idx + 1).toString().padStart(3, '0')}</Typography>
                                  <Typography variant="span" className={`text-[11px] font-mono ${isHeader ? 'text-bk-yellow font-bold' : isPlanLine ? 'text-sky-600 dark:text-sky-400 pl-4 border-l border-sky-500/20' : 'text-slate-600 dark:text-slate-300'}`}>
                                    {line}
                                  </Typography>
                                </div>
                              );
                            })}
                         </div>
                       ) : (
                         <div className="p-20 text-center opacity-30 italic">
                            <Icon name="subtitles_off" size="sm" weight={300} className="text-4xl mb-2" />
                            <Typography variant="p" className="text-[11px]">No active plans found in cache</Typography>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-bk-main/80 backdrop-blur-xs flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button 
            className="px-5 py-1.5 text-[11px] font-bold tracking-tight text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50 rounded-sm hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
            onClick={handleClose}
          >
            Close
          </button>
          
          {step === 'setup' ? (
            <button 
              className="px-10 py-2 bg-bk-yellow hover:bg-[#ffd700] active:scale-[0.98] text-bk-side text-[11px] font-black tracking-widest rounded-lg border border-bk-yellow/50 shadow-lg shadow-bk-yellow/10 transition-all uppercase"
              onClick={handleRunDump}
            >
              OK
            </button>
          ) : (
            <button 
              className="px-10 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 active:scale-[0.98] text-white text-[11px] font-black tracking-widest rounded-lg transition-all uppercase"
              onClick={() => setStep('setup')}
            >
              Back to settings
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
