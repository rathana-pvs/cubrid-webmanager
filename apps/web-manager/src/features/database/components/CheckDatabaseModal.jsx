import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeCheckDatabaseModal } from '../databaseSlice';
import { databaseApi } from '../databaseApi';
import { showStatusModal } from '../../layout/layoutSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Checkbox } from '../../../components/ds/forms/Checkbox';
import { Typography } from '../../../components/ds/foundation/Typography';

export default function CheckDatabaseModal() {
  const dispatch = useDispatch();
  const { isCheckDatabaseModalOpen, selectedDatabase } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);
  const [repair, setRepair] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isCheckDatabaseModalOpen) return null;

  const handleCheck = async () => {
    if (!selectedHostUid || !selectedDatabase) return;

    setLoading(true);
    setError(null);
    try {
      const payload = {
        repairdb: repair ? 'y' : 'n'
      };
      const response = await databaseApi.checkDatabase(selectedHostUid, selectedDatabase, payload);

      dispatch(closeCheckDatabaseModal());
      dispatch(showStatusModal({
        type: 'success',
        title: 'Check complete',
        message: response.note || 'Database check completed successfully.'
      }));
    } catch (err) {
      setError(err.response?.data?.note || err.response?.data?.message || 'The database check operation encountered a conflict or failed to reach the server.');
    } finally {
      setLoading(false);
    }
  };

  const scanSteps = [
    { icon: 'search', label: 'Block Integrity Scan', desc: 'Verify physical page checksums' },
    { icon: 'account_tree', label: 'Index Consistency', desc: 'Validate B-tree structures' },
    { icon: 'fact_check', label: 'Catalog Verification', desc: 'Cross-check system metadata' },
  ];

  return (
    <Modal
      isOpen={isCheckDatabaseModalOpen}
      onClose={() => dispatch(closeCheckDatabaseModal())}
      title="Database Integrity Verification"
      icon="verified"
      maxWidth="480px"
      loading={loading}
      error={error}
      onErrorRetry={handleCheck}
      onErrorClose={() => setError(null)}
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={() => dispatch(closeCheckDatabaseModal())} disabled={loading}>
            Discard
          </Button>
          <Button
            variant="primary"
            onClick={handleCheck}
            loading={loading}
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
              <Checkbox
                className="w-fit!"
                checked={repair}
                onChange={(e) => setRepair(e.target.checked)}
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

