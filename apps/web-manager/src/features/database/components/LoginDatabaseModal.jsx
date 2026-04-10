import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { loginDatabase, registerDatabase, closeLoginDatabaseModal, fetchBackupSchedule, fetchQueryPlan } from '../databaseSlice';
import { fetchDatabaseUsers } from '../../user/userSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Toggle } from '../../../components/ds/forms/Toggle';
import { Typography } from '../../../components/ds/foundation/Typography';
import { SectionHeader } from '../../../components/ds/foundation/SectionHeader';
import { StatusBadge } from '../../../components/ds/foundation/StatusBadge';

import { useActionState } from '../../../infrastructure/hooks/useActionState';
import { 
  ModalStatusLoading, 
  ModalStatusSuccess, 
  ModalStatusError 
} from '../../../components/ds/feedback/ActionStatus';

export default function LoginDatabaseModal() {
  const dispatch = useDispatch();
  const { isLoginDatabaseModalOpen } = useSelector((state) => state.databaseUI, shallowEqual);
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

  const [formData, setFormData] = useState({ dbuser: 'dba', dbpasswd: '' });
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isLoginDatabaseModalOpen) {
      resetAction();
      setFormData({ dbuser: 'dba', dbpasswd: '' });
      setRememberMe(true);
      setShowPassword(false);
    }
  }, [isLoginDatabaseModalOpen, resetAction]);

  if (!isLoginDatabaseModalOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!formData.dbuser) return;
    
    startAction();
    try {
      if (rememberMe) {
        dispatch(registerDatabase({ 
          hostUid: selectedHostUid, 
          dbname: selectedDatabase, 
          payload: { id: formData.dbuser, password: formData.dbpasswd } 
        }));
      }

      await dispatch(loginDatabase({ 
        hostUid: selectedHostUid, 
        dbname: selectedDatabase, 
        payload: formData 
      })).unwrap();

      dispatch(fetchDatabaseUsers({ hostUid: selectedHostUid, dbname: selectedDatabase }));
      dispatch(fetchBackupSchedule({ hostUid: selectedHostUid, dbname: selectedDatabase }));
      dispatch(fetchQueryPlan({ hostUid: selectedHostUid, dbname: selectedDatabase }));
      
      endSuccess(`Session established for ${selectedDatabase}. Access granted.`);
      
      // Auto close after brief success message
      setTimeout(() => {
        dispatch(closeLoginDatabaseModal());
      }, 1000);
    } catch (err) {
      endError(typeof err === 'string' ? err : (err.message || 'Authentication failed. Verify credentials and instance state.'));
    }
  };

  const handleClose = () => dispatch(closeLoginDatabaseModal());

  /* ─── LOADING view ─── */
  if (isLoading) {
    return (
      <Modal isOpen title="Environment Access" icon="lock" onClose={handleClose} maxWidth="440px">
        <ModalStatusLoading 
          title="Verifying Identity" 
          subtitle={`Establishing secure session as ${formData.dbuser} on ${selectedDatabase}.`} 
        />
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  if (isSuccess) {
    return (
      <Modal isOpen title="Access Granted" icon="lock_open" iconVariant="success" onClose={handleClose} maxWidth="440px">
        <ModalStatusSuccess 
          title="Session Established"
          message="Identity verified. Redirecting to workspace environment..."
          onConfirm={handleClose}
          confirmText="Initialize Session"
        />
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (isError) {
    return (
      <Modal isOpen title="Auth Failed" icon="lock" iconVariant="danger" onClose={resetAction} maxWidth="440px">
        <ModalStatusError 
          title="Verification Error"
          error={error}
          onRetry={handleLogin}
          onCancel={resetAction}
          retryText="Retry Registry Login"
          cancelText="Adjust Credentials"
        />
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isLoginDatabaseModalOpen}
      onClose={handleClose}
      title="Environment Access"
      subtitle="Identity verification required for instance management"
      icon="lock"
      maxWidth="440px"
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <Button variant="ghost" onClick={handleClose}>Discard</Button>
          <Button variant="primary" onClick={handleLogin} icon="login" className="min-w-[140px]">Establish Session</Button>
        </div>
      }
    >
      <form onSubmit={handleLogin} className="space-y-6 pb-2 px-1.5">
        <div className="space-y-4">
          <SectionHeader title="Target Workspace" icon="database" />
          <div className="relative overflow-hidden rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 p-4 pt-5 pb-5 transition-all hover:border-slate-200 dark:hover:border-white/10 group">
            <div className="flex items-center justify-between gap-2.5">
              <div className="min-w-0 flex-1">
                <Typography variant="caption" className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-[10px] block mb-1">Instance Name</Typography>
                <Typography variant="h4" className="text-[18px] font-black text-slate-800 dark:text-white font-mono truncate">{selectedDatabase}</Typography>
              </div>
              <StatusBadge label="Locked" variant="amber" pulse={true} className="rounded-full shadow-sm" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeader title="Identity & Credentials" icon="lock" />
          <div className="space-y-4">
            <Input label="Access Principal" value={formData.dbuser} onChange={(e) => handleInputChange('dbuser', e.target.value)} placeholder="dba" icon="account_circle" autoFocus />
            <div className="relative">
              <Input type={showPassword ? 'text' : 'password'} label="Cipher Key" value={formData.dbpasswd} onChange={(e) => handleInputChange('dbpasswd', e.target.value)} placeholder="Enter password" icon="password" />
              <button type="button" tabIndex={-1} onClick={() => setShowPassword(s => !s)} className="absolute right-3 bottom-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} size="16px" weight={300} />
              </button>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 transition-all hover:border-slate-200 dark:hover:border-white/10 group cursor-pointer" onClick={() => setRememberMe(v => !v)}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${rememberMe ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400'}`}>
                <Icon name={rememberMe ? 'verified' : 'security'} size="sm" weight={300} />
              </div>
              <div className="flex-1 min-w-0">
                <Typography variant="p" className={`text-[12px] font-black transition-colors ${rememberMe ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>Session Persistence</Typography>
                <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium block leading-none mt-1">Encrypt credentials for background auto-recon</Typography>
              </div>
              <Toggle variant="primary" checked={rememberMe} onChange={() => setRememberMe(v => !v)} />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
