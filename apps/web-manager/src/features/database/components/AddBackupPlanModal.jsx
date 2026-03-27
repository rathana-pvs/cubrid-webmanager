import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeAddBackupPlanModal, addBackupSchedule } from '../databaseSlice';
import { showStatusModal } from '../../layout/layoutSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Select } from '../../../components/ds/forms/Select';
import { Checkbox } from '../../../components/ds/forms/Checkbox';
import { Divider } from '../../../components/ds/layout/Divider';
import { Typography } from '../../../components/ds/foundation/Typography';

export default function AddBackupPlanModal() {
  const dispatch = useDispatch();
  const { isAddBackupPlanModalOpen, selectedDatabase, loading, error } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);
  
  const [formData, setFormData] = useState({
    backupId: 'plan_1',
    backupLevel: '0',
    backupPath: `/home/cubrid/backup`,
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
      setFormData(prev => ({
        ...prev,
        backupPath: `/home/cubrid/CUBRID/databases/${selectedDatabase}/backup`,
        backupId: `backup_${selectedDatabase}_${Date.now().toString().slice(-4)}`
      }));
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

  const isPresetActive = (type) => {
    const current = [...formData.periodDetail].sort((a,b) => a-b);
    const getDays = (t) => {
      switch(t) {
        case 'all': return Array.from({length: 31}, (_, i) => i + 1);
        case 'weekdays': return Array.from({length: 31}, (_, i) => i + 1).filter(d => (d % 7 !== 6 && d % 7 !== 0));
        case 'weekends': return Array.from({length: 31}, (_, i) => i + 1).filter(d => (d % 7 === 6 || d % 7 === 0));
        case 'clear': return [];
        default: return null;
      }
    };
    const target = getDays(type);
    if (!target) return false;
    return current.length === target.length && current.every((v, i) => v === target.sort((a,b) => a-b)[i]);
  };

  const handleSave = () => {
    if (!selectedDatabase || !selectedHostUid) return;

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

    dispatch(addBackupSchedule({ 
      hostUid: selectedHostUid, 
      dbname: selectedDatabase, 
      payload 
    })).unwrap()
      .then(() => {
        dispatch(closeAddBackupPlanModal());
        dispatch(showStatusModal({
          type: 'success',
          title: 'Schedule Active',
          message: 'Your automated backup cycle has been initialized successfully.'
        }));
      });
  };

  return (
    <Modal
      isOpen={isAddBackupPlanModalOpen}
      onClose={() => dispatch(closeAddBackupPlanModal())}
      title="Add Backup Plan"
      subtitle={`Configure automated scheduled backups for ${selectedDatabase}`}
      icon="backup_table"
      maxWidth="max-w-[700px]"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button 
            variant="secondary" 
            onClick={() => dispatch(closeAddBackupPlanModal())}
            disabled={loading}
          >
            Discard
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSave}
            loading={loading}
            icon="play_circle"
            className="min-w-[130px]"
          >
            Run Schedule
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 bg-rose-500/5 border border-rose-500/10 rounded-xl animate-in fade-in slide-in-from-top-1">
            <Icon name="error" size="md" weight={300} className="text-rose-500" />
            <div className="flex-1 text-xs">
              <Typography variant="label" className="text-rose-500 font-bold uppercase tracking-wider block mb-0.5">Submission Failed</Typography>
              <Typography variant="p" className="text-rose-600/80 font-medium leading-relaxed">{error}</Typography>
            </div>
          </div>
        )}
        
        <div className="space-y-8">
          {/* General Section */}
          <section className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-400">
            <Divider label="STRATEGY PRESETS" />
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: '0', title: 'Full (L0)', desc: 'Complete static clone', icon: 'auto_awesome_motion' },
                { value: '1', title: 'Inc. (L1)', desc: 'Delta since last L0', icon: 'trending_up' },
                { value: '2', title: 'Inc. (L2)', desc: 'Delta since last L1', icon: 'call_split' }
              ].map(item => (
                <button
                  key={item.value}
                  onClick={() => handleInputChange('backupLevel', item.value)}
                  className={`flex flex-col items-center text-center p-3.5 rounded-2xl border transition-all group ${
                    formData.backupLevel === item.value
                      ? 'bg-bk-yellow/10 border-bk-yellow/40 shadow-lg shadow-bk-yellow/5'
                      : 'bg-slate-50/20 dark:bg-white/1 border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 transition-colors ${
                    formData.backupLevel === item.value ? 'bg-bk-yellow text-slate-900 shadow-xs' : 'bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:text-slate-300'
                  }`}>
                    <Icon name={item.icon} size="sm" weight={300} />
                  </div>
                  <Typography variant="label" className={`font-black text-[10.5px] mb-0.5 transition-colors ${
                    formData.backupLevel === item.value ? 'text-bk-yellow' : 'text-slate-900 dark:text-white'
                  }`}>{item.title}</Typography>
                  <Typography variant="p" className="text-[8.5px] text-slate-500 dark:text-slate-500 font-medium leading-tight">{item.desc}</Typography>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-1">
              <Input 
                label="Plan Identifier"
                value={formData.backupId}
                onChange={(e) => handleInputChange('backupId', e.target.value)}
                placeholder="plan_1"
                icon="fingerprint"
              />
              <Input 
                label="Target Path"
                value={formData.backupPath}
                onChange={(e) => handleInputChange('backupPath', e.target.value)}
                placeholder="/home/cubrid/backup"
                icon="folder_zip"
              />
            </div>
          </section>

          {/* Backup Period Section */}
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Divider label="RECURRENCE SCHEDULE" />
            <div className="p-5 bg-slate-50/30 dark:bg-bk-main/10 border border-slate-100 dark:border-white/5 rounded-2xl space-y-6">
              <div className="flex gap-6">
                <div className="flex-1">
                  <Select 
                    label="Rotation Frequency"
                    value={formData.periodType}
                    onChange={(e) => handleInputChange('periodType', e.target.value)}
                    options={[
                      { value: 'Monthly', label: 'Monthly Routine' },
                      { value: 'Weekly', label: 'Weekly Precision' },
                      { value: 'Daily', label: 'Daily Stream' },
                      { value: 'Specific days', label: 'One-time specialized' }
                    ]}
                  />
                </div>
                <div className="w-[140px]">
                  <Input 
                    label="Target Time"
                    type="time"
                    value={formData.backupTime}
                    onChange={(e) => handleInputChange('backupTime', e.target.value)}
                    icon="schedule"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {formData.periodType === 'Monthly' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'all', label: 'All days', icon: 'select_all' },
                        { id: 'clear', label: 'Clear selection', icon: 'backspace' },
                        { id: 'weekdays', label: 'Weekdays', icon: 'work' },
                        { id: 'weekends', label: 'Weekends', icon: 'beach_access' },
                      ].map(preset => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setBulkDays(preset.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-black transition-all uppercase tracking-widest ${
                            isPresetActive(preset.id)
                              ? 'bg-bk-yellow/10 border-bk-yellow/40 text-bk-yellow shadow-inner'
                              : 'bg-white dark:bg-white/2 border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-500 hover:border-bk-yellow/50'
                          }`}
                        >
                          <Icon name={preset.icon} size="xs" weight={300} />
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1.5 p-3.5 bg-white/50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`h-9 rounded-lg border text-[11px] font-black transition-all flex items-center justify-center ${
                            formData.periodDetail.includes(day)
                              ? 'bg-bk-yellow border-bk-yellow text-slate-900 shadow-md shadow-bk-yellow/10 scale-105 z-10'
                              : 'bg-white dark:bg-white/3 border-slate-200 dark:border-white/5 text-slate-500 hover:border-bk-yellow/40'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                 {formData.periodType === 'Weekly' && (
                  <div className="grid grid-cols-7 gap-2 p-3.5 bg-white/50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                      const dayValue = index + 1;
                      const isActive = formData.periodDetail.includes(dayValue);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(dayValue)}
                          className={`h-11 w-full rounded-xl border text-[11px] font-black transition-all flex items-center justify-center ${
                            isActive
                              ? 'bg-bk-yellow border-bk-yellow text-slate-900 shadow-lg shadow-bk-yellow/10 scale-105 z-10'
                              : 'bg-white dark:bg-white/3 border-slate-200 dark:border-white/5 text-slate-500 hover:border-bk-yellow/40'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                )}

                {formData.periodType === 'Daily' && (
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-4 text-emerald-500 animate-in fade-in duration-400">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                      <Icon name="verified" size="md" weight={300} />
                    </div>
                    <div>
                      <Typography variant="label" className="text-emerald-500 font-black block">High-Frequency Monitoring</Typography>
                      <Typography variant="p" className="text-[10px] text-emerald-500/80 font-medium">Backup instance scheduled daily at exactly <span className="underline font-bold underline-offset-2">{formData.backupTime}</span>.</Typography>
                    </div>
                  </div>
                )}

                {formData.periodType === 'Specific days' && (
                  <Input 
                    type="date"
                    label="Target Date"
                    value={formData.periodDetail}
                    onChange={(e) => handleInputChange('periodDetail', e.target.value)}
                    icon="event"
                  />
                )}
              </div>
            </div>
          </section>

          {/* Options Section */}
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-600">
            <Divider label="OPERATIONAL INTEGRITY" />
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'Archive Purge', field: 'deleteArchive', icon: 'auto_delete' },
                { label: 'Integrity Check', field: 'checkConsistency', icon: 'verified' },
                { label: 'Schema Stats', field: 'updateStatistics', icon: 'query_stats' },
                { label: 'LZ4 Compression', field: 'useCompression', icon: 'compress' },
              ].map(opt => (
                <div 
                  key={opt.field} 
                  className={`group flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    formData[opt.field] 
                      ? 'bg-bk-yellow/3 border-bk-yellow/20' 
                      : 'bg-slate-50/20 dark:bg-white/1 border-slate-100 dark:border-white/5 hover:border-bk-yellow/20'
                  }`}
                  onClick={() => handleInputChange(opt.field, !formData[opt.field])}
                >
                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0 border ${
                    formData[opt.field] 
                      ? 'bg-bk-yellow/10 border-bk-yellow/20 text-bk-yellow' 
                      : 'bg-slate-100 dark:bg-white/5 border-transparent text-slate-400'
                  }`}>
                    <Icon name={opt.icon} size="sm" weight={300} />
                  </div>
                  <Typography variant="label" className={`flex-1 text-[11px] font-black transition-colors ${formData[opt.field] ? 'text-bk-yellow' : 'text-slate-900 dark:text-white'}`}>{opt.label}</Typography>
                  <Checkbox 
                    className="w-fit! h-fit!"
                    checked={formData[opt.field]}
                    onChange={(e) => handleInputChange(opt.field, e.target.checked)}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Input 
                type="number"
                label="Stream Threads"
                value={formData.threads}
                onChange={(e) => handleInputChange('threads', parseInt(e.target.value) || 0)}
                icon="speed"
                suffix="CORES"
              />
              <Input 
                type="number"
                label="Retention Count"
                value={formData.backupsToKeep}
                onChange={(e) => handleInputChange('backupsToKeep', parseInt(e.target.value) || 0)}
                icon="history"
                suffix="DAYS"
              />
            </div>
          </section>

          {/* Operation Mode Section */}
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Divider label="SYSTEM AVAILABILITY MODE" />
            <div className="space-y-3">
              {[
                { value: 'online', label: 'Concurrent (Online)', desc: 'Zero downtime operation with read-write access preserved.', icon: 'bolt', color: 'text-amber-500' },
                { value: 'offline', label: 'Isolated (Offline)', desc: 'Consistent snapshot with brief service interruption.', icon: 'power_settings_new', color: 'text-slate-400' }
              ].map(mode => (
                <button
                  key={mode.value}
                  onClick={() => handleInputChange('onlineType', mode.value)}
                  className={`w-full flex items-start gap-4 p-4 rounded-2xl border transition-all text-left ${
                    formData.onlineType === mode.value 
                      ? 'bg-bk-yellow/10 border-bk-yellow/40 shadow-lg shadow-bk-yellow/5' 
                      : 'bg-slate-50/10 dark:bg-white/1 border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all shrink-0 ${
                    formData.onlineType === mode.value ? 'bg-bk-yellow text-slate-900 border-bk-yellow/50' : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-transparent'
                  }`}>
                    <Icon name={mode.icon} size="md" weight={300} />
                  </div>
                  <div className="flex-1 pr-4">
                    <Typography variant="label" className={`font-black text-[12px] block mb-0.5 transition-colors ${formData.onlineType === mode.value ? 'text-bk-yellow' : 'text-slate-900 dark:text-white'}`}>{mode.label}</Typography>
                    <Typography variant="p" className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{mode.desc}</Typography>
                  </div>
                  <div className={`mt-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    formData.onlineType === mode.value ? 'border-bk-yellow' : 'border-slate-300 dark:border-white/10'
                  }`}>
                    {formData.onlineType === mode.value && <div className="w-2.5 h-2.5 rounded-full bg-bk-yellow" />}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Modal>
  );
}
