import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeRestoreDatabaseModal, fetchBackupList, restoreDatabase } from '../databaseSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Toggle } from '../../../components/ds/forms/Toggle';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Spinner } from '../../../components/ds/foundation/Spinner';
import { EmptyState } from '../../../components/ds/feedback/EmptyState';
import { useActionState } from '../../../infrastructure/hooks/useActionState';
import { 
  ModalStatusLoading, 
  ModalStatusSuccess, 
  ModalStatusError 
} from '../../../components/ds/feedback/ActionStatus';
import { StatusBadge } from '../../../components/ds/foundation/StatusBadge';

// view states
const VIEW_FORM    = 'form';
const VIEW_LOADING = 'loading';
const VIEW_SUCCESS = 'success';
const VIEW_ERROR   = 'error';

/* ── meta config ─────────────────────────────────────────────── */
const LEVEL_META = {
  0: {
    label: 'L0', title: 'Full Backup',
    icon: 'database', iconColor: 'text-blue-500',
    ring: 'border-blue-500/25 bg-blue-500/8 dark:bg-blue-500/10',
    ringSelected: 'bg-blue-500 text-white border-blue-400 shadow-blue-500/20',
    badge: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
    desc: 'Complete database snapshot. All data, schema and volumes captured.',
  },
  1: {
    label: 'L1', title: 'Incremental',
    icon: 'trending_up', iconColor: 'text-violet-500',
    ring: 'border-violet-500/25 bg-violet-500/8 dark:bg-violet-500/10',
    ringSelected: 'bg-violet-500 text-white border-violet-400 shadow-violet-500/20',
    badge: 'bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400',
    dot: 'bg-violet-500',
    desc: 'Changes since last full backup (L0). Requires L0 to restore.',
  },
  2: {
    label: 'L2', title: 'Differential',
    icon: 'call_split', iconColor: 'text-cyan-500',
    ring: 'border-cyan-500/25 bg-cyan-500/8 dark:bg-cyan-500/10',
    ringSelected: 'bg-cyan-500 text-white border-cyan-400 shadow-cyan-500/20',
    badge: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-400',
    dot: 'bg-cyan-500',
    desc: 'Changes since last incremental backup (L1). Requires L0 + L1.',
  },
};

/* ── helpers ─────────────────────────────────────────────────── */
const SectionLabel = ({ children, count }) => (
  <div className="flex items-center gap-3 mb-3">
    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 whitespace-nowrap">{children}</span>
    {count !== undefined && (
      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-xs bg-amber-500/10 border border-amber-500/20 text-amber-500">{count}</span>
    )}
    <div className="flex-1 h-px bg-slate-100 dark:bg-white/5" />
  </div>
);

/* ── main component ─────────────────────────────────────────── */
export default function RestoreDatabaseModal() {
  const dispatch = useDispatch();
  const { isRestoreDatabaseModalOpen } = useSelector((state) => state.databaseUI, shallowEqual);
  const { selectedDatabase } = useSelector((state) => state.database, shallowEqual);
  const {
    databaseBackups,
    databaseBackupsLoading,
  } = useSelector((state) => state.databaseOperation);
  const { selectedHostUid } = useSelector((state) => state.host, shallowEqual);

  const { 
    state, 
    error: actionError, 
    startAction, 
    endSuccess, 
    endError, 
    resetAction,
    isLoading,
    isSuccess,
    isError
  } = useActionState();

  const [formData, setFormData] = useState({ selectedBackup: null, recoveryPath: '', isPartial: false });
  const [filter, setFilter] = useState('all'); // 'all' | 0 | 1 | 2

  const parseBackupString = (str, level) => {
    if (!str || str === 'none' || typeof str !== 'string') return [];
    return str.split('|').filter(Boolean).map(item => {
      if (item.includes(';')) {
        const [date, pathname, recoverypath] = item.split(';');
        return { date: date || '', pathname: pathname || '', recoverypath: recoverypath || '', level };
      }
      return { date: '', pathname: item, recoverypath: '', level };
    });
  };

  const backupData = databaseBackups[selectedDatabase] || {};
  const allBackups = [
    ...(Array.isArray(backupData.level0) ? backupData.level0.map(b => ({ ...b, level: 0 })) : parseBackupString(backupData.level0, 0)),
    ...(Array.isArray(backupData.level1) ? backupData.level1.map(b => ({ ...b, level: 1 })) : parseBackupString(backupData.level1, 1)),
    ...(Array.isArray(backupData.level2) ? backupData.level2.map(b => ({ ...b, level: 2 })) : parseBackupString(backupData.level2, 2)),
  ].filter(b => b.pathname).sort((a, b) => {
    const tA = (a.date && !isNaN(new Date(a.date).getTime())) ? new Date(a.date).getTime() : 0;
    const tB = (b.date && !isNaN(new Date(b.date).getTime())) ? new Date(b.date).getTime() : 0;
    return tB - tA;
  });

  const backups = filter === 'all' ? allBackups : allBackups.filter(b => b.level === filter);
  const isLoadingBackups = databaseBackupsLoading[selectedDatabase];

  useEffect(() => {
    if (isRestoreDatabaseModalOpen && selectedHostUid && selectedDatabase) {
      setFormData({ selectedBackup: null, recoveryPath: '', isPartial: false });
      setFilter('all');
      resetAction();
      dispatch(fetchBackupList({ hostUid: selectedHostUid, dbname: selectedDatabase }));
    }
  }, [isRestoreDatabaseModalOpen, selectedHostUid, selectedDatabase, dispatch, resetAction]);

  if (!isRestoreDatabaseModalOpen) return null;

  const handleInputChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleRestore = async () => {
    if (!formData.selectedBackup) {
      endError('Please select a backup point to restore from.');
      return;
    }

    startAction();
    try {
      const backup = allBackups.find(b => b.pathname === formData.selectedBackup);
      await dispatch(restoreDatabase({
        hostUid: selectedHostUid,
        dbname: selectedDatabase,
        payload: {
          date: backup.date,
          level: String(backup.level),
          partial: formData.isPartial ? 'y' : 'n',
          pathname: backup.pathname,
          recoverypath: formData.recoveryPath || '',
        }
      })).unwrap();
      endSuccess(`Successfully restored "${selectedDatabase}" from snapshot ${backup.date || backup.pathname}.`);
    } catch (error) {
      endError(typeof error === 'string' ? error : (error.message || 'An unexpected error occurred during restore.'));
    }
  };

  const handleClose = () => dispatch(closeRestoreDatabaseModal());

  const levelCounts = { 0: allBackups.filter(b => b.level === 0).length, 1: allBackups.filter(b => b.level === 1).length, 2: allBackups.filter(b => b.level === 2).length };

  /* ─── LOADING view ─── */
  if (isLoading) {
    return (
      <Modal isOpen title="Restoring Database" icon="settings_backup_restore" onClose={handleClose} maxWidth="600px" iconVariant="danger">
        <ModalStatusLoading 
          title="Reconstructing Instance" 
          subtitle={`Applying snapshot volumes to ${selectedDatabase}. This may take several minutes.`}
          variant="danger"
        />
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  if (isSuccess) {
    return (
      <Modal isOpen title="Restore Successful" icon="settings_backup_restore" iconVariant="success" onClose={handleClose} maxWidth="600px">
        <ModalStatusSuccess 
          title="Restore Completed"
          message={`Instance ${selectedDatabase} has been successfully rolled back to the selected state.`}
          onConfirm={handleClose}
          confirmText="Close"
        />
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (isError) {
    return (
      <Modal isOpen title="Recovery Failed" icon="restore" iconVariant="danger" onClose={resetAction} maxWidth="900px">
        <ModalStatusError 
          title="Transaction Dropped"
          error={actionError}
          onRetry={handleRestore}
          onCancel={resetAction}
          retryText="Retry Recovery"
          cancelText="Dismiss"
        />
      </Modal>
    );
  }

  /* ─── FORM view ─── */
  return (
    <Modal
      isOpen={isRestoreDatabaseModalOpen}
      onClose={handleClose}
      title="Restore Database"
      subtitle="Roll back instance to a historical snapshot"
      icon="settings_backup_restore"
      maxWidth="680px"
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
            <Icon name="info" size="12px" weight={300} />
            <span>Database must be stopped before restoration</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleClose}>Discard</Button>
            <Button
              variant="primary"
              onClick={handleRestore}
              icon="settings_backup_restore"
              disabled={!formData.selectedBackup}
              className="px-6 min-w-[150px]"
            >
              Execute Restore
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5 pb-2">

        {/* ── Context banner ── */}
        <div className="relative rounded-xl border border-rose-500/20 bg-linear-to-r from-rose-500/5 to-transparent dark:from-rose-500/8 p-4 overflow-hidden">
          {/* subtle top-right flourish */}
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-rose-500/5 blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <Icon name="database" size="md" weight={300} className="text-rose-400" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-rose-500/70 dark:text-rose-400/60 mb-0.5">Target Instance</p>
                <p className="text-[15px] font-bold font-mono text-rose-700 dark:text-rose-400 leading-none">{selectedDatabase}</p>
              </div>
            </div>
            <StatusBadge label="Destructive Action" variant="rose" icon="warning" pulse={true} className="rounded-full" />
          </div>

          {/* Available level summary */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-rose-500/10">
            {[0, 1, 2].map(lvl => {
              const m = LEVEL_META[lvl];
              return (
                <div key={lvl} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${m.dot}`} />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{m.title}</span>
                  <span className={`ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-sm border ${m.badge}`}>{levelCounts[lvl]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Snapshot catalog ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel count={allBackups.length}>Snapshot Catalog</SectionLabel>
            {/* level filter pills */}
            {allBackups.length > 0 && (
              <div className="flex gap-1">
                {['all', 0, 1, 2].map(f => {
                  const meta = f === 'all' ? null : LEVEL_META[f];
                  const isActive = filter === f;
                  return (
                    <button
                      key={String(f)}
                      onClick={() => setFilter(f)}
                      className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border transition-all cursor-pointer
                        ${isActive
                          ? 'bg-slate-900 dark:bg-white dark:text-slate-900 text-white border-transparent shadow-xs'
                          : 'text-slate-400 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-600 dark:hover:text-slate-200'
                        }`}
                    >
                      {f === 'all' ? 'All' : `L${f}`}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {isLoadingBackups ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3 bg-slate-50/50 dark:bg-white/2 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
              <Spinner size="sm" />
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Scanning catalog…</p>
            </div>
          ) : backups.length === 0 ? (
            <EmptyState
              icon={filter === 'all' ? 'search_off' : 'filter_list_off'}
              title={filter === 'all' ? 'No Backup Records Found' : `No ${LEVEL_META[filter]?.title} Backups`}
              subtitle={
                filter === 'all'
                  ? 'Ensure the backup directory is synchronized with this host.'
                  : 'Try selecting another backup level or view all.'
              }
              action={filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="text-[10px] font-bold text-amber-500 hover:text-amber-600 transition-colors underline underline-offset-2 cursor-pointer"
                >
                  Show all backups
                </button>
              )}
            />
          ) : (
            <div className="space-y-2 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
              {backups.map((backup, idx) => {
                const meta = LEVEL_META[backup.level] || LEVEL_META[0];
                const isSel = formData.selectedBackup === backup.pathname;
                return (
                  <button
                    key={backup.pathname || idx}
                    onClick={() => handleInputChange('selectedBackup', isSel ? null : backup.pathname)}
                    type="button"
                    className={`w-full text-left flex items-center gap-3.5 p-3.5 rounded-xl border transition-all duration-200 group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer
                      ${isSel
                        ? 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/[0.07] shadow-xs'
                        : `${meta.ring} hover:border-opacity-50 hover:shadow-xs`
                      }`}
                  >
                    {/* level badge */}
                    <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 border shadow-xs transition-all
                      ${isSel ? `${meta.ringSelected} shadow-md` : `${meta.ring} ${meta.iconColor}`}`}
                    >
                      <Icon name={meta.icon} size="sm" weight={300} />
                      <span className="text-[8px] font-black leading-none mt-0.5 opacity-80">{meta.label}</span>
                    </div>

                    {/* details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className={`text-[12px] font-bold tracking-tight transition-colors ${isSel ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-white'}`}>
                          {meta.title}
                        </span>
                        {backup.date && (
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-sm border border-slate-200 dark:border-white/10">
                            {backup.date}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 opacity-50 group-hover:opacity-90 transition-opacity">
                        <Icon name="folder_open" size="12px" weight={300} className="text-slate-400 shrink-0" />
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">{backup.pathname}</span>
                      </div>
                      {isSel && (
                        <p className="text-[9px] text-amber-600/70 dark:text-amber-400/60 mt-1 font-medium italic leading-tight">
                          {meta.desc}
                        </p>
                      )}
                    </div>

                    {/* radio dot */}
                    <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                      ${isSel ? 'border-amber-500 bg-amber-500' : 'border-slate-200 dark:border-white/10 group-hover:border-amber-500/40'}`}
                    >
                      {isSel && <Icon name="check" size="12px" weight={700} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Restore options ── */}
        <div>
          <SectionLabel>Restore Options</SectionLabel>
          <div className="grid grid-cols-2 gap-3">

            {/* Partial recovery toggle */}
            <div
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-left w-full group cursor-pointer
                ${formData.isPartial
                  ? 'bg-amber-500/5 border-amber-500/30 dark:border-amber-500/25 shadow-xs'
                  : 'bg-slate-50/50 dark:bg-white/2 border-slate-200 dark:border-white/8 hover:border-slate-300 dark:hover:border-white/15'
                }`}
              onClick={() => handleInputChange('isPartial', !formData.isPartial)}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-all
                ${formData.isPartial
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 border-amber-400'
                  : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 group-hover:text-slate-600'
                }`}
              >
                <Icon name="history_edu" size="sm" weight={300} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[12px] font-bold transition-colors ${formData.isPartial ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                  Log Catch-up
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">Apply intermediate archive logs</p>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <Toggle checked={formData.isPartial} onChange={() => handleInputChange('isPartial', !formData.isPartial)} />
              </div>
            </div>

            {/* Recovery path override */}
            <div className="space-y-1.5">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-0.5">Path Override</p>
              <Input
                placeholder="Default: original location"
                value={formData.recoveryPath}
                onChange={(e) => handleInputChange('recoveryPath', e.target.value)}
                icon="drive_file_move"
              />
              <p className="text-[9px] text-slate-400 dark:text-slate-500 italic px-0.5">Leave blank to restore in-place</p>
            </div>
          </div>
        </div>

        {/* ── Danger notice ── */}
        <div className="flex items-start gap-3.5 p-4 bg-rose-500/4 border border-rose-500/20 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Icon name="priority_high" size="sm" weight={700} className="text-rose-500" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mb-1 uppercase tracking-tight">
              Irreversible Operation
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              All existing volumes for <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{selectedDatabase}</span> will be permanently overwritten by the selected snapshot.
            </p>
          </div>
        </div>

      </div>
    </Modal>
  );
}
