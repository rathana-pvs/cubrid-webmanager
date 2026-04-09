import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closePlanDumpModal, fetchDatabasePlanDump } from '../databaseSlice';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import ErrorOverlay from '../../../components/common/ErrorOverlay';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Toggle } from '../../../components/ds/forms/Toggle';
import { StatusBadge } from '../../../components/ds/foundation/StatusBadge';
import { Typography } from '../../../components/ds/foundation/Typography';
import { SectionHeader } from '../../../components/ds/foundation/SectionHeader';
import { InfoBanner } from '../../../components/ds/foundation/InfoBanner';
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

  const handleClose = () => dispatch(closePlanDumpModal());

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
    : '0.0';

  const statCards = [
    { label: 'Hit Ratio', value: `${hitRatio}%`, icon: 'adjust', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { label: 'Hits', value: stats['Hits'] || '0', icon: 'check_circle', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Misses', value: stats['Miss'] || '0', icon: 'remove_circle', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    { label: 'Entries', value: stats['Current entry count'] || '0', icon: 'layers', color: 'text-sky-500', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
  ];

  const planSteps = [
    { icon: 'query_stats', label: 'Cache Inspection', desc: 'Read current XASL plan cache state' },
    { icon: 'schema', label: 'Plan Extraction', desc: 'Parse SQL IDs and plan entries' },
    { icon: 'analytics', label: 'Statistics Aggregation', desc: 'Compute hit/miss ratios' },
  ];

  return (
    <Modal
      isOpen={isPlanDumpModalOpen}
      onClose={handleClose}
      title="Plan Cache Dump"
      subtitle="Inspect query plans stored in server cache"
      icon="schema"
      maxWidth={step === 'results' ? 'max-w-[850px]' : 'max-w-[480px]'}
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={handleClose}>
            {step === 'setup' ? 'Discard' : 'Close'}
          </Button>
          {step === 'setup' ? (
            <Button variant="primary" onClick={handleRunDump} loading={planDumpLoading} icon="play_circle">
              Execute Dump
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => setStep('setup')}
              icon="settings"
              className="bg-slate-800 hover:bg-slate-900 text-white border-transparent"
            >
              Adjust Settings
            </Button>
          )}
        </div>
      }
    >
      <div className="relative">
        <LoadingOverlay
          isVisible={planDumpLoading}
          title="Processing Plan Dump"
          subtitle="Dumping query plan cache from server..."
        />
        <ErrorOverlay
          isVisible={!!planDumpError}
          error={planDumpError}
          onRetry={handleRunDump}
          onClose={handleClose}
        />

        {step === 'setup' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

            {/* Target Banner */}
            <div>
              <SectionHeader title="Inspection Target" icon="database" />
              <div className="flex items-center gap-4 p-4 bg-slate-50/50 dark:bg-white/3 border border-slate-200 dark:border-white/5 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Icon name="database" size="sm" weight={300} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium uppercase tracking-widest text-[9px]">Active Database</Typography>
                  <Typography variant="h4" className="text-slate-900 dark:text-white font-black text-[15px] font-mono tracking-tight leading-none mt-0.5">
                    {selectedDatabase}
                  </Typography>
                </div>
                <StatusBadge label="XASL Cache" variant="amber" />
              </div>
            </div>

            {/* Pipeline Steps */}
            <div>
              <SectionHeader title="Execution Pipeline" icon="account_tree" />
              <div className="bg-slate-50/50 dark:bg-background-dark/30 border border-slate-100 dark:border-white/5 rounded-2xl p-4">
                {planSteps.map((s, i) => (
                  <div key={i} className="flex items-start gap-4 group">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-xs group-hover:shadow-[0_0_12px_rgba(251,191,36,0.2)] transition-shadow">
                        <Icon name={s.icon} size="xs" weight={300} />
                      </div>
                      {i < planSteps.length - 1 && (
                        <div className="w-px h-6 bg-gradient-to-b from-amber-500/30 to-transparent my-1" />
                      )}
                    </div>
                    <div className={`flex-1 ${i < planSteps.length - 1 ? 'pb-4' : 'pb-0'}`}>
                      <div className="flex items-center gap-2.5">
                        <Typography variant="caption" className="font-black text-amber-500/40 tabular-nums">0{i + 1}</Typography>
                        <Typography variant="p" className="font-bold text-slate-900 dark:text-white text-[11.5px] tracking-tight">{s.label}</Typography>
                      </div>
                      <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium mt-0.5">{s.desc}</Typography>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Drop Plans Toggle */}
            <div>
              <SectionHeader title="Execution Options" icon="tune" />
              <div
                className={`flex items-center gap-4 p-4 border rounded-2xl transition-all cursor-pointer select-none
                  ${planDrop
                    ? 'bg-rose-500/4 border-rose-500/20 shadow-[0_2px_16px_rgba(239,68,68,0.06)]'
                    : 'bg-white dark:bg-white/2 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10'
                  }`}
                onClick={() => setPlanDrop(!planDrop)}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all shrink-0
                  ${planDrop
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                    : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400'
                  }`}>
                  <Icon name="delete_sweep" size="xs" weight={300} />
                </div>
                <div className="flex-1 min-w-0">
                  <Typography variant="p" className={`font-bold text-[11.5px] tracking-tight transition-colors ${planDrop ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                    Drop All Plans After Dump
                  </Typography>
                  <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium mt-0.5 leading-snug">
                    Flush all entries from the server's XASL plan cache after export
                  </Typography>
                </div>
                <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Toggle
                    checked={planDrop}
                    onChange={setPlanDrop}
                  />
                </div>
              </div>

              {planDrop && (
                <div className="flex items-start gap-2.5 px-3 py-2.5 bg-rose-50/50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <Icon name="warning" size="xs" weight={300} className="text-rose-500 shrink-0 mt-0.5" />
                  <Typography variant="caption" className="text-rose-600 dark:text-rose-400 font-medium leading-relaxed text-[10px]">
                    Enabling this will <span className="font-black">clear all cached query plans</span> from the server's memory after the dump is complete. This may temporarily decrease performance for subsequent queries.
                  </Typography>
                </div>
              )}

              {/* Info note */}
              {!planDrop && (
                <InfoBanner title="Optimization Profile">
                  Displays query plans currently stored in the server's plan cache to analyze how queries are being executed and optimized.
                </InfoBanner>
              )}
            </div>
          </div>
        ) : (
          /* Results View */
          <div className="flex flex-col -m-6 h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Results Header */}
            <div className="px-6 py-3.5 flex items-center justify-between bg-slate-50/80 dark:bg-black/20 border-b border-slate-100 dark:border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                  <Icon name="schema" size="sm" weight={300} />
                </div>
                <div>
                  <Typography variant="label" className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Plan Cache For</Typography>
                  <Typography variant="p" className="text-[13px] font-black text-amber-500 font-mono leading-none">{selectedDatabase}</Typography>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge label="XASL Cache" variant="amber" />
                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${lines.length > 0 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'}`}>
                  {lines.length > 0 ? `${lines.filter(l => l && l.trim()).length} lines` : 'Empty'}
                </span>
              </div>
            </div>

            {/* Stats Bar */}
            {Object.keys(stats).length > 0 && (
              <div className="grid grid-cols-4 gap-0 border-b border-slate-100 dark:border-white/5 shrink-0">
                {statCards.map((card, i) => (
                  <div key={i} className={`p-4 flex flex-col gap-1 ${i < statCards.length - 1 ? 'border-r border-slate-100 dark:border-white/5' : ''} bg-white dark:bg-background-dark/10 hover:bg-slate-50 dark:hover:bg-white/3 transition-colors`}>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center ${card.bg} border ${card.border}`}>
                        <Icon name={card.icon} size="10px" weight={300} className={card.color} />
                      </div>
                      <Typography variant="label" className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{card.label}</Typography>
                    </div>
                    <Typography variant="h2" className={`text-[20px] font-black font-mono leading-none ${card.color}`}>{card.value}</Typography>
                  </div>
                ))}
              </div>
            )}

          {/* Plan Entries */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="px-4 py-2.5 flex items-center gap-2 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-background-dark/20 shrink-0">
                <Icon name="list_alt" size="sm" weight={300} className="text-amber-500" />
                <Typography variant="label" className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Query Plan Entries</Typography>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {lines.length > 0 ? (
                  lines.map((line, idx) => {
                    if (!line || !line.trim()) return null;
                    const isHeader = line.includes('XASL_ID') || line.includes('SQL_ID');
                    const isPlanLine = line.startsWith('  ') && !isHeader;
                    const isStatLine = line.includes(':') && !isHeader && !isPlanLine;

                    return (
                      <div
                        key={idx}
                        className={`px-5 py-2 flex gap-3 border-b border-slate-50 dark:border-white/3 last:border-0 transition-colors group
                          ${isHeader ? 'bg-amber-500/3 dark:bg-amber-500/5 hover:bg-amber-500/6' : 'hover:bg-slate-50/80 dark:hover:bg-white/2'}`}
                      >
                        <span className="shrink-0 w-8 text-[9px] font-mono text-slate-300 dark:text-slate-700 mt-0.5 tabular-nums">
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
                    title="Awaiting Plan Output"
                    subtitle="The generated query plan statistics will be rendered here for analysis."
                    py="py-8"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
