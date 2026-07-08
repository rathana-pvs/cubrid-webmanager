import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeCopyDatabaseModal, fetchDatabaseStartInfo } from '../databaseSlice';
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

function FlagCard({ icon, label, description, checked, onChange, variant = 'primary' }) {
  return (
    <div 
      className={`flex items-center gap-4 p-4 border rounded-2xl transition-all duration-200 cursor-pointer select-none
        ${checked
          ? variant === 'danger' ? 'bg-rose-500/5 border-rose-500/25 shadow-[0_2px_16px_rgba(244,63,94,0.04)]' : 'bg-amber-500/5 border-amber-500/25 shadow-[0_2px_16px_rgba(245,158,11,0.04)]'
          : 'bg-white dark:bg-white/2 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10'}`}
      onClick={() => onChange(!checked)}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all shrink-0
        ${checked 
          ? variant === 'danger' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500' 
          : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400'}`}>
        <Icon name={icon} size="xs" weight={300} />
      </div>
      <div className="flex-1 min-w-0">
        <Typography variant="p" className={`font-bold text-[11.5px] tracking-tight transition-colors ${checked ? (variant === 'danger' ? 'text-rose-500' : 'text-amber-500') : 'text-slate-900 dark:text-white'}`}>
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
  const CM = useCM();
  const dispatch = useDispatch();
  const { isCopyDatabaseModalOpen } = useSelector((state) => state.databaseUI, shallowEqual);
  const { selectedDatabase, databases } = useSelector((state) => state.database, shallowEqual);
  const { selectedHostUid } = useSelector((state) => state.host, shallowEqual);
  const currentDb = databases?.find((db) => db.dbname === selectedDatabase);

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
  const { runJob } = useCmsJob();
  const [jobStatus, setJobStatus] = useState(null);

  const [formData, setFormData] = useState({
    destName: '',
    destPath: '',
    extPath: '',
    logPath: '',
    replaceExisting: false,
    deleteSource: false,
  });

  useEffect(() => {
    if (isCopyDatabaseModalOpen) {
      resetAction();
      const defaultPath = currentDb?.dbdir || '/home/cubrid/CUBRID/databases/';
      setFormData({
        destName: '',
        destPath: defaultPath,
        extPath: defaultPath,
        logPath: defaultPath,
        replaceExisting: false,
        deleteSource: false,
      });
    }
  }, [isCopyDatabaseModalOpen, resetAction, currentDb?.dbdir]);

  if (!isCopyDatabaseModalOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCopy = async () => {
    if (!formData.destName.trim()) return;
    
    startAction();

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
      await runJob(
        () => databaseJobApi.submitCopy(selectedHostUid, payload),
        { onProgress: (j) => setJobStatus(j.jobStatus ?? j.status) }
      );
      dispatch(fetchDatabaseStartInfo(selectedHostUid));
      endSuccess(`${CM.copyCompleted}: ${formData.destName}`);
    } catch (err) {
      endError(typeof err === 'string' ? err : (err.message || CM.operationFailed));
    }
  };

  const handleClose = () => {
    dispatch(closeCopyDatabaseModal());
    resetAction();
  };

  /* ─── LOADING view ─── */
  if (isLoading) {
    return (
      <Modal isOpen title={CM.copyDatabase} icon="content_copy" onClose={handleClose} maxWidth="580px">
        <ModalStatusLoading
          title={CM.synchronizingVolumes}
          subtitle={getCmsJobLoadingSubtitle(formData.destName, jobStatus, CM)}
        />
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  if (isSuccess) {
    return (
      <Modal isOpen title={CM.cloningComplete} icon="content_copy" iconVariant="success" onClose={handleClose} maxWidth="580px">
        <ModalStatusSuccess
          title={CM.copyCompleted}
          message={`${CM.copyCompleted}: ${formData.destName}`}
          onConfirm={handleClose}
          confirmText={CM.ok}
        />
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (isError) {
    return (
      <Modal isOpen title={CM.cloningFailed} icon="content_copy" iconVariant="danger" onClose={resetAction} maxWidth="580px">
        <ModalStatusError 
          title={CM.operationInterrupted}
          error={error}
          onRetry={handleCopy}
          onCancel={resetAction}
          retryText={CM.retryClone}
          cancelText={CM.dismiss}
        />
      </Modal>
    );
  }

  /* ─── FORM view ─── */
  return (
    <Modal
      isOpen={isCopyDatabaseModalOpen}
      onClose={handleClose}
      title={CM.cloneDatabase}
      subtitle={CM.cloneSubtitle}
      icon="content_copy"
      maxWidth="580px"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="ghost" onClick={handleClose}>{CM.discard}</Button>
          <Button 
            variant="primary" 
            onClick={handleCopy} 
            icon="content_copy"
            className="min-w-[140px]"
          >
            {CM.initiateCopy}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Source -> Destination */}
        <div>
          <SectionHeader title={CM.cloningContext} icon="swap_horiz" />
          <div className="flex items-end gap-2">
            <div className="flex items-center gap-3 px-4 h-[52px] bg-slate-50 dark:bg-white/4 border border-slate-100 dark:border-white/8 rounded-2xl">
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-white/8 flex items-center justify-center shrink-0">
                <Icon name="database" size="sm" weight={300} className="text-slate-500 dark:text-slate-400" />
              </div>
              <p className="text-[12.5px] font-black text-slate-700 dark:text-slate-200 truncate">{selectedDatabase}</p>
            </div>

          {/* Center Indicator Pillar */}
          <div className="flex flex-col h-[52px] justify-center shrink-0 px-1">
            <div className="w-9 h-9 rounded-full bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 flex items-center justify-center relative shadow-[0_0_15px_rgba(245,158,11,0.05)]">
              <Icon name="chevron_right" size="sm" weight={700} className="text-amber-500 text-[11px]!" />
            </div>
          </div>

          {/* Destination Column */}
          <div className="flex-1">
            <Input
              label={CM.cloneIdentifier}
              value={formData.destName}
              onChange={e => handleInputChange('destName', e.target.value)}
              placeholder="e.g. clone_db"
              autoFocus
              icon="content_copy"
              inputClassName="h-[52px]! font-black!"
            />
          </div>
          </div>
        </div>

        {/* Path configuration */}
        <div>
          <SectionHeader title={CM.targetEnvironment} icon="folder_open" />
          <div className="bg-white dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-2xl p-4">
          <div className="grid grid-cols-1 gap-3">
            {[
              { label: CM.primaryVolumePath, field: 'destPath', icon: 'folder' },
              { label: CM.extVolumePath, field: 'extPath', icon: 'folder_copy' },
              { label: CM.logVolumePath, field: 'logPath', icon: 'description' },
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
      </div>

        {/* Action Flags */}
        <div>
          <SectionHeader title={CM.executionStrategy} icon="tune" />
          <div className="space-y-3">
          <FlagCard
            icon="sync"
            label={CM.overwriteExistingEnvironment}
            description={CM.replaceExistingDesc}
            checked={formData.replaceExisting}
            onChange={v => handleInputChange('replaceExisting', v)}
          />
          <FlagCard
            icon="move_up"
            label={CM.transformToMove}
            description={CM.moveSourceDesc}
            checked={formData.deleteSource}
            onChange={v => handleInputChange('deleteSource', v)}
            variant="danger"
          />
          </div>
        </div>
      </div>
    </Modal>
  );
}
