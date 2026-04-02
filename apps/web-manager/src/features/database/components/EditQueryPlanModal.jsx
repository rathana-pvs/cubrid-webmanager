import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeEditQueryPlanModal, setAutoExecQuery, fetchQueryPlan } from '../databaseSlice';
import Editor from '@monaco-editor/react';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Select } from '../../../components/ds/forms/Select';
import { DatePicker } from '../../../components/ds/forms/DatePicker';
import { TimePicker } from '../../../components/ds/forms/TimePicker';
import { Typography } from '../../../components/ds/foundation/Typography';
import { useActionState } from '../../../infrastructure/hooks/useActionState';
import { 
  ModalStatusLoading, 
  ModalStatusSuccess, 
  ModalStatusError 
} from '../../../components/ds/feedback/ActionStatus';

// view states
const VIEW_FORM    = 'form';
const VIEW_LOADING = 'loading';
const VIEW_SUCCESS = 'success';
const VIEW_ERROR   = 'error';

export default function EditQueryPlanModal() {
  const dispatch = useDispatch();
  const { isEditQueryPlanModalOpen, selectedQueryPlanId } = useSelector((state) => state.databaseUI, shallowEqual);
  const { selectedDatabase } = useSelector((state) => state.database, shallowEqual);
  const { selectedHostUid } = useSelector((state) => state.host, shallowEqual);
  const { theme } = useSelector((state) => state.layout, shallowEqual);
  const { queryPlans } = useSelector((state) => state.databaseOperation, shallowEqual);
  
  const { 
    state, 
    error: actionError, 
    startAction, 
    endSuccess, 
    endError, 
    resetAction,
    isLoading,
    isSuccess,
    isError
  } = useActionState();

  const [formData, setFormData] = useState({
    queryId: '',
    username: 'public',
    password: '',
    periodType: 'DAY',
    periodDetail: [],
    backupTime: '12:00',
    queryString: ''
  });

  // Clear view on modal open
  useEffect(() => {
    if (isEditQueryPlanModalOpen) {
      resetAction();
    }
  }, [isEditQueryPlanModalOpen, resetAction]);

  // Initialization
  useEffect(() => {
    if (isEditQueryPlanModalOpen && selectedDatabase && selectedQueryPlanId && !isLoading && !isSuccess && !isError) {
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
        
        // Clean "select" from time if API includes it
        time = time.replace(/select/gi, '').trim();

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
  }, [isEditQueryPlanModalOpen, selectedDatabase, selectedQueryPlanId, queryPlans, isLoading, isSuccess, isError, selectedHostUid, dispatch]);

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
       endError('A unique Query Identifier is required.');
       return;
    }
    if (!formData.queryString.trim()) {
      endError('No SQL statement provided.');
      return;
    }
    
    startAction();

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
      endSuccess(`Plan "${formData.queryId}" has been successfully updated.`);
      dispatch(fetchQueryPlan({ hostUid: selectedHostUid, dbname: selectedDatabase }));
    } catch (err) {
      endError(typeof err === 'string' ? err : (err.message || 'Operation failed.'));
    }
  };

  const handleClose = () => dispatch(closeEditQueryPlanModal());

  /* ─── LOADING view ─── */
  if (isLoading) {
    return (
      <Modal isOpen title="Updating Schedule" icon="edit" onClose={handleClose} maxWidth="720px">
        <ModalStatusLoading 
          title="Syncing Changes" 
          subtitle="Committing the new automation sequence to the task controller."
        />
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  if (isSuccess) {
    return (
      <Modal isOpen title="Update Successful" icon="verified" iconVariant="success" onClose={handleClose} maxWidth="700px">
        <ModalStatusSuccess 
          title="Schedule Registry Updated"
          message={`Changes to the query plan for ${selectedDatabase} have been committed and re-indexed.`}
          onConfirm={handleClose}
          confirmText="Acknowledge"
        />
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (isError) {
    return (
      <Modal isOpen title="Update Failed" icon="error" iconVariant="danger" onClose={resetAction} maxWidth="700px">
        <ModalStatusError 
          title="Execution Halted"
          error={actionError}
          onRetry={handleSave}
          onCancel={resetAction}
          retryText="Retry Update"
          cancelText="Dismiss"
        />
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
          <Button variant="primary" onClick={handleSave} icon="save" className="min-w-[140px]">Save Changes</Button>
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
            />
            <Input 
              type="password"
              label="Database Password"
              value={formData.password}
              onChange={e => handleInputChange('password', e.target.value)}
              icon="key"
              placeholder="••••••••"
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
            <Select 
              label="Recurrence Frequency"
              icon="event_repeat"
              value={formData.periodType}
              onChange={e => handleInputChange('periodType', e.target.value)}
              options={[
                { value: 'DAY', label: 'Daily (Every 24h)' },
                { value: 'WEEK', label: 'Weekly Precision' },
                { value: 'MONTH', label: 'Monthly Rotation' },
                { value: 'DATE', label: 'Specific Single Date' }
              ]}
            />
            <TimePicker 
              label="Start Time"
              value={formData.backupTime}
              onChange={e => handleInputChange('backupTime', e.target.value)}
              icon="history_toggle_off"
            />
          </div>
        </div>

        <div className="mt-[-10px] animate-in fade-in slide-in-from-top-2 duration-300">
          {formData.periodType === 'WEEK' && (
            <div className="grid grid-cols-7 gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, ix) => {
                const isSel = formData.periodDetail.includes(ix + 1);
                return (
                  <button 
                    key={day} 
                    onClick={() => toggleDetail(ix + 1)} 
                    className={`h-10 rounded-xl border text-[11px] font-black transition-all cursor-pointer 
                      ${isSel 
                        ? 'bg-amber-500/15 dark:bg-amber-500/25 border-amber-500/30 text-amber-600 dark:text-amber-400' 
                        : 'bg-white dark:bg-white/2 border-slate-100 dark:border-white/5 text-slate-400 hover:border-amber-500/30'}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          )}
          {formData.periodType === 'MONTH' && (
            <div className="grid grid-cols-8 gap-1.5 p-3.5 bg-slate-50/50 dark:bg-white/1 border border-slate-100 dark:border-white/5 rounded-2xl">
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
                const isSel = formData.periodDetail.includes(d);
                return (
                  <button 
                    key={d} 
                    onClick={() => toggleDetail(d)} 
                    className={`h-8 rounded-lg border text-[10px] font-black font-mono transition-all cursor-pointer 
                      ${isSel 
                        ? 'bg-amber-500/15 dark:bg-amber-500/25 border-amber-500/30 text-amber-600 dark:text-amber-400' 
                        : 'bg-white dark:bg-white/4 border-transparent text-slate-400 hover:border-amber-500/30'}`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          )}
          {formData.periodType === 'DATE' && (
            <DatePicker 
              value={formData.periodDetail}
              onChange={e => handleInputChange('periodDetail', e.target.value)}
              icon="calendar_month"
            />
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
