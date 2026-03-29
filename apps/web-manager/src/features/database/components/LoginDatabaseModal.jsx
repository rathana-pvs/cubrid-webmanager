import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginDatabase, registerDatabase, closeLoginDatabaseModal, fetchBackupSchedule, fetchQueryPlan } from '../databaseSlice';
import { fetchDatabaseUsers } from '../../user/userSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Toggle } from '../../../components/ds/forms/Toggle';
import { Typography } from '../../../components/ds/foundation/Typography';

// view states
const VIEW_FORM    = 'form';
const VIEW_LOADING = 'loading';
const VIEW_SUCCESS = 'success';
const VIEW_ERROR   = 'error';

export default function LoginDatabaseModal() {
  const dispatch = useDispatch();
  const { isLoginDatabaseModalOpen } = useSelector((state) => state.databaseUI);
  const { selectedDatabase } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);
  
  const [view, setView] = useState(VIEW_FORM);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({ dbuser: 'dba', dbpasswd: '' });
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isLoginDatabaseModalOpen) {
      setView(VIEW_FORM);
      setErrorMsg('');
      setFormData({ dbuser: 'dba', dbpasswd: '' });
      setRememberMe(true);
      setShowPassword(false);
    }
  }, [isLoginDatabaseModalOpen]);

  if (!isLoginDatabaseModalOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!formData.dbuser) return;
    
    setView(VIEW_LOADING);
    setErrorMsg('');

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
      
      setView(VIEW_SUCCESS);
      // Auto close after brief success message
      setTimeout(() => {
        dispatch(closeLoginDatabaseModal());
      }, 800);
    } catch (err) {
      setErrorMsg(typeof err === 'string' ? err : (err.message || 'Authentication failed. Please verify credentials.'));
      setView(VIEW_ERROR);
    }
  };

  const handleClose = () => dispatch(closeLoginDatabaseModal());

  /* ─── LOADING view ─── */
  if (view === VIEW_LOADING) {
    return (
      <Modal isOpen title="Authenticating" icon="lock" onClose={handleClose} maxWidth="440px">
        <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in fade-in duration-200">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-slate-100 dark:border-white/5" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-bk-yellow animate-spin" style={{ animationDuration: '0.9s' }} />
            <div className="absolute inset-0 flex items-center justify-center text-bk-yellow">
              <Icon name="security" size="md" weight={400} className="animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-1.5 px-8">
            <Typography variant="h4" className="text-[14px] font-black text-slate-800 dark:text-white tracking-tight">Verifying Credentials</Typography>
            <Typography variant="p" className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-[280px] mx-auto">
              Establishing secure session for <span className="font-black text-slate-900 dark:text-white font-mono">{selectedDatabase}</span>.
            </Typography>
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  if (view === VIEW_SUCCESS) {
    return (
      <Modal isOpen title="Access Granted" icon="lock_open" iconVariant="success" onClose={handleClose} maxWidth="440px">
        <div className="flex flex-col items-center justify-center py-12 gap-7 text-center animate-in fade-in duration-200">
          <div className="relative w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.3)]">
            <Icon name="verified" size="lg" weight={700} className="text-white" />
          </div>
          <div className="space-y-1 px-8">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">Session Established</Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 font-medium leading-relaxed">Identity verified. Redirecting to workspace...</Typography>
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (view === VIEW_ERROR) {
    return (
      <Modal isOpen title="Auth Failed" icon="lock" iconVariant="danger" onClose={handleClose} maxWidth="440px">
        <div className="flex flex-col items-center justify-center py-10 gap-6 text-center animate-in fade-in duration-200">
          <div className="relative w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)]">
            <Icon name="lock_reset" size="md" weight={300} className="text-white" />
          </div>
          <div className="space-y-2 px-6">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">Authentication Error</Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 font-medium leading-relaxed max-w-[300px] mx-auto">
              The credentials provided for <span className="font-black text-slate-900 dark:text-white font-mono">{selectedDatabase}</span> were rejected.
            </Typography>
          </div>
          <div className="w-full max-w-[340px] bg-rose-500/5 border border-rose-500/15 rounded-xl px-4 py-3 text-left">
             <Typography variant="caption" className="text-rose-400 font-mono leading-relaxed break-words block text-center uppercase tracking-widest text-[10px] font-bold italic">
              {errorMsg}
            </Typography>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleClose}>Dismiss</Button>
            <Button variant="primary" icon="refresh" onClick={() => { setView(VIEW_FORM); setErrorMsg(''); }}>Try Again</Button>
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── FORM view ─── */
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
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={handleLogin} icon="login" className="px-6 min-w-[120px]">Establish Session</Button>
        </div>
      }
    >
      <form onSubmit={handleLogin} className="space-y-6 pb-2">
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-linear-to-r from-amber-500/8 to-transparent dark:from-amber-500/10 dark:to-transparent p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Icon name="database" size="md" weight={300} className="text-amber-500" />
            </div>
            <div className="min-w-0 flex-1">
              <Typography variant="caption" className="font-black uppercase tracking-widest text-amber-600/70 dark:text-amber-400/60 mb-0.5">Target Workspace</Typography>
              <Typography variant="h4" className="text-[14px] font-black text-amber-700 dark:text-amber-400 font-mono truncate">{selectedDatabase}</Typography>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Locked</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Input label="Access Principal" value={formData.dbuser} onChange={(e) => handleInputChange('dbuser', e.target.value)} placeholder="dba" icon="account_circle" autoFocus />
          <div className="relative">
            <Input type={showPassword ? 'text' : 'password'} label="Cipher Key" value={formData.dbpasswd} onChange={(e) => handleInputChange('dbpasswd', e.target.value)} placeholder="Enter password" icon="password" />
            <button type="button" tabIndex={-1} onClick={() => setShowPassword(s => !s)} className="absolute right-3 bottom-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              <Icon name={showPassword ? 'visibility_off' : 'visibility'} size="16px" weight={300} />
            </button>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 transition-all hover:border-slate-200 dark:hover:border-white/10 group cursor-pointer" onClick={() => setRememberMe(v => !v)}>
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${rememberMe ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400'}`}>
              <Icon name={rememberMe ? 'verified' : 'security'} size="sm" weight={300} />
            </div>
            <div className="flex-1 min-w-0">
              <Typography variant="p" className={`text-[12px] font-black transition-colors ${rememberMe ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>Session Persistence</Typography>
              <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium block">Encrypt credentials for background auto-recon</Typography>
            </div>
            <Toggle checked={rememberMe} onChange={() => setRememberMe(v => !v)} />
          </div>
        </div>
      </form>
    </Modal>
  );
}
