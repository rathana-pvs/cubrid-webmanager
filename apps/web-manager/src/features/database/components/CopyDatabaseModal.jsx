import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeCopyDatabaseModal, copyDatabase, fetchDatabaseStartInfo } from '../databaseSlice';
import { showStatusModal } from '../../layout/layoutSlice';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import ErrorOverlay from '../../../components/common/ErrorOverlay';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Typography } from '../../../components/ds/foundation/Typography';

// Compact flag toggle card
function FlagCard({ icon, label, description, checked, onChange, color = 'amber' }) {
  const colors = {
    amber: {
      active: 'bg-amber-500/8 border-amber-500/30',
      icon: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      label: 'text-amber-500',
      indicator: 'bg-amber-500',
    },
    rose: {
      active: 'bg-rose-500/8 border-rose-500/30',
      icon: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      label: 'text-rose-500',
      indicator: 'bg-rose-500',
    },
  };
  const c = colors[color];
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-full text-left flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-150 cursor-pointer overflow-hidden
        ${checked
          ? c.active
          : 'bg-slate-50/50 dark:bg-white/2 border-slate-100 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-white/5'
        }`}
    >
      <div className={`shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${checked ? c.icon : 'bg-slate-100 dark:bg-white/5 border-transparent text-slate-400'}`}>
        <Icon name={icon} size="sm" weight={300} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[11.5px] font-semibold leading-none mb-0.5 transition-colors ${checked ? c.label : 'text-slate-800 dark:text-slate-200'}`}>
          {label}
        </p>
        <p className="text-[10px] text-slate-500 dark:text-slate-500 font-medium leading-relaxed">{description}</p>
      </div>
      {/* Toggle pill */}
      <div className={`shrink-0 w-9 h-5 rounded-full transition-all duration-200 relative ${checked ? c.indicator : 'bg-slate-200 dark:bg-white/10'}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${checked ? 'left-[calc(100%-18px)]' : 'left-0.5'}`} />
      </div>
    </button>
  );
}

export default function CopyDatabaseModal() {
  const dispatch = useDispatch();
  const { isCopyDatabaseModalOpen, selectedDatabase, actionLoading, error: sliceError } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);

  const [formData, setFormData] = useState({
    destName: '',
    destPath: '/home/cubrid/CUBRID/databases/',
    extPath: '/home/cubrid/CUBRID/databases/',
    logPath: '/home/cubrid/CUBRID/databases/',
    replaceExisting: false,
    deleteSource: false,
  });
  const [localError, setLocalError] = useState(null);

  // Sync slice error to local state
  useEffect(() => {
    if (sliceError) setLocalError(sliceError);
  }, [sliceError]);

  // Reset on open
  useEffect(() => {
    if (isCopyDatabaseModalOpen) {
      setFormData({
        destName: '',
        destPath: '/home/cubrid/CUBRID/databases/',
        extPath: '/home/cubrid/CUBRID/databases/',
        logPath: '/home/cubrid/CUBRID/databases/',
        replaceExisting: false,
        deleteSource: false,
      });
      setLocalError(null);
    }
  }, [isCopyDatabaseModalOpen]);

  if (!isCopyDatabaseModalOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCopy = async () => {
    if (!formData.destName.trim()) {
      setLocalError('Please provide a destination database name.');
      return;
    }
    
    setLocalError(null);
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
      
      // On Success: modal is closed by the slice
      // Refetch database list
      dispatch(fetchDatabaseStartInfo(selectedHostUid));
      
      // Show success notification
      dispatch(showStatusModal({
        type: 'success',
        title: 'Clone started',
        message: `Database "${selectedDatabase}" is being cloned to "${formData.destName.trim()}".`
      }));
    } catch (err) {
      // Error handled by slice and synced to localError via useEffect
    }
  };

  const footer = (
    <>
      <Button variant="ghost" onClick={() => dispatch(closeCopyDatabaseModal())} disabled={actionLoading}>
        Cancel
      </Button>
      <Button
        onClick={handleCopy}
        loading={actionLoading}
        icon="content_copy"
        disabled={!formData.destName.trim()}
        className="min-w-[130px]"
      >
        Clone Database
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isCopyDatabaseModalOpen}
      onClose={() => dispatch(closeCopyDatabaseModal())}
      title="Clone Database"
      subtitle="Duplicate volumes, logs, and configuration to a new target"
      icon="content_copy"
      maxWidth="max-w-[580px]"
      footer={footer}
    >
      <div className="relative">
        <LoadingOverlay 
          isVisible={actionLoading} 
          title="Cloning Database" 
          subtitle="Synchronizing volumes and building new registry environment..." 
        />
        
        <ErrorOverlay 
          isVisible={!!localError && !actionLoading} 
          error={localError} 
          onRetry={handleCopy}
          onClose={() => setLocalError(null)}
        />

        <div className="space-y-5">
          {/* ── Source → Destination Flow ── */}
          <div className="flex items-center gap-2">
            {/* Source pill */}
            <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-100 dark:bg-white/4 border border-slate-200 dark:border-white/8 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-white/8 flex items-center justify-center shrink-0">
                <Icon name="database" size="sm" weight={300} className="text-slate-500 dark:text-slate-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[9.5px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">Source</p>
                <p className="text-[12px] font-bold text-slate-700 dark:text-slate-200 truncate">{selectedDatabase}</p>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <div className="w-6 h-px bg-amber-500/40" />
              <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Icon name="arrow_forward" size="sm" weight={400} className="text-amber-500 text-[13px]!" />
              </div>
              <div className="w-6 h-px bg-amber-500/40" />
            </div>

            {/* Destination name input pill */}
            <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl transition-all focus-within:border-amber-500/50">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Icon name="content_copy" size="sm" weight={300} className="text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9.5px] font-semibold uppercase tracking-widest text-amber-500/70 mb-0.5">Clone name</p>
                <input
                  type="text"
                  value={formData.destName}
                  onChange={e => handleInputChange('destName', e.target.value)}
                  placeholder="e.g. clone_db"
                  autoFocus
                  className="w-full bg-transparent text-[12px] font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none border-none p-0"
                />
              </div>
            </div>
          </div>

          {/* ── Path Configuration ── */}
          <div className="rounded-xl border border-slate-100 dark:border-white/5 overflow-hidden">
            <div className="px-3.5 py-2 bg-slate-50 dark:bg-white/2 border-b border-slate-100 dark:border-white/5">
              <p className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Path Configuration</p>
            </div>
            <div className="p-3.5 grid grid-cols-1 gap-3">
              {[
                { label: 'Volume root path', field: 'destPath', icon: 'folder' },
                { label: 'Extent volume path', field: 'extPath', icon: 'folder_open' },
                { label: 'Log path', field: 'logPath', icon: 'description' },
              ].map(({ label, field, icon }) => (
                <div key={field} className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-lg group focus-within:border-amber-500/40 focus-within:bg-amber-500/3 transition-colors">
                  <Icon name={icon} size="sm" weight={300} className="text-slate-400 dark:text-slate-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">{label}</p>
                    <input
                      type="text"
                      value={formData[field]}
                      onChange={e => handleInputChange(field, e.target.value)}
                      className="w-full bg-transparent text-[11px] font-medium text-slate-700 dark:text-slate-300 outline-none border-none p-0 truncate"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Migration Flags ── */}
          <div className="space-y-2">
            <p className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-0.5">Migration flags</p>
            <div className="grid grid-cols-1 gap-2">
              <FlagCard
                icon="sync"
                label="Overwrite existing database"
                description="Replace the destination if a database with the same name already exists."
                checked={formData.replaceExisting}
                onChange={v => handleInputChange('replaceExisting', v)}
                color="amber"
              />
              <FlagCard
                icon="link_off"
                label="Unlink source after copy"
                description="Remove the source database registry after the clone completes successfully."
                checked={formData.deleteSource}
                onChange={v => handleInputChange('deleteSource', v)}
                color="rose"
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
