import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeDatabaseLoginModal, loginDatabase } from '../databaseSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Typography } from '../../../components/ds/foundation/Typography';

import { useActionState } from '../../../infrastructure/hooks/useActionState';
import { ModalStatusLoading, ModalStatusSuccess, ModalStatusError } from '../../../components/ds/feedback/ActionStatus';

export default function DatabaseLoginModal() {
  const dispatch = useDispatch();
  const { isDatabaseLoginModalOpen } = useSelector((state) => state.databaseUI, shallowEqual);
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

  const [formData, setFormData] = useState({
    username: 'dba',
    password: ''
  });

  // Initialization
  useEffect(() => {
    if (isDatabaseLoginModalOpen) {
      resetAction();
      setFormData({ username: 'dba', password: '' });
    }
  }, [isDatabaseLoginModalOpen, resetAction]);

  if (!isDatabaseLoginModalOpen) return null;

  const handleLogin = async () => {
    startAction();
    try {
      await dispatch(loginDatabase({ 
        hostUid: selectedHostUid, 
        dbname: selectedDatabase, 
        username: formData.username, 
        password: formData.password 
      })).unwrap();
      endSuccess();
    } catch (err) {
      endError(err);
    }
  };

  const handleClose = () => dispatch(closeDatabaseLoginModal());

  /* ─── LOADING view ─── */
  if (isLoading) {
    return (
      <Modal isOpen title="Identity Verification" icon="lock" onClose={handleClose} maxWidth="480px">
        <ModalStatusLoading 
          title="Authenticating" 
          subtitle={`Verifying system authority for ${formData.username} on ${selectedDatabase}.`} 
        />
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  if (isSuccess) {
    return (
      <Modal isOpen title="Access Granted" icon="lock" iconVariant="success" onClose={handleClose} maxWidth="480px">
        <ModalStatusSuccess 
          title="Authority Established"
          message={`Connection to "${selectedDatabase}" has been successfully established and cached.`}
          onConfirm={handleClose}
          confirmText="Initialize Session"
        />
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (isError) {
    return (
      <Modal isOpen title="Access Denied" icon="lock" iconVariant="danger" onClose={resetAction} maxWidth="480px">
        <ModalStatusError 
          title="Verification Failed"
          error={error}
          onRetry={handleLogin}
          onCancel={resetAction}
          retryText="Retry Registry Login"
          cancelText="Discard"
        />
      </Modal>
    );
  }

  /* ─── FORM view ─── */
  return (
    <Modal
      isOpen={isDatabaseLoginModalOpen}
      onClose={handleClose}
      title="Secure Login"
      subtitle={`Authenticate for ${selectedDatabase}`}
      icon="vpn_key"
      maxWidth="max-w-[480px]"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button 
            variant="primary"
            onClick={handleLogin} 
            icon="login"
            className="px-8 min-w-[140px]"
          >
            Authorize
          </Button>
        </div>
      }
    >
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
        
        {/* Identity Headroom */}
        <div className="flex flex-col items-center justify-center pt-2 pb-6 text-center">
           <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5 shrink-0 shadow-sm relative group overflow-hidden">
             <div className="absolute inset-0 bg-amber-500/5 rotate-45 translate-x-3 translate-y-3" />
             <Icon name="database" size="lg" weight={300} className="text-amber-500 relative z-10" />
           </div>
           <div className="space-y-1">
             <Typography variant="h4" className="text-[17px] font-black text-slate-800 dark:text-white uppercase tracking-widest leading-none block">{selectedDatabase}</Typography>
             <Typography variant="caption" className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">CUBRID Database Instance</Typography>
           </div>
        </div>

        <div className="space-y-6">
           <Input 
             label="DBA Account Identity"
             value={formData.username}
             onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
             icon="person"
             placeholder="dba"
             autoFocus
           />
           <Input 
             type="password"
             label="Account Security Token"
             value={formData.password}
             onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
             icon="key"
             placeholder="••••••••"
             onKeyUp={e => e.key === 'Enter' && handleLogin()}
           />
        </div>

        <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-4">
           <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
             <Icon name="security" size="sm" weight={300} className="text-amber-500" />
           </div>
           <div className="space-y-0.5">
             <Typography variant="p" className="text-[11px] font-black text-amber-600 uppercase tracking-tight">Access Control Policy</Typography>
             <Typography variant="caption" className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic block">
                Access is restricted to authorized <span className="font-bold text-amber-600">DBA accounts</span>. Multiple failed attempts may trigger system locks.
             </Typography>
           </div>
        </div>
      </div>
    </Modal>
  );
}
