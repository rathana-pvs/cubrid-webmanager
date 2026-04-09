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

export default function CheckDatabaseModal() {
  const dispatch = useDispatch();
  const { isCheckDatabaseModalOpen } = useSelector((state) => state.databaseUI, shallowEqual);
  const { selectedDatabase } = useSelector((state) => state.database, shallowEqual);
  const { selectedHostUid } = useSelector((state) => state.host, shallowEqual);
  
  const { error, startAction, endSuccess, endError, resetAction, isLoading, isSuccess, isError } = useActionState();

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
      const response = await databaseApi.checkDatabase(selectedHostUid, selectedDatabase, { repairdb: repair ? 'y' : 'n' });
      endSuccess(response.note || 'Database integrity verification completed successfully.');
    } catch (err) {
      endError(err.response?.data?.note || err.response?.data?.message || 'The database check operation failed.');
    }
  };

  const handleClose = () => dispatch(closeCheckDatabaseModal());

  if (isLoading) return (
    <Modal isOpen title="Check Database" icon="verified" onClose={handleClose} maxWidth="420px">
      <ModalStatusLoading title="Running Diagnostics" subtitle={`Scanning ${selectedDatabase}…`} />
    </Modal>
  );

  if (isSuccess) return (
    <Modal isOpen title="Check Database" icon="verified" iconVariant="success" onClose={handleClose} maxWidth="420px">
      <ModalStatusSuccess 
        title="Verification Complete"
        message={`${selectedDatabase} passed integrity check.`}
        onConfirm={handleClose}
        confirmText="Done"
      />
    </Modal>
  );

  if (isError) return (
    <Modal isOpen title="Check Database" icon="verified" iconVariant="danger" onClose={resetAction} maxWidth="420px">
      <ModalStatusError 
        title="Diagnostic Failed"
        error={error}
        onRetry={handleCheck}
        onCancel={resetAction}
        retryText="Retry"
        cancelText="Dismiss"
      />
    </Modal>
  );

  return (
    <Modal
      isOpen={isCheckDatabaseModalOpen}
      onClose={handleClose}
      title="Check Database"
      icon="verified"
      maxWidth="420px"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={handleCheck} icon="play_circle">Run Check</Button>
        </div>
      }
    >
      <div className="space-y-4">

        {/* Target database */}
        <div className="flex items-center gap-3 px-3.5 py-3 bg-slate-50 dark:bg-white/3 border border-slate-200 dark:border-white/5 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Icon name="database" size="sm" weight={300} className="text-amber-500" />
          </div>
          <div className="min-w-0">
            <Typography variant="caption" className="text-slate-400 text-[9px] uppercase tracking-widest font-semibold">Target</Typography>
            <Typography variant="p" className="font-bold text-[13px] text-slate-900 dark:text-white font-mono truncate leading-none mt-0.5">
              {selectedDatabase}
            </Typography>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-0 divide-y divide-slate-100 dark:divide-white/5 border border-slate-100 dark:border-white/5 rounded-xl overflow-hidden">
          {[
            { icon: 'search',        label: 'Block Integrity',  desc: 'Page checksum verification' },
            { icon: 'account_tree',  label: 'Index Consistency', desc: 'B-tree structure validation' },
            { icon: 'fact_check',    label: 'Catalog Check',    desc: 'System metadata cross-check' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 px-3.5 py-2.5 bg-white dark:bg-white/1 hover:bg-slate-50 dark:hover:bg-white/3 transition-colors">
              <Icon name={s.icon} size="sm" weight={300} className="text-amber-500 shrink-0" />
              <div className="min-w-0">
                <Typography variant="p" className="font-semibold text-[11.5px] text-slate-800 dark:text-slate-100 leading-none">{s.label}</Typography>
                <Typography variant="caption" className="text-slate-400 font-medium mt-0.5">{s.desc}</Typography>
              </div>
            </div>
          ))}
        </div>

        {/* Repair toggle */}
        <div
          className={`flex items-center gap-3 px-3.5 py-3 border rounded-xl cursor-pointer select-none transition-all ${
            repair
              ? 'bg-amber-500/5 border-amber-500/25'
              : 'bg-white dark:bg-white/2 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10'
          }`}
          onClick={() => setRepair(!repair)}
        >
          <Icon name="build" size="sm" weight={300} className={repair ? 'text-amber-500' : 'text-slate-400'} />
          <div className="flex-1 min-w-0">
            <Typography variant="p" className={`font-semibold text-[11.5px] leading-none ${repair ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-100'}`}>
              Auto-Repair
            </Typography>
            <Typography variant="caption" className="text-slate-400 font-medium mt-0.5">
              Attempt to fix inconsistencies found during scan
            </Typography>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <Toggle checked={repair} onChange={setRepair} />
          </div>
        </div>

      </div>
    </Modal>
  );
}
