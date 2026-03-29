import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeRenameDatabaseModal, renameDatabase, fetchDatabaseStartInfo } from '../databaseSlice';

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

export default function RenameDatabaseModal() {
  const dispatch = useDispatch();
  const { isRenameDatabaseModalOpen } = useSelector((state) => state.databaseUI);
  const { selectedDatabase } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);

  const [newDbName, setNewDbName] = useState('');
  const [forcedel, setForcedel] = useState(false);
  const [view, setView] = useState(VIEW_FORM);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isRenameDatabaseModalOpen) {
      setNewDbName('');
      setForcedel(false);
      setView(VIEW_FORM);
      setErrorMsg('');
    }
  }, [isRenameDatabaseModalOpen]);

  if (!isRenameDatabaseModalOpen) return null;

  const handleRename = async () => {
    if (!selectedHostUid || !selectedDatabase || !newDbName.trim()) return;
    setView(VIEW_LOADING);
    try {
      const payload = {
        rename: newDbName.trim(),
        exvolpath: 'none',
        advanced: 'off',
        forcedel: forcedel ? 'y' : 'n',
      };
      await dispatch(renameDatabase({ hostUid: selectedHostUid, dbname: selectedDatabase, payload })).unwrap();
      dispatch(fetchDatabaseStartInfo(selectedHostUid));
      setView(VIEW_SUCCESS);
    } catch (err) {
      setErrorMsg(
        typeof err === 'string' ? err
          : err?.message || err?.note || 'Failed to rename database. Ensure the database is stopped.'
      );
      setView(VIEW_ERROR);
    }
  };

  const handleClose = () => dispatch(closeRenameDatabaseModal());

  const hasNewName = newDbName.trim().length > 0;
  const isNameChanged = newDbName.trim() !== selectedDatabase;

  /* ─── LOADING view ─── */
  if (view === VIEW_LOADING) {
    return (
      <Modal isOpen title="Rename Database" icon="drive_file_rename_outline" onClose={handleClose} maxWidth="480px">
        <div className="flex flex-col items-center justify-center py-12 gap-7 text-center animate-in fade-in duration-200">
          {/* Spinner */}
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

          <div className="space-y-1.5">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
              Renaming Database
            </Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium max-w-[220px] mx-auto leading-relaxed">
              Migrating volumes and updating configuration…
            </Typography>
          </div>

          {/* Progress bar */}
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
      <Modal isOpen title="Rename Database" icon="drive_file_rename_outline" iconVariant="success" onClose={handleClose} maxWidth="480px">
        <div className="flex flex-col items-center justify-center py-12 gap-7 text-center animate-in fade-in duration-200">
          {/* Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.3)]">
              <Icon name="check" size="lg" weight={700} className="text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
              Rename Successful
            </Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[260px] mx-auto">
              Database{' '}
              <span className="font-black text-slate-900 dark:text-white">{selectedDatabase}</span>
              {' '}has been renamed to{' '}
              <span className="font-black text-emerald-500">{newDbName.trim()}</span>.
            </Typography>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/15">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Completed</span>
          </div>

          <Button variant="secondary" onClick={handleClose}>Close</Button>
        </div>
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (view === VIEW_ERROR) {
    return (
      <Modal isOpen title="Rename Database" icon="drive_file_rename_outline" iconVariant="danger" onClose={handleClose} maxWidth="480px">
        <div className="flex flex-col items-center justify-center py-10 gap-6 text-center animate-in fade-in duration-200">
          {/* Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-rose-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <Icon name="error" size="md" weight={300} className="text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
              Operation Failed
            </Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[280px] mx-auto">
              We encountered a technical issue while processing your rename request. 
            </Typography>
          </div>

          {/* Error detail box */}
          {errorMsg && (
            <div className="w-full max-w-[320px] bg-rose-500/5 border border-rose-500/15 rounded-xl px-4 py-3 text-left">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon name="terminal" size="xs" weight={300} className="text-rose-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-rose-400">Error Detail</span>
              </div>
              <Typography variant="caption" className="text-rose-400/80 font-mono leading-relaxed break-words">
                {errorMsg}
              </Typography>
            </div>
          )}

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
      isOpen={isRenameDatabaseModalOpen}
      onClose={handleClose}
      title="Rename Database"
      icon="drive_file_rename_outline"
      maxWidth="480px"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={handleClose}>Discard</Button>
          <Button
            variant="primary"
            onClick={handleRename}
            icon="drive_file_rename_outline"
            disabled={!hasNewName || !isNameChanged}
          >
            Execute Rename
          </Button>
        </div>
      }
    >
      <div className="space-y-6">

        {/* Source identity */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-bk-yellow" />
            <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-[0.2em]">Source Database</Typography>
          </div>
          <div className="flex items-center gap-4 p-4 bg-slate-50/50 dark:bg-white/3 border border-slate-200 dark:border-white/5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-bk-yellow/10 border border-bk-yellow/20 flex items-center justify-center shrink-0">
              <Icon name="database" size="sm" weight={300} className="text-bk-yellow" />
            </div>
            <div className="flex-1 min-w-0">
              <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium uppercase tracking-widest">Current Identifier</Typography>
              <Typography variant="h4" className="text-slate-900 dark:text-white font-bold text-[14px] tracking-tight leading-none mt-0.5">{selectedDatabase}</Typography>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2.5 py-1 rounded-full shrink-0">
              Active
            </span>
          </div>
        </div>

        {/* Arrow connector */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex-1 h-px bg-linear-to-r from-transparent via-slate-200 dark:via-white/8 to-transparent" />
          <div className="w-7 h-7 rounded-full bg-bk-yellow/10 border border-bk-yellow/20 flex items-center justify-center">
            <Icon name="arrow_downward" size="xs" weight={300} className="text-bk-yellow" />
          </div>
          <div className="flex-1 h-px bg-linear-to-l from-transparent via-slate-200 dark:via-white/8 to-transparent" />
        </div>

        {/* Target identifier */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-bk-yellow" />
            <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-[0.2em]">Target Identifier</Typography>
          </div>
          <Input
            label="New Database Name"
            value={newDbName}
            onChange={(e) => setNewDbName(e.target.value)}
            placeholder={`${selectedDatabase}_v2`}
            icon="edit"
            autoFocus
          />
        </div>



        {/* Overwrite option */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-[0.2em]">Destructive Options</Typography>
          </div>

          <div
            className={`flex items-center gap-4 p-4 border rounded-2xl transition-all cursor-pointer select-none ${forcedel ? 'bg-rose-500/4 border-rose-500/20 shadow-[0_2px_16px_rgba(244,63,94,0.06)]' : 'bg-white dark:bg-white/2 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10'}`}
            onClick={() => setForcedel(!forcedel)}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all shrink-0 ${forcedel ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400'}`}>
              <Icon name="delete_forever" size="xs" weight={300} />
            </div>
            <div className="flex-1 min-w-0">
              <Typography variant="p" className={`font-bold text-[11.5px] tracking-tight transition-colors ${forcedel ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                Overwrite Existing Target
              </Typography>
              <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium mt-0.5 leading-snug">
                Force-delete target path directories if they already exist
              </Typography>
            </div>
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              <Toggle checked={forcedel} onChange={setForcedel} variant="danger" />
            </div>
          </div>

          {forcedel ? (
            <div className="flex items-start gap-2.5 px-3 py-2.5 bg-rose-500/5 border border-rose-500/15 rounded-xl animate-in fade-in duration-200">
              <Icon name="warning" size="xs" weight={300} className="text-rose-400 shrink-0 mt-0.5" />
              <Typography variant="caption" className="text-rose-400 font-medium leading-relaxed">
                This will permanently delete any existing directory at the target path before migration begins.
              </Typography>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 px-3 py-2 bg-slate-50/80 dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-xl">
              <Icon name="info" size="xs" weight={300} className="text-slate-400 shrink-0 mt-0.5" />
              <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium leading-relaxed italic">
                Ensure the database service is fully stopped before renaming to prevent binary corruption.
              </Typography>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
