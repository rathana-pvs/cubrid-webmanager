import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeAddBackupPlanModal, addBackupSchedule } from '../databaseSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Select } from '../../../components/ds/forms/Select';
import { Toggle } from '../../../components/ds/forms/Toggle';
import { Typography } from '../../../components/ds/foundation/Typography';

// view states
const VIEW_FORM    = 'form';
const VIEW_LOADING = 'loading';
const VIEW_SUCCESS = 'success';
const VIEW_ERROR   = 'error';

const LEVEL_PRESETS = [
  { value: '0', title: 'Full (L0)', desc: 'Static Clone', icon: 'auto_awesome_motion' },
  { value: '1', title: 'Inc. (L1)', desc: 'Delta L0', icon: 'trending_up' },
  { value: '2', title: 'Inc. (L2)', desc: 'Delta L1', icon: 'call_split' }
];

export default function AddBackupPlanModal() {
  const dispatch = useDispatch();
  const { isAddBackupPlanModalOpen } = useSelector((state) => state.databaseUI);
  const { selectedDatabase } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);

  const [view, setView] = useState(VIEW_FORM);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    backupId: '',
    backupLevel: '0',
    backupPath: '',
    periodType: 'Monthly',
    periodDetail: [1],
    backupTime: '12:30',
    deleteArchive: false,
    checkConsistency: false,
    updateStatistics: false,
    useCompression: false,
    threads: 0,
    backupsToKeep: 0,
    onlineType: 'offline'
  });

  useEffect(() => {
    if (isAddBackupPlanModalOpen && selectedDatabase) {
      setView(VIEW_FORM);
      setErrorMsg('');
      setFormData({
        backupLevel: '0',
        backupPath: `/home/cubrid/CUBRID/databases/${selectedDatabase}/backup`,
        backupId: `backup_${selectedDatabase}_${Date.now().toString().slice(-4)}`,
        periodType: 'Monthly',
        periodDetail: [1],
        backupTime: '12:30',
        deleteArchive: false,
        checkConsistency: false,
        updateStatistics: false,
        useCompression: false,
        threads: 0,
        backupsToKeep: 0,
        onlineType: 'offline'
      });
    }
  }, [isAddBackupPlanModalOpen, selectedDatabase]);

  if (!isAddBackupPlanModalOpen) return null;

  const handleInputChange = (field, value) => {
    if (field === 'periodType') {
      setFormData(prev => ({ 
        ...prev, 
        periodType: value,
        periodDetail: value === 'Daily' ? [] : (value === 'Specific days' ? new Date().toISOString().split('T')[0] : [1])
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      periodDetail: prev.periodDetail.includes(day)
        ? prev.periodDetail.filter(d => d !== day)
        : [...prev.periodDetail, day]
    }));
  };

  const setBulkDays = (type) => {
    let days = [];
    switch(type) {
      case 'all': days = Array.from({length: 31}, (_, i) => i + 1); break;
      case 'clear': days = []; break;
      case 'weekdays': 
        days = Array.from({length: 31}, (_, i) => i + 1).filter(d => (d % 7 !== 6 && d % 7 !== 0)); 
        break;
      case 'weekends':
        days = Array.from({length: 31}, (_, i) => i + 1).filter(d => (d % 7 === 6 || d % 7 === 0));
        break;
      default: days = [];
    }
    handleInputChange('periodDetail', days);
  };

  const handleSave = async () => {
    if (!selectedDatabase || !selectedHostUid) return;

    setView(VIEW_LOADING);
    setErrorMsg('');

    let periodDateValue = '';
    if (formData.periodType === 'Weekly') {
      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const selectedDays = Array.isArray(formData.periodDetail) ? formData.periodDetail : [];
      periodDateValue = selectedDays.map(dayNum => dayNames[dayNum - 1]).join(',');
    } else if (formData.periodType === 'Monthly') {
      periodDateValue = Array.isArray(formData.periodDetail) ? formData.periodDetail.join(',') : '';
    } else if (formData.periodType === 'Specific days') {
      periodDateValue = formData.periodDetail || '';
    }

    const payload = {
      backupid: formData.backupId,
      level: formData.backupLevel,
      path: formData.backupPath,
      period_type: formData.periodType === 'Specific days' ? 'Special' : formData.periodType,
      period_date: periodDateValue,
      time: formData.backupTime.replace(':', ''),
      archivedel: formData.deleteArchive ? 'ON' : 'OFF',
      updatestatus: formData.updateStatistics ? 'ON' : 'OFF',
      zip: formData.useCompression ? 'y' : 'n',
      check: formData.checkConsistency ? 'y' : 'n',
      storeold: 'OFF',
      mt: formData.threads,
      bknum: formData.backupsToKeep,
      onoff: formData.onlineType === 'online' ? 'ON' : 'OF',
    };

    try {
      await dispatch(addBackupSchedule({ hostUid: selectedHostUid, dbname: selectedDatabase, payload })).unwrap();
      setView(VIEW_SUCCESS);
    } catch (err) {
      setErrorMsg(typeof err === 'string' ? err : (err.message || 'Operation aborted by system controller. Verify target path permissions.'));
      setView(VIEW_ERROR);
    }
  };

  const handleClose = () => dispatch(closeAddBackupPlanModal());

  /* ─── LOADING view ─── */
  if (view === VIEW_LOADING) {
    return (
      <Modal isOpen title="Initializing Schedule" icon="backup_table" onClose={handleClose} maxWidth="700px">
        <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in fade-in duration-200">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-slate-100 dark:border-white/5" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-bk-yellow animate-spin" style={{ animationDuration: '0.9s' }} />
            <div className="absolute inset-0 flex items-center justify-center text-bk-yellow">
              <Icon name="history" size="md" weight={400} className="animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-1.5 px-8">
            <Typography variant="h4" className="text-[14px] font-black text-slate-800 dark:text-white tracking-tight text-center">Committing Automation</Typography>
            <Typography variant="p" className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-[320px] mx-auto">
              Synchronizing <span className="font-black text-slate-900 dark:text-white font-mono">{formData.backupId}</span> with the system scheduler.
            </Typography>
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  if (view === VIEW_SUCCESS) {
    return (
      <Modal isOpen title="Schedule Commited" icon="backup_table" iconVariant="success" onClose={handleClose} maxWidth="700px">
        <div className="flex flex-col items-center justify-center py-12 gap-7 text-center animate-in fade-in duration-200">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.3)]">
            <Icon name="verified" size="lg" weight={700} className="text-white" />
          </div>
          <div className="space-y-2 px-8">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">Automation Active</Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 font-medium leading-relaxed max-w-[360px] mx-auto">
              The backup plan for <span className="font-bold text-slate-900 dark:text-white">{selectedDatabase}</span> is now registered and will execute as scheduled.
            </Typography>
          </div>
          <Button variant="secondary" onClick={handleClose}>Confirm & Dismiss</Button>
        </div>
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (view === VIEW_ERROR) {
    return (
      <Modal isOpen title="Execution Error" icon="backup_table" iconVariant="danger" onClose={handleClose} maxWidth="700px">
        <div className="flex flex-col items-center justify-center py-10 gap-6 text-center animate-in fade-in duration-200">
          <div className="relative w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)]">
            <Icon name="error" size="md" weight={300} className="text-white" />
          </div>
          <div className="space-y-2 px-6">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">Transaction Dropped</Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 font-medium leading-relaxed">System controller could not finalize the schedule registry.</Typography>
          </div>
          <div className="w-full max-w-[480px] bg-rose-500/5 border border-rose-500/15 rounded-xl px-4 py-3 text-left">
            <Typography variant="caption" className="text-rose-400 font-mono leading-relaxed break-words block text-center uppercase tracking-widest text-[10px] font-bold italic">
              {errorMsg}
            </Typography>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleClose}>Dismiss</Button>
            <Button variant="primary" icon="refresh" onClick={() => { setView(VIEW_FORM); setErrorMsg(''); }}>Retry Submission</Button>
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── FORM view ─── */
  return (
    <Modal
      isOpen={isAddBackupPlanModalOpen}
      onClose={handleClose}
      title="Create Backup Plan"
      subtitle={`Configure automated scheduled backups for ${selectedDatabase}`}
      icon="backup_table"
      maxWidth="700px"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="ghost" onClick={handleClose}>Discard</Button>
          <Button variant="primary" onClick={handleSave} icon="play_circle" className="min-w-[140px]">Initialize Cycle</Button>
        </div>
      }
    >
      <div className="space-y-10 pb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* Level Presets */}
        <div className="space-y-4">
           <div className="flex items-center gap-3">
             <Icon name="architecture" size="14px" weight={400} className="text-bk-yellow" />
             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Abstraction Level</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {LEVEL_PRESETS.map(item => (
              <button
                key={item.value}
                onClick={() => handleInputChange('backupLevel', item.value)}
                className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-300 group ${
                  formData.backupLevel === item.value
                    ? 'bg-bk-yellow/10 border-bk-yellow/40 shadow-xs'
                    : 'bg-white dark:bg-white/1 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 transition-colors border ${
                  formData.backupLevel === item.value ? 'bg-bk-yellow text-slate-900 border-bk-yellow/50' : 'bg-slate-50 dark:bg-white/5 text-slate-400 border-transparent'
                }`}>
                  <Icon name={item.icon} size="sm" weight={300} />
                </div>
                <Typography variant="p" className={`font-black text-[11.5px] mb-0.5 tracking-tight ${formData.backupLevel === item.value ? 'text-bk-yellow' : 'text-slate-900 dark:text-white'}`}>{item.title}</Typography>
                <Typography variant="caption" className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">{item.desc}</Typography>
              </button>
            ))}
          </div>
        </div>

        {/* Identity & Path */}
        <div className="grid grid-cols-2 gap-4">
          <Input label="Plan Registry ID" value={formData.backupId} onChange={(e) => handleInputChange('backupId', e.target.value)} placeholder="backup_plan_1" icon="badge" size="sm" />
          <Input label="Payload Path" value={formData.backupPath} onChange={(e) => handleInputChange('backupPath', e.target.value)} placeholder="/var/backups" icon="folder_zip" size="sm" className="font-mono!" />
        </div>

        {/* Recurrence */}
        <div className="space-y-4">
           <div className="flex items-center gap-3">
             <Icon name="schedule" size="14px" weight={400} className="text-bk-yellow" />
             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Execution Schedule</span>
          </div>
          <div className="p-5 bg-slate-50/50 dark:bg-white/1 border border-slate-100 dark:border-white/4 rounded-2xl space-y-6 shadow-xs">
            <div className="flex gap-4">
              <div className="flex-1">
                <Select 
                  label="Rotation Logic"
                  value={formData.periodType}
                  onChange={(e) => handleInputChange('periodType', e.target.value)}
                  options={[
                    { value: 'Monthly', label: 'Monthly Rotation' },
                    { value: 'Weekly', label: 'Weekly Precision' },
                    { value: 'Daily', label: 'Daily Stream' },
                    { value: 'Specific days', label: 'Specialized Single' }
                  ]}
                  size="sm"
                />
              </div>
              <div className="w-[140px]">
                <Input label="Target Time" type="time" value={formData.backupTime} onChange={(e) => handleInputChange('backupTime', e.target.value)} icon="nest_clock_farsight_analog" size="sm" />
              </div>
            </div>

            <div className="animate-in fade-in duration-300">
              {formData.periodType === 'Monthly' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'all', label: 'Full Spectrum', icon: 'select_all' },
                      { id: 'clear', label: 'Reset Grid', icon: 'backspace' },
                      { id: 'weekdays', label: 'Standard Week', icon: 'work' },
                      { id: 'weekends', label: 'Weekend Cycle', icon: 'beach_access' },
                    ].map(preset => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setBulkDays(preset.id)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/3 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:border-bk-yellow/50 hover:text-bk-yellow transition-all"
                      >
                         {preset.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 p-3.5 bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`h-9 rounded-xl border text-[11px] font-black transition-all flex items-center justify-center ${
                          formData.periodDetail.includes(day)
                            ? 'bg-bk-yellow border-bk-yellow text-slate-900 shadow-xs scale-105 z-10'
                            : 'bg-white dark:bg-white/3 border-slate-200 dark:border-white/4 text-slate-400 hover:border-bk-yellow/40'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {formData.periodType === 'Weekly' && (
                <div className="grid grid-cols-7 gap-2 p-3.5 bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                    const dayValue = index + 1;
                    const isActive = formData.periodDetail.includes(dayValue);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(dayValue)}
                        className={`h-11 rounded-xl border text-[11px] font-black transition-all flex items-center justify-center ${
                          isActive
                            ? 'bg-bk-yellow border-bk-yellow text-slate-900 shadow-xs scale-105'
                            : 'bg-white dark:bg-white/3 border-slate-200 dark:border-white/4 text-slate-400 hover:border-bk-yellow/40'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              )}

              {formData.periodType === 'Daily' && (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-2 duration-300">
                  <Icon name="verified" size="md" weight={400} className="text-emerald-500" />
                  <div className="min-w-0">
                    <Typography variant="p" className="text-[11px] font-black text-emerald-500 uppercase tracking-tight leading-none mb-1">Standard 24h Cycle</Typography>
                    <Typography variant="caption" className="text-emerald-500/70 font-medium leading-none block italic">Instance synchronized daily at exactly <span className="font-black text-emerald-500">{formData.backupTime}</span>.</Typography>
                  </div>
                </div>
              )}

              {formData.periodType === 'Specific days' && (
                <Input type="date" label="Registry Date" value={formData.periodDetail} onChange={(e) => handleInputChange('periodDetail', e.target.value)} icon="event" size="sm" />
              )}
            </div>
          </div>
        </div>

        {/* Operational Options */}
        <div className="space-y-4">
           <div className="flex items-center gap-3">
             <Icon name="settings_input_component" size="14px" weight={400} className="text-bk-yellow" />
             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Optimization Matrix</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Archive Rotation', field: 'deleteArchive', icon: 'auto_delete', desc: 'Auto-purge old logs' },
              { label: 'Integrity Seal', field: 'checkConsistency', icon: 'verified', desc: 'Verify block checksums' },
              { label: 'Schema Re-indexing', field: 'updateStatistics', icon: 'query_stats', desc: 'Optimize query map' },
              { label: 'LZ4 Core Compression', field: 'useCompression', icon: 'compress', desc: 'Minimize disk footprint' },
            ].map(opt => (
              <div 
                key={opt.field} 
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group shadow-xs ${
                  formData[opt.field] 
                    ? 'bg-bk-yellow/5 border-bk-yellow/30' 
                    : 'bg-white dark:bg-white/1 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/12'
                }`}
                onClick={() => handleInputChange(opt.field, !formData[opt.field])}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 border ${
                  formData[opt.field] 
                    ? 'bg-bk-yellow text-slate-900 border-bk-yellow/40' 
                    : 'bg-slate-50 dark:bg-white/5 border-transparent text-slate-400 group-hover:text-slate-500'
                }`}>
                  <Icon name={opt.icon} size="sm" weight={300} />
                </div>
                <div className="flex-1 min-w-0">
                   <Typography variant="p" className={`text-[12px] font-black transition-colors leading-none mb-1 ${formData[opt.field] ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                    {opt.label}
                  </Typography>
                  <Typography variant="caption" className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter block leading-none">{opt.desc}</Typography>
                </div>
                <Toggle checked={formData[opt.field]} onChange={(v) => handleInputChange(opt.field, v)} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div className="grid grid-cols-2 gap-6">
          <Input type="number" label="Concurrent Threads" value={formData.threads} onChange={(e) => handleInputChange('threads', parseInt(e.target.value) || 0)} icon="speed" suffix="CORES" size="sm" />
          <Input type="number" label="Rotation Retention" value={formData.backupsToKeep} onChange={(e) => handleInputChange('backupsToKeep', parseInt(e.target.value) || 0)} icon="history" suffix="SETS" size="sm" />
        </div>

        {/* Mode Selector */}
        <div className="space-y-3 px-1">
          {[
            { value: 'online', label: 'Concurrent Session (Online)', desc: 'Zero downtime operation with read-write access preserved.', icon: 'bolt' },
            { value: 'offline', label: 'Isolated Snapshot (Offline)', desc: 'Strict consistency with brief service interruption.', icon: 'power_settings_new' }
          ].map(mode => (
            <button
              key={mode.value}
              onClick={() => handleInputChange('onlineType', mode.value)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left shadow-xs ${
                formData.onlineType === mode.value 
                  ? 'bg-bk-yellow/5 border-bk-yellow/40' 
                  : 'bg-white dark:bg-white/1 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/12'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all shrink-0 ${
                formData.onlineType === mode.value ? 'bg-bk-yellow text-slate-900 border-bk-yellow/40' : 'bg-slate-50 dark:bg-white/5 text-slate-400 border-transparent'
              }`}>
                <Icon name={mode.icon} size="md" weight={300} />
              </div>
              <div className="flex-1">
                <Typography variant="p" className={`font-black text-[12px] leading-tight transition-colors ${formData.onlineType === mode.value ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{mode.label}</Typography>
                <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium leading-relaxed block">{mode.desc}</Typography>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                formData.onlineType === mode.value ? 'border-bk-yellow shadow-[0_0_8px_rgba(255,193,7,0.3)]' : 'border-slate-300 dark:border-white/10'
              }`}>
                {formData.onlineType === mode.value && <div className="w-2.5 h-2.5 rounded-full bg-bk-yellow shadow-xs" />}
              </div>
            </button>
          ))}
        </div>

      </div>
    </Modal>
  );
}
