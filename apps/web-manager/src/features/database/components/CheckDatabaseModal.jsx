import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeCheckDatabaseModal } from '../databaseSlice';
import { databaseApi } from '../databaseApi';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
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

export default function CheckDatabaseModal() {
  const dispatch = useDispatch();
  const { isCheckDatabaseModalOpen } = useSelector((state) => state.databaseUI, shallowEqual);
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

  const [repair, setRepair] = useState(false);

  useEffect(() => {
    if (isCheckDatabaseModalOpen) {
      setRepair(false);
      resetAction();
    }
  }, [isCheckDatabaseModalOpen, resetAction]);

  if (!isCheckDatabaseModalOpen) return null;

  const handleCheck = async () => {
    if (!selectedHostUid || !selectedDatabase) return;

    startAction();
    try {
      const payload = {
        repairdb: repair ? 'y' : 'n'
      };
      const response = await databaseApi.checkDatabase(selectedHostUid, selectedDatabase, payload);
      endSuccess(response.note || 'Database integrity verification completed successfully.');
    } catch (err) {
      endError(
        err.response?.data?.note || 
        err.response?.data?.message || 
        'The database check operation encountered a conflict or failed to reach the server.'
      );
    }
  };

  const handleClose = () => dispatch(closeCheckDatabaseModal());

  const scanSteps = [
    { icon: 'search', label: 'Block Integrity Scan', desc: 'Verify physical page checksums' },
    { icon: 'account_tree', label: 'Index Consistency', desc: 'Validate B-tree structures' },
    { icon: 'fact_check', label: 'Catalog Verification', desc: 'Cross-check system metadata' },
  ];

  /* ─── LOADING view ─── */
  if (isLoading) {
    return (
      <Modal isOpen title="Database Integrity Verification" icon="verified" onClose={handleClose} maxWidth="480px">
        <ModalStatusLoading 
          title="Running Diagnostics" 
          subtitle={`The system is scanning block structures and verifying page checksums for ${selectedDatabase}.`} 
        />
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  if (isSuccess) {
    return (
      <Modal isOpen title="Database Integrity Verification" icon="verified" iconVariant="success" onClose={handleClose} maxWidth="480px">
        <ModalStatusSuccess 
          title="Verification Complete"
          message={`Diagnostic scan for ${selectedDatabase} finished without critical errors.`}
          onConfirm={handleClose}
          confirmText="Dismiss Report"
        />
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (isError) {
    return (
      <Modal isOpen title="Database Integrity Verification" icon="verified" iconVariant="danger" onClose={resetAction} maxWidth="480px">
        <ModalStatusError 
          title="Diagnostic Failed"
          error={error}
          onRetry={handleCheck}
          onCancel={resetAction}
          retryText="Retry Diagnostics"
          cancelText="Close"
        />
      </Modal>
    );
  }

  /* ─── FORM view ─── */
  return (
    <Modal
      isOpen={isCheckDatabaseModalOpen}
      onClose={handleClose}
      title="Database Integrity Verification"
      icon="verified"
      maxWidth="480px"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={handleClose}>
            Discard
          </Button>
          <Button
            variant="primary"
            onClick={handleCheck}
            icon="play_circle"
          >
            Run Diagnostics
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Target */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
            <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-[0.2em]">Verification Target</Typography>
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

        {/* Diagnostic Scan Pipeline */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
            <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-[0.2em]">Diagnostic Pipeline</Typography>
          </div>

          <div className="bg-slate-50/50 dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-2xl p-4 space-y-0">
            {scanSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-4 group">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-xs group-hover:shadow-[0_0_12px_rgba(16,185,129,0.15)] transition-shadow">
                    <Icon name={step.icon} size="xs" weight={300} />
                  </div>
                  {i < scanSteps.length - 1 && (
                    <div className="w-px h-6 bg-linear-to-b from-emerald-500/30 to-transparent my-1"></div>
                  )}
                </div>
                <div className={`flex-1 ${i < scanSteps.length - 1 ? 'pb-4' : 'pb-0'}`}>
                  <div className="flex items-center gap-2.5">
                    <Typography variant="caption" className="font-black text-emerald-500/40 tabular-nums">0{i + 1}</Typography>
                    <Typography variant="p" className="font-bold text-slate-900 dark:text-white text-[11.5px] tracking-tight">{step.label}</Typography>
                  </div>
                  <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium mt-0.5">{step.desc}</Typography>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Repair Toggle */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
            <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-[0.2em]">Recovery Options</Typography>
          </div>

          <div
            className={`flex items-center gap-4 p-4 border rounded-2xl transition-all cursor-pointer select-none ${repair ? 'bg-amber-500/4 border-amber-500/20 shadow-[0_2px_16px_rgba(245,158,11,0.06)]' : 'bg-white dark:bg-white/2 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10'}`}
            onClick={() => setRepair(!repair)}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all shrink-0 ${repair ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400'}`}>
              <Icon name="build" size="xs" weight={300} />
            </div>
            <div className="flex-1 min-w-0">
              <Typography variant="p" className={`font-bold text-[11.5px] tracking-tight transition-colors ${repair ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                Autonomous Repair
              </Typography>
              <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium mt-0.5 leading-snug">
                Auto-resolve physical inconsistencies discovered during the scan
              </Typography>
            </div>
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              <Toggle
                checked={repair}
                onChange={setRepair}
              />
            </div>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2.5 px-3 py-2 bg-slate-50/80 dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-xl">
            <Icon name="info" size="xs" weight={300} className="text-slate-400 shrink-0 mt-0.5" />
            <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium leading-relaxed italic">
              The integrity scanner checks for block inconsistencies, index corruptions, and catalog mismatches. Enable repair to attempt immediate restoration if anomalies are detected.
            </Typography>
          </div>
        </div>
      </div>
    </Modal>
  );
}
