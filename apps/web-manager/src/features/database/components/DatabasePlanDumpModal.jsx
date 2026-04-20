import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closePlanDumpModal, fetchDatabasePlanDump, resetPlanDumpState } from '../databaseSlice';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import ErrorOverlay from '../../../components/common/ErrorOverlay';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Toggle } from '../../../components/ds/forms/Toggle';
import { StatusBadge } from '../../../components/ds/foundation/StatusBadge';
import { Typography } from '../../../components/ds/foundation/Typography';
import { SectionHeader } from '../../../components/ds/foundation/SectionHeader';
import { EmptyState } from '../../../components/ds/feedback/EmptyState';

export default function DatabasePlanDumpModal() {
  const dispatch = useDispatch();
  const { isPlanDumpModalOpen } = useSelector((state) => state.databaseUI, shallowEqual);
  const { selectedDatabase } = useSelector((state) => state.database, shallowEqual);
  const { planDumpData, planDumpLoading, planDumpError } = useSelector((state) => state.databaseConfiguration, shallowEqual);
  const { selectedHostUid } = useSelector((state) => state.host, shallowEqual);

  const [step, setStep] = useState('setup');
  const [planDrop, setPlanDrop] = useState(false);

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
    dispatch(resetPlanDumpState());
    dispatch(closePlanDumpModal());
  };

  const results = planDumpData[selectedDatabase] || {};
  let lines = [];
  if (results.log && Array.isArray(results.log) && results.log.length > 0) {
    lines = results.log[0].line || [];
  } else if (results.lines) {
    lines = results.lines;
  } else if (Array.isArray(results)) {
    lines = results;
  }

  // Parse stats from lines
  const stats = {};
  lines.forEach(l => {
    if (l && l.includes(':') && !l.includes('sql info')) {
      const [k, ...vParts] = l.split(':');
      if (k && vParts.length) stats[k.trim()] = vParts.join(':').trim();
    }
  });
  const hitRatio = stats['Hits'] && stats['Lookups']
    ? ((parseInt(stats['Hits']) / (parseInt(stats['Lookups']) || 1)) * 100).toFixed(1)
    : null;

  const statCards = [
    { label: 'Hit Ratio', value: hitRatio ? `${hitRatio}%` : '—', color: 'text-amber-500' },
    { label: 'Hits', value: stats['Hits'] || '0', color: 'text-emerald-500' },
    { label: 'Misses', value: stats['Miss'] || '0', color: 'text-rose-500' },
    { label: 'Entries', value: stats['Current entry count'] || '0', color: 'text-sky-500' },
  ];

  const visibleLines = lines.filter(l => l && l.trim());

  return (
    <Modal
      isOpen={isPlanDumpModalOpen}
      onClose={handleClose}
      title="Plan Cache Dump"
      subtitle={`Query plan cache for ${selectedDatabase}`}
      icon="schema"
      maxWidth={step === 'results' ? 'max-w-[780px]' : 'max-w-[460px]'}
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={handleClose}>
            {step === 'setup' ? 'Cancel' : 'Close'}
          </Button>
          {step === 'setup' ? (
            <Button variant="primary" onClick={handleRunDump} loading={planDumpLoading} icon="play_circle">
              Run Dump
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={() => setStep('setup')}
              icon="arrow_back"
            >
              Back
            </Button>
          )}
        </div>
      }
    >
      <div className={`relative ${planDumpLoading || planDumpError ? 'min-h-[340px]' : ''}`}>
        <LoadingOverlay
          isVisible={planDumpLoading}
          title="Dumping Plan Cache"
          subtitle="Reading XASL plan cache from server..."
        />
        <ErrorOverlay
          isVisible={!!planDumpError}
          error={planDumpError}
          onRetry={handleRunDump}
          onClose={() => dispatch(resetPlanDumpState())}
        />

        {step === 'setup' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

            <div>
              <SectionHeader title="Target Database" icon="database" />
              <div className="px-1.5 flex items-center justify-between p-3 bg-slate-50 dark:bg-white/3 border border-slate-200 dark:border-white/8 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <Icon name="database" size="sm" weight={300} className="text-amber-500" />
                  <Typography variant="p" className="font-bold text-[13px] text-slate-900 dark:text-white font-mono">
                    {selectedDatabase}
                  </Typography>
                </div>
                <StatusBadge label="XASL Cache" variant="amber" />
              </div>
            </div>

            {/* Options */}
            <div>
              <SectionHeader title="Options" icon="tune" />
              <div className="px-1.5">
                <div
                  className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer select-none transition-all
                    ${planDrop
                      ? 'bg-rose-500/5 border-rose-500/20'
                      : 'bg-white dark:bg-white/2 border-slate-200 dark:border-white/8 hover:border-slate-300 dark:hover:border-white/15'
                    }`}
                  onClick={() => setPlanDrop(!planDrop)}
                >
                  <div className="flex-1 min-w-0">
                    <Typography variant="p" className={`font-semibold text-[12px] ${planDrop ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                      Drop plans after dump
                    </Typography>
                    <Typography variant="caption" className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5">
                      Flush all entries from XASL plan cache after export
                    </Typography>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Toggle checked={planDrop} onChange={setPlanDrop} />
                  </div>
                </div>

                {planDrop && (
                  <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/15 rounded-lg animate-in fade-in duration-200">
                    <Icon name="warning" size="xs" weight={300} className="text-rose-500 shrink-0 mt-0.5" />
                    <Typography variant="caption" className="text-rose-600 dark:text-rose-400 text-[10px] leading-relaxed">
                      This will <span className="font-bold">clear all cached query plans</span> from server memory. Subsequent queries may be temporarily slower.
                    </Typography>
                  </div>
                )}
              </div>
            </div>
          </div>

        ) : (
          /* Results View */
          <div className="flex flex-col -m-6 h-[560px]">
            {/* Stats Bar */}
            {Object.keys(stats).length > 0 && (
              <div className="grid grid-cols-4 border-b border-slate-100 dark:border-white/5 shrink-0">
                {statCards.map((card, i) => (
                  <div
                    key={i}
                    className={`px-4 py-3 ${i < statCards.length - 1 ? 'border-r border-slate-100 dark:border-white/5' : ''}`}
                  >
                    <Typography variant="label" className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                      {card.label}
                    </Typography>
                    <Typography variant="h2" className={`text-[18px] font-black font-mono leading-tight mt-0.5 ${card.color}`}>
                      {card.value}
                    </Typography>
                  </div>
                ))}
              </div>
            )}

            {/* Header row */}
            <div className="px-4 py-2 flex items-center justify-between bg-slate-50/80 dark:bg-white/2 border-b border-slate-100 dark:border-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <Icon name="list_alt" size="sm" weight={300} className="text-slate-400" />
                <Typography variant="label" className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Query Plan Entries
                </Typography>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${visibleLines.length > 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/10'}`}>
                {visibleLines.length > 0 ? `${visibleLines.length} lines` : 'Empty'}
              </span>
            </div>

            {/* Output */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {visibleLines.length > 0 ? (
                visibleLines.map((line, idx) => {
                  const isHeader = line.includes('XASL_ID') || line.includes('SQL_ID');
                  const isPlanLine = line.startsWith('  ') && !isHeader;
                  const isStatLine = line.includes(':') && !isHeader && !isPlanLine;

                  return (
                    <div
                      key={idx}
                      className={`px-4 py-1.5 flex gap-3 border-b border-slate-50 dark:border-white/3 last:border-0
                        ${isHeader ? 'bg-amber-500/3 dark:bg-amber-500/5' : 'hover:bg-slate-50/80 dark:hover:bg-white/2'}`}
                    >
                      <span className="shrink-0 w-7 text-[9px] font-mono text-slate-300 dark:text-slate-700 mt-0.5 tabular-nums">
                        {(idx + 1).toString().padStart(3, '0')}
                      </span>
                      <span className={`text-[11px] font-mono leading-snug break-all
                        ${isHeader ? 'text-amber-600 dark:text-amber-400 font-bold' :
                          isPlanLine ? 'text-sky-600 dark:text-sky-400 pl-2 border-l border-sky-500/20' :
                          isStatLine ? 'text-slate-600 dark:text-slate-300' :
                          'text-slate-500 dark:text-slate-500'}`}
                      >
                        {line}
                      </span>
                    </div>
                  );
                })
              ) : (
                <EmptyState
                  icon="topic"
                  title="No Plan Data"
                  subtitle="Run the dump to view query plan cache entries."
                  py="py-12"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
