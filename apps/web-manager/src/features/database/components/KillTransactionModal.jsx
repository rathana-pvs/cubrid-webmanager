import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeKillTransactionModal } from '../databaseSlice';
import { databaseApi } from '../databaseApi';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Select } from '../../../components/ds/forms/Select';
import { Typography } from '../../../components/ds/foundation/Typography';

// view states
const VIEW_FORM    = 'form';
const VIEW_LOADING = 'loading';
const VIEW_SUCCESS = 'success';
const VIEW_ERROR   = 'error';

export default function KillTransactionModal({ onTransactionKilled }) {
  const dispatch = useDispatch();
  const { isKillTransactionModalOpen, killTransactionData } = useSelector((state) => state.databaseUI);
  const { selectedDatabase } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);

  const [view, setView] = useState(VIEW_FORM);
  const [errorMsg, setErrorMsg] = useState('');
  const [killType, setKillType] = useState('i'); // Default: Kill selected only

  useEffect(() => {
    if (isKillTransactionModalOpen) {
      setView(VIEW_FORM);
      setKillType('i');
      setErrorMsg('');
    }
  }, [isKillTransactionModalOpen]);

  if (!isKillTransactionModalOpen || !killTransactionData) return null;

  const handleKill = async () => {
    if (!selectedHostUid) return;

    setView(VIEW_LOADING);
    setErrorMsg('');

    try {
      const idx = killTransactionData.tranindex?.match(/\d+/)?.[0] || '';
      const payload = {
        dbname: selectedDatabase,
        type: killType,
        parameter: idx
      };

      await databaseApi.killTransaction(selectedHostUid, selectedDatabase, payload);
      
      setView(VIEW_SUCCESS);
      if (onTransactionKilled) onTransactionKilled();
      
      // Auto close after brief success
      setTimeout(() => {
        dispatch(closeKillTransactionModal());
      }, 1000);
    } catch (err) {
      setErrorMsg(typeof err === 'string' ? err : (err.message || 'Termination sequence aborted by system controller. Handle remains active.'));
      setView(VIEW_ERROR);
    }
  };

  const handleClose = () => dispatch(closeKillTransactionModal());

  /* ─── LOADING view ─── */
  if (view === VIEW_LOADING) {
    return (
      <Modal isOpen title="Terminating Handle" icon="bolt" onClose={handleClose} maxWidth="540px">
        <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in fade-in duration-200">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-rose-500/10" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-rose-500 animate-spin" style={{ animationDuration: '0.9s' }} />
            <div className="absolute inset-0 flex items-center justify-center text-rose-500">
              <Icon name="bolt" size="md" weight={400} className="animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-1.5 px-8">
            <Typography variant="h4" className="text-[14px] font-black text-slate-800 dark:text-white tracking-tight text-rose-500">Force Aborting</Typography>
            <Typography variant="p" className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-[280px] mx-auto">
              Initiating rollback and lock release for PID <span className="font-black text-rose-500 font-mono">{killTransactionData.pid}</span>.
            </Typography>
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  if (view === VIEW_SUCCESS) {
    return (
      <Modal isOpen title="Handle Terminated" icon="verified" iconVariant="success" onClose={handleClose} maxWidth="540px">
        <div className="flex flex-col items-center justify-center py-12 gap-7 text-center animate-in fade-in duration-200">
           <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.3)]">
            <Icon name="done_all" size="lg" weight={700} className="text-white" />
          </div>
          <div className="space-y-1 px-8">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">Transaction Aborted</Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 font-medium leading-relaxed">System resources released. Transaction state discarded.</Typography>
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (view === VIEW_ERROR) {
    return (
      <Modal isOpen title="Termination Failed" icon="error" iconVariant="danger" onClose={handleClose} maxWidth="540px">
        <div className="flex flex-col items-center justify-center py-10 gap-6 text-center animate-in fade-in duration-200">
          <div className="relative w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)]">
            <Icon name="emergency_home" size="md" weight={300} className="text-white" />
          </div>
          <div className="space-y-2 px-6">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight text-rose-500">Signal Interrupted</Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 font-medium leading-relaxed">System could not finalize the termination signal for this handle.</Typography>
          </div>
          <div className="w-full max-w-[340px] bg-rose-500/5 border border-rose-500/15 rounded-xl px-4 py-3 text-left">
             <Typography variant="caption" className="text-rose-400 font-mono leading-relaxed break-words block text-center uppercase tracking-widest text-[10px] font-bold">
              {errorMsg}
            </Typography>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleClose}>Dismiss</Button>
            <Button variant="primary" icon="refresh" onClick={() => { setView(VIEW_FORM); setErrorMsg(''); }}>Retry Kill</Button>
          </div>
        </div>
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
