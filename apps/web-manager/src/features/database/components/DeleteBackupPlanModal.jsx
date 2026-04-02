import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeDeleteBackupPlanModal, deleteBackupSchedule, fetchBackupSchedule } from '../databaseSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
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

export default function DeleteBackupPlanModal() {
  const dispatch = useDispatch();
  const { isDeleteBackupPlanModalOpen, selectedBackupId } = useSelector((state) => state.databaseUI, shallowEqual);
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

  useEffect(() => {
    if (isDeleteBackupPlanModalOpen) {
      resetAction();
    }
  }, [isDeleteBackupPlanModalOpen, resetAction]);

  if (!isDeleteBackupPlanModalOpen) return null;

  const handleDelete = async () => {
    if (!selectedHostUid || !selectedDatabase || !selectedBackupId) return;
    
    startAction();

    try {
      await dispatch(deleteBackupSchedule({ 
        hostUid: selectedHostUid, 
        dbname: selectedDatabase, 
        payload: { backupid: selectedBackupId } 
      })).unwrap();
      
      endSuccess(`Backup plan ${selectedBackupId} successfully removed.`);
      dispatch(fetchBackupSchedule({ hostUid: selectedHostUid, dbname: selectedDatabase }));
      
      // Auto close after brief success
      setTimeout(() => {
        dispatch(closeDeleteBackupPlanModal());
      }, 1500);
    } catch (err) {
      endError(typeof err === 'string' ? err : (err.message || 'System controller rejected the deletion signal. Registry remains active.'));
    }
  };

  const handleClose = () => dispatch(closeDeleteBackupPlanModal());

  /* ─── LOADING view ─── */
  if (isLoading) {
    return (
      <Modal isOpen title="Deleting Plan" icon="delete_forever" onClose={handleClose} maxWidth="440px" iconVariant="danger">
        <ModalStatusLoading 
          title="Removing Registry" 
          subtitle={`Discarding automation handle "${selectedBackupId}".`}
          variant="danger"
        />
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  if (isSuccess) {
    return (
      <Modal isOpen title="Deletion Success" icon="verified" iconVariant="success" onClose={handleClose} maxWidth="440px">
        <ModalStatusSuccess 
          title="Registry Purged"
          message="The plan has been removed from the system scheduler."
          onConfirm={handleClose}
          confirmText="Acknowledge"
        />
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (isError) {
    return (
      <Modal isOpen title="Deletion Failed" icon="error" iconVariant="danger" onClose={resetAction} maxWidth="440px">
        <ModalStatusError 
          title="Signal Rejected"
          error={actionError}
          onRetry={handleDelete}
          onCancel={resetAction}
          retryText="Retry Deletion"
          cancelText="Dismiss"
        />
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
          <Button variant="ghost" onClick={handleClose}>Discard</Button>
          <Button variant="danger" onClick={handleDelete} icon="delete" className="min-w-[140px]">Execute Discard</Button>
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
           <Icon name="info" size="14px" weight={400} className="text-amber-500 mt-0.5" />
           <Typography variant="caption" className="text-slate-500 dark:text-slate-500 font-bold uppercase tracking-tighter leading-relaxed italic">
             This only removes the registry handle. Existing physical backup volumes on disk remain untouched.
           </Typography>
        </div>
      </div>
    </Modal>
  );
}
