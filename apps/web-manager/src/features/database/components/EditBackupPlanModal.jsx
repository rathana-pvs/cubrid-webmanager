import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeEditBackupPlanModal, editBackupSchedule, fetchBackupSchedule } from '../databaseSlice';
import { showStatusModal } from '../../layout/layoutSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Select } from '../../../components/ds/forms/Select';
import { Checkbox } from '../../../components/ds/forms/Checkbox';
import { Radio, RadioGroup } from '../../../components/ds/forms/Radio';
import { Divider } from '../../../components/ds/layout/Divider';
import { Typography } from '../../../components/ds/foundation/Typography';

export default function EditBackupPlanModal() {
  const dispatch = useDispatch();
  const { isEditBackupPlanModalOpen, selectedDatabase, selectedBackupId, loading, error } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);
  
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

  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    if (isEditBackupPlanModalOpen && selectedDatabase && selectedHostUid) {
      dispatch(fetchBackupSchedule({ hostUid: selectedHostUid, dbname: selectedDatabase }))
        .unwrap()
        .then((data) => {
          const backupData = data?.backups || data?.backup_info;
          if (backupData) {
            const plans = Array.isArray(backupData) ? backupData : [backupData];
            const info = selectedBackupId ? plans.find(p => p.backupid === selectedBackupId) : plans[0];
            
            if (info) {
              // Parse period detail based on period type
              let periodDetail = [];
              if (info.period_type === 'Special') {
                // Specific days: date string
                periodDetail = info.period_date || '';
              } else if (info.period_type === 'Weekly' && info.period_date) {
                // Weekly: convert day names to numbers (Monday=1, Sunday=7)
                const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                const dayNameMap = {
                  'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 
                  'Friday': 5, 'Saturday': 6, 'Sunday': 7
                };
                // Handle both comma-separated string and array
                const days = Array.isArray(info.period_date) ? info.period_date : info.period_date.split(',');
                periodDetail = days
                  .map(day => day.trim())
                  .filter(day => day && dayNames.includes(day))
                  .map(day => dayNameMap[day]);
              } else if (info.period_type === 'Monthly' && info.period_date) {
                // Monthly: comma-separated day numbers
                const days = Array.isArray(info.period_date) ? info.period_date : info.period_date.split(',');
                periodDetail = days.map(Number).filter(day => !isNaN(day) && day >= 1 && day <= 31);
              } else if (info.period_type === 'Daily') {
                // Daily: empty array
                periodDetail = [];
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
      periodDetail: details.includes(day)
        ? details.filter(d => d !== day)
        : [...details, day]
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
      case 'mid': days = [1, 15, 30]; break;
      case 'even': days = Array.from({length: 31}, (_, i) => i + 1).filter(d => d % 2 === 0); break;
      case 'odd': days = Array.from({length: 31}, (_, i) => i + 1).filter(d => d % 2 !== 0); break;
      default: days = [];
    }
    handleInputChange('periodDetail', days);
  };

  const isPresetActive = (type) => {
    const details = Array.isArray(formData.periodDetail) ? formData.periodDetail : [];
    const current = [...details].sort((a,b) => a-b);
    const getDays = (t) => {
      switch(t) {
        case 'all': return Array.from({length: 31}, (_, i) => i + 1);
        case 'weekdays': return Array.from({length: 31}, (_, i) => i + 1).filter(d => (d % 7 !== 6 && d % 7 !== 0));
        case 'weekends': return Array.from({length: 31}, (_, i) => i + 1).filter(d => (d % 7 === 6 || d % 7 === 0));
        case 'mid': return [1, 15, 30];
        case 'even': return Array.from({length: 31}, (_, i) => i + 1).filter(d => d % 2 === 0);
        case 'odd': return Array.from({length: 31}, (_, i) => i + 1).filter(d => d % 2 !== 0);
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

    // Convert period detail based on period type
    let periodDateValue = '';
    if (formData.periodType === 'Weekly') {
      // Convert day numbers to day names (1=Monday, 7=Sunday)
      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const selectedDays = Array.isArray(formData.periodDetail) ? formData.periodDetail : [];
      periodDateValue = selectedDays.map(dayNum => dayNames[dayNum - 1]).join(',');
    } else if (formData.periodType === 'Monthly') {
      // Monthly: comma-separated day numbers
      periodDateValue = Array.isArray(formData.periodDetail) ? formData.periodDetail.join(',') : '';
    } else if (formData.periodType === 'Daily') {
      // Daily: empty string
      periodDateValue = '';
    } else if (formData.periodType === 'Specific days') {
      // Specific days: date string
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

    dispatch(editBackupSchedule({ 
      hostUid: selectedHostUid, 
      dbname: selectedDatabase, 
      payload 
    })).unwrap()
      .then(() => {
        dispatch(closeEditBackupPlanModal());
        dispatch(fetchBackupSchedule({ hostUid: selectedHostUid, dbname: selectedDatabase }));
        dispatch(showStatusModal({
          type: 'success',
          title: 'Schedule Updated',
          message: 'The backup schedule has been successfully updated and re-optimized.'
        }));
      });
  };

  return (
    <Modal
      isOpen={isEditBackupPlanModalOpen}
      onClose={() => dispatch(closeEditBackupPlanModal())}
      title="Edit backup plan"
      subtitle={`Modify automated scheduled backup for ${selectedDatabase}`}
      icon="backup_table"
      maxWidth="700px"
      footer={
        <>
          <Button 
            variant="secondary" 
            onClick={() => dispatch(closeEditBackupPlanModal())}
            disabled={loading}
          >
            Discard
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSave}
            loading={loading}
            icon="save"
            className="min-w-[130px]"
          >
            Update plan
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 bg-rose-500/5 border border-rose-500/10 rounded-xl animate-in fade-in slide-in-from-top-1">
            <Icon name="error" size="md" weight={300} className="text-rose-500" />
            <div className="flex-1">
              <Typography variant="label" className="text-rose-500 font-bold uppercase tracking-wider block mb-0.5">Update Failed</Typography>
              <Typography variant="p" className="text-rose-600/80 font-medium">{error}</Typography>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* General Section */}
          <section className="space-y-4">
            <Divider label="General settings" />
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Backup ID"
                value={formData.backupId}
                disabled
                placeholder="plan_1"
                className="opacity-70"
              />
              <Select 
                label="Backup level"
                value={formData.backupLevel}
                onChange={(e) => handleInputChange('backupLevel', e.target.value)}
                options={[
                  { value: '0', label: '0 (Full)' },
                  { value: '1', label: '1 (First increment)' },
                  { value: '2', label: '2 (Second increment)' }
                ]}
              />
              <div className="col-span-2">
                <Input 
                  label="Backup path"
                  value={formData.backupPath}
                  onChange={(e) => handleInputChange('backupPath', e.target.value)}
                  placeholder="/home/cubrid/backup"
                />
              </div>
            </div>
          </section>
          {/* Backup Period Section */}
          <section className="space-y-4">
            <Divider label="Backup schedule" />
            <div className="p-5 bg-slate-50/50 dark:bg-bk-main/20 border border-slate-100 dark:border-white/5 rounded-2xl space-y-5">
              <div className="grid grid-cols-2 gap-6">
                <Select 
                  label="Period type"
                  value={formData.periodType}
                  onChange={(e) => handleInputChange('periodType', e.target.value)}
                  options={[
                    { value: 'Monthly', label: 'Monthly' },
                    { value: 'Weekly', label: 'Weekly' },
                    { value: 'Daily', label: 'Daily' },
                    { value: 'Specific days', label: 'Specific days' }
                  ]}
                />
                <Input 
                  label="Backup time"
                  type="time"
                  value={formData.backupTime}
                  onChange={(e) => handleInputChange('backupTime', e.target.value)}
                />
              </div>

              <div className="space-y-3">
                {formData.periodType !== 'Specific days' && (
                  <Typography variant="label" className="text-slate-500 ml-1">
                    {formData.periodType === 'Monthly' && 'Period detail (Day of Month)'}
                    {formData.periodType === 'Weekly' && 'Period detail (Day of Week)'}
                    {formData.periodType === 'Daily' && 'Schedule active every day'}
                  </Typography>
                )}
                
                {formData.periodType === 'Monthly' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 px-1">
                      {[
                        { id: 'all', label: 'Select All', icon: 'select_all' },
                        { id: 'clear', label: 'Clear', icon: 'backspace' },
                        { id: 'weekdays', label: 'Weekdays', icon: 'work' },
                        { id: 'weekends', label: 'Weekends', icon: 'beach_access' },
                      ].map(preset => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setBulkDays(preset.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all uppercase tracking-wider ${
                            isPresetActive(preset.id)
                              ? 'bg-bk-yellow border-bk-yellow text-bk-side shadow-lg shadow-bk-yellow/20'
                              : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-bk-yellow/40 hover:text-bk-yellow'
                          }`}
                        >
                          <Icon name={preset.icon} size="sm" weight={300} />
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2 relative z-10 p-4 border border-slate-100 dark:border-white/5 bg-white/50 dark:bg-bk-side/50 rounded-xl">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`h-8 rounded border text-[11px] font-bold transition-all flex items-center justify-center ${
                            (Array.isArray(formData.periodDetail) && formData.periodDetail.includes(day))
                              ? 'bg-bk-yellow border-bk-yellow text-bk-side shadow-md'
                              : 'bg-white dark:bg-bk-side border-slate-200 dark:border-slate-800 text-slate-500 hover:border-bk-yellow/50 hover:text-bk-yellow'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                 {formData.periodType === 'Weekly' && (
                  <div className="grid grid-cols-7 gap-2 p-4 border border-slate-100 dark:border-white/5 bg-white/50 dark:bg-bk-side/50 rounded-xl">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                      const dayValue = index + 1;
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(dayValue)}
                          className={`h-9 w-full rounded border text-[11px] font-bold transition-all flex items-center justify-center ${
                            (Array.isArray(formData.periodDetail) && formData.periodDetail.includes(dayValue))
                              ? 'bg-bk-yellow border-bk-yellow text-bk-side shadow-md'
                              : 'bg-white dark:bg-bk-side border-slate-200 dark:border-slate-800 text-slate-500 hover:border-bk-yellow/50 hover:text-bk-yellow'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                )}

                {formData.periodType === 'Daily' && (
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-3 text-emerald-500">
                    <Icon name="check_circle" size="md" weight={300} />
                    <Typography variant="p" className="text-emerald-500 font-medium">Backup active every day at {formData.backupTime}.</Typography>
                  </div>
                )}

                {formData.periodType === 'Specific days' && (
                  <Input 
                    type="date"
                    label="Specific Date"
                    value={formData.periodDetail}
                    onChange={(e) => handleInputChange('periodDetail', e.target.value)}
                  />
                )}
              </div>
            </div>
          </section>

          {/* Options Section */}
          <section className="space-y-4">
            <Divider label="Additional settings" />
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 p-5 bg-slate-50/50 dark:bg-bk-main/20 border border-slate-100 dark:border-white/5 rounded-2xl">
              <Checkbox 
                label="Delete archive volumes"
                checked={formData.deleteArchive}
                onChange={(e) => handleInputChange('deleteArchive', e.target.checked)}
              />
              <Checkbox 
                label="Update statistics"
                checked={formData.updateStatistics}
                onChange={(e) => handleInputChange('updateStatistics', e.target.checked)}
              />
              <Checkbox 
                label="Check consistency"
                checked={formData.checkConsistency}
                onChange={(e) => handleInputChange('checkConsistency', e.target.checked)}
              />
              <Checkbox 
                label="Use compression"
                checked={formData.useCompression}
                onChange={(e) => handleInputChange('useCompression', e.target.checked)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input 
                type="number"
                label="Number of threads"
                value={formData.threads}
                onChange={(e) => handleInputChange('threads', parseInt(e.target.value) || 0)}
              />
              <Input 
                type="number"
                label="Backups to keep"
                value={formData.backupsToKeep}
                onChange={(e) => handleInputChange('backupsToKeep', parseInt(e.target.value) || 0)}
              />
            </div>
          </section>

          {/* Online/Offline Section */}
          <section className="space-y-4">
            <Divider label="Operation mode" />
            <RadioGroup 
              name="onlineType"
              value={formData.onlineType}
              onChange={(val) => handleInputChange('onlineType', val)}
              options={[
                { 
                  value: 'online', 
                  label: 'Online backup', 
                  description: 'Allows continuing database operations while the backup is being performed.'
                },
                { 
                  value: 'offline', 
                  label: 'Offline backup', 
                  description: 'Notice: Database will be stopped during backup operation and then restarted automatically.'
                }
              ]}
            />
          </section>
        </div>
      </div>
    </Modal>
  );
}
