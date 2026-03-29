import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeCreateDatabaseModal, createDatabase, fetchCreateDatabaseInfo } from '../databaseSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Select } from '../../../components/ds/forms/Select';
import { Toggle } from '../../../components/ds/forms/Toggle';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Spinner } from '../../../components/ds/foundation/Spinner';

// view states
const VIEW_FORM    = 'form';
const VIEW_LOADING = 'loading';
const VIEW_SUCCESS = 'success';
const VIEW_ERROR   = 'error';

const PAGE_SIZES = [4096, 8192, 16384, 32768];
const LOCALES = [
  { value: 'en_US.iso88591', label: 'en_US.iso88591 — English, Western European' },
  { value: 'en_US.utf8', label: 'en_US.utf8 — English, Universal' },
  { value: 'ko_KR.euckr', label: 'ko_KR.euckr — Korean, Legacy' },
  { value: 'ko_KR.utf8', label: 'ko_KR.utf8 — Korean, Universal' },
  { value: 'user_defined', label: 'User Defined' }
];
const VOLUME_TYPES = [
  { value: 'data', label: 'Data' },
  { value: 'index', label: 'Index' },
  { value: 'temp', label: 'Temp' },
  { value: 'generic', label: 'Generic' }
];

const STEPS = [
  { id: 1, label: 'General', icon: 'settings' },
  { id: 2, label: 'Volumes', icon: 'storage' },
  { id: 3, label: 'Access', icon: 'lock' },
  { id: 4, label: 'Review', icon: 'fact_check' },
];

/* ── helpers ─────────────────────────────────────────────────── */
function SectionLabel({ icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon name={icon} size="14px" weight={400} className="text-amber-500" />
      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">{children}</span>
    </div>
  );
}

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
  const dispatch = useDispatch();
  const { isCreateDatabaseModalOpen } = useSelector((state) => state.databaseUI);
  const { selectedHostUid } = useSelector((state) => state.host);

  const [view, setView] = useState(VIEW_FORM);
  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    dbName: '',
    pageSize: 16384,
    locale: 'en_US.utf8',
    userDefinedLocale: '',
    genericVolPath: '/home/cubrid/databases',
    genericVolSize: 512,
    logVolPath: '/home/cubrid/databases',
    logVolSize: 512,
    logPageSize: 16384,
    autoStart: true,
    volumes: [
      { name: 'data_vol_001', type: 'data', size: 512, path: '/home/cubrid/databases' },
      { name: 'index_vol_001', type: 'index', size: 512, path: '/home/cubrid/databases' },
      { name: 'temp_vol_001', type: 'temp', size: 512, path: '/home/cubrid/databases' }
    ],
    dbaPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (isCreateDatabaseModalOpen && selectedHostUid) {
      setStep(1);
      setView(VIEW_FORM);
      setErrorMsg('');
      setSuccessMsg('');
      dispatch(fetchCreateDatabaseInfo({ hostUid: selectedHostUid }))
        .unwrap()
        .then(data => {
          if (data?.default_db_dir) {
            setFormData(prev => ({
              ...prev,
              genericVolPath: data.default_db_dir,
              logVolPath: data.default_db_dir,
              volumes: prev.volumes.map(vol => ({
                ...vol,
                path: data.default_db_dir
              }))
            }));
          }
        })
        .catch(() => {});
    }
  }, [isCreateDatabaseModalOpen, selectedHostUid, dispatch]);

  useEffect(() => {
    if (formData.dbName) {
      const dbName = formData.dbName;
      setFormData(prev => ({
        ...prev,
        genericVolPath: prev.genericVolPath.endsWith(dbName) ? prev.genericVolPath : `${prev.genericVolPath}${prev.genericVolPath.endsWith('/') ? '' : '/'}${dbName}`,
        logVolPath: prev.logVolPath.endsWith(dbName) ? prev.logVolPath : `${prev.logVolPath}${prev.logVolPath.endsWith('/') ? '' : '/'}${dbName}`,
        volumes: prev.volumes.map(vol => ({
          ...vol,
          name: `${dbName}_${vol.type}_001`,
          path: prev.genericVolPath.endsWith(dbName) ? prev.genericVolPath : `${prev.genericVolPath}${prev.genericVolPath.endsWith('/') ? '' : '/'}${dbName}`
        }))
      }));
    }
  }, [formData.dbName]);

  if (!isCreateDatabaseModalOpen) return null;

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);
  const handleInputChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleVolumeChange = (index, field, value) => {
    const newVolumes = [...formData.volumes];
    newVolumes[index] = { ...newVolumes[index], [field]: value };
    setFormData(prev => ({ ...prev, volumes: newVolumes }));
  };
  const addVolume = () => {
    const type = 'data';
    const name = `${formData.dbName || 'vol'}_${type}_${String(formData.volumes.length + 1).padStart(3, '0')}`;
    setFormData(prev => ({
      ...prev,
      volumes: [...prev.volumes, { name, type, size: 512, path: prev.genericVolPath }]
    }));
  };
  const removeVolume = (index) => setFormData(prev => ({ ...prev, volumes: prev.volumes.filter((_, i) => i !== index) }));

  const isFormValid = () => {
    if (step === 1) return formData.dbName && formData.genericVolPath && formData.logVolPath;
    if (step === 3) return formData.dbaPassword && formData.dbaPassword === formData.confirmPassword && formData.dbaPassword.length >= 8;
    return true;
  };

  const handleFinish = async () => {
    if (!selectedHostUid) return;

    setView(VIEW_LOADING);
    try {
      const exvol = formData.volumes.map(vol => ({
        [vol.name]: {
          volpath: vol.path,
          volsize: String(Math.floor((vol.size * 1024 * 1024) / formData.pageSize)),
          voltype: vol.type
        }
      }));

      const payload = {
        dbname: formData.dbName,
        numpage: String(Math.floor((formData.genericVolSize * 1024 * 1024) / formData.pageSize)),
        pagesize: String(formData.pageSize),
        logsize: String(Math.floor((formData.logVolSize * 1024 * 1024) / formData.logPageSize)),
        logpagesize: String(formData.logPageSize),
        genvolpath: formData.genericVolPath,
        logvolpath: formData.logVolPath,
        exvol: exvol,
        charset: formData.locale === 'user_defined' ? formData.userDefinedLocale : formData.locale,
        overwrite_config_file: 'n',
        updateUser: {
          userpass: formData.dbaPassword
        },
        setAutoStart: formData.autoStart,
      };

      await dispatch(createDatabase({ hostUid: selectedHostUid, payload })).unwrap();
      setSuccessMsg(`Database "${formData.dbName}" has been successfully initialized and commissioned.`);
      setView(VIEW_SUCCESS);
    } catch (error) {
      setErrorMsg(typeof error === 'string' ? error : (error.message || 'An unexpected error occurred during database creation.'));
      setView(VIEW_ERROR);
    }
  };

  const handleClose = () => dispatch(closeCreateDatabaseModal());

  const totalStorage = formData.genericVolSize + formData.logVolSize + formData.volumes.reduce((a, v) => a + v.size, 0);
  const pwRules = [
    { text: 'At least 8 characters', ok: formData.dbaPassword.length >= 8 },
    { text: 'Letters and numbers', ok: /[a-zA-Z]/.test(formData.dbaPassword) && /\d/.test(formData.dbaPassword) },
    { text: 'At least one special symbol', ok: /[!@#$%^&*(),.?":{}|<>]/.test(formData.dbaPassword) },
  ];

  /* ─── LOADING view ─── */
  if (view === VIEW_LOADING) {
    return (
      <Modal isOpen title="Initializing Instance" icon="add_circle" onClose={handleClose} maxWidth="600px">
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
              Creating Database Structure
            </Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium max-w-[320px] mx-auto leading-relaxed">
              Allocating volume space and initializing the system catalog for <span className="text-slate-900 dark:text-white font-black">{formData.dbName}</span>.
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
      <Modal isOpen title="Database Created" icon="add_circle" iconVariant="success" onClose={handleClose} maxWidth="600px">
        <div className="flex flex-col items-center justify-center py-12 gap-7 text-center animate-in fade-in duration-200">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.3)]">
              <Icon name="verified" size="lg" weight={700} className="text-white" />
            </div>
          </div>

          <div className="space-y-2 px-8">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
              Initialization Complete
            </Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[340px] mx-auto">
              Instance <span className="font-black text-slate-900 dark:text-white">{formData.dbName}</span> is now active and ready for data ingest.
            </Typography>
          </div>

          {successMsg && (
            <div className="w-full max-w-[420px] bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-4 py-3.5 text-left">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon name="rule" size="xs" weight={300} className="text-emerald-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Status Report</span>
              </div>
              <Typography variant="caption" className="text-emerald-600 dark:text-emerald-400/80 font-medium leading-relaxed">
                {successMsg}
              </Typography>
            </div>
          )}

          <Button variant="secondary" onClick={handleClose}>Access Instance</Button>
        </div>
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (view === VIEW_ERROR) {
    return (
      <Modal isOpen title="Creation Failed" icon="add_circle" iconVariant="danger" onClose={handleClose} maxWidth="600px">
        <div className="flex flex-col items-center justify-center py-10 gap-6 text-center animate-in fade-in duration-200">
          <div className="relative">
            <div className="absolute inset-0 bg-rose-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <Icon name="error" size="md" weight={300} className="text-white" />
            </div>
          </div>

          <div className="space-y-2 px-6">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
              Action Interrupted
            </Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[300px] mx-auto">
              The initialization sequence for <span className="font-bold text-slate-900 dark:text-white">{formData.dbName}</span> was halted.
            </Typography>
          </div>

          <div className="w-full max-w-[420px] bg-rose-500/5 border border-rose-500/15 rounded-xl px-4 py-3 text-left">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon name="terminal" size="xs" weight={300} className="text-rose-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-400">System Trace</span>
            </div>
            <Typography variant="caption" className="text-rose-400/80 font-mono leading-relaxed break-words">
              {errorMsg}
            </Typography>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleClose}>Dismiss</Button>
            <Button variant="danger" icon="refresh" onClick={() => { setView(VIEW_FORM); setErrorMsg(''); setStep(1); }}>
              Retry Setup
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── FORM view ─── */
  return (
    <Modal
      isOpen={isCreateDatabaseModalOpen}
      onClose={handleClose}
      title="Create Database"
      subtitle={`Step ${step} of 4 — ${STEPS[step - 1].label}`}
      icon="add_circle"
      maxWidth="780px"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-1.5">
            {STEPS.map(s => (
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
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} icon="chevron_left">
                Back
              </Button>
            )}
            {step < 4 ? (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!isFormValid()}
                icon="chevron_right"
                iconPosition="right"
              >
                Continue
              </Button>
            ) : (
              <Button variant="primary" onClick={handleFinish} icon="done_all">
                Create database
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-0">
        {/* Step Track */}
        <div className="flex items-center gap-0 mb-5 px-1">
          {STEPS.map((s, idx) => (
            <React.Fragment key={s.id}>
              <div className="flex items-center gap-2 shrink-0">
                <div className={`w-6 h-6 rounded-xl flex items-center justify-center border text-[10px] font-black transition-all duration-300 ${
                  step > s.id
                    ? 'bg-amber-500 border-amber-500 text-white'
                    : step === s.id
                    ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_12px_rgba(255,193,7,0.1)]'
                    : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-400'
                }`}>
                  {step > s.id
                    ? <Icon name="check" size="11px" weight={700} />
                    : <span>{s.id}</span>
                  }
                </div>
                <span className={`text-[11px] font-bold transition-colors uppercase tracking-widest ${
                  step === s.id ? 'text-amber-600 dark:text-amber-400' :
                  step > s.id ? 'text-slate-400 dark:text-slate-500' :
                  'text-slate-300 dark:text-slate-600'
                }`}>{s.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 mx-3 h-px transition-all duration-500 ${step > idx + 1 ? 'bg-amber-500/30' : 'bg-slate-100 dark:bg-white/6'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* STEP 1: General Info */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-2xl p-4">
              <SectionLabel icon="settings">Basic Configuration</SectionLabel>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Database name"
                  value={formData.dbName}
                  onChange={(e) => handleInputChange('dbName', e.target.value)}
                  placeholder="e.g. production_db"
                  icon="database"
                />
                <Select
                  label="Page size"
                  value={formData.pageSize}
                  onChange={(e) => handleInputChange('pageSize', parseInt(e.target.value))}
                  options={PAGE_SIZES.map(s => ({ value: s, label: `${s / 1024} KB` }))}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-2xl p-4">
              <SectionLabel icon="language">Locale & Encoding</SectionLabel>
              <Select
                label="Region locale"
                value={formData.locale}
                onChange={(e) => handleInputChange('locale', e.target.value)}
                options={LOCALES}
              />
              {formData.locale === 'user_defined' && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  <Input
                    label="Custom locale"
                    value={formData.userDefinedLocale}
                    onChange={(e) => handleInputChange('userDefinedLocale', e.target.value)}
                    placeholder="e.g. de_DE.utf8"
                  />
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-2xl p-4">
              <SectionLabel icon="folder_open">Volume Mapping</SectionLabel>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3 p-4 bg-slate-50/50 dark:bg-white/3 border border-slate-200 dark:border-white/5 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Icon name="storage" size="14px" weight={400} className="text-amber-500" />
                      Generic Volume
                    </span>
                    <span className="text-[9px] font-black uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-sm border border-amber-500/20">System</span>
                  </div>
                  <Input label="Storage Path" value={formData.genericVolPath} disabled size="sm" />
                  <Input label="Volume Size (MB)" type="number" value={formData.genericVolSize} onChange={(e) => handleInputChange('genericVolSize', Number(e.target.value))} size="sm" />
                </div>

                <div className="space-y-3 p-4 bg-slate-50/50 dark:bg-white/3 border border-slate-200 dark:border-white/5 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Icon name="history" size="14px" weight={400} className="text-amber-500" />
                      Log Volume
                    </span>
                    <span className="text-[9px] font-black uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-sm border border-rose-500/20">Critical</span>
                  </div>
                  <Input label="Log Path" value={formData.logVolPath} disabled size="sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Size (MB)" type="number" value={formData.logVolSize} onChange={(e) => handleInputChange('logVolSize', Number(e.target.value))} size="sm" />
                    <Select label="Page Size" value={formData.logPageSize} onChange={(e) => handleInputChange('logPageSize', parseInt(e.target.value))} options={PAGE_SIZES.map(s => ({ value: s, label: `${s / 1024}K` }))} size="sm" />
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
                  <Typography variant="p" className={`text-[12px] font-bold transition-colors ${formData.autoStart ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>Auto-Provisioning</Typography>
                  <Typography variant="caption" className="text-slate-400 font-medium leading-none">Activate entire ecosystem post-initialization</Typography>
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
          <div className="animate-in fade-in duration-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="h4" className="text-[14px] font-black text-slate-800 dark:text-white tracking-tight">Active Volume Topology</Typography>
                <Typography variant="p" className="text-[11px] text-slate-500 font-medium">Provision secondary storage for data shards and index blocks.</Typography>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={addVolume}
                icon="add_box"
              >
                Provision Volume
              </Button>
            </div>

            <div className="border border-slate-100 dark:border-white/8 rounded-2xl overflow-hidden bg-white dark:bg-white/1">
              <div className="grid grid-cols-[1fr_120px_100px_1.5fr_44px] bg-slate-50 dark:bg-white/3 border-b border-slate-100 dark:border-white/8 px-4 py-2.5">
                {['Identifier', 'Segment', 'Size MB', 'Absolute Path', ''].map((h, i) => (
                  <span key={i} className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{h}</span>
                ))}
              </div>

              <div className="divide-y divide-slate-100 dark:divide-white/4 max-h-[320px] overflow-y-auto custom-scrollbar">
                {formData.volumes.map((vol, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_120px_100px_1.5fr_44px] items-center gap-0 px-4 py-2 hover:bg-slate-50/50 dark:hover:bg-white/2 transition-colors group">
                    <div className="pr-3">
                      <Input value={vol.name} onChange={(e) => handleVolumeChange(idx, 'name', e.target.value)} size="sm" className="font-mono text-[11px]" />
                    </div>
                    <div className="pr-3">
                      <Select value={vol.type} onChange={(e) => handleVolumeChange(idx, 'type', e.target.value)} options={VOLUME_TYPES} size="sm" />
                    </div>
                    <div className="pr-3">
                      <Input type="number" value={vol.size} onChange={(e) => handleVolumeChange(idx, 'size', Number(e.target.value))} size="sm" suffix="MB" />
                    </div>
                    <div className="pr-1">
                      <Input value={vol.path} onChange={(e) => handleVolumeChange(idx, 'path', e.target.value)} size="sm" className="font-mono text-[10px]" />
                    </div>
                    <button
                      onClick={() => removeVolume(idx)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 hover:bg-rose-500/10 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <Icon name="delete_outline" size="sm" weight={300} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 px-4 py-2.5 border-t border-slate-100 dark:border-white/4 bg-slate-50/50 dark:bg-white/1">
                {VOLUME_TYPES.map(vt => (
                  <span key={vt.value} className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${typeBadge(vt.value)}`}>{vt.label}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Access Control */}
        {step === 3 && (
          <div className="animate-in fade-in duration-200 space-y-6 max-w-sm mx-auto py-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-[0_8px_32px_rgba(255,193,7,0.1)]">
                <Icon name="admin_panel_settings" size="lg" weight={300} />
              </div>
              <div className="space-y-1">
                <Typography variant="h4" className="text-[16px] font-black text-slate-800 dark:text-white tracking-tight">Access Guardian</Typography>
                <Typography variant="p" className="text-[11px] text-slate-500 font-medium">Initialize the core <span className="font-black text-amber-500 uppercase">dba</span> administrative token.</Typography>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                type="password"
                label="Primary DBA Token"
                value={formData.dbaPassword}
                onChange={(e) => handleInputChange('dbaPassword', e.target.value)}
                placeholder="Strength required"
                icon="key"
              />
              <Input
                type="password"
                label="Verify Token"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm entry"
                icon="verified_user"
                error={(formData.confirmPassword && formData.dbaPassword !== formData.confirmPassword) ? "Tokens do not match" : ""}
              />
            </div>

            <div className="p-4 bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/8 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="security_update_good" size="xs" weight={400} className="text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Heuristics</span>
              </div>
              {pwRules.map((rule, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${rule.ok ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-slate-700'}`}>
                    <Icon name={rule.ok ? 'check' : 'close'} size="10px" weight={900} />
                  </div>
                  <span className={`text-[11px] font-bold transition-colors ${rule.ok ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600'}`}>
                    {rule.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Commisioning Review */}
        {step === 4 && (
          <div className="animate-in fade-in duration-200 space-y-5">
            <div className="flex items-center gap-4 p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-[0_4px_16px_rgba(16,185,129,0.3)]">
                <Icon name="verified" size="md" weight={400} />
              </div>
              <div>
                <Typography variant="p" className="text-[12.5px] font-black text-slate-800 dark:text-white leading-none">Topology Verified</Typography>
                <Typography variant="p" className="text-[11px] text-slate-500 font-medium mt-1">Review finalized manifest before deploying to host.</Typography>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white dark:bg-white/2 border border-slate-200 dark:border-white/8 rounded-2xl">
                <SectionLabel icon="tune">Heuristics</SectionLabel>
                <div className="space-y-0.5 mt-1">
                  <SummaryRow label="Primary Identifier" value={formData.dbName} accent />
                  <SummaryRow label="Base Page Topology" value={`${formData.pageSize / 1024} KB`} />
                  <SummaryRow label="Execution Locale" value={formData.locale === 'user_defined' ? formData.userDefinedLocale : formData.locale.split('.')[0]} />
                  <SummaryRow label="Automatic Ignition" value={formData.autoStart ? 'Ready' : 'Manual'} />
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-white/2 border border-slate-200 dark:border-white/8 rounded-2xl">
                <SectionLabel icon="hard_drive">Physical Footprint</SectionLabel>
                <div className="space-y-0.5 mt-1">
                  <SummaryRow label="Segment Count" value={`${formData.volumes.length + 2}`} />
                  <SummaryRow label="System Volume" value={`${formData.genericVolSize} MB`} />
                  <SummaryRow label="Transmission Logs" value={`${formData.logVolSize} MB`} />
                  <div className="flex items-center justify-between pt-3 mt-1.5 border-t border-slate-100 dark:border-white/4">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Total Projection</span>
                    <span className="text-[16px] font-black font-mono text-emerald-500 tracking-tight">{totalStorage} MB</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-slate-100 dark:border-white/8 rounded-2xl overflow-hidden shadow-xs">
              <div className="px-4 py-2.5 bg-slate-50/50 dark:bg-white/3 border-b border-slate-100 dark:border-white/8">
                <SectionLabel icon="storage">Segment Manifest</SectionLabel>
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
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border leading-tight ${typeBadge(vol.type)}`}>{vol.type}</span>
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
