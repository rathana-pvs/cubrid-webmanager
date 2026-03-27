import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginDatabase, registerDatabase, closeLoginDatabaseModal, fetchBackupSchedule, fetchQueryPlan } from '../databaseSlice';
import { fetchDatabaseUsers } from '../../user/userSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Typography } from '../../../components/ds/foundation/Typography';

// Minimal section header
const SectionHeader = ({ label }) => (
  <div className="flex items-center gap-3 mb-3">
    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</span>
    <div className="flex-1 h-px bg-slate-100 dark:bg-white/5" />
  </div>
);

// Slide toggle
const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={`w-9 h-5 rounded-full border-2 relative shrink-0 transition-all duration-200
      ${checked ? 'bg-amber-500 border-amber-500' : 'bg-slate-200 dark:bg-white/10 border-slate-300 dark:border-white/15'}`}
  >
    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-xs transition-all duration-200 ${checked ? 'left-[18px]' : 'left-0.5'}`} />
  </button>
);

export default function LoginDatabaseModal() {
  const dispatch = useDispatch();
  const { isLoginDatabaseModalOpen, selectedDatabase, actionLoading, error: sliceError } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);
  
  const [formData, setFormData] = useState({ dbuser: 'dba', dbpasswd: '' });
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isLoginDatabaseModalOpen) {
      setFormData({ dbuser: 'dba', dbpasswd: '' });
      setRememberMe(true);
      setError(null);
      setShowPassword(false);
    }
  }, [isLoginDatabaseModalOpen]);

  useEffect(() => {
    if (sliceError) setError(sliceError);
  }, [sliceError]);

  if (!isLoginDatabaseModalOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    if (!formData.dbuser) { setError('Database user is required.'); return; }
    
    if (rememberMe) {
      dispatch(registerDatabase({ 
        hostUid: selectedHostUid, 
        dbname: selectedDatabase, 
        payload: { id: formData.dbuser, password: formData.dbpasswd } 
      }));
    }

    dispatch(loginDatabase({ 
      hostUid: selectedHostUid, 
      dbname: selectedDatabase, 
      payload: formData 
    })).unwrap()
      .then(() => {
        dispatch(fetchDatabaseUsers({ hostUid: selectedHostUid, dbname: selectedDatabase }));
        dispatch(fetchBackupSchedule({ hostUid: selectedHostUid, dbname: selectedDatabase }));
        dispatch(fetchQueryPlan({ hostUid: selectedHostUid, dbname: selectedDatabase }));
      })
      .catch((err) => {
        setError(err || 'Failed to authenticate with database.');
      });
  };

  return (
    <Modal
      isOpen={isLoginDatabaseModalOpen}
      onClose={() => dispatch(closeLoginDatabaseModal())}
      title="Database Authentication"
      subtitle="Verify your credentials to manage this instance"
      icon="lock"
      maxWidth="max-w-[440px]"
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <button
            type="button"
            onClick={() => dispatch(closeLoginDatabaseModal())}
            disabled={actionLoading}
            className="text-[12px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors px-2"
          >
            Cancel
          </button>
          <Button 
            variant="primary" 
            onClick={handleLogin} 
            loading={actionLoading}
            icon="login"
            className="px-6"
          >
            Sign In
          </Button>
        </div>
      }
    >
      <form onSubmit={handleLogin} className="space-y-6 pb-2">

        {/* Target Database Banner */}
        <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-linear-to-r from-amber-500/8 path-to-transparent dark:from-amber-500/10 dark:to-transparent p-4">
          <div className="absolute right-0 top-0 w-24 h-full bg-linear-to-l from-amber-500/5 path-to-transparent pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Icon name="database" size="md" weight={300} className="text-amber-500" />
            </div>
            <div className="min-w-0 flex-1">
              <Typography variant="p" className="text-[10px] font-bold uppercase tracking-widest text-amber-600/70 dark:text-amber-400/60 mb-0.5">
                Connecting To
              </Typography>
              <Typography variant="p" className="text-[14px] font-bold text-amber-700 dark:text-amber-400 font-mono truncate">
                {selectedDatabase}
              </Typography>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Locked</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-500/8 border border-rose-500/15 rounded-xl flex gap-3 items-start animate-in slide-in-from-top-2 duration-200">
            <Icon name="error" size="sm" weight={300} className="text-rose-500 shrink-0 mt-0.5" />
            <Typography variant="p" className="text-[12px] text-rose-600 dark:text-rose-400 font-medium leading-relaxed">
              {typeof error === 'string' ? error : JSON.stringify(error)}
            </Typography>
          </div>
        )}

        {/* Credentials Section */}
        <div>
          <SectionHeader label="Identity & Access" />
          <div className="space-y-4">
            <Input 
              label="Username"
              value={formData.dbuser}
              onChange={(e) => handleInputChange('dbuser', e.target.value)}
              placeholder="dba"
              icon="account_circle"
              autoFocus
            />

            <div className="relative">
              <Input 
                type={showPassword ? 'text' : 'password'}
                label="Password"
                value={formData.dbpasswd}
                onChange={(e) => handleInputChange('dbpasswd', e.target.value)}
                placeholder="Enter password"
                icon="password"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 bottom-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} size="16px" weight={300} />
              </button>
            </div>
          </div>
        </div>

        {/* Persistence Section */}
        <div>
          <SectionHeader label="Security Persistence" />
          <button
            type="button"
            onClick={() => setRememberMe(v => !v)}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-left cursor-pointer group
              ${rememberMe 
                ? 'bg-amber-500/5 border-amber-500/25 dark:border-amber-500/20 shadow-xs' 
                : 'bg-slate-50/50 dark:bg-white/2 border-slate-200 dark:border-white/8 hover:border-slate-300 dark:hover:border-white/15'
              }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-all
              ${rememberMe 
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' 
                : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400'
              }`}
            >
              <Icon name={rememberMe ? 'verified' : 'security'} size="sm" weight={300} />
            </div>
            <div className="flex-1 min-w-0">
              <Typography variant="p" className={`text-[12px] font-bold transition-colors ${rememberMe ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                Auto-connect Session
              </Typography>
              <Typography variant="p" className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                Store credentials for instant background login
              </Typography>
            </div>
            <Toggle checked={rememberMe} onChange={() => setRememberMe(v => !v)} />
          </button>
        </div>

        {/* Security Hint */}
        <div className="flex items-center gap-2.5 px-1 py-1 group cursor-default">
          <div className="p-1 rounded-sm bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:text-amber-500 transition-colors">
            <Icon name="info" size="14px" weight={300} />
          </div>
          <Typography variant="p" className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed italic">
            Connection handles are encrypted and scoped to your local browser environment.
          </Typography>
        </div>

      </form>
    </Modal>
  );
}
