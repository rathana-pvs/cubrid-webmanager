import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeEditBackupPlanModal, editBackupSchedule, fetchBackupSchedule } from '../databaseSlice';

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

export default function EditBackupPlanModal() {
  const dispatch = useDispatch();
  const { isEditBackupPlanModalOpen, selectedBackupId } = useSelector((state) => state.databaseUI);
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
    if (isEditBackupPlanModalOpen && selectedDatabase && selectedHostUid) {
      setView(VIEW_FORM);
      setErrorMsg('');
      dispatch(fetchBackupSchedule({ hostUid: selectedHostUid, dbname: selectedDatabase }))
        .unwrap()
        .then((data) => {
          const backupData = data?.backups || data?.backup_info;
          if (backupData) {
            const plans = Array.isArray(backupData) ? backupData : [backupData];
            const info = selectedBackupId ? plans.find(p => p.backupid === selectedBackupId) : plans[0];
            
            if (info) {
              let periodDetail = [];
              if (info.period_type === 'Special') {
                periodDetail = info.period_date || '';
              } else if (info.period_type === 'Weekly' && info.period_date) {
                const dayNameMap = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
                const days = Array.isArray(info.period_date) ? info.period_date : info.period_date.split(',');
                periodDetail = days.map(day => day.trim()).filter(day => dayNameMap[day]).map(day => dayNameMap[day]);
              } else if (info.period_type === 'Monthly' && info.period_date) {
                const days = Array.isArray(info.period_date) ? info.period_date : info.period_date.split(',');
                periodDetail = days.map(Number).filter(day => !isNaN(day) && day >= 1 && day <= 31);
              }

              setFormData({
                backupId: info.backupid || '',
                backupLevel: info.level || '0',
                backupPath: info.path || '',
                periodType: info.period_type === 'Special' ? 'Specific days' : info.period_type,
                periodDetail: periodDetail,
                backupTime: info.time ? `${info.time.slice(0, 2)}:${info.time.slice(2)}` : '12:30',
                deleteArchive: info.archivedel === 'ON',
                updateStatistics: info.updatestatus === 'ON',
                useCompression: info.zip === 'y',
                checkConsistency: info.check === 'y',
                threads: parseInt(info.mt) || 0,
                backupsToKeep: parseInt(info.bknum) || 0,
                onlineType: info.onoff === 'ON' ? 'online' : 'offline'
              });
            }
          }
        });
    }
  }, [isEditBackupPlanModalOpen, selectedDatabase, selectedHostUid, selectedBackupId, dispatch]);

  if (!isEditBackupPlanModalOpen) return null;

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
    const details = Array.isArray(formData.periodDetail) ? formData.periodDetail : [];
    setFormData(prev => ({
      ...prev,
      periodDetail: details.includes(day) ? details.filter(d => d !== day) : [...details, day]
    }));
  };

  const setBulkDays = (type) => {
    let days = [];
    switch(type) {
      case 'all': days = Array.from({length: 31}, (_, i) => i + 1); break;
      case 'clear': days = []; break;
      case 'weekdays': days = Array.from({length: 31}, (_, i) => i + 1).filter(d => (d % 7 !== 6 && d % 7 !== 0)); break;
      case 'weekends': days = Array.from({length: 31}, (_, i) => i + 1).filter(d => (d % 7 === 6 || d % 7 === 0)); break;
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
      await dispatch(editBackupSchedule({ hostUid: selectedHostUid, dbname: selectedDatabase, payload })).unwrap();
      dispatch(fetchBackupSchedule({ hostUid: selectedHostUid, dbname: selectedDatabase }));
      setView(VIEW_SUCCESS);
    } catch (err) {
      setErrorMsg(typeof err === 'string' ? err : (err.message || 'System controller rejected the patch. Verify schema integrity.'));
      setView(VIEW_ERROR);
    }
  };

  const handleClose = () => dispatch(closeEditBackupPlanModal());

  /* ─── LOADING view ─── */
  if (view === VIEW_LOADING) {
    return (
      <Modal isOpen title="Committing Updates" icon="edit" onClose={handleClose} maxWidth="700px">
        <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in fade-in duration-200">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-slate-100 dark:border-white/5" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-bk-yellow animate-spin" style={{ animationDuration: '0.9s' }} />
            <div className="absolute inset-0 flex items-center justify-center text-bk-yellow">
              <Icon name="sync_saved_locally" size="md" weight={400} className="animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-1.5 px-8">
            <Typography variant="h4" className="text-[14px] font-black text-slate-800 dark:text-white tracking-tight">Syncing Registry</Typography>
            <Typography variant="p" className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-[320px] mx-auto">
              Patching automation configuration for <span className="font-black text-slate-900 dark:text-white font-mono">{formData.backupId}</span>.
            </Typography>
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  if (view === VIEW_SUCCESS) {
    return (
      <Modal isOpen title="Update Successful" icon="verified" iconVariant="success" onClose={handleClose} maxWidth="700px">
        <div className="flex flex-col items-center justify-center py-12 gap-7 text-center animate-in fade-in duration-200">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.3)]">
            <Icon name="done_all" size="lg" weight={700} className="text-white" />
          </div>
          <div className="space-y-2 px-8">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">Schedule Patched</Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 font-medium leading-relaxed max-w-[360px] mx-auto">
              Changes to the backup plan for <span className="font-bold text-slate-900 dark:text-white">{selectedDatabase}</span> have been committed and re-indexed.
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
      <Modal isOpen title="Patch Rejected" icon="error" iconVariant="danger" onClose={handleClose} maxWidth="700px">
        <div className="flex flex-col items-center justify-center py-10 gap-6 text-center animate-in fade-in duration-200">
          <div className="relative w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)]">
            <Icon name="edit_off" size="md" weight={300} className="text-white" />
          </div>
          <div className="space-y-2 px-6">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">Execution Halted</Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 font-medium leading-relaxed">System could not finalize the schedule modification sequence.</Typography>
          </div>
          <div className="w-full max-w-[480px] bg-rose-500/5 border border-rose-500/15 rounded-xl px-4 py-3 text-left shadow-xs">
            <Typography variant="caption" className="text-rose-400 font-mono leading-relaxed break-words block text-center uppercase tracking-widest text-[10px] font-bold">
              {errorMsg}
            </Typography>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleClose}>Dismiss</Button>
            <Button variant="primary" icon="refresh" onClick={() => { setView(VIEW_FORM); setErrorMsg(''); }}>Retry Update</Button>
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── FORM view ─── */
  return (
    <Modal
      isOpen={isEditBackupPlanModalOpen}
      onClose={handleClose}
      title="Edit Backup Plan"
      subtitle={`Modify automated scheduled backup for ${selectedDatabase}`}
      icon="edit_calendar"
      maxWidth="700px"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="ghost" onClick={handleClose}>Discard</Button>
          <Button variant="primary" onClick={handleSave} icon="save" className="min-w-[140px]">Commit Changes</Button>
        </div>
      }
    >
      <div className="space-y-10 pb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* Level Presets */}
        <div className="space-y-4">
           <div className="flex items-center gap-3">
             <Icon name="architecture" size="14px" weight={400} className="text-bk-yellow" />
             <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Abstraction Level</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {LEVEL_PRESETS.map(item => (
              <button
                key={item.value}
                onClick={() => handleInputChange('backupLevel', item.value)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200 ${
                  formData.backupLevel === item.value
                    ? 'bg-bk-yellow/10 border-bk-yellow/40 shadow-xs'
                    : 'bg-white dark:bg-white/1 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                  formData.backupLevel === item.value ? 'bg-bk-yellow text-slate-900 border-bk-yellow/50' : 'bg-slate-50 dark:bg-white/5 text-slate-400 border-transparent'
                }`}>
                  <Icon name={item.icon} size="14px" weight={300} />
                </div>
                <div className="text-left min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <Typography variant="p" className={`font-black text-[11px] leading-none ${formData.backupLevel === item.value ? 'text-bk-yellow' : 'text-slate-700 dark:text-white'}`}>
                      {item.title}
                    </Typography>
                    <Typography variant="caption" className="text-[9px] text-slate-400 dark:text-slate-500 font-bold leading-none">
                      {item.desc}
                    </Typography>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Identity & Path */}
        <div className="grid grid-cols-2 gap-4">
          <Input label="Registry Identifier" value={formData.backupId} disabled icon="badge" size="sm" className="opacity-60 bg-slate-50!" />
          <Input label="Payload Path" value={formData.backupPath} onChange={(e) => handleInputChange('backupPath', e.target.value)} placeholder="/var/backups" icon="folder_zip" size="sm" className="font-mono!" />
        </div>

        {/* Recurrence */}
        <div className="space-y-4">
           <div className="flex items-center gap-3">
             <Icon name="schedule" size="14px" weight={400} className="text-bk-yellow" />
             <span className="text-[10px] font-bold text-slate-400">Execution Schedule</span>
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
                    {['all', 'clear', 'weekdays', 'weekends'].map(id => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setBulkDays(id)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/3 text-[10px] font-bold text-slate-400 hover:border-bk-yellow/50 hover:text-bk-yellow transition-all"
                      >
                         {id.replace('_', ' ')}
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
                          (Array.isArray(formData.periodDetail) && formData.periodDetail.includes(day))
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
                    const isActive = Array.isArray(formData.periodDetail) && formData.periodDetail.includes(dayValue);
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
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-4">
                  <Icon name="verified" size="md" weight={400} className="text-emerald-500" />
                  <div className="min-w-0">
                    <Typography variant="p" className="text-[11px] font-bold text-emerald-500 leading-none mb-1">Standard 24h cycle</Typography>
                    <Typography variant="caption" className="text-emerald-500/70 font-medium leading-none block italic">Instance synchronized daily at exactly <span className="font-bold text-emerald-500">{formData.backupTime}</span>.</Typography>
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
             <span className="text-[10px] font-bold text-slate-400">Optimization Matrix</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Delete archive volumes', field: 'deleteArchive', icon: 'auto_delete', desc: 'Automatic log purging' },
              { label: 'Update statistics information', field: 'updateStatistics', icon: 'query_stats', desc: 'Optimize query performance' },
              { label: 'Check database consistency', field: 'checkConsistency', icon: 'verified', desc: 'Validate data block checksums' },
              { label: 'Use compression', field: 'useCompression', icon: 'compress', desc: 'Reduce storage footprint' },
            ].map(opt => (
              <div 
                key={opt.field} 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer group ${
                  formData[opt.field] 
                    ? 'bg-bk-yellow/5 border-bk-yellow/30' 
                    : 'bg-white dark:bg-white/1 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/12'
                }`}
                onClick={() => handleInputChange(opt.field, !formData[opt.field])}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 border ${
                  formData[opt.field] 
                    ? 'bg-bk-yellow text-slate-900 border-bk-yellow/40' 
                    : 'bg-slate-50 dark:bg-white/5 border-transparent text-slate-400 group-hover:text-slate-500'
                }`}>
                  <Icon name={opt.icon} size="12px" weight={300} />
                </div>
                <div className="flex-1 min-w-0">
                  <Typography variant="p" className={`text-[11px] font-black transition-colors leading-none whitespace-nowrap ${formData[opt.field] ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                    {opt.label}
                  </Typography>
                </div>
                <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Toggle checked={formData[opt.field]} onChange={(val) => handleInputChange(opt.field, val)} size="sm" variant="primary" />
                </div>
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
