import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeCompactDatabaseModal } from '../databaseSlice';
import { databaseApi } from '../databaseApi';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Toggle } from '../../../components/ds/forms/Toggle';
import { Typography } from '../../../components/ds/foundation/Typography';

// view states
const VIEW_FORM    = 'form';
const VIEW_LOADING = 'loading';
const VIEW_SUCCESS = 'success';
const VIEW_ERROR   = 'error';

export default function CompactDatabaseModal() {
  const dispatch = useDispatch();
  const { isCompactDatabaseModalOpen } = useSelector((state) => state.databaseUI);
  const { selectedDatabase } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);
  const [verbose, setVerbose] = useState(false);
  const [view, setView] = useState(VIEW_FORM);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isCompactDatabaseModalOpen) {
      setVerbose(false);
      setView(VIEW_FORM);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isCompactDatabaseModalOpen]);

  if (!isCompactDatabaseModalOpen) return null;

  const handleCompact = async () => {
    if (!selectedHostUid || !selectedDatabase) return;
    
    setView(VIEW_LOADING);
    try {
      const payload = {
        verbose: verbose ? 'y' : 'n'
      };
      const response = await databaseApi.compactDatabase(selectedHostUid, selectedDatabase, payload);
      setSuccessMsg(response.note || 'Database compaction completed successfully.');
      setView(VIEW_SUCCESS);
    } catch (err) {
      setErrorMsg(err.response?.data?.note || err.response?.data?.message || 'Database compaction failed. Ensure no other maintenance tasks are running.');
      setView(VIEW_ERROR);
    }
  };

  const handleClose = () => dispatch(closeCompactDatabaseModal());

  const pipelineSteps = [
    { label: 'OID Truncation', desc: 'Remove unused object references', icon: 'auto_fix_normal' },
    { label: 'Metadata Pruning', desc: 'Clean stale internal metadata', icon: 'dataset' },
    { label: 'Block Consolidation', desc: 'Merge fragmented disk pages', icon: 'grid_view' },
  ];

  /* ─── LOADING view ─── */
  if (view === VIEW_LOADING) {
    return (
      <Modal isOpen title="Dynamic Storage Compaction" icon="compress" onClose={handleClose} maxWidth="480px">
        <div className="flex flex-col items-center justify-center py-12 gap-7 text-center animate-in fade-in duration-200">
          <div className="relative w-[72px] h-[72px]">
            <div className="absolute inset-0 rounded-full border-2 border-slate-100 dark:border-white/5" />
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-bk-yellow animate-spin"
              style={{ animationDuration: '0.9s' }}
            />
            <div
              className="absolute inset-[10px] rounded-full border-[1.5px] border-transparent border-b-bk-yellow/35 animate-spin"
              style={{ animationDuration: '1.7s', animationDirection: 'reverse' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-bk-yellow shadow-[0_0_10px_3px_rgba(255,193,7,0.3)] animate-pulse" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
              Compacting Storage
            </Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium max-w-[240px] mx-auto leading-relaxed">
              Consolidating data blocks and pruning stale metadata…
            </Typography>
          </div>

          <div className="w-44 h-[2px] bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-bk-yellow rounded-full"
              style={{ animation: 'modalSlide 1.5s ease-in-out infinite' }}
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-white/4 border border-slate-100 dark:border-white/5">
            <div className="w-1.5 h-1.5 rounded-full bg-bk-yellow animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">In Progress</span>
          </div>

          <style>{`
            @keyframes modalSlide {
              0%   { transform: translateX(-100%); width: 50%; }
              50%  { transform: translateX(100%);  width: 60%; }
              100% { transform: translateX(200%);  width: 50%; }
            }
          `}</style>
        </div>
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  if (view === VIEW_SUCCESS) {
    return (
      <Modal isOpen title="Dynamic Storage Compaction" icon="compress" iconVariant="success" onClose={handleClose} maxWidth="480px">
        <div className="flex flex-col items-center justify-center py-12 gap-7 text-center animate-in fade-in duration-200">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.3)]">
              <Icon name="compress" size="lg" weight={700} className="text-white" />
            </div>
          </div>

          <div className="space-y-2 px-6">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
              Compaction Complete
            </Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[300px] mx-auto">
              Dynamic storage optimization for <span className="font-black text-slate-900 dark:text-white">{selectedDatabase}</span> finished successfully.
            </Typography>
          </div>

          {successMsg && (
            <div className="w-full max-w-[340px] bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-4 py-3 text-left">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon name="fact_check" size="xs" weight={300} className="text-emerald-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Execution Note</span>
              </div>
              <Typography variant="caption" className="text-emerald-600 dark:text-emerald-400/80 font-medium leading-relaxed">
                {successMsg}
              </Typography>
            </div>
          )}

          <Button variant="secondary" onClick={handleClose}>Close</Button>
        </div>
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (view === VIEW_ERROR) {
    return (
      <Modal isOpen title="Dynamic Storage Compaction" icon="compress" iconVariant="danger" onClose={handleClose} maxWidth="480px">
        <div className="flex flex-col items-center justify-center py-10 gap-6 text-center animate-in fade-in duration-200">
          <div className="relative">
            <div className="absolute inset-0 bg-rose-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <Icon name="error" size="md" weight={300} className="text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
              Compaction Failed
            </Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[280px] mx-auto">
              We encountered a technical issue while optimizing the storage volumes.
            </Typography>
          </div>

          <div className="w-full max-w-[320px] bg-rose-500/5 border border-rose-500/15 rounded-xl px-4 py-3 text-left">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon name="terminal" size="xs" weight={300} className="text-rose-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-400">Error Detail</span>
            </div>
            <Typography variant="caption" className="text-rose-400/80 font-mono leading-relaxed break-words">
              {errorMsg}
            </Typography>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleClose}>Close</Button>
            <Button variant="danger" icon="refresh" onClick={() => { setView(VIEW_FORM); setErrorMsg(''); }}>
              Try Again
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── FORM view ─── */
  return (
    <Modal
      isOpen={isCompactDatabaseModalOpen}
      onClose={handleClose}
      title="Dynamic Storage Compaction"
      icon="compress"
      maxWidth="480px"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={handleClose}>
            Discard
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCompact} 
            icon="play_circle"
          >
            Execute Compaction
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Target */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-bk-yellow"></div>
            <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-[0.2em]">Maintenance Target</Typography>
          </div>
          <div className="flex items-center gap-4 p-4 bg-slate-50/50 dark:bg-white/3 border border-slate-200 dark:border-white/5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-bk-yellow/10 border border-bk-yellow/20 flex items-center justify-center shrink-0">
              <Icon name="database" size="sm" weight={300} className="text-bk-yellow" />
            </div>
            <div className="flex-1 min-w-0">
              <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium uppercase tracking-widest">Database</Typography>
              <Typography variant="h4" className="text-slate-900 dark:text-white font-bold text-[14px] tracking-tight leading-none mt-0.5">{selectedDatabase}</Typography>
            </div>
          </div>
        </div>

        {/* Pipeline Steps */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-bk-yellow"></div>
            <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-[0.2em]">Optimization Pipeline</Typography>
          </div>

          <div className="bg-slate-50/50 dark:bg-bk-main/30 border border-slate-100 dark:border-white/5 rounded-2xl p-4 space-y-0">
            {pipelineSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-4 group">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-8 h-8 rounded-xl bg-bk-yellow/10 border border-bk-yellow/20 flex items-center justify-center text-bk-yellow shadow-xs group-hover:shadow-[0_0_12px_rgba(255,215,0,0.15)] transition-shadow">
                    <Icon name={step.icon} size="xs" weight={300} />
                  </div>
                  {i < pipelineSteps.length - 1 && (
                    <div className="w-px h-6 bg-linear-to-b from-bk-yellow/30 to-transparent my-1"></div>
                  )}
                </div>
                <div className={`flex-1 ${i < pipelineSteps.length - 1 ? 'pb-4' : 'pb-0'}`}>
                  <div className="flex items-center gap-2.5">
                    <Typography variant="caption" className="font-black text-bk-yellow/40 tabular-nums">0{i + 1}</Typography>
                    <Typography variant="p" className="font-bold text-slate-900 dark:text-white text-[11.5px] tracking-tight">{step.label}</Typography>
                  </div>
                  <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium mt-0.5">{step.desc}</Typography>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verbose Toggle */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-bk-yellow"></div>
            <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-[0.2em]">Execution Options</Typography>
          </div>

          <div 
            className={`flex items-center gap-4 p-4 border rounded-2xl transition-all cursor-pointer select-none ${verbose ? 'bg-bk-yellow/4 border-bk-yellow/20 shadow-[0_2px_16px_rgba(255,188,4,0.06)]' : 'bg-white dark:bg-white/2 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10'}`}
            onClick={() => setVerbose(!verbose)}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all shrink-0 ${verbose ? 'bg-bk-yellow/10 border-bk-yellow/20 text-bk-yellow' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400'}`}>
              <Icon name="terminal" size="xs" weight={300} />
            </div>
            <div className="flex-1 min-w-0">
              <Typography variant="p" className={`font-bold text-[11.5px] tracking-tight transition-colors ${verbose ? 'text-bk-yellow' : 'text-slate-900 dark:text-white'}`}>
                Verbose Monitoring
              </Typography>
              <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium mt-0.5 leading-snug">
                Stream real-time OID transformation logs for post-mortem auditing
              </Typography>
            </div>
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              <Toggle 
                checked={verbose}
                onChange={setVerbose}
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
