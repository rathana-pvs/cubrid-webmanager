import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeBackupDatabaseModal, backupDatabase, fetchBackupDbInfo } from '../databaseSlice';
import { showStatusModal } from '../../layout/layoutSlice';

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

export default function BackupDatabaseModal() {
  const dispatch = useDispatch();
  const { isBackupDatabaseModalOpen, selectedDatabase, actionLoading, databaseBackupInfo } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);

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

  if (!isBackupDatabaseModalOpen) return null;

  const handleInputChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleBackup = async () => {
    if (!formData.volPath || !formData.backupDir) {
      dispatch(showStatusModal({ type: 'error', title: 'Validation Error', message: "Volume path and Backup directory are required." }));
      return;
    }
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
      dispatch(showStatusModal({ type: 'success', title: 'Backup Successful', message: `"${selectedDatabase}" backed up to "${formData.backupDir}".` }));
      dispatch(closeBackupDatabaseModal());
    } catch (err) {
      dispatch(showStatusModal({ type: 'error', title: 'Backup Failed', message: typeof err === 'string' ? err : (err.message || 'An error occurred.') }));
    }
  };

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

  return (
    <Modal
      isOpen={isBackupDatabaseModalOpen}
      onClose={() => dispatch(closeBackupDatabaseModal())}
      title="Backup Database"
      subtitle="Create a persistent snapshot of your database volumes"
      icon="backup"
      maxWidth="max-w-[600px]"
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <button
            type="button"
            onClick={() => dispatch(closeBackupDatabaseModal())}
            disabled={actionLoading}
            className="text-[12px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors px-2"
          >
            Cancel
          </button>
          <Button variant="primary" onClick={handleBackup} loading={actionLoading} icon="play_circle">
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
                  <span className={`text-[12px] font-bold transition-colors block mb-1 ${isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'}`}>
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-left
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
                    <span className={`block text-[12px] font-semibold transition-colors ${isOn ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                      {opt.label}
                    </span>
                    <span className="block text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                      {opt.desc}
                    </span>
                  </div>
                  <Toggle checked={isOn} onChange={() => handleInputChange(opt.field, !isOn)} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
