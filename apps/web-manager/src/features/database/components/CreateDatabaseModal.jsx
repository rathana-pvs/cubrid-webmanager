import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeCreateDatabaseModal, createDatabase, fetchCreateDatabaseInfo } from '../databaseSlice';
import { showStatusModal } from '../../layout/layoutSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Select } from '../../../components/ds/forms/Select';
import { Checkbox } from '../../../components/ds/forms/Checkbox';
import { Typography } from '../../../components/ds/foundation/Typography';

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

// ── Shared compact section header ────────────────────────────────────────────
function SectionLabel({ icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon name={icon} size="14px" weight={400} className="text-amber-500" />
      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">{children}</span>
    </div>
  );
}

// ── Read-only summary row ─────────────────────────────────────────────────────
function SummaryRow({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/4 last:border-0">
      <span className="text-[11px] text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`text-[11px] font-bold font-mono ${accent ? 'text-amber-500' : 'text-slate-700 dark:text-slate-200'}`}>{value}</span>
    </div>
  );
}

export default function CreateDatabaseModal() {
  const dispatch = useDispatch();
  const { isCreateDatabaseModalOpen, actionLoading } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);

  const [step, setStep] = useState(1);
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
        .catch(err => console.warn('Failed to fetch default DB dir:', err));
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
    if (step === 3) return formData.dbaPassword && formData.dbaPassword === formData.confirmPassword;
    return true;
  };

  const handleFinish = async () => {
    if (!selectedHostUid) {
      dispatch(showStatusModal({
        type: 'error',
        title: 'Target host missing',
        message: 'Please select a host first.'
      }));
      return;
    }

    try {
      // Map extra volumes to backend format
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
        // The backend expects numpage for generic and log volumes
      };

      await dispatch(createDatabase({ hostUid: selectedHostUid, payload })).unwrap();
      
      dispatch(showStatusModal({
        type: 'success',
        title: 'Database Created',
        message: `Successfully created database "${formData.dbName}" on host.`
      }));
      dispatch(closeCreateDatabaseModal());
    } catch (error) {
      dispatch(showStatusModal({
        type: 'error',
        title: 'Creation Failed',
        message: typeof error === 'string' ? error : (error.message || 'An error occurred during database creation.')
      }));
    }
  };

  const totalStorage = formData.genericVolSize + formData.logVolSize + formData.volumes.reduce((a, v) => a + v.size, 0);
  const pwRules = [
    { text: 'At least 8 characters', ok: formData.dbaPassword.length >= 8 },
    { text: 'Letters and numbers', ok: /[a-zA-Z]/.test(formData.dbaPassword) && /\d/.test(formData.dbaPassword) },
    { text: 'At least one special symbol', ok: /[!@#$%^&*(),.?":{}|<>]/.test(formData.dbaPassword) },
  ];

  // ── Volume type badge colours ─────────────────────────────────────────────
  const typeBadge = (t) => {
    if (t === 'data') return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    if (t === 'index') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    if (t === 'temp') return 'bg-violet-500/10 text-violet-500 border-violet-500/20';
    return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  return (
    <Modal
      isOpen={isCreateDatabaseModalOpen}
      onClose={() => dispatch(closeCreateDatabaseModal())}
      title="Create Database"
      subtitle={`Step ${step} of 4 — ${STEPS[step - 1].label}`}
      icon="add_circle"
      maxWidth="780px"
      loading={actionLoading}
      footer={
        <div className="flex w-full items-center justify-between">
          {/* Step dots */}
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
            <Button
              variant="ghost"
              onClick={() => dispatch(closeCreateDatabaseModal())}
            >
              Cancel
            </Button>
            {step > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  icon="chevron_left"
                >
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
                <Button
                  variant="primary"
                  onClick={handleFinish}
                  icon="done_all"
                >
                  Create database
                </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-0">
        {/* ── Inline Step Track ─────────────────────────────────────────── */}
        <div className="flex items-center gap-0 mb-5 px-1">
          {STEPS.map((s, idx) => (
            <React.Fragment key={s.id}>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] font-black transition-all duration-300 ${
                  step > s.id
                    ? 'bg-amber-500 border-amber-500 text-white'
                    : step === s.id
                    ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                    : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-400'
                }`}>
                  {step > s.id
                    ? <Icon name="check" size="11px" weight={600} />
                    : <span>{s.id}</span>
                  }
                </div>
                <span className={`text-[11px] font-semibold transition-colors ${
                  step === s.id ? 'text-amber-600 dark:text-amber-400' :
                  step > s.id ? 'text-slate-400 dark:text-slate-500' :
                  'text-slate-300 dark:text-slate-600'
                }`}>{s.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 mx-2 h-px transition-all duration-500 ${step > s.id ? 'bg-amber-500/40' : 'bg-slate-100 dark:bg-white/6'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── STEP 1: General Info ───────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">

            {/* Basic Config */}
            <div className="bg-white dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-lg p-4">
              <SectionLabel icon="settings">Basic Configuration</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
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

            {/* Locale */}
            <div className="bg-white dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-lg p-4">
              <SectionLabel icon="language">Locale &amp; Encoding</SectionLabel>
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

            {/* Volume Paths */}
            <div className="bg-white dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-lg p-4">
              <SectionLabel icon="folder_open">Initial Volume Paths</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                {/* Generic Volume */}
                <div className="space-y-2 p-3 bg-slate-50 dark:bg-white/2 border border-slate-100 dark:border-white/4 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Icon name="storage" size="13px" weight={400} className="text-amber-500" />
                      Generic Volume
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-amber-500/10 text-amber-500 border border-amber-500/20">Required</span>
                  </div>
                  <Input label="Path" value={formData.genericVolPath} disabled size="sm" />
                  <Input label="Initial size (MB)" type="number" value={formData.genericVolSize} onChange={(e) => handleInputChange('genericVolSize', Number(e.target.value))} size="sm" />
                </div>

                {/* Log Volume */}
                <div className="space-y-2 p-3 bg-slate-50 dark:bg-white/2 border border-slate-100 dark:border-white/4 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Icon name="history" size="13px" weight={400} className="text-amber-500" />
                      Log Volume
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-amber-500/10 text-amber-500 border border-amber-500/20">Required</span>
                  </div>
                  <Input label="Path" value={formData.logVolPath} disabled size="sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Size (MB)" type="number" value={formData.logVolSize} onChange={(e) => handleInputChange('logVolSize', Number(e.target.value))} size="sm" />
                    <Select label="Page size" value={formData.logPageSize} onChange={(e) => handleInputChange('logPageSize', parseInt(e.target.value))} options={PAGE_SIZES.map(s => ({ value: s, label: `${s / 1024}K` }))} size="sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Auto-start toggle */}
            <div className="flex items-center justify-between px-4 py-3 bg-amber-500/4 border border-amber-500/10 rounded-lg">
              <div className="flex items-center gap-2.5">
                <Icon name={formData.autoStart ? 'flash_on' : 'flash_off'} size="16px" weight={300} className="text-amber-500" />
                <div>
                  <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 leading-none">Auto-start database</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Initialize and start automatically after creation</p>
                </div>
              </div>
              <Checkbox checked={formData.autoStart} onChange={(e) => handleInputChange('autoStart', e.target.checked)} />
            </div>
          </div>
        )}

        {/* ── STEP 2: Volumes ────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="animate-in fade-in duration-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Volume management</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Configure storage volumes for data, index, and temp operations.</p>
              </div>
              <button
                onClick={addVolume}
                className="h-7 px-3 flex items-center gap-1.5 text-[11px] font-semibold bg-amber-500 text-white rounded-sm hover:bg-amber-400 transition-all shadow-xs shadow-amber-500/20"
              >
                <Icon name="add" size="13px" weight={400} />
                Add volume
              </button>
            </div>

            <div className="border border-slate-100 dark:border-white/6 rounded-lg">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_100px_80px_1fr_36px] bg-slate-50 dark:bg-white/2 border-b border-slate-100 dark:border-white/6 px-3 py-2">
                {['Name', 'Type', 'Size (MB)', 'Path', ''].map((h, i) => (
                  <span key={i} className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{h}</span>
                ))}
              </div>

              {/* Table body */}
              <div className="divide-y divide-slate-100 dark:divide-white/4">
                {formData.volumes.map((vol, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_100px_80px_1fr_36px] items-center gap-0 px-3 py-1.5 hover:bg-slate-50/50 dark:hover:bg-white/2 transition-colors group">
                    <div className="pr-2">
                      <Input value={vol.name} onChange={(e) => handleVolumeChange(idx, 'name', e.target.value)} size="sm" />
                    </div>
                    <div className="pr-2">
                      <Select value={vol.type} onChange={(e) => handleVolumeChange(idx, 'type', e.target.value)} options={VOLUME_TYPES} size="sm" />
                    </div>
                    <div className="pr-2">
                      <Input type="number" value={vol.size} onChange={(e) => handleVolumeChange(idx, 'size', Number(e.target.value))} size="sm" />
                    </div>
                    <div className="pr-2">
                      <Input value={vol.path} onChange={(e) => handleVolumeChange(idx, 'path', e.target.value)} size="sm" />
                    </div>
                    <button
                      onClick={() => removeVolume(idx)}
                      className="w-7 h-7 flex items-center justify-center rounded-sm text-slate-300 dark:text-slate-600 hover:bg-rose-500/10 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Icon name="close" size="14px" weight={400} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Type legend */}
              <div className="flex items-center gap-3 px-3 py-2 border-t border-slate-100 dark:border-white/4 bg-slate-50/50 dark:bg-white/1">
                {VOLUME_TYPES.map(vt => (
                  <span key={vt.value} className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm border ${typeBadge(vt.value)}`}>{vt.label}</span>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 bg-amber-500/4 border border-amber-500/10 rounded-lg">
              <Icon name="info" size="14px" weight={300} className="text-amber-500 mt-px shrink-0" />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Distribute volumes across physical disks to optimize I/O. Separate data, index, and temp volumes for best performance.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 3: DBA Password ───────────────────────────────────────── */}
        {step === 3 && (
          <div className="animate-in fade-in duration-200 space-y-4 max-w-sm mx-auto py-2">
            {/* Icon header */}
            <div className="flex flex-col items-center gap-3 text-center pb-2">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Icon name="admin_panel_settings" size="22px" weight={300} />
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200">Account Security</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Set the administrative password for the <span className="font-bold text-amber-500 uppercase tracking-wider">dba</span> account</p>
              </div>
            </div>

            <div className="space-y-3">
              <Input
                type="password"
                label="DBA password"
                value={formData.dbaPassword}
                onChange={(e) => handleInputChange('dbaPassword', e.target.value)}
                placeholder="••••••••••••"
              />
              <Input
                type="password"
                label="Confirm password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="••••••••••••"
                error={(formData.confirmPassword && formData.dbaPassword !== formData.confirmPassword) ? "Passwords don't match" : ""}
              />
            </div>

            {/* Password strength rules */}
            <div className="p-3.5 bg-slate-50 dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-lg space-y-2">
              <div className="flex items-center gap-1.5 mb-2">
                <Icon name="security" size="13px" weight={400} className="text-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Password requirements</span>
              </div>
              {pwRules.map((rule, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Icon
                    name={rule.ok ? 'check_circle' : 'radio_button_unchecked'}
                    size="13px"
                    weight={rule.ok ? 400 : 300}
                    className={rule.ok ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'}
                  />
                  <span className={`text-[11px] font-medium transition-colors ${rule.ok ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'}`}>
                    {rule.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 4: Review & Summary ───────────────────────────────────── */}
        {step === 4 && (
          <div className="animate-in fade-in duration-200 space-y-4">
            {/* Ready banner */}
            <div className="flex items-center gap-3 p-3.5 bg-emerald-500/5 border border-emerald-500/15 rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shrink-0">
                <Icon name="done_all" size="16px" weight={400} />
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-700 dark:text-slate-200">Ready for initialization</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Review your configuration before creating the database.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Parameters */}
              <div className="p-4 bg-white dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-lg">
                <SectionLabel icon="tune">Parameters</SectionLabel>
                <SummaryRow label="Database Name" value={formData.dbName} accent />
                <SummaryRow label="Page Size" value={`${formData.pageSize / 1024} KB`} />
                <SummaryRow label="Locale" value={formData.locale === 'user_defined' ? formData.userDefinedLocale : formData.locale.split('.')[1]} />
                <SummaryRow label="Auto-start" value={formData.autoStart ? 'Enabled' : 'Disabled'} />
              </div>

              {/* Storage */}
              <div className="p-4 bg-white dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-lg">
                <SectionLabel icon="hard_drive">Storage</SectionLabel>
                <SummaryRow label="Total Volumes" value={`${formData.volumes.length + 2}`} />
                <SummaryRow label="Generic Volume" value={`${formData.genericVolSize} MB`} />
                <SummaryRow label="Log Volume" value={`${formData.logVolSize} MB`} />
                <SummaryRow label="Custom Volumes" value={`${formData.volumes.reduce((a, v) => a + v.size, 0)} MB`} />
                <div className="flex items-center justify-between pt-2.5 mt-0.5 border-t border-slate-100 dark:border-white/4">
                  <span className="text-[11px] font-bold text-slate-500">Total Footprint</span>
                  <span className="text-[14px] font-black font-mono text-emerald-500">{totalStorage} MB</span>
                </div>
              </div>
            </div>

            {/* Volume list */}
            <div className="border border-slate-100 dark:border-white/5 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 dark:bg-white/2 border-b border-slate-100 dark:border-white/5">
                <SectionLabel icon="storage">Configured Volumes</SectionLabel>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-white/3">
                {/* Implicit volumes */}
                {[
                  { name: `${formData.dbName}_generic`, type: 'generic', size: formData.genericVolSize, path: formData.genericVolPath },
                  { name: `${formData.dbName}_log`, type: 'generic', size: formData.logVolSize, path: formData.logVolPath },
                  ...formData.volumes
                ].map((vol, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-3 py-2">
                    <Icon name="storage" size="13px" weight={300} className="text-slate-300 dark:text-slate-600 shrink-0" />
                    <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 flex-1 truncate">{vol.name}</span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm border ${typeBadge(vol.type)}`}>{vol.type}</span>
                    <span className="text-[10px] font-bold font-mono text-slate-500 w-14 text-right">{vol.size} MB</span>
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
