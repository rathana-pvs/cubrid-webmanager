import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeRestoreDatabaseModal, fetchBackupList, restoreDatabase } from '../databaseSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Toggle } from '../../../components/ds/forms/Toggle';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Spinner } from '../../../components/ds/foundation/Spinner';

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
  const { isRestoreDatabaseModalOpen } = useSelector((state) => state.databaseUI);
  const { selectedDatabase } = useSelector((state) => state.database);
  const {
    databaseBackups,
    databaseBackupsLoading,
  } = useSelector((state) => state.databaseOperation);
  const { selectedHostUid } = useSelector((state) => state.host);

  const [view, setView] = useState(VIEW_FORM);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
      setView(VIEW_FORM);
      setErrorMsg('');
      setSuccessMsg('');
      dispatch(fetchBackupList({ hostUid: selectedHostUid, dbname: selectedDatabase }));
    }
  }, [isRestoreDatabaseModalOpen, selectedHostUid, selectedDatabase, dispatch]);

  if (!isRestoreDatabaseModalOpen) return null;

  const handleInputChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleRestore = async () => {
    if (!formData.selectedBackup) {
      setErrorMsg('Please select a backup point to restore from.');
      setView(VIEW_ERROR);
      return;
    }

    setView(VIEW_LOADING);
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
      setSuccessMsg(`Successfully restored "${selectedDatabase}" from snapshot ${backup.date || backup.pathname}.`);
      setView(VIEW_SUCCESS);
    } catch (error) {
      setErrorMsg(typeof error === 'string' ? error : (error.message || 'An unexpected error occurred during restore.'));
      setView(VIEW_ERROR);
    }
  };

  const handleClose = () => dispatch(closeRestoreDatabaseModal());

  const levelCounts = { 0: allBackups.filter(b => b.level === 0).length, 1: allBackups.filter(b => b.level === 1).length, 2: allBackups.filter(b => b.level === 2).length };

  /* ─── LOADING view ─── */
  if (view === VIEW_LOADING) {
    return (
      <Modal isOpen title="Restoring Database" icon="settings_backup_restore" onClose={handleClose} maxWidth="600px">
        <div className="flex flex-col items-center justify-center py-12 gap-7 text-center animate-in fade-in duration-200">
          <div className="relative w-[72px] h-[72px]">
            <div className="absolute inset-0 rounded-full border-2 border-slate-100 dark:border-white/5" />
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-rose-500 animate-spin"
              style={{ animationDuration: '0.9s' }}
            />
            <div
              className="absolute inset-[10px] rounded-full border-[1.5px] border-transparent border-b-rose-500/35 animate-spin"
              style={{ animationDuration: '1.7s', animationDirection: 'reverse' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_3px_rgba(244,63,94,0.3)] animate-pulse" />
            </div>
          </div>

          <div className="space-y-1.5 px-8">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
              Reconstructing Instance
            </Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium max-w-[320px] mx-auto leading-relaxed">
              Applying snapshot volumes to <span className="text-slate-900 dark:text-white font-black">{selectedDatabase}</span>. This may take several minutes.
            </Typography>
          </div>

          <div className="w-44 h-[2px] bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full"
              style={{ animation: 'modalSlide 1.5s ease-in-out infinite' }}
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/5 border border-rose-500/15">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-rose-500">In Progress</span>
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
      <Modal isOpen title="Database Restore" icon="settings_backup_restore" iconVariant="success" onClose={handleClose} maxWidth="600px">
        <div className="flex flex-col items-center justify-center py-12 gap-7 text-center animate-in fade-in duration-200">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.3)]">
              <Icon name="check" size="lg" weight={700} className="text-white" />
            </div>
          </div>

          <div className="space-y-2 px-8">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
              Restore Completed
            </Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[340px] mx-auto">
              Instance <span className="font-black text-slate-900 dark:text-white">{selectedDatabase}</span> has been successfully rolled back to the selected state.
            </Typography>
          </div>

          {successMsg && (
            <div className="w-full max-w-[420px] bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-4 py-3.5 text-left">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon name="history" size="xs" weight={300} className="text-emerald-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Trace Summary</span>
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
      <Modal isOpen title="Database Restore" icon="settings_backup_restore" iconVariant="danger" onClose={handleClose} maxWidth="600px">
        <div className="flex flex-col items-center justify-center py-10 gap-6 text-center animate-in fade-in duration-200">
          <div className="relative">
            <div className="absolute inset-0 bg-rose-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <Icon name="error" size="md" weight={300} className="text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
              Restoration Interrupted
            </Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[320px] mx-auto">
              We encountered a critical issue while attempting to reconstruct the instance.
            </Typography>
          </div>

          <div className="w-full max-w-[420px] bg-rose-500/5 border border-rose-500/15 rounded-xl px-4 py-3 text-left">
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
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
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
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20">
              <Icon name="warning" size="12px" className="text-rose-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">Destructive Action</span>
            </div>
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
            <div className="flex flex-col items-center justify-center py-14 gap-4 bg-slate-50/50 dark:bg-white/2 border border-dashed border-slate-200 dark:border-white/10 rounded-xl text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                <Icon name="search_off" size="lg" weight={100} className="text-slate-300 dark:text-white/20" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {filter === 'all' ? 'No Backup Records Found' : `No ${LEVEL_META[filter]?.title} Backups Found`}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 italic max-w-[240px] leading-relaxed mx-auto">
                  {filter === 'all'
                    ? 'Ensure the backup directory is synchronized with this host.'
                    : 'Try selecting another backup level or view all.'}
                </p>
              </div>
              {filter !== 'all' && (
                <button onClick={() => setFilter('all')} className="text-[10px] font-bold text-amber-500 hover:text-amber-600 transition-colors underline underline-offset-2 cursor-pointer">
                  Show all backups
                </button>
              )}
            </div>
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
