import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeEditQueryPlanModal, setAutoExecQuery, fetchQueryPlan } from '../databaseSlice';
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
          className={`w-full h-11 px-3.5 flex items-center justify-between bg-white dark:bg-white/3 border rounded-2xl transition-all font-medium text-[12px] shadow-xs cursor-pointer
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
                  className={`w-full px-4 py-3 text-[12px] font-medium transition-all flex items-center justify-between group cursor-pointer
                    ${value === opt.value ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${value === opt.value ? 'bg-amber-500 scale-125' : 'bg-slate-300 dark:bg-slate-700 opacity-0 group-hover:opacity-100'}`} />
                    {opt.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function EditQueryPlanModal() {
  const dispatch = useDispatch();
  const { isEditQueryPlanModalOpen, selectedQueryPlanId } = useSelector((state) => state.databaseUI);
  const { selectedDatabase } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);
  const { theme } = useSelector((state) => state.layout);
  const { queryPlans } = useSelector((state) => state.databaseOperation);
  
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

  // Clear view on modal open
  useEffect(() => {
    if (isEditQueryPlanModalOpen) {
      setView(VIEW_FORM);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isEditQueryPlanModalOpen]);

  // Initialization
  useEffect(() => {
    if (isEditQueryPlanModalOpen && selectedDatabase && selectedQueryPlanId && view === VIEW_FORM) {
      const plans = queryPlans[selectedDatabase] || [];
      let plan = plans.find(p => p.query_id === selectedQueryPlanId);
      
      if (!plan && plans.length === 0) {
        dispatch(fetchQueryPlan({ hostUid: selectedHostUid, dbname: selectedDatabase }));
      }
      
      if (plan) {
        let periodType = plan.period || 'DAY';
        let detailStr = plan.detail || '';
        let time = '12:00';
        let periodDetail = [];
        
        if (periodType === 'DAY') {
          time = detailStr;
        } else if (periodType === 'DATE') {
          const parts = detailStr.split(' ');
          periodDetail = parts[0];
          time = parts[1] || '12:00';
        } else {
          // MONTH, WEEK
          const parts = detailStr.split(' ');
          periodDetail = parts[0].split(',').map(s => isNaN(parseInt(s)) ? s : parseInt(s));
          time = parts[1] || '12:00';
        }

        setFormData({
          queryId: plan.query_id,
          username: plan.username || 'public',
          password: plan.userpass || '',
          periodType: periodType,
          periodDetail: periodDetail,
          backupTime: time,
          queryString: plan.query_string || ''
        });
      }
    }
  }, [isEditQueryPlanModalOpen, selectedDatabase, selectedQueryPlanId, queryPlans]);

  if (!isEditQueryPlanModalOpen) return null;

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
       setErrorMsg('A unique Query Identifier is required.');
       setView(VIEW_ERROR);
       return;
    }
    if (!formData.queryString.trim()) {
      setErrorMsg('No SQL statement provided.');
      setView(VIEW_ERROR);
      return;
    }
    
    setView(VIEW_LOADING);
    setErrorMsg('');

    let detail = '';
    if (formData.periodType === 'DAY') detail = formData.backupTime;
    else if (formData.periodType === 'DATE') detail = `${formData.periodDetail} ${formData.backupTime}`;
    else detail = `${formData.periodDetail.join(',')} ${formData.backupTime}`;

    // IMPORTANT: CUBRID API usually requires sending the full list for a database.
    const currentPlans = queryPlans[selectedDatabase] || [];
    const otherPlans = currentPlans.filter(p => p.query_id !== selectedQueryPlanId);
    
    const updatedPlan = {
      query_id: formData.queryId.trim(),
      username: formData.username,
      userpass: formData.password,
      period: formData.periodType,
      detail: detail,
      query_string: formData.queryString.trim()
    };

    const payload = {
      dbname: selectedDatabase,
      planlist: [{
        queryplan: [
            ...otherPlans.map(p => ({
                query_id: p.query_id,
                username: p.username,
                userpass: p.userpass || '',
                period: p.period,
                detail: p.detail,
                query_string: p.query_string
            })),
            updatedPlan
        ]
      }]
    };

    try {
      await dispatch(setAutoExecQuery({ hostUid: selectedHostUid, dbname: selectedDatabase, payload })).unwrap();
      setSuccessMsg(`Plan "${formData.queryId}" has been successfully updated.`);
      setView(VIEW_SUCCESS);
      dispatch(fetchQueryPlan({ hostUid: selectedHostUid, dbname: selectedDatabase }));
    } catch (err) {
      setErrorMsg(typeof err === 'string' ? err : (err.message || 'Operation failed.'));
      setView(VIEW_ERROR);
    }
  };

  const handleClose = () => dispatch(closeEditQueryPlanModal());

  /* ─── LOADING view ─── */
  if (view === VIEW_LOADING) {
    return (
      <Modal isOpen title="Updating Schedule" icon="edit" onClose={handleClose} maxWidth="720px">
        <div className="flex flex-col items-center justify-center py-12 gap-7 text-center animate-in fade-in duration-200">
          <div className="size-16 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin"></div>
          <Typography variant="h4" className="text-[15px] font-black tracking-tight">Syncing Changes</Typography>
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
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">Schedule Registry Updated</Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 font-medium leading-relaxed max-w-[360px] mx-auto">
              Changes to the query plan for <span className="font-bold text-slate-900 dark:text-white">{selectedDatabase}</span> have been committed and re-indexed.
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
      <Modal isOpen title="Update Failed" icon="error" iconVariant="danger" onClose={handleClose} maxWidth="700px">
        <div className="flex flex-col items-center justify-center py-10 gap-6 text-center animate-in fade-in duration-200">
          <div className="relative w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)]">
            <Icon name="edit_off" size="md" weight={300} className="text-white" />
          </div>
          <div className="space-y-2 px-6">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">Execution Halted</Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 font-medium leading-relaxed">System could not finalize the query schedule modification sequence.</Typography>
          </div>
          <div className="w-full max-w-[480px] bg-rose-500/5 border border-rose-500/15 rounded-xl px-4 py-3 text-left shadow-xs">
            <Typography variant="caption" className="text-rose-400 font-mono leading-relaxed break-words block text-center uppercase tracking-widest text-[10px] font-bold">
              {errorMsg}
            </Typography>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleClose}>Dismiss</Button>
            <Button variant="primary" icon="refresh" onClick={() => setView(VIEW_FORM)}>Retry Update</Button>
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── FORM view ─── */
  return (
    <Modal
      isOpen={isEditQueryPlanModalOpen}
      onClose={handleClose}
      title="Edit Query Plan"
      subtitle={`Modify automated SQL execution for ${selectedDatabase}`}
      icon="edit"
      maxWidth="max-w-[720px]"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="ghost" onClick={handleClose}>Discard</Button>
          <Button variant="primary" onClick={handleSave} icon="save" className="px-8 min-w-[160px]">Save Changes</Button>
        </div>
      }
    >
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
        {/* Identifier */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <Icon name="fingerprint" size="14px" weight={400} className="text-amber-500" />
             <span className="text-[10px] font-black text-slate-400">Object Identification</span>
          </div>
          <Input 
            label="Query Identifier"
            value={formData.queryId}
            disabled
            icon="tag"
            size="sm"
            className="opacity-50"
          />
        </div>

        {/* Security */}
        <div className="space-y-4">
           <div className="flex items-center gap-3">
             <Icon name="lock" size="14px" weight={400} className="text-amber-500" />
             <span className="text-[10px] font-black text-slate-400">Secure Context</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Database Username"
              value={formData.username}
              onChange={e => handleInputChange('username', e.target.value)}
              icon="person"
              size="sm"
            />
            <Input 
              type="password"
              label="Database Password"
              value={formData.password}
              onChange={e => handleInputChange('password', e.target.value)}
              icon="key"
              placeholder="••••••••"
              size="sm"
            />
          </div>
        </div>

        {/* Schedule */}
        <div className="space-y-4">
           <div className="flex items-center gap-3">
             <Icon name="schedule" size="14px" weight={400} className="text-amber-500" />
             <span className="text-[10px] font-black text-slate-400">Execution Schedule</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
              <Typography variant="caption" className="text-[10px] font-black text-slate-400 ml-0.5">Start Time</Typography>
              <div className="relative">
                <button 
                  onClick={() => setShowTimePicker(!showTimePicker)}
                  className={`w-full h-11 px-3.5 flex items-center justify-between bg-white dark:bg-white/3 border rounded-2xl transition-all font-medium text-[12px] shadow-xs cursor-pointer
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
                  <div className="absolute top-[calc(100%+6px)] left-0 mt-1.5 z-100 w-[180px] bg-white dark:bg-bk-side border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex divide-x divide-slate-100 dark:divide-white/5 h-[220px]">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (
                        <button key={h} onClick={() => handleInputChange('backupTime', `${h}:${formData.backupTime.split(':')[1]}`)} className={`w-full py-2.5 text-[11px] font-black font-mono cursor-pointer ${formData.backupTime.startsWith(h) ? 'bg-amber-500/15 text-amber-600' : 'hover:bg-slate-50 text-slate-400'}`}>{h}</button>
                      ))}
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      {Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')).map(m => (
                        <button key={m} onClick={() => { handleInputChange('backupTime', `${formData.backupTime.split(':')[0]}:${m}`); setShowTimePicker(false); }} className={`w-full py-2.5 text-[11px] font-black font-mono cursor-pointer ${formData.backupTime.endsWith(m) ? 'bg-amber-500/15 text-amber-600' : 'hover:bg-slate-50 text-slate-400'}`}>{m}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-[-10px] animate-in fade-in slide-in-from-top-2 duration-300">
          {formData.periodType === 'WEEK' && (
            <div className="grid grid-cols-7 gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, ix) => (
                <button key={day} onClick={() => toggleDetail(ix + 1)} className={`h-10 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${formData.periodDetail.includes(ix + 1) ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white dark:bg-white/2 border-slate-100 dark:border-white/5 text-slate-400 hover:border-amber-500/30'}`}>{day}</button>
              ))}
            </div>
          )}
          {formData.periodType === 'MONTH' && (
            <div className="grid grid-cols-8 gap-1.5 p-3.5 bg-slate-50/50 dark:bg-white/1 border border-slate-100 dark:border-white/5 rounded-2xl">
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                <button key={d} onClick={() => toggleDetail(d)} className={`h-8 rounded-lg border text-[11px] font-bold font-mono transition-all cursor-pointer ${formData.periodDetail.includes(d) ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-white dark:bg-white/4 border-transparent text-slate-400 hover:border-amber-500/30'}`}>{d}</button>
              ))}
            </div>
          )}
        </div>

        {/* SQL Payload */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <Icon name="code" size="14px" weight={400} className="text-amber-500" />
               <span className="text-[10px] font-black text-slate-400">SQL Execution Payload</span>
            </div>
            <span className="text-[10px] font-bold text-amber-500/60 bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded-full">Atomic execution</span>
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
                  lineNumbers: 'off',
                  glyphMargin: false,
                  folding: false,
                  lineDecorationsWidth: 0,
                  lineNumbersMinChars: 0,
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
              <Typography variant="p" className="text-[11px] font-black text-slate-700 dark:text-slate-200 tracking-tight">System Compliance</Typography>
              <Typography variant="caption" className="text-slate-500 dark:text-slate-500 font-medium leading-relaxed italic block">
                Queries are executed on the server side via the task controller. Ensure the DB user has <span className="font-bold non-italic text-amber-500">sufficient privileges</span> for the intended operations.
              </Typography>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
