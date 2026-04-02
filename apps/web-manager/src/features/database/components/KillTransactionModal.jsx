import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeKillTransactionModal } from '../databaseSlice';
import { databaseApi } from '../databaseApi';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Select } from '../../../components/ds/forms/Select';
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

export default function KillTransactionModal({ onTransactionKilled }) {
  const dispatch = useDispatch();
  const { isKillTransactionModalOpen, killTransactionData } = useSelector((state) => state.databaseUI, shallowEqual);
  const { selectedDatabase } = useSelector((state) => state.database, shallowEqual);
  const { selectedHostUid } = useSelector((state) => state.host, shallowEqual);

  const { 
    state, 
    error: actionError, 
    startAction, 
    endSuccess, 
    endError, 
    resetAction,
    isLoading,
    isSuccess,
    isError
  } = useActionState();

  const [killType, setKillType] = useState('i'); // Default: Kill selected only

  useEffect(() => {
    if (isKillTransactionModalOpen) {
      resetAction();
      setKillType('i');
    }
  }, [isKillTransactionModalOpen, resetAction]);

  if (!isKillTransactionModalOpen || !killTransactionData) return null;

  const handleKill = async () => {
    if (!selectedHostUid) return;

    startAction();

    try {
      const idx = killTransactionData.tranindex?.match(/\d+/)?.[0] || '';
      const payload = {
        dbname: selectedDatabase,
        type: killType,
        parameter: idx
      };

      await databaseApi.killTransaction(selectedHostUid, selectedDatabase, payload);
      
      endSuccess('Transaction state discarded.');
      if (onTransactionKilled) onTransactionKilled();
      
      // Auto close after brief success
      setTimeout(() => {
        dispatch(closeKillTransactionModal());
      }, 1200);
    } catch (err) {
      endError(typeof err === 'string' ? err : (err.message || 'Termination sequence aborted by system controller. Handle remains active.'));
    }
  };

  const handleClose = () => dispatch(closeKillTransactionModal());

  /* ─── LOADING view ─── */
  if (isLoading) {
    return (
      <Modal isOpen title="Terminating Handle" icon="bolt" onClose={handleClose} maxWidth="540px">
        <ModalStatusLoading 
          title="Force Aborting" 
          subtitle={`Initiating rollback and lock release for PID ${killTransactionData.pid}.`}
        />
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  if (isSuccess) {
    return (
      <Modal isOpen title="Handle Terminated" icon="verified" iconVariant="success" onClose={handleClose} maxWidth="540px">
        <ModalStatusSuccess 
          title="Transaction Aborted"
          message="System resources released. Transaction state discarded."
          onConfirm={handleClose}
        />
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (isError) {
    return (
      <Modal isOpen title="Termination Failed" icon="error" iconVariant="danger" onClose={resetAction} maxWidth="540px">
        <ModalStatusError 
          title="Signal Interrupted"
          error={actionError}
          onRetry={handleKill}
          onCancel={resetAction}
          retryText="Retry Kill"
          cancelText="Dismiss"
        />
      </Modal>
    );
  }

  /* ─── FORM view ─── */
  return (
    <Modal
      isOpen={isKillTransactionModalOpen}
      onClose={handleClose}
      title="Danger: Terminate Transaction"
      subtitle="Interrupt active handle and force rollback"
      icon="cancel"
      maxWidth="540px"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="ghost" onClick={handleClose}>Discard</Button>
          <Button variant="danger" onClick={handleKill} icon="bolt" className="px-6 min-w-[140px]">Force Abort</Button>
        </div>
      }
    >
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Transaction context */}
        <div className="bg-slate-50 dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-2xl p-5 space-y-5">
           <div className="flex items-center gap-3 mb-1">
            <Icon name="history" size="14px" weight={400} className="text-rose-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Handle Metadata</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Typography variant="caption" className="font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Principal</Typography>
              <Input value={killTransactionData['@user'] || '-'} disabled icon="account_circle" size="sm" />
            </div>
            <div className="space-y-1">
              <Typography variant="caption" className="font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Process PID</Typography>
              <Input value={killTransactionData.pid || '-'} disabled icon="fingerprint" size="sm" className="font-bold!" />
            </div>
            <div className="space-y-1">
              <Typography variant="caption" className="font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Source Host</Typography>
              <Input value={killTransactionData.host || '-'} disabled icon="lan" size="sm" />
            </div>
            <div className="space-y-1">
              <Typography variant="caption" className="font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Binary Path</Typography>
              <Input value={killTransactionData.program || '-'} disabled icon="terminal" size="sm" />
            </div>
          </div>
        </div>

        {/* Action Strategy */}
        <div className="space-y-4 px-1">
           <div className="flex items-center gap-3">
            <Icon name="settings" size="14px" weight={400} className="text-slate-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Termination Strategy</span>
          </div>
          
          <Select 
            value={killType}
            onChange={(val) => setKillType(val)}
            options={[
              { value: 'i', label: 'Isolated: Abort single handle', icon: 'gps_fixed' },
              { value: 'h', label: 'Broadcast: Abort all client handles', icon: 'hub' },
              { value: 'p', label: 'Programmatic: Abort all binary handles', icon: 'apps' }
            ]}
          />

          <div className="flex items-start gap-4 p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20 shrink-0">
              <Icon name="warning" size="md" weight={300} />
            </div>
            <div className="space-y-1">
              <Typography variant="p" className="text-[11px] text-rose-600 dark:text-rose-400 font-black uppercase tracking-tight">System Integrity Warning</Typography>
              <Typography variant="caption" className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic">
                Force termination results in an immediate <b>rollback</b> of any uncommitted atomic operations. Lock handles will be released asynchronously by the controller.
              </Typography>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
