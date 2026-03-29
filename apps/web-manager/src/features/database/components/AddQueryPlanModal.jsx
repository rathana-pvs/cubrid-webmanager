import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeAddQueryPlanModal, setAutoExecQuery } from '../databaseSlice';
import Editor from '@monaco-editor/react';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Typography } from '../../../components/ds/foundation/Typography';

// view states
const VIEW_FORM    = 'form';
const VIEW_LOADING = 'loading';
const VIEW_SUCCESS = 'success';
const VIEW_ERROR   = 'error';

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
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-0.5">{label}</p>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full h-11 px-3.5 flex items-center justify-between bg-white dark:bg-white/3 border rounded-2xl transition-all font-bold text-[12px] shadow-xs cursor-pointer
            ${isOpen ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'}`}
        >
          <span className="flex items-center gap-2.5">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${isOpen ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
              {icon && <Icon name={icon} size="14px" weight={300} />}
            </div>
            <span className={selected ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}>
              {selected ? selected.label : 'Select Recurrence…'}
            </span>
          </span>
          <Icon name="expand_more" size="sm" className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-amber-500' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-100 bg-white dark:bg-bk-side border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="py-1.5 max-h-[240px] overflow-y-auto custom-scrollbar">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  className={`w-full px-4 py-3 text-[12px] font-bold transition-all flex items-center justify-between group cursor-pointer
                    ${value === opt.value ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${value === opt.value ? 'bg-amber-500 scale-125' : 'bg-slate-300 dark:bg-slate-700 opacity-0 group-hover:opacity-100'}`} />
                    {opt.label}
                  </div>
                  {value === opt.value && <Icon name="check_circle" size="xs" weight={700} />}
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
  const { isAddQueryPlanModalOpen } = useSelector((state) => state.databaseUI);
  const { selectedDatabase } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);
  const { theme } = useSelector((state) => state.layout);
  
  const [view, setView] = useState(VIEW_FORM);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    queryId: '',
    username: 'public',
    password: '',
    periodType: 'DAY',
    periodDetail: [],
    backupTime: '12:00',
    queryString: ''
  });

  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  const timePickerRef = useRef(null);
  const calendarRef = useRef(null);

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
      setView(VIEW_FORM);
      setErrorMsg('');
      setSuccessMsg('');
      setFormData({
        queryId: `q_${selectedDatabase}_${Date.now().toString().slice(-4)}`,
        username: 'public',
        password: '',
        periodType: 'DAY',
        periodDetail: [],
        backupTime: '12:00',
        queryString: ''
      });
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
    if (!formData.queryId.trim()) {
       setErrorMsg('A unique Query Identifier is required to register this plan.');
       setView(VIEW_ERROR);
       return;
    }
    if (!formData.queryString.trim()) {
      setErrorMsg('No SQL statement provided. The automation payload must contain at least one valid query.');
      setView(VIEW_ERROR);
      return;
    }
    
    setView(VIEW_LOADING);
    setErrorMsg('');

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
      setSuccessMsg(`Plan "${formData.queryId}" has been successfully synchronized and registered with the scheduler.`);
      setView(VIEW_SUCCESS);
    } catch (err) {
      setErrorMsg(typeof err === 'string' ? err : (err.message || 'Operation aborted by system controller. Verify database connectivity and user privileges.'));
      setView(VIEW_ERROR);
    }
  };

  const handleClose = () => dispatch(closeAddQueryPlanModal());

  /* ─── LOADING view ─── */
  if (view === VIEW_LOADING) {
    return (
      <Modal isOpen title="Scheduling Automate" icon="bolt" onClose={handleClose} maxWidth="720px">
        <div className="flex flex-col items-center justify-center py-12 gap-7 text-center animate-in fade-in duration-200">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-slate-100 dark:border-white/5" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-500 animate-spin" style={{ animationDuration: '0.9s' }} />
            <div className="absolute inset-[10px] rounded-full border-[1.5px] border-transparent border-b-amber-500/30 animate-spin" style={{ animationDuration: '1.7s', animationDirection: 'reverse' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon name="schedule" size="md" weight={400} className="text-amber-500 animate-pulse" />
            </div>
          </div>

          <div className="space-y-1.5 px-8">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">Syncing Schedule</Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium max-w-[320px] mx-auto leading-relaxed">
              Registering <span className="text-slate-900 dark:text-white font-black font-mono">{formData.queryId}</span> with the CUBRID Automation Service.
            </Typography>
          </div>

          <div className="w-32 h-[2px] bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ animation: 'modalSlide 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  if (view === VIEW_SUCCESS) {
    return (
      <Modal isOpen title="Plan Synchronized" icon="bolt" iconVariant="success" onClose={handleClose} maxWidth="720px">
        <div className="flex flex-col items-center justify-center py-12 gap-7 text-center animate-in fade-in duration-200">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.3)]">
              <Icon name="verified" size="lg" weight={700} className="text-white" />
            </div>
          </div>

          <div className="space-y-2 px-8">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">Schedule Registry Active</Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[360px] mx-auto">
              The automated query task for <span className="font-bold text-slate-900 dark:text-white font-mono">{selectedDatabase}</span> has been successfully committed.
            </Typography>
          </div>

          {successMsg && (
            <div className="w-full max-w-[440px] bg-emerald-500/5 border border-emerald-500/15 rounded-2xl px-4 py-3.5 text-left flex gap-3">
              <Icon name="task_alt" size="sm" weight={300} className="text-emerald-500 shrink-0 mt-0.5" />
              <Typography variant="caption" className="text-emerald-600 dark:text-emerald-400 font-medium leading-relaxed italic">
                {successMsg}
              </Typography>
            </div>
          )}

          <Button variant="secondary" onClick={handleClose}>Access Scheduler</Button>
        </div>
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (view === VIEW_ERROR) {
    return (
      <Modal isOpen title="Scheduling Interrupted" icon="bolt" iconVariant="danger" onClose={handleClose} maxWidth="720px">
        <div className="flex flex-col items-center justify-center py-10 gap-6 text-center animate-in fade-in duration-200">
          <div className="relative w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)]">
            <Icon name="error" size="md" weight={300} className="text-white" />
          </div>

          <div className="space-y-2 px-6">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">Transaction Dropped</Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">System controller could not finalize the scheduling registry.</Typography>
          </div>

          <div className="w-full max-w-[440px] bg-rose-500/5 border border-rose-500/15 rounded-2xl px-5 py-4 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="terminal" size="xs" weight={300} className="text-rose-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-400">Error Manifest</span>
            </div>
            <Typography variant="caption" className="text-rose-400/90 font-mono leading-relaxed block break-words text-[11px] font-medium italic">
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
      isOpen={isAddQueryPlanModalOpen}
      onClose={handleClose}
      title="Add Query Plan"
      subtitle={`Schedule automated SQL execution for ${selectedDatabase}`}
      icon="bolt"
      maxWidth="max-w-[720px]"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="ghost" onClick={handleClose}>Discard</Button>
          <Button 
            variant="primary"
            onClick={handleSave} 
            icon="play_circle"
            className="px-8 min-w-[160px]"
          >
            Run Schedule
          </Button>
        </div>
      }
    >
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
        
        {/* Source Instance Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-linear-to-r from-amber-500/8 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Icon name="database" size="md" weight={300} className="text-amber-500" />
              </div>
              <div className="min-w-0">
                <Typography variant="caption" className="font-black uppercase tracking-widest text-amber-600/70 mb-0.5">Automating Database</Typography>
                <Typography variant="h4" className="text-[14px] font-black text-amber-700 dark:text-amber-400 font-mono truncate">
                  {selectedDatabase}
                </Typography>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/5 shadow-xs">
              <Icon name="bolt" size="sm" className="text-amber-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Payload: SQL Service</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
          {/* Identity */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-3">
               <Icon name="fingerprint" size="14px" weight={400} className="text-amber-500" />
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Object Identification</span>
            </div>
            <Input 
              label="Query Identifier"
              placeholder="e.g. hourly_purge_logs"
              value={formData.queryId}
              onChange={e => handleInputChange('queryId', e.target.value)}
              icon="tag"
              size="sm"
            />
          </div>

          <div className="space-y-4">
             <div className="flex items-center gap-3">
               <Icon name="lock" size="14px" weight={400} className="text-amber-500" />
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Secure Context</span>
            </div>
            <div className="space-y-4">
              <Input 
                label="DB Username"
                value={formData.username}
                onChange={e => handleInputChange('username', e.target.value)}
                icon="person"
                size="sm"
              />
              <Input 
                type="password"
                label="DB Password"
                value={formData.password}
                onChange={e => handleInputChange('password', e.target.value)}
                icon="key"
                placeholder="••••••••"
                size="sm"
              />
            </div>
          </div>

          {/* Schedule Configuration */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <Icon name="schedule" size="14px" weight={400} className="text-amber-500" />
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Execution Schedule</span>
            </div>
            <div className="space-y-4">
              <CustomSelect 
                label="Recurrence Frequency"
                icon="event_repeat"
                value={formData.periodType}
                onChange={val => handleInputChange('periodType', val)}
                options={[
                  { value: 'DAY', label: 'Daily (Every 24h)' },
                  { value: 'WEEK', label: 'Weekly Precision' },
                  { value: 'MONTH', label: 'Monthly Rotation' },
                  { value: 'DATE', label: 'Specific Single Date' }
                ]}
              />
              
              <div className="space-y-1" ref={timePickerRef}>
                <Typography variant="caption" className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-0.5">Start Time</Typography>
                <div className="relative">
                  <button 
                    onClick={() => setShowTimePicker(!showTimePicker)}
                    className={`w-full h-11 px-3.5 flex items-center justify-between bg-white dark:bg-white/3 border rounded-2xl transition-all font-bold text-[12px] shadow-xs cursor-pointer
                      ${showTimePicker ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${showTimePicker ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                        <Icon name="history_toggle_off" size="14px" weight={300} />
                      </div>
                      <span className="font-mono text-[13px] tracking-tight">{formData.backupTime}</span>
                    </span>
                    <Icon name="expand_more" size="sm" className={`text-slate-400 transition-transform ${showTimePicker ? 'rotate-180 text-amber-500' : ''}`} />
                  </button>

                  {showTimePicker && (
                    <div className="absolute top-[calc(100%+6px)] left-0 mt-1.5 z-100 w-[180px] bg-white dark:bg-bk-side border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden flex divide-x divide-slate-100 dark:divide-white/5 h-[220px]">
                      <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (
                          <button key={h} onClick={() => handleInputChange('backupTime', `${h}:${formData.backupTime.split(':')[1]}`)} className={`w-full py-2.5 text-[11px] font-black font-mono transition-colors cursor-pointer ${formData.backupTime.startsWith(h) ? 'bg-amber-500/15 text-amber-600' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400'}`}>{h}</button>
                        ))}
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')).map(m => (
                          <button key={m} onClick={() => { handleInputChange('backupTime', `${formData.backupTime.split(':')[0]}:${m}`); setShowTimePicker(false); }} className={`w-full py-2.5 text-[11px] font-black font-mono transition-colors cursor-pointer ${formData.backupTime.endsWith(m) ? 'bg-amber-500/15 text-amber-600' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400'}`}>{m}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Detail Grids */}
          <div className="col-span-2 mt-[-10px] animate-in fade-in slide-in-from-top-2 duration-300">
            {formData.periodType === 'WEEK' && (
              <div className="grid grid-cols-7 gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, ix) => (
                  <button key={day} onClick={() => toggleDetail(ix + 1)} className={`h-10 rounded-xl border text-[10px] font-black tracking-widest uppercase transition-all cursor-pointer ${formData.periodDetail.includes(ix + 1) ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white dark:bg-white/2 border-slate-100 dark:border-white/5 text-slate-400 hover:border-amber-500/30'}`}>{day}</button>
                ))}
              </div>
            )}

            {formData.periodType === 'MONTH' && (
              <div className="grid grid-cols-8 gap-1.5 p-3.5 bg-slate-50/50 dark:bg-white/1 border border-slate-100 dark:border-white/5 rounded-2xl">
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <button key={d} onClick={() => toggleDetail(d)} className={`h-8 rounded-lg border text-[10px] font-black font-mono transition-all cursor-pointer ${formData.periodDetail.includes(d) ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-white dark:bg-white/4 border-transparent text-slate-400 hover:border-amber-500/30'}`}>{d}</button>
                ))}
              </div>
            )}

            {formData.periodType === 'DATE' && (
              <div className="relative" ref={calendarRef}>
                <button 
                  onClick={() => setShowCalendar(!showCalendar)} 
                  className={`w-full h-11 px-4 flex items-center justify-between bg-white dark:bg-white/3 border rounded-2xl text-[12px] font-bold shadow-xs cursor-pointer transition-all
                    ${showCalendar ? 'border-amber-500' : 'border-slate-200 dark:border-white/10'}`}
                >
                  <span className="flex items-center gap-3">
                    <Icon name="calendar_today" size="sm" weight={300} className="text-amber-500" />
                    <span className="font-mono">{formData.periodDetail}</span>
                  </span>
                  <Icon name="expand_more" size="sm" className={`text-slate-400 transition-transform ${showCalendar ? 'rotate-180' : ''}`} />
                </button>
                {showCalendar && (
                  <div className="absolute top-[calc(100%+6px)] left-0 mt-1.5 z-100 w-[280px] bg-white dark:bg-bk-side border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-4 px-1">
                      <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"><Icon name="chevron_left" size="sm" /></button>
                      <span className="text-[12px] font-black tracking-tight">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                      <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"><Icon name="chevron_right" size="sm" /></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {['S','M','T','W','T','F','S'].map(d => <div key={d} className="h-7 mb-1 flex items-center justify-center text-[9px] font-black text-slate-300 uppercase tracking-widest">{d}</div>)}
                      {Array.from({ length: new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() }).map((_, i) => <div key={i} />)}
                      {Array.from({ length: new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map(d => {
                        const ds = `${viewDate.getFullYear()}-${String(viewDate.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                        const isSel = formData.periodDetail === ds;
                        return (
                          <button 
                            key={d} 
                            onClick={() => { handleInputChange('periodDetail', ds); setShowCalendar(false); }} 
                            className={`h-9 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${isSel ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 z-10 scale-110' : 'hover:bg-amber-500/10 text-slate-600 dark:text-slate-300'}`}
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SQL Payload */}
          <div className="col-span-2 space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <Icon name="code" size="14px" weight={400} className="text-amber-500" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">SQL Execution Payload</span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-500/60 bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded-full">Atomic Execution</span>
            </div>
            <div className="relative group rounded-3xl overflow-hidden border border-slate-200 dark:border-white/8 bg-white dark:bg-[#1e1e1e] shadow-inner transition-all focus-within:ring-4 focus-within:ring-amber-500/5 focus-within:border-amber-500/40">
              <div className="absolute top-4 left-4 z-10 opacity-40 group-focus-within:opacity-100 transition-opacity pointer-events-none">
                <Icon name="terminal" size="sm" weight={300} className="text-amber-500" />
              </div>
              <div className="pl-10">
                <Editor
                  height="168px"
                  language="sql"
                  theme={theme === 'dark' ? 'vs-dark' : 'light'}
                  value={formData.queryString}
                  onChange={val => handleInputChange('queryString', val || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    glyphMargin: false,
                    folding: false,
                    lineDecorationsWidth: 10,
                    lineNumbersMinChars: 3,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                    fontFamily: 'JetBrains Mono, Fira Code, monospace',
                    renderLineHighlight: 'all',
                    scrollbar: {
                      vertical: 'visible',
                      horizontal: 'hidden',
                      useShadows: false,
                      verticalScrollbarSize: 8
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/8 rounded-2xl shadow-xs shrink-0">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center shrink-0 border border-slate-200 dark:border-white/10">
                <Icon name="info" size="sm" weight={300} className="text-sky-500" />
              </div>
              <div className="space-y-0.5">
                <Typography variant="p" className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">System Compliance</Typography>
                <Typography variant="caption" className="text-slate-500 dark:text-slate-500 font-medium leading-relaxed italic block">
                  Queries are executed on the server side via the task controller. Ensure the DB user has <span className="font-bold non-italic text-amber-500">sufficient privileges</span> for the intended operations.
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
