import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { 
  closeCreateDatabaseModal, 
  fetchCreateDatabaseInfo,
  fetchDatabaseStartInfo 
} from '../databaseSlice';

import { databaseJobApi } from '../databaseJobApi';
import { useCmsJob } from '../../../infrastructure/hooks/useCmsJob';
import { getCmsJobLoadingSubtitle } from '../../../infrastructure/cmsJob/cmsJobUi';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Select } from '../../../components/ds/forms/Select';
import { Toggle } from '../../../components/ds/forms/Toggle';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Spinner } from '../../../components/ds/foundation/Spinner';
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

const PAGE_SIZES = [4096, 8192, 16384, 32768];
const BASE_LOCALES = [
  { value: 'en_US.iso88591', label: 'en_US.iso88591 — English, Western European' },
  { value: 'en_US.utf8', label: 'en_US.utf8 — English, Universal' },
  { value: 'ko_KR.euckr', label: 'ko_KR.euckr — Korean, Legacy' },
  { value: 'ko_KR.utf8', label: 'ko_KR.utf8 — Korean, Universal' },
];
// Fixed volume type: segment represents a permanent data volume.

const renameVolumesSequentially = (volumes, dbName) => {
  const typeCounters = {};
  return volumes.map((vol, idx) => {
    const type = vol.type;
    typeCounters[type] = (typeCounters[type] || 0) + 1;
    const padNum = String(typeCounters[type]).padStart(3, '0');
    const name = dbName 
      ? `${dbName}_${type}_${padNum}` 
      : `vol_${type}_${padNum}`;
    return { ...vol, name };
  });
};

const INITIAL_FORM_DATA = {
  dbName: '',
  pageSize: 16384,
  locale: 'en_US.utf8',
  userDefinedLocale: '',
  genericVolPath: '',
  genericVolSize: 512,
  logVolPath: '',
  logVolSize: 512,
  logPageSize: 16384,
  autoStart: true,
  volumes: [],
  autoAddVol: {
    data: 'ON',
    dataWarn: '0.15',
    dataExtPage: '32768',
    index: 'OFF',
    indexWarn: '0.15',
    indexExtPage: '32768',
  },
  baseDir: '',
  dbaPassword: '',
  confirmPassword: ''
};

function SummaryRow({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/4 last:border-0">
      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{label}</span>
      <span className={`text-[11px] font-bold font-mono ${accent ? 'text-amber-500' : 'text-slate-700 dark:text-slate-200'}`}>{value}</span>
    </div>
  );
}

const typeBadge = (t) => {
  if (t === 'data') return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  if (t === 'index') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  if (t === 'temp') return 'bg-violet-500/10 text-violet-500 border-violet-500/20';
  return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
};

/* ── main component ─────────────────────────────────────────── */
export default function CreateDatabaseModal() {
  const CM = useCM();
  const locales = useMemo(
    () => [...BASE_LOCALES, { value: 'user_defined', label: CM.userDefined }],
    [CM]
  );
  // Removed dynamic volume type selection. Fixed to permanent data segment.
  const steps = useMemo(
    () => [
      { id: 1, label: CM.wizardGeneral, icon: 'settings' },
      { id: 2, label: CM.wizardAdditionalVol, icon: 'storage' },
      { id: 3, label: CM.wizardAutoVol, icon: 'auto_mode' },
      { id: 4, label: CM.wizardSetDbaPass, icon: 'lock' },
      { id: 5, label: CM.wizardDbInfo, icon: 'fact_check' },
    ],
    [CM]
  );
  const dispatch = useDispatch();
  const { isCreateDatabaseModalOpen } = useSelector((state) => state.databaseUI, shallowEqual);
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

  const { runJob } = useCmsJob();
  const [jobStatus, setJobStatus] = useState(null);
  const jobDismissedRef = useRef(false);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const hostEnv = useSelector((state) => state.host.hostEnvs[selectedHostUid]);

  useEffect(() => {
    if (isCreateDatabaseModalOpen && selectedHostUid) {
      jobDismissedRef.current = false;
      setStep(1);
      resetAction();
      setFormData(INITIAL_FORM_DATA);
      
      // 1. Immediate Population: Use cached system info if available
      const cachedDir = hostEnv?.CUBRID_DATABASES;
      if (cachedDir) {
        setFormData(prev => ({
          ...prev,
          baseDir: cachedDir,
          genericVolPath: cachedDir,
          logVolPath: cachedDir,
          volumes: prev.volumes.map(vol => ({ ...vol, path: cachedDir }))
        }));
      } else {
        // 2. Proactive Fetch: If missing, fetch system environment metadata
        // dispatch(fetchHostEnv(selectedHostUid));
      }

      // 3. Backend Fallback: Fetch specific create-info
      dispatch(fetchCreateDatabaseInfo({ hostUid: selectedHostUid }))
        .unwrap()
        .then(data => {
          const dir = hostEnv?.CUBRID_DATABASES || data?.default_db_dir;
          if (dir) {
            setFormData(prev => ({
              ...prev,
              baseDir: dir,
              genericVolPath: prev.genericVolPath || dir,
              logVolPath: prev.logVolPath || dir,
              volumes: prev.volumes.map(vol => ({ ...vol, path: vol.path || dir }))
            }));
          }
        })
        .catch(() => {});
    }
  }, [isCreateDatabaseModalOpen, selectedHostUid, dispatch, hostEnv?.CUBRID_DATABASES, resetAction]);

  useEffect(() => {
    const { dbName, baseDir } = formData;
    if (baseDir) {
      const fullPath = dbName 
        ? (baseDir.endsWith('/') ? `${baseDir}${dbName}` : `${baseDir}/${dbName}`)
        : baseDir;
      
      setFormData(prev => {
        const renamed = renameVolumesSequentially(prev.volumes, dbName);
        return {
          ...prev,
          genericVolPath: fullPath,
          logVolPath: fullPath,
          volumes: renamed.map(vol => ({ ...vol, path: fullPath }))
        };
      });
    }
  }, [formData.dbName]);

  if (!isCreateDatabaseModalOpen) return null;

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);
  const handleInputChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleVolumeChange = (index, field, value) => {
    let newVolumes = [...formData.volumes];
    newVolumes[index] = { ...newVolumes[index], [field]: value };
    if (field === 'type') {
      newVolumes = renameVolumesSequentially(newVolumes, formData.dbName);
    }
    setFormData(prev => ({ ...prev, volumes: newVolumes }));
  };
  const addVolume = () => {
    const type = 'data';
    const newVolumes = [...formData.volumes, { name: '', type, size: 512, path: formData.genericVolPath }];
    const renamed = renameVolumesSequentially(newVolumes, formData.dbName);
    setFormData(prev => ({
      ...prev,
      volumes: renamed
    }));
  };
  const removeVolume = (index) => setFormData(prev => ({ ...prev, volumes: prev.volumes.filter((_, i) => i !== index) }));

  const handleAutoAddVolChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      autoAddVol: { ...prev.autoAddVol, [field]: value }
    }));
  };

  const isFormValid = () => {
    if (step === 1) return formData.dbName && formData.genericVolPath && formData.logVolPath;
    if (step === 4) return formData.dbaPassword === formData.confirmPassword && (formData.dbaPassword === '' || formData.dbaPassword.length >= 8);
    return true;
  };

  const handleFinish = async () => {
    if (!selectedHostUid) return;

    startAction();
    try {
      const exvol = formData.volumes.map(vol => ({
        [vol.name]: {
          type: vol.type,
          size: vol.size,
          pagesize: formData.pageSize,
          volpath: vol.path
        }
      }));

      const payload = {
        dbname: formData.dbName,
        pagesize: formData.pageSize,
        db_volume_size: formData.genericVolSize,
        genvolpath: formData.genericVolPath,
        logpagesize: formData.logPageSize,
        logsize: formData.logVolSize,
        logvolpath: formData.logVolPath,
        setAutoStart: formData.autoStart,
        overwrite_config_file: 'YES',
        numpage: Math.floor((formData.genericVolSize * 1024 * 1024) / formData.pageSize),
        exvol: exvol,
        charset: formData.locale === 'user_defined' ? formData.userDefinedLocale : formData.locale,
        setAutoAddVol: {
          data: formData.autoAddVol.data,
          data_warn_outofspace: formData.autoAddVol.dataWarn,
          data_ext_page: formData.autoAddVol.dataExtPage,
          index: formData.autoAddVol.index,
          index_warn_outofspace: formData.autoAddVol.indexWarn,
          index_ext_page: formData.autoAddVol.indexExtPage,
        },
        username: "dba",
        updateUser: {
          userpass: formData.dbaPassword
        }
      };

      await runJob(
        () => databaseJobApi.submitCreate(selectedHostUid, payload),
        {
          onProgress: (j) => {
            if (!jobDismissedRef.current) {
              setJobStatus(j.jobStatus ?? j.status);
            }
          },
        }
      );

      dispatch(fetchDatabaseStartInfo({ hostUid: selectedHostUid, isBackground: true }));

      if (!jobDismissedRef.current) {
        endSuccess(`Database "${formData.dbName}" has been successfully initialized and commissioned.`);
      }
    } catch (err) {
      if (!jobDismissedRef.current) {
        const msg =
          err?.response?.data?.note ||
          err?.response?.data?.message ||
          (typeof err === 'string' ? err : err?.message) ||
          'An unexpected error occurred during database creation.';
        endError(msg);
      }
    }
  };

  const handleClose = () => {
    if (isLoading) {
      jobDismissedRef.current = true;
    }
    dispatch(closeCreateDatabaseModal());
    setStep(1);
    setFormData(INITIAL_FORM_DATA);
    resetAction();
  };

  const totalStorage = formData.genericVolSize + formData.logVolSize + formData.volumes.reduce((a, v) => a + v.size, 0);


  /* ─── LOADING view ─── */
  if (isLoading) {
    return (
      <Modal isOpen title={CM.createDatabase} icon="add_circle" onClose={handleClose} maxWidth="600px">
        <ModalStatusLoading
          title={CM.createDatabase}
          subtitle={getCmsJobLoadingSubtitle(formData.dbName, jobStatus, CM)}
        />
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  if (isSuccess) {
    return (
      <Modal isOpen title={CM.createDatabase} icon="add_circle" iconVariant="success" onClose={handleClose} maxWidth="600px">
        <ModalStatusSuccess 
          title={CM.success}
          message={CM.createDbJobComplete(CM.createDatabase)}
          onConfirm={handleClose}
          confirmText={CM.ok}
        />
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (isError) {
    return (
      <Modal isOpen title={CM.createDatabase} icon="add_circle" iconVariant="danger" onClose={resetAction} maxWidth="600px">
        <ModalStatusError 
          title={CM.failure}
          error={error}
          onRetry={handleFinish}
          onCancel={resetAction}
          cancelText={CM.close}
        />
      </Modal>
    );
  }

  /* ─── FORM view ─── */
  return (
    <Modal
      isOpen={isCreateDatabaseModalOpen}
      onClose={handleClose}
      title={CM.createDatabase}
      subtitle={CM.createDatabaseMsg}
      icon="add_circle"
      maxWidth="780px"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-1.5">
            {steps.map(s => (
              <div
                key={s.id}
                className={`rounded-full transition-all duration-300 ${
                  step === s.id ? 'w-5 h-1.5 bg-amber-500' :
                  step > s.id ? 'w-1.5 h-1.5 bg-amber-500/40' :
                  'w-1.5 h-1.5 bg-slate-200 dark:bg-white/10'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleClose}>{CM.cancel}</Button>
            {step > 1 && (
              <Button variant="outline" onClick={handleBack}>
                {CM.back}
              </Button>
            )}
            {step < 5 ? (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!isFormValid()}
                icon="chevron_right"
                iconPosition="right"
                className="min-w-[140px]"
              >
                {CM.next}
              </Button>
            ) : (
              <Button variant="primary" onClick={handleFinish} icon="done_all" className="min-w-[140px]">
                {CM.finish}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-0">
        {/* Step Track */}
        <div className="mb-6">
          {/* Step nodes */}
          <div className="flex items-center">
            {steps.map((s, idx) => {
              const isActive  = step === s.id;
              const isDone    = step > s.id;
              const isLast    = idx === steps.length - 1;
              return (
                <React.Fragment key={s.id}>
                  {/* Node column */}
                  <div className="flex flex-col items-center shrink-0" style={{ minWidth: 0 }}>
                    {/* Pill */}
                    <div className={`relative w-9 h-9 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${
                      isDone
                        ? 'bg-amber-500 border-amber-500 text-white shadow-[0_0_14px_rgba(245,158,11,0.3)]'
                        : isActive
                        ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_16px_rgba(245,158,11,0.2)]'
                        : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-600'
                    }`}>
                      <Icon
                        name={isDone ? 'check' : s.icon}
                        size={isDone ? '13px' : '15px'}
                        weight={isDone ? 700 : 300}
                      />
                      {isActive && (
                        <span className="absolute inset-0 rounded-2xl border-2 border-amber-500/50 animate-ping opacity-50" />
                      )}
                    </div>
                    {/* Label — only under active step */}
                    <div className="h-8 flex flex-col items-center justify-center mt-1.5">
                      {isActive && (
                        <span className="text-[9px] font-black capitalize tracking-widest text-amber-500 text-center leading-tight animate-in fade-in slide-in-from-top-1 duration-200 px-1">
                          {s.label}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Connector line */}
                  {!isLast && (
                    <div className="flex-1 mx-2 mb-7">
                      <div className="relative h-px">
                        <div className="absolute inset-0 bg-slate-100 dark:bg-white/6 rounded-full" />
                        <div className={`absolute inset-y-0 left-0 rounded-full transition-all duration-600 ease-in-out ${
                          isDone ? 'right-0 bg-gradient-to-r from-amber-500/60 to-amber-400/40' : 'right-full'
                        }`} />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* STEP 1: General Info */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-2xl p-4">
            <SectionHeader title={CM.wizardGeneral} icon="settings" className="mb-4" />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={CM.databaseName}
                  value={formData.dbName}
                  onChange={(e) => handleInputChange('dbName', e.target.value)}
                  placeholder="e.g. production_db"
                  icon="database"
                />
                <Select
                  label={CM.pageSize}
                  value={formData.pageSize}
                  onChange={(e) => handleInputChange('pageSize', parseInt(e.target.value))}
                  options={PAGE_SIZES.map(s => ({ value: s, label: `${s / 1024} KB` }))}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-2xl p-4">
            <SectionHeader title={CM.localeCharset} icon="language" className="mb-4" />
              <Select
                label={CM.regionLocale}
                value={formData.locale}
                onChange={(e) => handleInputChange('locale', e.target.value)}
                options={locales}
              />
              {formData.locale === 'user_defined' && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  <Input
                    label={CM.userDefined}
                    value={formData.userDefinedLocale}
                    onChange={(e) => handleInputChange('userDefinedLocale', e.target.value)}
                    placeholder="e.g. de_DE.utf8"
                  />
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-2xl p-4">
            <SectionHeader title={CM.genericVolInfo} icon="folder_open" className="mb-4" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3 p-4 bg-slate-50/50 dark:bg-white/3 border border-slate-200 dark:border-white/5 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                       <Icon name="storage" size="14px" weight={400} className="text-amber-500" />
                      Generic Volume
                    </span>
                    <span className="text-[9px] font-black uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-sm border border-amber-500/20">System</span>
                  </div>
                  <Input label={CM.genericVolPath} value={formData.genericVolPath} disabled size="sm" />
                  <Input label={CM.volumeSize} type="number" value={formData.genericVolSize} onChange={(e) => handleInputChange('genericVolSize', Number(e.target.value))} size="sm" />
                </div>

                <div className="space-y-3 p-4 bg-slate-50/50 dark:bg-white/3 border border-slate-200 dark:border-white/5 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Icon name="history" size="14px" weight={400} className="text-amber-500" />
                      Log Volume
                    </span>
                    <span className="text-[9px] font-black uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-sm border border-rose-500/20">Critical</span>
                  </div>
                  <Input label={CM.logVolPath} value={formData.logVolPath} disabled size="sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input label={CM.volumeSize} type="number" value={formData.logVolSize} onChange={(e) => handleInputChange('logVolSize', Number(e.target.value))} size="sm" />
                    <Select label={CM.logPageSize} value={formData.logPageSize} onChange={(e) => handleInputChange('logPageSize', parseInt(e.target.value))} options={PAGE_SIZES.map(s => ({ value: s, label: `${s / 1024}K` }))} size="sm" />
                  </div>
                </div>
              </div>
            </div>

            <div 
              className={`flex items-center justify-between p-4 border rounded-2xl transition-all duration-200 cursor-pointer select-none
                ${formData.autoStart ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white dark:bg-white/2 border-slate-100 dark:border-white/5'}`}
              onClick={() => handleInputChange('autoStart', !formData.autoStart)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${formData.autoStart ? 'bg-amber-500 text-white border-amber-400' : 'bg-slate-100 dark:bg-white/5 border-transparent text-slate-400'}`}>
                  <Icon name={formData.autoStart ? 'flash_on' : 'flash_off'} size="sm" weight={300} />
                </div>
                <div>
                  <Typography variant="p" className={`text-[12px] font-bold transition-colors ${formData.autoStart ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>Start database after creation</Typography>
                  <Typography variant="caption" className="text-slate-400 font-medium leading-none">Automatically start the database when creation completes</Typography>
                </div>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <Toggle checked={formData.autoStart} onChange={(v) => handleInputChange('autoStart', v)} color="amber" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Volumes */}
        {step === 2 && (
          <div className="animate-in fade-in duration-200 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="h4" className="text-[14px] font-bold text-slate-800 dark:text-white">{CM.wizardAdditionalVol}</Typography>
                <Typography variant="p" className="text-[11px] text-slate-500 font-medium">Optionally add extra data or temporary volumes to the database.</Typography>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={addVolume}
                icon="add_box"
              >
                {CM.addVolume}
              </Button>
            </div>

            <div className="max-h-[380px] overflow-y-auto pr-1 space-y-4 custom-scrollbar">
              {formData.volumes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50/30 dark:bg-white/[0.01]">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-slate-500">
                    <Icon name="storage" size="md" weight={300} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-600 dark:text-slate-400">No additional volumes</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{CM.clickAddVolumeHint}</p>
                  </div>
                </div>
              ) : (
                formData.volumes.map((vol, idx) => (
                  <div key={idx} className="p-3.5 bg-white dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-xl space-y-3 hover:border-amber-500/25 dark:hover:border-amber-500/25 transition-all duration-200 group">
                    
                    {/* Card Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon name="storage" size="14px" className="text-amber-500 shrink-0" />
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Volume {idx + 1}
                        </span>
                        <span className="text-[9px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 dark:border-blue-500/30 px-1.5 py-0.5 rounded-md">
                          {CM.permanent}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVolume(idx)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-rose-500 bg-rose-500/5 hover:bg-rose-500/15 transition-all cursor-pointer border border-transparent hover:border-rose-500/10"
                        title={CM.removeVolume}
                      >
                        <Icon name="delete_outline" size="sm" weight={300} />
                      </button>
                    </div>

                    {/* Card Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr_2fr] gap-3">
                      <Input
                        value={vol.name}
                        onChange={(e) => handleVolumeChange(idx, 'name', e.target.value)}
                        size="sm"
                        placeholder={CM.identifier}
                        className="font-mono text-[11px]"
                      />
                      <Input
                        type="number"
                        value={vol.size}
                        onChange={(e) => handleVolumeChange(idx, 'size', Number(e.target.value))}
                        size="sm"
                        min={1}
                        placeholder={CM.sizeMb}
                        suffix="MB"
                      />
                      <Input
                        value={vol.path}
                        onChange={(e) => handleVolumeChange(idx, 'path', e.target.value)}
                        size="sm"
                        placeholder={CM.absolutePath}
                        className="font-mono text-[10px]"
                        title={vol.path}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Automation Settings */}
        {step === 3 && (
          <div className="animate-in fade-in duration-200 space-y-4">

            {/* Header card */}
            <div className="flex items-start gap-4 p-4 bg-white dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Icon name="auto_mode" size="sm" weight={300} className="text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">Auto Volume Expansion</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  When a volume's free space drops below the threshold, CUBRID automatically appends additional pages to keep the database running.
                </p>
              </div>
            </div>

            {/* Policy card */}
            <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
              formData.autoAddVol.data === 'ON'
                ? 'bg-white dark:bg-white/2 border-amber-500/20'
                : 'bg-slate-50/50 dark:bg-white/1 border-slate-100 dark:border-white/5'
            }`}>
              {/* Card header */}
              <div className={`flex items-center justify-between px-4 py-3 border-b transition-all duration-300 ${
                formData.autoAddVol.data === 'ON'
                  ? 'border-amber-500/10 bg-amber-500/[0.03]'
                  : 'border-transparent'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all duration-300 ${
                    formData.autoAddVol.data === 'ON'
                      ? 'bg-amber-500/10 border-amber-500/25 text-amber-500'
                      : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/8 text-slate-400'
                  }`}>
                    <Icon name="database" size="sm" weight={300} />
                  </div>
                  <div>
                    <p className={`text-[12px] font-bold leading-tight transition-colors ${
                      formData.autoAddVol.data === 'ON' ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-600'
                    }`}>Data volume</p>
                    <p className="text-[9px] text-slate-400 font-mono">auto-expansion policy</p>
                  </div>
                </div>
                <Toggle
                  checked={formData.autoAddVol.data === 'ON'}
                  onChange={(v) => handleAutoAddVolChange('data', v ? 'ON' : 'OFF')}
                  size="sm"
                  color="amber"
                />
              </div>

              {/* Card body */}
              <div className={`px-4 py-4 transition-all duration-300 ${formData.autoAddVol.data !== 'ON' ? 'opacity-30 pointer-events-none' : ''}`}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Warning threshold
                    </label>
                    <Input
                      value={formData.autoAddVol.dataWarn}
                      onChange={(e) => handleAutoAddVolChange('dataWarn', e.target.value)}
                      size="sm"
                      placeholder="e.g. 0.15"
                    />
                    <p className="text-[9px] text-slate-400">Ratio 0–1 (e.g. 0.15 = 15% free)</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Extension size
                    </label>
                    <Input
                      value={formData.autoAddVol.dataExtPage}
                      onChange={(e) => handleAutoAddVolChange('dataExtPage', e.target.value)}
                      size="sm"
                      placeholder="e.g. 32768"
                    />
                    <p className="text-[9px] text-slate-400">Number of pages to add per extension</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Index volume policy (CMS setautoaddvol requires index + data) */}
            <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
              formData.autoAddVol.index === 'ON'
                ? 'bg-white dark:bg-white/2 border-amber-500/20'
                : 'bg-slate-50/50 dark:bg-white/1 border-slate-100 dark:border-white/5'
            }`}>
              <div className={`flex items-center justify-between px-4 py-3 border-b transition-all duration-300 ${
                formData.autoAddVol.index === 'ON'
                  ? 'border-amber-500/10 bg-amber-500/[0.03]'
                  : 'border-transparent'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all duration-300 ${
                    formData.autoAddVol.index === 'ON'
                      ? 'bg-amber-500/10 border-amber-500/25 text-amber-500'
                      : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/8 text-slate-400'
                  }`}>
                    <Icon name="sort" size="sm" weight={300} />
                  </div>
                  <div>
                    <p className={`text-[12px] font-bold leading-tight transition-colors ${
                      formData.autoAddVol.index === 'ON' ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-600'
                    }`}>{CM.volumeTypeIndex} volume</p>
                    <p className="text-[9px] text-slate-400 font-mono">auto-expansion policy</p>
                  </div>
                </div>
                <Toggle
                  checked={formData.autoAddVol.index === 'ON'}
                  onChange={(v) => handleAutoAddVolChange('index', v ? 'ON' : 'OFF')}
                  size="sm"
                  color="amber"
                />
              </div>

              <div className={`px-4 py-4 transition-all duration-300 ${formData.autoAddVol.index !== 'ON' ? 'opacity-30 pointer-events-none' : ''}`}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Warning threshold
                    </label>
                    <Input
                      value={formData.autoAddVol.indexWarn}
                      onChange={(e) => handleAutoAddVolChange('indexWarn', e.target.value)}
                      size="sm"
                      placeholder="e.g. 0.15"
                    />
                    <p className="text-[9px] text-slate-400">Ratio 0–1 (e.g. 0.15 = 15% free)</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Extension size
                    </label>
                    <Input
                      value={formData.autoAddVol.indexExtPage}
                      onChange={(e) => handleAutoAddVolChange('indexExtPage', e.target.value)}
                      size="sm"
                      placeholder="e.g. 32768"
                    />
                    <p className="text-[9px] text-slate-400">Number of pages to add per extension</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* STEP 4: Access Control */}
        {step === 4 && (
          <div className="animate-in fade-in duration-200 space-y-6 max-w-sm mx-auto py-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-[0_8px_32px_rgba(255,193,7,0.1)]">
                <Icon name="admin_panel_settings" size="lg" weight={300} />
              </div>
              <div className="space-y-1">
                <Typography variant="h4" className="text-[16px] font-bold text-slate-800 dark:text-white">{CM.wizardSetDbaPass}</Typography>
                <Typography variant="p" className="text-[11px] text-slate-500 font-medium">Set a password for the <span className="font-bold text-amber-500">dba</span> administrator account. Leave blank for no password.</Typography>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                type="password"
                label={CM.password}
                value={formData.dbaPassword}
                onChange={(e) => handleInputChange('dbaPassword', e.target.value)}
                placeholder={CM.leaveBlankNoPassword}
                icon="key"
              />
              <Input
                type="password"
                label={CM.passwordConfirm}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder={CM.repeatPassword}
                icon="verified_user"
                error={(formData.confirmPassword && formData.dbaPassword !== formData.confirmPassword) ? CM.passwordsDoNotMatch : ""}
              />
            </div>
          </div>
        )}

        {/* STEP 5: Commisioning Review */}
        {step === 5 && (
          <div className="animate-in fade-in duration-200 space-y-5">
            <InfoBanner title={CM.wizardDbInfo}>
              Review your configuration below before creating the database. Once confirmed, the process cannot be undone.
            </InfoBanner>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white dark:bg-white/2 border border-slate-200 dark:border-white/8 rounded-2xl">
                <SectionHeader title={CM.configuration} icon="tune" className="mb-4" />
                <div className="space-y-0.5 mt-1">
                  <SummaryRow label={CM.databaseName} value={formData.dbName} accent />
                  <SummaryRow label={CM.pageSize} value={`${formData.pageSize / 1024} KB`} />
                  <SummaryRow label={CM.localeCharset} value={formData.locale === 'user_defined' ? formData.userDefinedLocale : formData.locale.split('.')[0]} />
                  <SummaryRow label={CM.autoStart} value={formData.autoStart ? CM.yes : CM.no} />
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-white/2 border border-slate-200 dark:border-white/8 rounded-2xl">
                <SectionHeader title={CM.storage} icon="hard_drive" className="mb-4" />
                <div className="space-y-0.5 mt-1">
                  <SummaryRow label={CM.totalVolumes} value={`${formData.volumes.length + 2}`} />
                  <SummaryRow label={CM.genericVolume} value={`${formData.genericVolSize} MB`} />
                  <SummaryRow label={CM.logVolume} value={`${formData.logVolSize} MB`} />
                  <div className="flex items-center justify-between pt-3 mt-1.5 border-t border-slate-100 dark:border-white/4">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Total</span>
                    <span className="text-[16px] font-black font-mono text-emerald-500 tracking-tight">{totalStorage} MB</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-white/2 border border-slate-200 dark:border-white/8 rounded-2xl">
              <SectionHeader title={CM.wizardAutoVol} icon="auto_mode" className="mb-3" />
              <div className={`rounded-xl border transition-all ${
                formData.autoAddVol.data === 'ON'
                  ? 'bg-amber-500/[0.03] border-amber-500/15'
                  : 'bg-slate-50 dark:bg-white/2 border-slate-100 dark:border-white/5'
              }`}>
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-inherit">
                  <div className="flex items-center gap-2">
                    <Icon name="database" size="sm" weight={300} className={formData.autoAddVol.data === 'ON' ? 'text-amber-500' : 'text-slate-400'} />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Data volume</span>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${
                    formData.autoAddVol.data === 'ON'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-slate-500/10 text-slate-500 border-slate-500/15'
                  }`}>{formData.autoAddVol.data}</span>
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-white/5">
                  <div className="px-4 py-3">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Warning threshold</p>
                    <p className="text-[13px] font-black font-mono text-slate-700 dark:text-slate-200">{formData.autoAddVol.dataWarn}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">ratio (0–1)</p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Extension size</p>
                    <p className="text-[13px] font-black font-mono text-slate-700 dark:text-slate-200">{formData.autoAddVol.dataExtPage}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">pages per extension</p>
                  </div>
                </div>
              </div>
              <div className={`mt-3 rounded-xl border transition-all ${
                formData.autoAddVol.index === 'ON'
                  ? 'bg-amber-500/[0.03] border-amber-500/15'
                  : 'bg-slate-50 dark:bg-white/2 border-slate-100 dark:border-white/5'
              }`}>
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-inherit">
                  <div className="flex items-center gap-2">
                    <Icon name="sort" size="sm" weight={300} className={formData.autoAddVol.index === 'ON' ? 'text-amber-500' : 'text-slate-400'} />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{CM.volumeTypeIndex} volume</span>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${
                    formData.autoAddVol.index === 'ON'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-slate-500/10 text-slate-500 border-slate-500/15'
                  }`}>{formData.autoAddVol.index}</span>
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-white/5">
                  <div className="px-4 py-3">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Warning threshold</p>
                    <p className="text-[13px] font-black font-mono text-slate-700 dark:text-slate-200">{formData.autoAddVol.indexWarn}</p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Extension size</p>
                    <p className="text-[13px] font-black font-mono text-slate-700 dark:text-slate-200">{formData.autoAddVol.indexExtPage}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-slate-100 dark:border-white/8 rounded-2xl overflow-hidden shadow-xs">
              <div className="px-4 py-2.5 bg-slate-50/50 dark:bg-white/3 border-b border-slate-100 dark:border-white/8">
                <SectionHeader title={CM.wizardAdditionalVol} icon="storage" className="mb-4" />
              </div>
              <div className="divide-y divide-slate-100 dark:divide-white/4 max-h-[160px] overflow-y-auto custom-scrollbar">
                {[
                  { name: `${formData.dbName}_primary`, type: 'generic', size: formData.genericVolSize },
                  { name: `${formData.dbName}_log`, type: 'generic', size: formData.logVolSize },
                  ...formData.volumes
                ].map((vol, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/50 dark:hover:bg-white/2 transition-colors">
                    <Icon name="storage" size="14px" weight={300} className="text-slate-400 shrink-0" />
                    <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 flex-1 truncate">{vol.name}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border leading-tight ${typeBadge('data')}`}>
                      {CM.permanent}
                    </span>
                    <span className="text-[11px] font-black font-mono text-slate-700 dark:text-slate-300 w-16 text-right tabular-nums">{vol.size} MB</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
