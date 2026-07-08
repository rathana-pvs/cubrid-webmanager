import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeRenameDatabaseModal, fetchDatabaseStartInfo } from '../databaseSlice';
import { databaseJobApi } from '../databaseJobApi';
import { useCmsJob } from '../../../infrastructure/hooks/useCmsJob';
import { getCmsJobLoadingSubtitle } from '../../../infrastructure/cmsJob/cmsJobUi';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Toggle } from '../../../components/ds/forms/Toggle';
import { Typography } from '../../../components/ds/foundation/Typography';
import { SectionHeader } from '../../../components/ds/foundation/SectionHeader';
import { InfoBanner } from '../../../components/ds/foundation/InfoBanner';
import { useActionState } from '../../../infrastructure/hooks/useActionState';
import { 
  ModalStatusLoading, 
  ModalStatusSuccess, 
  ModalStatusError 
} from '../../../components/ds/feedback/ActionStatus';
import { useCM } from '../../../constants/useCM';

// view states
const VIEW_FORM    = 'form';
const VIEW_LOADING = 'loading';
const VIEW_SUCCESS = 'success';
const VIEW_ERROR   = 'error';

export default function RenameDatabaseModal() {
  const CM = useCM();
  const dispatch = useDispatch();
  const { isRenameDatabaseModalOpen } = useSelector((state) => state.databaseUI, shallowEqual);
  const { selectedDatabase } = useSelector((state) => state.database, shallowEqual);
  const { selectedHostUid } = useSelector((state) => state.host, shallowEqual);

  const { 
    error, 
    startAction, 
    endSuccess, 
    endError, 
    resetAction,
    isLoading,
    isSuccess,
    isError
  } = useActionState();
  const { runJob } = useCmsJob();
  const [jobStatus, setJobStatus] = useState(null);

  const [newDbName, setNewDbName] = useState('');
  const [forcedel, setForcedel] = useState(false);

  useEffect(() => {
    if (isRenameDatabaseModalOpen) {
      setNewDbName('');
      setForcedel(false);
      resetAction();
    }
  }, [isRenameDatabaseModalOpen, resetAction]);

  if (!isRenameDatabaseModalOpen) return null;

  const handleRename = async () => {
    if (!selectedHostUid || !selectedDatabase || !newDbName.trim()) return;
    startAction();
    try {
      const payload = {
        rename: newDbName.trim(),
        exvolpath: 'none',
        advanced: 'off',
        forcedel: forcedel ? 'y' : 'n',
      };
      await runJob(
        () => databaseJobApi.submitRename(selectedHostUid, selectedDatabase, payload),
        { onProgress: (j) => setJobStatus(j.jobStatus ?? j.status) }
      );
      dispatch(fetchDatabaseStartInfo(selectedHostUid));
      endSuccess(CM.databaseRenamedMsg(selectedDatabase, newDbName.trim()));
    } catch (err) {
      endError(
        typeof err === 'string' ? err
          : err?.message || err?.note || CM.renameFailedMsg
      );
    }
  };

  const handleClose = () => {
    dispatch(closeRenameDatabaseModal());
    resetAction();
  };

  const hasNewName = newDbName.trim().length > 0;
  const isNameChanged = newDbName.trim() !== selectedDatabase;

  /* ─── LOADING view ─── */
  if (isLoading) {
    return (
      <Modal isOpen title={CM.renamingDatabase} icon="drive_file_rename_outline" onClose={handleClose} maxWidth="480px">
        <ModalStatusLoading
          title={CM.updatingIdentity}
          subtitle={getCmsJobLoadingSubtitle(selectedDatabase, jobStatus, CM)}
        />
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  if (isSuccess) {
    return (
      <Modal isOpen title={CM.renameComplete} icon="drive_file_rename_outline" iconVariant="success" onClose={handleClose} maxWidth="480px">
        <ModalStatusSuccess
          title={CM.renameSuccessful}
          message={CM.databaseRenamedMsg(selectedDatabase, newDbName.trim())}
          onConfirm={handleClose}
          confirmText={CM.ok}
        />
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (isError) {
    return (
      <Modal isOpen title={CM.renameFailed} icon="drive_file_rename_outline" iconVariant="danger" onClose={handleClose} maxWidth="480px">
        <ModalStatusError 
          title={CM.operationFailed}
          error={error}
          onRetry={handleRename}
          onCancel={handleClose}
          retryText={CM.retryRename}
          cancelText={CM.dismiss}
        />
      </Modal>
    );
  }

  /* ─── FORM view ─── */
  return (
    <Modal
      isOpen={isRenameDatabaseModalOpen}
      onClose={handleClose}
      title={CM.renameDatabase}
      icon="drive_file_rename_outline"
      maxWidth="480px"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={handleClose}>{CM.discard}</Button>
          <Button
            variant="primary"
            onClick={handleRename}
            icon="drive_file_rename_outline"
            disabled={!hasNewName || !isNameChanged}
            className="min-w-[140px]"
          >
            {CM.executeRename}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">

        {/* Source identity */}
        <div className="space-y-3">
          <SectionHeader title={CM.sourceDatabase} icon="database" />
          <div className="flex items-center gap-4 p-4 bg-slate-50/50 dark:bg-white/3 border border-slate-200 dark:border-white/5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Icon name="database" size="sm" weight={300} className="text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium uppercase tracking-widest">{CM.currentIdentifier}</Typography>
              <Typography variant="h4" className="text-slate-900 dark:text-white font-bold text-[14px] tracking-tight leading-none mt-0.5">{selectedDatabase}</Typography>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2.5 py-1 rounded-full shrink-0">
              {CM.active}
            </span>
          </div>
        </div>

        {/* Arrow connector */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex-1 h-px bg-linear-to-r from-transparent via-slate-200 dark:via-white/8 to-transparent" />
          <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Icon name="arrow_downward" size="xs" weight={300} className="text-amber-500" />
          </div>
          <div className="flex-1 h-px bg-linear-to-l from-transparent via-slate-200 dark:via-white/8 to-transparent" />
        </div>

        {/* Target identifier */}
        <div className="space-y-3">
          <SectionHeader title={CM.targetIdentifier} icon="label" />
          <Input
            label={CM.newDatabaseName}
            value={newDbName}
            onChange={(e) => setNewDbName(e.target.value)}
            placeholder={`${selectedDatabase}_v2`}
            icon="edit"
            autoFocus
          />
        </div>



        {/* Overwrite option */}
        <div className="space-y-3">
          <SectionHeader title={CM.destructiveOptions} icon="warning" />

          <div
            className={`flex items-center gap-4 p-4 border rounded-2xl transition-all cursor-pointer select-none ${forcedel ? 'bg-rose-500/4 border-rose-500/20 shadow-[0_2px_16px_rgba(244,63,94,0.06)]' : 'bg-white dark:bg-white/2 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10'}`}
            onClick={() => setForcedel(!forcedel)}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all shrink-0 ${forcedel ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400'}`}>
              <Icon name="delete_forever" size="xs" weight={300} />
            </div>
            <div className="flex-1 min-w-0">
              <Typography variant="p" className={`font-bold text-[11.5px] tracking-tight transition-colors ${forcedel ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                {CM.overwriteExistingTarget}
              </Typography>
              <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium mt-0.5 leading-snug">
                {CM.overwriteTargetDesc}
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
                {CM.overwriteTargetWarning}
              </Typography>
            </div>
          ) : (
            <InfoBanner title={CM.downtimeRequired}>
              {CM.renameDowntimeHint}
            </InfoBanner>
          )}
        </div>
      </div>
    </Modal>
  );
}
