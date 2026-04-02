import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeCompactDatabaseModal } from '../databaseSlice';
import { databaseApi } from '../databaseApi';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Toggle } from '../../../components/ds/forms/Toggle';
import { Typography } from '../../../components/ds/foundation/Typography';
import { useActionState } from '../../../infrastructure/hooks/useActionState';
import { 
  ModalStatusLoading, 
  ModalStatusSuccess, 
  ModalStatusError 
} from '../../../components/ds/feedback/ActionStatus';

// view states
const VIEW_FORM    = 'form';
const VIEW_LOADING = 'loading';
const VIEW_SUCCESS = 'success';
const VIEW_ERROR   = 'error';

export default function CompactDatabaseModal() {
  const dispatch = useDispatch();
  const { isCompactDatabaseModalOpen } = useSelector((state) => state.databaseUI, shallowEqual);
  const { selectedDatabase } = useSelector((state) => state.database, shallowEqual);
  const { selectedHostUid } = useSelector((state) => state.host, shallowEqual);
  const { 
    state, 
    error, 
    startAction, 
    endSuccess, 
    endError, 
    resetAction,
    isLoading,
    isSuccess,
    isError
  } = useActionState();

  const [verbose, setVerbose] = useState(false);

  useEffect(() => {
    if (isCompactDatabaseModalOpen) {
      setVerbose(false);
      resetAction();
    }
  }, [isCompactDatabaseModalOpen, resetAction]);

  if (!isCompactDatabaseModalOpen) return null;

  const handleCompact = async () => {
    if (!selectedHostUid || !selectedDatabase) return;
    
    startAction();
    try {
      const payload = {
        verbose: verbose ? 'y' : 'n'
      };
      const response = await databaseApi.compactDatabase(selectedHostUid, selectedDatabase, payload);
      endSuccess(response.note || 'Database compaction completed successfully.');
    } catch (err) {
      endError(err.response?.data?.note || err.response?.data?.message || 'Database compaction failed. Ensure no other maintenance tasks are running.');
    }
  };

  const handleClose = () => dispatch(closeCompactDatabaseModal());

  const pipelineSteps = [
    { label: 'OID Truncation', desc: 'Remove unused object references', icon: 'auto_fix_normal' },
    { label: 'Metadata Pruning', desc: 'Clean stale internal metadata', icon: 'dataset' },
    { label: 'Block Consolidation', desc: 'Merge fragmented disk pages', icon: 'grid_view' },
  ];

  /* ─── LOADING view ─── */
  if (isLoading) {
    return (
      <Modal isOpen title="Dynamic Storage Compaction" icon="compress" onClose={handleClose} maxWidth="480px">
        <ModalStatusLoading 
          title="Consolidating Blocks" 
          subtitle={`The system is merging fragmented disk pages and pruning stale metadata for ${selectedDatabase}.`} 
        />
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  if (isSuccess) {
    return (
      <Modal isOpen title="Dynamic Storage Compaction" icon="compress" iconVariant="success" onClose={handleClose} maxWidth="480px">
        <ModalStatusSuccess 
          title="Optimization Complete"
          message={`Dynamic storage optimization for ${selectedDatabase} finished successfully.`}
          onConfirm={handleClose}
          confirmText="Acknowledge"
        />
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (isError) {
    return (
      <Modal isOpen title="Dynamic Storage Compaction" icon="compress" iconVariant="danger" onClose={resetAction} maxWidth="480px">
        <ModalStatusError 
          title="Compaction Failed"
          error={error}
          onRetry={handleCompact}
          onCancel={resetAction}
          retryText="Retry Optimization"
          cancelText="Dismiss"
        />
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
            className="min-w-[140px]"
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
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
            <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-[0.2em]">Maintenance Target</Typography>
          </div>
          <div className="flex items-center gap-4 p-4 bg-slate-50/50 dark:bg-white/3 border border-slate-200 dark:border-white/5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Icon name="database" size="sm" weight={300} className="text-amber-500" />
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
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
            <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-[0.2em]">Optimization Pipeline</Typography>
          </div>

          <div className="bg-slate-50/50 dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-2xl p-4 space-y-0">
            {pipelineSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-4 group">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-xs group-hover:shadow-[0_0_12px_rgba(245,158,11,0.15)] transition-shadow">
                    <Icon name={step.icon} size="xs" weight={300} />
                  </div>
                  {i < pipelineSteps.length - 1 && (
                    <div className="w-px h-6 bg-linear-to-b from-amber-500/30 to-transparent my-1"></div>
                  )}
                </div>
                <div className={`flex-1 ${i < pipelineSteps.length - 1 ? 'pb-4' : 'pb-0'}`}>
                  <div className="flex items-center gap-2.5">
                    <Typography variant="caption" className="font-black text-amber-500/40 tabular-nums">0{i + 1}</Typography>
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
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
            <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-[0.2em]">Execution Options</Typography>
          </div>

          <div 
            className={`flex items-center gap-4 p-4 border rounded-2xl transition-all cursor-pointer select-none ${verbose ? 'bg-amber-500/4 border-amber-500/20 shadow-[0_2px_16px_rgba(245,158,11,0.06)]' : 'bg-white dark:bg-white/2 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10'}`}
            onClick={() => setVerbose(!verbose)}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all shrink-0 ${verbose ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400'}`}>
              <Icon name="terminal" size="xs" weight={300} />
            </div>
            <div className="flex-1 min-w-0">
              <Typography variant="p" className={`font-bold text-[11.5px] tracking-tight transition-colors ${verbose ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
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
