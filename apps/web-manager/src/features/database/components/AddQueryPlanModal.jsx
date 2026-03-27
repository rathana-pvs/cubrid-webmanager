import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeAddQueryPlanModal, setAutoExecQuery } from '../databaseSlice';
import { showStatusModal } from '../../layout/layoutSlice';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import ErrorOverlay from '../../../components/common/ErrorOverlay';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Typography } from '../../../components/ds/foundation/Typography';

// ── Custom Dropdown ──
const CustomSelect = ({ label, value, options, onChange, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.find(opt => opt.value === value);

  return (
    <div className="space-y-1.5" ref={dropdownRef}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-0.5">{label}</p>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full h-10 px-3 flex items-center justify-between bg-slate-50/50 dark:bg-white/2 border rounded-xl transition-all font-medium text-[12px]
            ${isOpen ? 'border-amber-500/50 ring-2 ring-amber-500/10' : 'border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10'}`}
        >
          <span className="flex items-center gap-2.5">
            {icon && <Icon name={icon} size="sm" weight={300} className={isOpen ? 'text-amber-500' : 'text-slate-400'} />}
            <span className={selected ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}>
              {selected ? selected.label : 'Select...'}
            </span>
          </span>
          <Icon name="expand_more" size="sm" className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-500' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white dark:bg-bk-side border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="py-1 max-h-[240px] overflow-y-auto custom-scrollbar">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  className={`w-full px-4 py-2.5 text-left text-[12px] font-medium transition-all flex items-center justify-between group
                    ${value === opt.value ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                >
                  {opt.label}
                  {value === opt.value && <Icon name="check_circle" size="sm" weight={300} />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function AddQueryPlanModal() {
  const dispatch = useDispatch();
  const { isAddQueryPlanModalOpen, selectedDatabase, loading: sliceLoading, error: sliceError } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);
  
  const [formData, setFormData] = useState({
    queryId: '',
    username: 'public',
    password: '',
    periodType: 'DAY',
    periodDetail: [],
    backupTime: '12:00',
    queryString: ''
  });

  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  const timePickerRef = useRef(null);
  const calendarRef = useRef(null);

  // Sync slice error
  useEffect(() => {
    if (sliceError) setLocalError(sliceError);
  }, [sliceError]);

  // Handle clicks outside pickers
  useEffect(() => {
    const handleOutside = (e) => {
      if (timePickerRef.current && !timePickerRef.current.contains(e.target)) setShowTimePicker(false);
      if (calendarRef.current && !calendarRef.current.contains(e.target)) setShowCalendar(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Initialization
  useEffect(() => {
    if (isAddQueryPlanModalOpen && selectedDatabase) {
      setFormData({
        queryId: `q_${selectedDatabase}_${Date.now().toString().slice(-4)}`,
        username: 'public',
        password: '',
        periodType: 'DAY',
        periodDetail: [],
        backupTime: '12:00',
        queryString: ''
      });
      setLocalError(null);
    }
  }, [isAddQueryPlanModalOpen, selectedDatabase]);

  if (!isAddQueryPlanModalOpen) return null;

  const handleInputChange = (field, value) => {
    if (field === 'periodType') {
      let detail = [];
      if (value === 'DATE') detail = new Date().toISOString().split('T')[0];
      if (value === 'MONTH' || value === 'WEEK') detail = [1];
      setFormData(prev => ({ ...prev, periodType: value, periodDetail: detail }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const toggleDetail = (val) => {
    setFormData(prev => ({
      ...prev,
      periodDetail: prev.periodDetail.includes(val)
        ? prev.periodDetail.filter(v => v !== val)
        : [...prev.periodDetail, val].sort((a, b) => a - b)
    }));
  };

  const handleSave = async () => {
    if (!formData.queryId.trim()) return setLocalError('Query ID is required.');
    if (!formData.queryString.trim()) return setLocalError('SQL query statement is required.');
    
    setLocalError(null);
    setLocalLoading(true);

    let detail = '';
    if (formData.periodType === 'DAY') detail = formData.backupTime;
    else if (formData.periodType === 'DATE') detail = `${formData.periodDetail} ${formData.backupTime}`;
    else detail = `${formData.periodDetail.join(',')} ${formData.backupTime}`;

    const payload = {
      dbname: selectedDatabase,
      planlist: [{
        queryplan: [{
          query_id: formData.queryId.trim(),
          username: formData.username,
          userpass: formData.password,
          period: formData.periodType,
          detail: detail,
          query_string: formData.queryString.trim()
        }]
      }]
    };

    try {
      await dispatch(setAutoExecQuery({ hostUid: selectedHostUid, dbname: selectedDatabase, payload })).unwrap();
      dispatch(closeAddQueryPlanModal());
      dispatch(showStatusModal({
        type: 'success',
        title: 'Query Plan Scheduled',
        message: `Plan "${formData.queryId}" has been registered successfully.`
      }));
    } catch (err) {
      setLocalError(err || 'Failed to register query plan.');
    } finally {
      setLocalLoading(false);
    }
  };

  const footer = (
    <>
      <Button variant="ghost" onClick={() => dispatch(closeAddQueryPlanModal())} disabled={localLoading}>
        Cancel
      </Button>
      <Button 
        onClick={handleSave} 
        loading={localLoading} 
        icon="bolt"
        className="min-w-[140px]"
      >
        Run Schedule
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isAddQueryPlanModalOpen}
      onClose={() => dispatch(closeAddQueryPlanModal())}
      title="Add Query Plan"
      subtitle={`Schedule automated SQL execution for ${selectedDatabase}`}
      icon="bolt"
      maxWidth="max-w-[720px]"
      footer={footer}
    >
      <div className="relative">
        <LoadingOverlay 
          isVisible={localLoading} 
          title="Scheduling Plan"
          subtitle="Verifying database endpoint and registering automate task..."
        />
        
        <ErrorOverlay 
          isVisible={!!localError && !localLoading}
          error={localError}
          onRetry={handleSave}
          onClose={() => setLocalError(null)}
        />

        <div className="space-y-6">
          {/* ── Identification ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Query Identifier"
              placeholder="e.g. hourly_purge"
              value={formData.queryId}
              onChange={e => handleInputChange('queryId', e.target.value)}
              icon="tag"
              className="md:col-span-2"
            />
            <Input 
              label="DB Username"
              value={formData.username}
              onChange={e => handleInputChange('username', e.target.value)}
              icon="person"
            />
            <Input 
              type="password"
              label="DB Password"
              value={formData.password}
              onChange={e => handleInputChange('password', e.target.value)}
              icon="key"
              placeholder="••••••••"
            />
          </div>

          {/* ── Schedule ── */}
          <div className="rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-white/2 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Execution Schedule</p>
              <div className="flex items-center gap-1.5 grayscale opacity-50">
                <Icon name="schedule" size="xs" />
                <span className="text-[9px] font-bold">Standard Cron</span>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomSelect 
                  label="Recurrence"
                  icon="event_repeat"
                  value={formData.periodType}
                  onChange={val => handleInputChange('periodType', val)}
                  options={[
                    { value: 'DAY', label: 'Daily' },
                    { value: 'WEEK', label: 'Weekly' },
                    { value: 'MONTH', label: 'Monthly' },
                    { value: 'DATE', label: 'Specific Date' }
                  ]}
                />
                
                {/* Time Picker */}
                <div className="space-y-1.5" ref={timePickerRef}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-0.5">Start Time</p>
                  <div className="relative">
                    <button 
                      onClick={() => setShowTimePicker(!showTimePicker)}
                      className={`w-full h-10 px-3 flex items-center justify-between bg-slate-50/50 dark:bg-white/2 border rounded-xl transition-all font-medium text-[12px]
                        ${showTimePicker ? 'border-amber-500/50 ring-2 ring-amber-500/10' : 'border-slate-100 dark:border-white/5'}`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon name="history_toggle_off" size="sm" weight={300} className={showTimePicker ? 'text-amber-500' : 'text-slate-400'} />
                        <span className="text-slate-900 dark:text-slate-100">{formData.backupTime}</span>
                      </span>
                      <Icon name="expand_more" size="sm" className={`text-slate-400 transition-transform ${showTimePicker ? 'rotate-180' : ''}`} />
                    </button>

                    {showTimePicker && (
                      <div className="absolute top-full left-0 mt-1.5 z-50 w-[200px] bg-white dark:bg-bk-side border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden flex divide-x divide-slate-100 dark:divide-white/5 h-[220px]">
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                          {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (
                            <button key={h} onClick={() => handleInputChange('backupTime', `${h}:${formData.backupTime.split(':')[1]}`)} className={`w-full py-2 text-[11px] font-medium transition-colors ${formData.backupTime.startsWith(h) ? 'bg-amber-500/15 text-amber-600' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500'}`}>{h}</button>
                          ))}
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                          {Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')).map(m => (
                            <button key={m} onClick={() => { handleInputChange('backupTime', `${formData.backupTime.split(':')[0]}:${m}`); setShowTimePicker(false); }} className={`w-full py-2 text-[11px] font-medium transition-colors ${formData.backupTime.endsWith(m) ? 'bg-amber-500/15 text-amber-600' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500'}`}>{m}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Day selection for Week/Month */}
              {formData.periodType === 'WEEK' && (
                <div className="grid grid-cols-7 gap-1.5">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, ix) => (
                    <button key={day} onClick={() => toggleDetail(ix + 1)} className={`h-10 rounded-lg border text-[10px] font-bold transition-all ${formData.periodDetail.includes(ix + 1) ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white dark:bg-white/2 border-slate-100 dark:border-white/5 text-slate-500 hover:border-amber-500/30'}`}>{day}</button>
                  ))}
                </div>
              )}

              {formData.periodType === 'MONTH' && (
                <div className="grid grid-cols-8 gap-1">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <button key={d} onClick={() => toggleDetail(d)} className={`h-8 rounded-lg border text-[10px] font-bold transition-all ${formData.periodDetail.includes(d) ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-white dark:bg-white/2 border-slate-100 dark:border-white/5 text-slate-500'}`}>{d}</button>
                  ))}
                </div>
              )}

              {/* Calendar for Specific Date */}
              {formData.periodType === 'DATE' && (
                <div className="relative" ref={calendarRef}>
                  <button onClick={() => setShowCalendar(!showCalendar)} className="w-full h-10 px-3 flex items-center justify-between bg-slate-50/50 dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-xl text-[12px] font-medium">
                    <span className="flex items-center gap-2.5">
                      <Icon name="calendar_today" size="sm" weight={300} className="text-amber-500" />
                      {formData.periodDetail}
                    </span>
                    <Icon name="expand_more" size="sm" />
                  </button>
                  {showCalendar && (
                    <div className="absolute top-full left-0 mt-1.5 z-50 w-[280px] bg-white dark:bg-bk-side border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between mb-3 px-1">
                        <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg"><Icon name="chevron_left" size="sm" /></button>
                        <span className="text-[12px] font-bold">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                        <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg"><Icon name="chevron_right" size="sm" /></button>
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {['S','M','T','W','T','F','S'].map(d => <div key={d} className="h-7 flex items-center justify-center text-[10px] font-bold text-slate-400">{d}</div>)}
                        {Array.from({ length: new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() }).map((_, i) => <div key={i} />)}
                        {Array.from({ length: new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map(d => {
                          const ds = `${viewDate.getFullYear()}-${String(viewDate.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                          return <button key={d} onClick={() => { handleInputChange('periodDetail', ds); setShowCalendar(false); }} className={`h-8 rounded-lg text-[11px] font-medium transition-all ${formData.periodDetail === ds ? 'bg-amber-500 text-white' : 'hover:bg-amber-500/10 text-slate-600 dark:text-slate-300'}`}>{d}</button>
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── SQL ── */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-0.5">SQL Query Statement</p>
            <div className="relative group">
              <div className="absolute top-3 left-3 opacity-40 group-focus-within:opacity-100 transition-opacity">
                <Icon name="code" size="sm" weight={300} className="text-amber-500" />
              </div>
              <textarea 
                value={formData.queryString}
                onChange={e => handleInputChange('queryString', e.target.value)}
                placeholder="Enter SQL (e.g. UPDATE users SET login_count = 0;)"
                className="w-full h-36 pl-10 pr-4 py-3 bg-slate-50/50 dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-2xl text-[13px] font-mono text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/40 transition-all resize-none custom-scrollbar"
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
