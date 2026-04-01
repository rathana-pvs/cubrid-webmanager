import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeCopyDatabaseModal, copyDatabase, fetchDatabaseStartInfo } from '../databaseSlice';

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

function FlagCard({ icon, label, description, checked, onChange, variant = 'primary' }) {
  return (
    <div 
      className={`flex items-center gap-4 p-4 border rounded-2xl transition-all duration-200 cursor-pointer select-none
        ${checked
          ? variant === 'danger' ? 'bg-rose-500/5 border-rose-500/25 shadow-[0_2px_16px_rgba(244,63,94,0.04)]' : 'bg-bk-yellow/5 border-bk-yellow/25 shadow-[0_2px_16px_rgba(255,193,7,0.04)]'
          : 'bg-white dark:bg-white/2 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10'}`}
      onClick={() => onChange(!checked)}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all shrink-0
        ${checked 
          ? variant === 'danger' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-bk-yellow/10 border-bk-yellow/20 text-bk-yellow' 
          : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400'}`}>
        <Icon name={icon} size="xs" weight={300} />
      </div>
      <div className="flex-1 min-w-0">
        <Typography variant="p" className={`font-bold text-[11.5px] tracking-tight transition-colors ${checked ? (variant === 'danger' ? 'text-rose-500' : 'text-bk-yellow') : 'text-slate-900 dark:text-white'}`}>
          {label}
        </Typography>
        <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium mt-0.5 leading-snug">
          {description}
        </Typography>
      </div>
      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        <Toggle 
          variant={variant}
          checked={checked}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

export default function CopyDatabaseModal() {
  const dispatch = useDispatch();
  const { isCopyDatabaseModalOpen } = useSelector((state) => state.databaseUI, shallowEqual);
  const { selectedDatabase } = useSelector((state) => state.database, shallowEqual);
  const { selectedHostUid } = useSelector((state) => state.host, shallowEqual);

  const [view, setView] = useState(VIEW_FORM);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    destName: '',
    destPath: '/home/cubrid/CUBRID/databases/',
    extPath: '/home/cubrid/CUBRID/databases/',
    logPath: '/home/cubrid/CUBRID/databases/',
    replaceExisting: false,
    deleteSource: false,
  });

  useEffect(() => {
    if (isCopyDatabaseModalOpen) {
      setView(VIEW_FORM);
      setErrorMsg('');
      setFormData({
        destName: '',
        destPath: '/home/cubrid/CUBRID/databases/',
        extPath: '/home/cubrid/CUBRID/databases/',
        logPath: '/home/cubrid/CUBRID/databases/',
        replaceExisting: false,
        deleteSource: false,
      });
    }
  }, [isCopyDatabaseModalOpen]);

  if (!isCopyDatabaseModalOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCopy = async () => {
    if (!formData.destName.trim()) return;
    
    setView(VIEW_LOADING);
    setErrorMsg('');

    const payload = {
      srcdbname: selectedDatabase,
      destdbname: formData.destName.trim(),
      destdbpath: formData.destPath,
      exvolpath: formData.extPath,
      logpath: formData.logPath,
      overwrite: formData.replaceExisting ? 'y' : 'n',
      move: formData.deleteSource ? 'y' : 'n',
      advanced: 'off',
    };

    try {
      await dispatch(copyDatabase({ hostUid: selectedHostUid, payload })).unwrap();
      dispatch(fetchDatabaseStartInfo(selectedHostUid));
      setView(VIEW_SUCCESS);
    } catch (err) {
      setErrorMsg(typeof err === 'string' ? err : (err.message || 'The cloning sequence was interrupted. Please verify disk space and connectivity.'));
      setView(VIEW_ERROR);
    }
  };

  const handleClose = () => dispatch(closeCopyDatabaseModal());

  /* ─── LOADING view ─── */
  if (view === VIEW_LOADING) {
    return (
      <Modal isOpen title="Cloning Instance" icon="content_copy" onClose={handleClose} maxWidth="580px">
        <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in fade-in duration-200">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-slate-100 dark:border-white/5" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-bk-yellow animate-spin" style={{ animationDuration: '0.9s' }} />
            <div className="absolute inset-[10px] rounded-full border-[1.5px] border-transparent border-b-bk-yellow/30 animate-spin" style={{ animationDuration: '1.7s', animationDirection: 'reverse' }} />
            <div className="absolute inset-0 flex items-center justify-center text-bk-yellow">
              <Icon name="content_copy" size="md" weight={400} className="animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-1.5 px-8">
            <Typography variant="h4" className="text-[14px] font-black text-slate-800 dark:text-white tracking-tight">Synchronizing Volumes</Typography>
            <Typography variant="p" className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-[280px] mx-auto">
              Duplicating block storage and environment registry to <span className="font-black text-slate-900 dark:text-white">{formData.destName}</span>.
            </Typography>
          </div>
          <div className="w-32 h-[2px] bg-slate-100 dark:bg-white/4 rounded-full overflow-hidden">
            <div className="h-full bg-bk-yellow rounded-full" style={{ animation: 'modalSlide 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  if (view === VIEW_SUCCESS) {
    return (
      <Modal isOpen title="Cloning Complete" icon="content_copy" iconVariant="success" onClose={handleClose} maxWidth="580px">
        <div className="flex flex-col items-center justify-center py-12 gap-7 text-center animate-in fade-in duration-200">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.3)]">
              <Icon name="verified" size="lg" weight={700} className="text-white" />
            </div>
          </div>

          <div className="space-y-2 px-8">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
              Instance Duplicated
            </Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 font-medium leading-relaxed max-w-[340px] mx-auto">
              Clone <span className="font-bold text-slate-900 dark:text-white">{formData.destName}</span> has been established and registered successfully.
            </Typography>
          </div>

          <Button variant="secondary" onClick={handleClose}>Access Clone</Button>
        </div>
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (view === VIEW_ERROR) {
    return (
      <Modal isOpen title="Cloning Failed" icon="content_copy" iconVariant="danger" onClose={handleClose} maxWidth="580px">
        <div className="flex flex-col items-center justify-center py-10 gap-6 text-center animate-in fade-in duration-200">
          <div className="relative">
            <div className="absolute inset-0 bg-rose-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <Icon name="error" size="md" weight={300} className="text-white" />
            </div>
          </div>

          <div className="space-y-2 px-6">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
              Action Interrupted
            </Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 font-medium leading-relaxed">
              System could not finalize the clone of <span className="font-black text-slate-900 dark:text-white">{selectedDatabase}</span>.
            </Typography>
          </div>

          <div className="w-full max-w-[420px] bg-rose-500/5 border border-rose-500/15 rounded-xl px-4 py-3 text-left">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon name="terminal" size="xs" weight={300} className="text-rose-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-400">Error Manifest</span>
            </div>
            <Typography variant="caption" className="text-rose-400/80 font-mono leading-relaxed break-words">
              {errorMsg}
            </Typography>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleClose}>Dismiss</Button>
            <Button variant="primary" icon="refresh" onClick={() => { setView(VIEW_FORM); setErrorMsg(''); }}>
              Retry Clone
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── FORM view ─── */
  return (
    <Modal
      isOpen={isCopyDatabaseModalOpen}
      onClose={handleClose}
      title="Clone Database"
      subtitle="Duplicate volumes and environment registry"
      icon="content_copy"
      maxWidth="580px"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCopy}
            icon="content_copy"
            disabled={!formData.destName.trim()}
          >
            Execute Clone
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Source -> Destination */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-white/4 border border-slate-100 dark:border-white/8 rounded-2xl">
            <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-white/8 flex items-center justify-center shrink-0">
              <Icon name="database" size="sm" weight={300} className="text-slate-500 dark:text-slate-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">Source</p>
              <p className="text-[12px] font-black text-slate-700 dark:text-slate-200 truncate">{selectedDatabase}</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-0 shrink-0">
            <div className="w-6 h-px bg-bk-yellow/40" />
            <div className="w-7 h-7 rounded-full bg-bk-yellow/10 border border-bk-yellow/20 flex items-center justify-center">
              <Icon name="arrow_forward" size="sm" weight={700} className="text-bk-yellow text-[11px]!" />
            </div>
            <div className="w-6 h-px bg-bk-yellow/40" />
          </div>

          <div className="flex-1">
            <Input
              label="Clone Identifier"
              value={formData.destName}
              onChange={e => handleInputChange('destName', e.target.value)}
              placeholder="e.g. clone_db"
              autoFocus
              icon="content_copy"
              className="font-bold!"
            />
          </div>
        </div>

        {/* Path configuration */}
        <div className="bg-white dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="folder_open" size="14px" weight={400} className="text-bk-yellow" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Paths</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {[
              { label: 'Primary Volume Root', field: 'destPath', icon: 'folder' },
              { label: 'Extended Shard Root', field: 'extPath', icon: 'folder_copy' },
              { label: 'Transaction Log Path', field: 'logPath', icon: 'description' },
            ].map(({ label, field, icon }) => (
              <Input
                key={field}
                label={label}
                value={formData[field]}
                onChange={e => handleInputChange(field, e.target.value)}
                icon={icon}
                size="sm"
                className="font-mono! text-[11px]!"
              />
            ))}
          </div>
        </div>

        {/* Action Flags */}
        <div className="space-y-3">
          <FlagCard
            icon="sync"
            label="Overwrite Existing Environment"
            description="Replace destination files if a database with this name already exists."
            checked={formData.replaceExisting}
            onChange={v => handleInputChange('replaceExisting', v)}
          />
          <FlagCard
            icon="move_up"
            label="Transform to Move Operation"
            description="Remove source files after the clone is successfully finalized."
            checked={formData.deleteSource}
            onChange={v => handleInputChange('deleteSource', v)}
            variant="danger"
          />
        </div>
      </div>
    </Modal>
  );
}
