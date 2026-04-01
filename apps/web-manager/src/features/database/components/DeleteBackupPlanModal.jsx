import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeDeleteBackupPlanModal, deleteBackupSchedule, fetchBackupSchedule } from '../databaseSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Typography } from '../../../components/ds/foundation/Typography';

// view states
const VIEW_FORM    = 'form';
const VIEW_LOADING = 'loading';
const VIEW_SUCCESS = 'success';
const VIEW_ERROR   = 'error';

export default function DeleteBackupPlanModal() {
  const dispatch = useDispatch();
  const { isDeleteBackupPlanModalOpen, selectedBackupId } = useSelector((state) => state.databaseUI, shallowEqual);
  const { selectedDatabase } = useSelector((state) => state.database, shallowEqual);
  const { selectedHostUid } = useSelector((state) => state.host, shallowEqual);
  
  const [view, setView] = useState(VIEW_FORM);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isDeleteBackupPlanModalOpen) {
      setView(VIEW_FORM);
      setErrorMsg('');
    }
  }, [isDeleteBackupPlanModalOpen]);

  if (!isDeleteBackupPlanModalOpen) return null;

  const handleDelete = async () => {
    if (!selectedHostUid || !selectedDatabase || !selectedBackupId) return;
    
    setView(VIEW_LOADING);
    setErrorMsg('');

    try {
      await dispatch(deleteBackupSchedule({ 
        hostUid: selectedHostUid, 
        dbname: selectedDatabase, 
        payload: { backupid: selectedBackupId } 
      })).unwrap();
      
      setView(VIEW_SUCCESS);
      dispatch(fetchBackupSchedule({ hostUid: selectedHostUid, dbname: selectedDatabase }));
      
      // Auto close after brief success
      setTimeout(() => {
        dispatch(closeDeleteBackupPlanModal());
      }, 1000);
    } catch (err) {
      setErrorMsg(typeof err === 'string' ? err : (err.message || 'System controller rejected the deletion signal. Registry remains active.'));
      setView(VIEW_ERROR);
    }
  };

  const handleClose = () => dispatch(closeDeleteBackupPlanModal());

  /* ─── LOADING view ─── */
  if (view === VIEW_LOADING) {
    return (
      <Modal isOpen title="Deleting Plan" icon="delete_forever" onClose={handleClose} maxWidth="440px">
        <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in fade-in duration-200">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-rose-500/10" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-rose-500 animate-spin" style={{ animationDuration: '0.9s' }} />
            <div className="absolute inset-0 flex items-center justify-center text-rose-500">
              <Icon name="auto_delete" size="md" weight={400} className="animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-1.5 px-8">
            <Typography variant="h4" className="text-[14px] font-black text-rose-500 tracking-tight">Removing Registry</Typography>
            <Typography variant="p" className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-[280px] mx-auto text-center">
              Discarding automation handle <span className="font-black text-rose-500 font-mono">"{selectedBackupId}"</span>.
            </Typography>
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  if (view === VIEW_SUCCESS) {
    return (
      <Modal isOpen title="Deletion Success" icon="verified" iconVariant="success" onClose={handleClose} maxWidth="440px">
        <div className="flex flex-col items-center justify-center py-12 gap-7 text-center animate-in fade-in duration-200">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.3)]">
            <Icon name="done_all" size="lg" weight={700} className="text-white" />
          </div>
          <div className="space-y-1 px-8">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">Registry Purged</Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 font-medium leading-relaxed">The plan has been removed from the system scheduler.</Typography>
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (view === VIEW_ERROR) {
    return (
      <Modal isOpen title="Deletion Failed" icon="error" iconVariant="danger" onClose={handleClose} maxWidth="440px">
        <div className="flex flex-col items-center justify-center py-10 gap-6 text-center animate-in fade-in duration-200">
          <div className="relative w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)]">
            <Icon name="emergency_home" size="md" weight={300} className="text-white" />
          </div>
          <div className="space-y-2 px-6">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight text-rose-500">Signal Rejected</Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 font-medium leading-relaxed">System could not finalize the deletion signal for this backup plan.</Typography>
          </div>
          <div className="w-full max-w-[340px] bg-rose-500/5 border border-rose-500/15 rounded-xl px-4 py-3 text-left">
             <Typography variant="caption" className="text-rose-400 font-mono leading-relaxed break-words block text-center uppercase tracking-widest text-[10px] font-bold">
              {errorMsg}
            </Typography>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleClose}>Dismiss</Button>
            <Button variant="primary" icon="refresh" onClick={() => { setView(VIEW_FORM); setErrorMsg(''); }}>Retry Deletion</Button>
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── FORM view ─── */
  return (
    <Modal
      isOpen={isDeleteBackupPlanModalOpen}
      onClose={handleClose}
      title="Dangerous: Discard Schedule"
      subtitle="Permanent removal of automation registry"
      icon="delete_forever"
      maxWidth="440px"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} icon="delete" className="min-w-[130px]">Execute Discard</Button>
        </div>
      }
    >
      <div className="flex flex-col items-center justify-center py-6 gap-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="w-16 h-16 bg-rose-500/5 rounded-full flex items-center justify-center border border-rose-500/10 shadow-inner">
           <Icon name="warning" size="md" weight={300} className="text-3xl text-rose-500 animate-pulse" />
        </div>
        
        <div className="space-y-2">
          <Typography variant="h4" className="text-[16px] font-black text-slate-900 dark:text-white tracking-tight">Discard Backup Strategy?</Typography>
          <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-[320px] mx-auto">
            You are about to permanently remove the backup plan <span className="text-rose-500 font-black uppercase tracking-tight">"{selectedBackupId}"</span>. Automated capture for <span className="font-bold text-slate-900 dark:text-white">"{selectedDatabase}"</span> will cease immediately.
          </Typography>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-2xl flex items-start gap-3 text-left">
           <Icon name="info" size="14px" weight={400} className="text-bk-yellow mt-0.5" />
           <Typography variant="caption" className="text-slate-500 dark:text-slate-500 font-bold uppercase tracking-tighter leading-relaxed italic">
             This only removes the registry handle. Existing physical backup volumes on disk remain untouched.
           </Typography>
        </div>
      </div>
    </Modal>
  );
}
