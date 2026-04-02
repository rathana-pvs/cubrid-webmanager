import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeAddQueryPlanModal, setAutoExecQuery } from '../databaseSlice';
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



export default function AddQueryPlanModal() {
  const dispatch = useDispatch();
  const { isAddQueryPlanModalOpen } = useSelector((state) => state.databaseUI, shallowEqual);
  const { selectedDatabase } = useSelector((state) => state.database, shallowEqual);
  const { selectedHostUid } = useSelector((state) => state.host, shallowEqual);
  const { theme } = useSelector((state) => state.layout, shallowEqual);
  
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

  // Initialization
  useEffect(() => {
    if (isAddQueryPlanModalOpen && selectedDatabase) {
      resetAction();
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
  }, [isAddQueryPlanModalOpen, selectedDatabase, resetAction]);

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
       endError('A unique Query Identifier is required to register this plan.');
       return;
    }
    if (!formData.queryString.trim()) {
      endError('No SQL statement provided. The automation payload must contain at least one valid query.');
      return;
    }
    
    startAction();

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
      endSuccess(`Plan "${formData.queryId}" has been successfully synchronized and registered with the scheduler.`);
    } catch (err) {
      endError(typeof err === 'string' ? err : (err.message || 'Operation aborted by system controller. Verify database connectivity and user privileges.'));
    }
  };

  const handleClose = () => dispatch(closeAddQueryPlanModal());

  /* ─── LOADING view ─── */
  if (isLoading) {
    return (
      <Modal isOpen title="Scheduling Automate" icon="bolt" onClose={handleClose} maxWidth="720px">
        <ModalStatusLoading 
          title="Syncing Schedule" 
          subtitle={`Registering ${formData.queryId} with the CUBRID Automation Service.`}
        />
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  if (isSuccess) {
    return (
      <Modal isOpen title="Plan Synchronized" icon="bolt" iconVariant="success" onClose={handleClose} maxWidth="720px">
        <ModalStatusSuccess 
          title="Schedule Registry Active"
          message={`The automated query task for ${selectedDatabase} has been successfully committed.`}
          onConfirm={handleClose}
          confirmText="Access Scheduler"
        />
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (isError) {
    return (
      <Modal isOpen title="Scheduling Interrupted" icon="bolt" iconVariant="danger" onClose={resetAction} maxWidth="720px">
        <ModalStatusError 
          title="Transaction Dropped"
          error={actionError}
          onRetry={handleSave}
          onCancel={resetAction}
          retryText="Retry Submission"
          cancelText="Dismiss"
        />
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
                <Typography variant="caption" className="font-bold text-amber-600/70 mb-0.5">Automating database</Typography>
                <Typography variant="h4" className="text-[14px] font-black text-amber-700 dark:text-amber-400 font-mono truncate">
                   {selectedDatabase}
                </Typography>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/5 shadow-xs">
              <Icon name="bolt" size="sm" className="text-amber-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Payload: SQL Service</span>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <Icon name="fingerprint" size="14px" weight={400} className="text-amber-500" />
               <span className="text-[10px] font-black text-slate-400">Object Identification</span>
            </div>
            <Input 
              label="Query Identifier"
              placeholder="e.g. hourly_purge_logs"
              value={formData.queryId}
              onChange={e => handleInputChange('queryId', e.target.value)}
              icon="tag"
            />
          </div>

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

          {/* Schedule Configuration */}
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

          {/* Schedule Detail Grids */}
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
                        ? 'bg-amber-500/15 dark:bg-amber-500/25 border-amber-500/20 text-amber-600 dark:text-amber-400' 
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
          <div className="col-span-2 space-y-4 pt-2">
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
      </div>
    </Modal>
  );
}
