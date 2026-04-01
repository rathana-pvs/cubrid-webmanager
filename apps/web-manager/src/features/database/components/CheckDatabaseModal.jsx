import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeCheckDatabaseModal } from '../databaseSlice';
import { databaseApi } from '../databaseApi';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Toggle } from '../../../components/ds/forms/Toggle';
import { Typography } from '../../../components/ds/foundation/Typography';

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
  
  const [repair, setRepair] = useState(false);
  const [view, setView] = useState(VIEW_FORM);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isCheckDatabaseModalOpen) {
      setRepair(false);
      setView(VIEW_FORM);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isCheckDatabaseModalOpen]);

  if (!isCheckDatabaseModalOpen) return null;

  const handleCheck = async () => {
    if (!selectedHostUid || !selectedDatabase) return;

    setView(VIEW_LOADING);
    try {
      const payload = {
        repairdb: repair ? 'y' : 'n'
      };
      const response = await databaseApi.checkDatabase(selectedHostUid, selectedDatabase, payload);
      setSuccessMsg(response.note || 'Database integrity verification completed successfully.');
      setView(VIEW_SUCCESS);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.note || 
        err.response?.data?.message || 
        'The database check operation encountered a conflict or failed to reach the server.'
      );
      setView(VIEW_ERROR);
    }
  };

  const handleClose = () => dispatch(closeCheckDatabaseModal());

  const scanSteps = [
    { icon: 'search', label: 'Block Integrity Scan', desc: 'Verify physical page checksums' },
    { icon: 'account_tree', label: 'Index Consistency', desc: 'Validate B-tree structures' },
    { icon: 'fact_check', label: 'Catalog Verification', desc: 'Cross-check system metadata' },
  ];

  /* ─── LOADING view ─── */
  if (view === VIEW_LOADING) {
    return (
      <Modal isOpen title="Database Integrity Verification" icon="verified" onClose={handleClose} maxWidth="480px">
        <div className="flex flex-col items-center justify-center py-12 gap-7 text-center animate-in fade-in duration-200">
          <div className="relative w-[72px] h-[72px]">
            <div className="absolute inset-0 rounded-full border-2 border-slate-100 dark:border-white/5" />
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-500 animate-spin"
              style={{ animationDuration: '0.9s' }}
            />
            <div
              className="absolute inset-[10px] rounded-full border-[1.5px] border-transparent border-b-emerald-500/35 animate-spin"
              style={{ animationDuration: '1.7s', animationDirection: 'reverse' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_3px_rgba(16,185,129,0.3)] animate-pulse" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
              Running Diagnostics
            </Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium max-w-[240px] mx-auto leading-relaxed">
              Scanning block structures and verifying page checksums…
            </Typography>
          </div>

          <div className="w-44 h-[2px] bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ animation: 'modalSlide 1.5s ease-in-out infinite' }}
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/15">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Scanning</span>
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
      <Modal isOpen title="Database Integrity Verification" icon="verified" iconVariant="success" onClose={handleClose} maxWidth="480px">
        <div className="flex flex-col items-center justify-center py-12 gap-7 text-center animate-in fade-in duration-200">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.3)]">
              <Icon name="verified" size="lg" weight={700} className="text-white" />
            </div>
          </div>

          <div className="space-y-2 px-6">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
              Verification Complete
            </Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[300px] mx-auto">
              Diagnostic scan for <span className="font-black text-slate-900 dark:text-white">{selectedDatabase}</span> finished without critical errors.
            </Typography>
          </div>

          {successMsg && (
            <div className="w-full max-w-[340px] bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-4 py-3 text-left">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon name="fact_check" size="xs" weight={300} className="text-emerald-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Report Summary</span>
              </div>
              <Typography variant="caption" className="text-emerald-600 dark:text-emerald-400/80 font-medium leading-relaxed">
                {successMsg}
              </Typography>
            </div>
          )}

          <Button variant="secondary" onClick={handleClose}>Dismiss Report</Button>
        </div>
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (view === VIEW_ERROR) {
    return (
      <Modal isOpen title="Database Integrity Verification" icon="verified" iconVariant="danger" onClose={handleClose} maxWidth="480px">
        <div className="flex flex-col items-center justify-center py-10 gap-6 text-center animate-in fade-in duration-200">
          <div className="relative">
            <div className="absolute inset-0 bg-rose-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <Icon name="error" size="md" weight={300} className="text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
              Diagnostic Failed
            </Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[280px] mx-auto">
              We encountered a technical issue while performing the database check.
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
            <div className="w-1.5 h-1.5 rounded-full bg-bk-yellow"></div>
            <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-[0.2em]">Verification Target</Typography>
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

        {/* Diagnostic Scan Pipeline */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-bk-yellow"></div>
            <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-[0.2em]">Diagnostic Pipeline</Typography>
          </div>

          <div className="bg-slate-50/50 dark:bg-bk-main/30 border border-slate-100 dark:border-white/5 rounded-2xl p-4 space-y-0">
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
            <div className="w-1.5 h-1.5 rounded-full bg-bk-yellow"></div>
            <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-[0.2em]">Recovery Options</Typography>
          </div>

          <div
            className={`flex items-center gap-4 p-4 border rounded-2xl transition-all cursor-pointer select-none ${repair ? 'bg-bk-yellow/4 border-bk-yellow/20 shadow-[0_2px_16px_rgba(255,188,4,0.06)]' : 'bg-white dark:bg-white/2 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10'}`}
            onClick={() => setRepair(!repair)}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all shrink-0 ${repair ? 'bg-bk-yellow/10 border-bk-yellow/20 text-bk-yellow' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400'}`}>
              <Icon name="build" size="xs" weight={300} />
            </div>
            <div className="flex-1 min-w-0">
              <Typography variant="p" className={`font-bold text-[11.5px] tracking-tight transition-colors ${repair ? 'text-bk-yellow' : 'text-slate-900 dark:text-white'}`}>
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
