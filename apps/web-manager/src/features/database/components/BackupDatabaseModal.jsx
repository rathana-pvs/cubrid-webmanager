import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeBackupDatabaseModal, backupDatabase, fetchBackupDbInfo } from '../databaseSlice';

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

// Minimal section header
const SectionHeader = ({ label }) => (
  <div className="flex items-center gap-3 mb-3">
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</span>
    <div className="flex-1 h-px bg-slate-100 dark:bg-white/5" />
  </div>
);

export default function BackupDatabaseModal() {
  const dispatch = useDispatch();
  const { isBackupDatabaseModalOpen } = useSelector((state) => state.databaseUI);
  const { selectedDatabase } = useSelector((state) => state.database);
  const { backupDbInfo: databaseBackupInfo } = useSelector((state) => state.databaseOperation);
  const { selectedHostUid } = useSelector((state) => state.host);

  const [view, setView] = useState(VIEW_FORM);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    volPath: `${selectedDatabase}_backup_lv0`,
    backupId: '0',
    backupLevel: 'level 0',
    backupDir: '',
    parallelBackup: '0',
    checkConsistency: true,
    deleteUnnecessary: false,
    compress: true
  });

  useEffect(() => {
    if (selectedDatabase) {
      setFormData(prev => ({ ...prev, volPath: `${selectedDatabase}_backup_lv0` }));
      if (isBackupDatabaseModalOpen && selectedHostUid) {
        dispatch(fetchBackupDbInfo({ hostUid: selectedHostUid, dbname: selectedDatabase }));
      }
    }
  }, [selectedDatabase, isBackupDatabaseModalOpen, selectedHostUid, dispatch]);

  useEffect(() => {
    if (selectedDatabase && databaseBackupInfo[selectedDatabase]) {
      const { dbdir } = databaseBackupInfo[selectedDatabase];
      if (dbdir && !formData.backupDir) {
        setFormData(prev => ({ ...prev, backupDir: `${dbdir}/backup` }));
      }
    }
  }, [selectedDatabase, databaseBackupInfo]);

  useEffect(() => {
    if (isBackupDatabaseModalOpen) {
      setView(VIEW_FORM);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isBackupDatabaseModalOpen]);

  if (!isBackupDatabaseModalOpen) return null;

  const handleInputChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleBackup = async () => {
    if (!formData.volPath || !formData.backupDir) {
      setErrorMsg("Volume path and Backup directory are required.");
      setView(VIEW_ERROR);
      return;
    }

    setView(VIEW_LOADING);
    try {
      const payload = {
        level: formData.backupLevel.split(' ')[1],
        volname: formData.volPath,
        backupdir: formData.backupDir,
        removelog: formData.deleteUnnecessary ? 'y' : 'n',
        check: formData.checkConsistency ? 'y' : 'n',
        mt: formData.parallelBackup,
        zip: formData.compress ? 'y' : 'n',
        safereplication: 'n'
      };
      await dispatch(backupDatabase({ hostUid: selectedHostUid, dbname: selectedDatabase, payload })).unwrap();
      setSuccessMsg(`Database "${selectedDatabase}" has been successfully backed up to "${formData.backupDir}".`);
      setView(VIEW_SUCCESS);
    } catch (err) {
      setErrorMsg(typeof err === 'string' ? err : (err.message || 'An unexpected error occurred during backup.'));
      setView(VIEW_ERROR);
    }
  };

  const handleClose = () => dispatch(closeBackupDatabaseModal());

  const levels = [
    { level: 'level 0', label: 'L0', title: 'Full', desc: 'Complete snapshot of all data', icon: 'layers' },
    { level: 'level 1', label: 'L1', title: 'Incremental', desc: 'Changes since last L0 or L1', icon: 'trending_up' },
    { level: 'level 2', label: 'L2', title: 'Differential', desc: 'Changes since last L1', icon: 'call_split' }
  ];

  const flags = [
    { field: 'checkConsistency', icon: 'verified_user', label: 'Consistency Check', desc: 'Validate block-level integrity of volumes' },
    { field: 'deleteUnnecessary', icon: 'cleaning_services', label: 'Purge Archived Logs', desc: 'Remove transaction logs already archived' },
    { field: 'compress', icon: 'compress', label: 'Compress Output', desc: 'Reduce file size with stream compression' },
  ];

  /* ─── LOADING view ─── */
  if (view === VIEW_LOADING) {
    return (
      <Modal isOpen title="Backup Database" icon="backup" onClose={handleClose} maxWidth="540px">
        <div className="flex flex-col items-center justify-center py-12 gap-7 text-center animate-in fade-in duration-200">
          <div className="relative w-[72px] h-[72px]">
            <div className="absolute inset-0 rounded-full border-2 border-slate-100 dark:border-white/5" />
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-bk-yellow animate-spin"
              style={{ animationDuration: '0.9s' }}
            />
            <div
              className="absolute inset-[10px] rounded-full border-[1.5px] border-transparent border-b-bk-yellow/35 animate-spin"
              style={{ animationDuration: '1.7s', animationDirection: 'reverse' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-bk-yellow shadow-[0_0_10px_3px_rgba(255,193,7,0.3)] animate-pulse" />
            </div>
          </div>

          <div className="space-y-1.5 px-8">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
              Initializing Backup
            </Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium max-w-[280px] mx-auto leading-relaxed">
              Consolidating pages and initializing data streams for <span className="text-slate-900 dark:text-white font-black">{selectedDatabase}</span>.
            </Typography>
          </div>

          <div className="w-44 h-[2px] bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-bk-yellow rounded-full"
              style={{ animation: 'modalSlide 1.5s ease-in-out infinite' }}
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-white/4 border border-slate-100 dark:border-white/5">
            <div className="w-1.5 h-1.5 rounded-full bg-bk-yellow animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">In Progress</span>
          </div>

          <style>{`
            @keyframes modalSlide {
              0%   { transform: translateX(-100%); width: 50%; }
              50%  { transform: translateX(100%);  width: 60%; }
              100% { transform: translateX(200%);  width: 50%; }
            }
          `}</style>
        </div>
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  if (view === VIEW_SUCCESS) {
    return (
      <Modal isOpen title="Backup Database" icon="backup" iconVariant="success" onClose={handleClose} maxWidth="540px">
        <div className="flex flex-col items-center justify-center py-12 gap-7 text-center animate-in fade-in duration-200">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.3)]">
              <Icon name="check" size="lg" weight={700} className="text-white" />
            </div>
          </div>

          <div className="space-y-2 px-8">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
              Backup Successful
            </Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[320px] mx-auto">
              System snapshot for <span className="font-black text-slate-900 dark:text-white">{selectedDatabase}</span> has been captured.
            </Typography>
          </div>

          {successMsg && (
            <div className="w-full max-w-[380px] bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-4 py-3.5 text-left">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon name="folder_zip" size="xs" weight={300} className="text-emerald-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Destination</span>
              </div>
              <Typography variant="caption" className="text-emerald-600 dark:text-emerald-400/80 font-medium leading-relaxed break-all">
                {successMsg}
              </Typography>
            </div>
          )}

          <Button variant="secondary" onClick={handleClose}>Close</Button>
        </div>
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (view === VIEW_ERROR) {
    return (
      <Modal isOpen title="Backup Database" icon="backup" iconVariant="danger" onClose={handleClose} maxWidth="540px">
        <div className="flex flex-col items-center justify-center py-10 gap-6 text-center animate-in fade-in duration-200">
          <div className="relative">
            <div className="absolute inset-0 bg-rose-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <Icon name="error" size="md" weight={300} className="text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
              Capture Failed
            </Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[300px] mx-auto">
              We encountered a technical issue while backing up the database volumes.
            </Typography>
          </div>

          <div className="w-full max-w-[380px] bg-rose-500/5 border border-rose-500/15 rounded-xl px-4 py-3 text-left">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon name="terminal" size="xs" weight={300} className="text-rose-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-400">Error Detail</span>
            </div>
            <Typography variant="caption" className="text-rose-400/80 font-mono leading-relaxed break-words">
              {errorMsg}
            </Typography>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleClose}>Close</Button>
            <Button variant="danger" icon="refresh" onClick={() => { setView(VIEW_FORM); setErrorMsg(''); }}>
              Try Again
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── FORM view ─── */
  return (
    <Modal
      isOpen={isBackupDatabaseModalOpen}
      onClose={handleClose}
      title="Backup Database"
      subtitle="Create a persistent snapshot of your database volumes"
      icon="backup"
      maxWidth="600px"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={handleBackup} icon="play_circle">
            Run Backup
          </Button>
        </div>
      }
    >
      <div className="space-y-6 pb-1">

        {/* Database Info Banner */}
        <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-linear-to-r from-amber-500/8 via-amber-500/4 to-transparent dark:from-amber-500/10 dark:via-amber-500/5 dark:to-transparent p-4">
          <div className="absolute right-0 top-0 w-32 h-full bg-linear-to-l from-amber-500/5 to-transparent pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Icon name="database" size="md" weight={300} className="text-amber-500" />
            </div>
            <div className="min-w-0 flex-1">
              <Typography variant="p" className="text-[10px] font-bold uppercase tracking-widest text-amber-600/70 dark:text-amber-400/60 mb-0.5">
                Target Database
              </Typography>
              <Typography variant="p" className="text-[14px] font-bold text-amber-700 dark:text-amber-400 font-mono truncate">
                {selectedDatabase || 'N/A'}
              </Typography>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Ready</span>
            </div>
          </div>
        </div>

        {/* Backup Level */}
        <div>
          <SectionHeader label="Backup Strategy" />
          <div className="grid grid-cols-3 gap-2.5">
            {levels.map(item => {
              const isSelected = formData.backupLevel === item.level;
              return (
                <button
                  key={item.level}
                  type="button"
                  onClick={() => handleInputChange('backupLevel', item.level)}
                  className={`flex flex-col items-center text-center p-4 rounded-xl border transition-all duration-200 group
                    ${isSelected
                      ? 'bg-amber-500/8 border-amber-500/30 dark:bg-amber-500/10 dark:border-amber-500/25 shadow-xs'
                      : 'bg-slate-50/50 dark:bg-white/2 border-slate-200 dark:border-white/8 hover:border-slate-300 dark:hover:border-white/15 hover:bg-white dark:hover:bg-white/4'
                    }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 transition-all
                    ${isSelected ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}
                  >
                    <Icon name={item.icon} size="sm" weight={300} />
                  </div>
                  <span className={`text-[12px] font-black transition-colors block mb-1 ${isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'}`}>
                    {item.title}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-tight">
                    {item.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Storage Configuration */}
        <div>
          <SectionHeader label="Storage Configuration" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <Input
              label="Volume Name"
              value={formData.volPath}
              onChange={(e) => handleInputChange('volPath', e.target.value)}
              placeholder="db_backup_lv0"
              icon="folder_zip"
            />
            <Input
              label="Revision ID"
              value={formData.backupId}
              onChange={(e) => handleInputChange('backupId', e.target.value)}
              icon="tag"
              placeholder="0"
            />
            <div className="col-span-2">
              <Input
                label="Backup Directory"
                value={formData.backupDir}
                onChange={(e) => handleInputChange('backupDir', e.target.value)}
                placeholder="/var/lib/cubrid/backup"
                icon="drive_file_move"
              />
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                label="Parallel Threads"
                description="Number of concurrent backup streams (based on CPU cores)"
                value={formData.parallelBackup}
                onChange={(e) => handleInputChange('parallelBackup', e.target.value)}
                icon="speed"
                suffix="Threads"
              />
            </div>
          </div>
        </div>

        {/* Options */}
        <div>
          <SectionHeader label="Options" />
          <div className="space-y-2">
            {flags.map(opt => {
              const isOn = formData[opt.field];
              return (
                <button
                  key={opt.field}
                  type="button"
                  onClick={() => handleInputChange(opt.field, !isOn)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-left cursor-pointer
                    ${isOn
                      ? 'bg-amber-500/5 border-amber-500/20 dark:bg-amber-500/8 dark:border-amber-500/15'
                      : 'bg-slate-50/50 dark:bg-white/2 border-slate-200 dark:border-white/8 hover:border-slate-300 dark:hover:border-white/15'
                    }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-all
                    ${isOn
                      ? 'bg-amber-500/10 border-amber-500/25 text-amber-500'
                      : 'bg-slate-100 dark:bg-white/5 border-transparent text-slate-400'
                    }`}
                  >
                    <Icon name={opt.icon} size="sm" weight={300} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`block text-[12px] font-bold transition-colors ${isOn ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                      {opt.label}
                    </span>
                    <span className="block text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                      {opt.desc}
                    </span>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Toggle checked={isOn} onChange={(val) => handleInputChange(opt.field, val)} variant="primary" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
