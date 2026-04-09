import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeDeleteQueryPlanModal, setAutoExecQuery, fetchQueryPlan } from '../databaseSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { EmptyState } from '../../../components/ds/feedback/EmptyState';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Typography } from '../../../components/ds/foundation/Typography';
import { InfoBanner } from '../../../components/ds/foundation/InfoBanner';

// view states
const VIEW_FORM    = 'form';
const VIEW_LOADING = 'loading';
const VIEW_SUCCESS = 'success';
const VIEW_ERROR   = 'error';

export default function DeleteQueryPlanModal() {
  const dispatch = useDispatch();
  const { isDeleteQueryPlanModalOpen, selectedQueryPlanId } = useSelector((state) => state.databaseUI, shallowEqual);
  const { selectedDatabase } = useSelector((state) => state.database, shallowEqual);
  const { selectedHostUid } = useSelector((state) => state.host, shallowEqual);
  const { queryPlans } = useSelector((state) => state.databaseOperation, shallowEqual);
  
  const [view, setView] = useState(VIEW_FORM);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isDeleteQueryPlanModalOpen) {
      setView(VIEW_FORM);
      setErrorMsg('');
    }
  }, [isDeleteQueryPlanModalOpen]);

  if (!isDeleteQueryPlanModalOpen) return null;

  const handleDelete = async () => {
    if (!selectedHostUid || !selectedDatabase || !selectedQueryPlanId) return;
    
    setView(VIEW_LOADING);
    setErrorMsg('');

    try {
      // Get current plans and filter out the one to delete
      const currentPlans = queryPlans[selectedDatabase] || [];
      const updatedPlans = currentPlans.filter(p => p.query_id !== selectedQueryPlanId);

      const payload = {
        dbname: selectedDatabase,
        planlist: [{
          queryplan: updatedPlans.map(p => ({
            query_id: p.query_id,
            username: p.username,
            userpass: p.userpass || '', // userpass might be missing in fetch response
            period: p.period,
            detail: p.detail,
            query_string: p.query_string
          }))
        }]
      };

      await dispatch(setAutoExecQuery({ 
        hostUid: selectedHostUid, 
        dbname: selectedDatabase, 
        payload 
      })).unwrap();
      
      setView(VIEW_SUCCESS);
      dispatch(fetchQueryPlan({ hostUid: selectedHostUid, dbname: selectedDatabase }));
      
      // Auto close after brief success
      setTimeout(() => {
        dispatch(closeDeleteQueryPlanModal());
      }, 1000);
    } catch (err) {
      setErrorMsg(typeof err === 'string' ? err : (err.message || 'System controller rejected the deletion signal. Registry remains active.'));
      setView(VIEW_ERROR);
    }
  };

  const handleClose = () => dispatch(closeDeleteQueryPlanModal());

  /* ─── LOADING view ─── */
  if (view === VIEW_LOADING) {
    return (
      <Modal isOpen title="Deleting Query Plan" icon="delete_forever" onClose={handleClose} maxWidth="440px">
        <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in fade-in duration-200">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-rose-500/10" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-rose-500 animate-spin" style={{ animationDuration: '0.9s' }} />
            <div className="absolute inset-0 flex items-center justify-center text-rose-500">
              <Icon name="delete_forever" size="md" weight={400} className="animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-1.5 px-8">
            <Typography variant="h4" className="text-[14px] font-black text-rose-500 tracking-tight">Removing Registry</Typography>
            <Typography variant="p" className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-[280px] mx-auto text-center">
              Discarding automation handle <span className="font-black text-rose-500 font-mono">"{selectedQueryPlanId}"</span>.
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
            <Typography variant="p" className="text-[11.5px] text-slate-500 font-medium leading-relaxed">The query plan has been removed from the system scheduler.</Typography>
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
            <Typography variant="p" className="text-[11.5px] text-slate-500 font-medium leading-relaxed">System could not finalize the deletion signal for this query plan.</Typography>
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
      isOpen={isDeleteQueryPlanModalOpen}
      onClose={handleClose}
      title="Dangerous: Discard Query Plan"
      subtitle="Permanent removal of SQL automation registry"
      icon="delete_forever"
      maxWidth="440px"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="ghost" onClick={handleClose}>Discard</Button>
          <Button variant="danger" onClick={handleDelete} icon="delete" className="min-w-[130px]">Execute Discard</Button>
        </div>
      }
    >
      <div className="flex flex-col items-center justify-center py-6 gap-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="w-16 h-16 bg-rose-500/5 rounded-full flex items-center justify-center border border-rose-500/10 shadow-inner">
           <Icon name="warning" size="md" weight={300} className="text-3xl text-rose-500 animate-pulse" />
        </div>
        
        <div className="space-y-2">
          <Typography variant="h4" className="text-[16px] font-black text-slate-900 dark:text-white tracking-tight">Discard Query Strategy?</Typography>
          <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-[320px] mx-auto">
            You are about to permanently remove the query plan <span className="text-rose-500 font-black uppercase tracking-tight">"{selectedQueryPlanId}"</span>. Automated capture for <span className="font-bold text-slate-900 dark:text-white">"{selectedDatabase}"</span> will cease immediately.
          </Typography>
        </div>

        <InfoBanner title="Plan Retirement">
          Existing logs generated by this plan will not be purged, but no new executions will be scheduled.
        </InfoBanner>
      </div>
    </Modal>
  );
}
