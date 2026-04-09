import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeBackupDatabaseModal, backupDatabase, fetchBackupDbInfo } from '../databaseSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { StatusBadge } from '../../../components/ds/foundation/StatusBadge';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Toggle } from '../../../components/ds/forms/Toggle';
import { Typography } from '../../../components/ds/foundation/Typography';
import { SectionHeader } from '../../../components/ds/foundation/SectionHeader';
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

export default function BackupDatabaseModal() {
  const dispatch = useDispatch();
  const { isBackupDatabaseModalOpen } = useSelector((state) => state.databaseUI, shallowEqual);
  const { selectedDatabase } = useSelector((state) => state.database, shallowEqual);
  const { backupDbInfo: databaseBackupInfo } = useSelector((state) => state.databaseOperation, shallowEqual);
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
      resetAction();
    }
  }, [isBackupDatabaseModalOpen, resetAction]);

  if (!isBackupDatabaseModalOpen) return null;

  const handleInputChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleBackup = async () => {
    if (!formData.volPath || !formData.backupDir) {
      endError("Volume path and Backup directory are required.");
      return;
    }

    startAction();
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
      endSuccess(`Database "${selectedDatabase}" has been successfully backed up to "${formData.backupDir}".`);
    } catch (err) {
      endError(err);
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
  if (isLoading) {
    return (
      <Modal isOpen title="Backup Database" icon="backup" onClose={handleClose} maxWidth="720px">
        <ModalStatusLoading 
          title="Snapshot In Progress" 
          subtitle={`The system is consolidating data volumes and capturing a consistent snapshot for ${selectedDatabase}.`} 
        />
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  if (isSuccess) {
    return (
      <Modal isOpen title="Backup Completed" icon="backup" iconVariant="success" onClose={handleClose} maxWidth="720px">
        <ModalStatusSuccess 
          title="Snapshot Secured"
          message={`A complete backup of ${selectedDatabase} has been written to: ${formData.backupDir}.`}
          onConfirm={handleClose}
          confirmText="Acknowledge"
        />
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (isError) {
    return (
      <Modal isOpen title="Backup Failed" icon="backup" iconVariant="danger" onClose={resetAction} maxWidth="720px">
        <ModalStatusError 
          title="Operation Interrupted"
          error={error}
          onRetry={handleBackup}
          onCancel={resetAction}
          retryText="Retry Backup"
          cancelText="Dismiss"
        />
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
          <Button variant="secondary" onClick={handleClose}>Discard</Button>
          <Button variant="primary" onClick={handleBackup} icon="play_circle" className="min-w-[140px]">
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
            <StatusBadge label="Ready" variant="emerald" pulse={true} className="rounded-full" />
          </div>
        </div>

        {/* Backup Level */}
        <div>
          <SectionHeader title="Backup Strategy" icon="layers" />
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
          <SectionHeader title="Storage Configuration" icon="storage" />
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
          <SectionHeader title="Options" icon="tune" />
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
