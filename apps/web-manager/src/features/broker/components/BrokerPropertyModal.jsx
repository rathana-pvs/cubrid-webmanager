import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  closeBrokerPropertyModal,
  fetchBrokerConfig,
  updateBrokerConfig,
} from '../brokerSlice';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Icon } from '../../../components/ds/foundation/Icon';
import { Input } from '../../../components/ds/forms/Input';
import { Select } from '../../../components/ds/forms/Select';

// ─── Schema ───────────────────────────────────────────────────────────────────
// Follows ConfConstants.java brokerParameters
const BROKER_PARAMETERS = [
  // Common Category (PARAMETER_TYPE_BROKER_COMMON)
  { name: 'SERVICE',              type: 'string(ON|OFF)',                    default: 'ON',                 category: 'common' },
  { name: 'BROKER_PORT',          type: 'int(1024~65535)',                   default: '',                   category: 'common' },
  { name: 'MIN_NUM_APPL_SERVER',  type: 'int',                               default: '5',                  category: 'common' },
  { name: 'MAX_NUM_APPL_SERVER',  type: 'int',                               default: '40',                 category: 'common' },
  { name: 'APPL_SERVER_SHM_ID',  type: 'int(1024~65535)',                   default: '',                   category: 'common' },
  { name: 'LOG_DIR',              type: 'string',                            default: 'log/broker/sql_log', category: 'common' },
  { name: 'ERROR_LOG_DIR',        type: 'string',                            default: 'log/broker/error_log', category: 'common' },
  { name: 'SQL_LOG',              type: 'string(ON|OFF|ERROR|NOTICE|TIMEOUT)', default: 'ON',              category: 'common' },
  { name: 'TIME_TO_KILL',         type: 'int',                               default: '120',                category: 'common' },
  { name: 'SESSION_TIMEOUT',      type: 'int',                               default: '300',                category: 'common' },
  { name: 'KEEP_CONNECTION',      type: 'string(ON|OFF|AUTO)',               default: 'AUTO',               category: 'common' },

  // Advance Category (PARAMETER_TYPE_BROKER_ADVANCE)
  { name: 'STATEMENT_POOLING',    type: 'string(ON|OFF)',                    default: 'ON',                 category: 'advance' },
  { name: 'LONG_QUERY_TIME',      type: 'int(sec)',                          default: '60',                 category: 'advance' },
  { name: 'LONG_TRANSACTION_TIME', type: 'int(sec)',                         default: '60',                 category: 'advance' },
  { name: 'SQL_LOG_MAX_SIZE',     type: 'int',                               default: '100000',             category: 'advance' },
  { name: 'LOG_BACKUP',           type: 'string(ON|OFF)',                    default: 'OFF',                category: 'advance' },
  { name: 'SOURCE_ENV',           type: 'string',                            default: 'cubrid.env',         category: 'advance' },
  { name: 'MAX_STRING_LENGTH',    type: 'int',                               default: '-1',                 category: 'advance' },
  { name: 'APPL_SERVER_PORT',     type: 'int',                               default: '',                   category: 'advance' },
  { name: 'ACCESS_LOG',           type: 'string(ON|OFF)',                    default: 'ON',                 category: 'advance' },
  { name: 'ACCESS_LIST',          type: 'string',                            default: '',                   category: 'advance' },
  { name: 'CCI_PCONNECT',         type: 'string(ON|OFF)',                    default: 'OFF',                category: 'advance' },
  { name: 'SELECT_AUTO_COMMIT',   type: 'string(ON|OFF)',                    default: 'OFF',                category: 'advance' },
  { name: 'ACCESS_MODE',          type: 'string(RW|RO|SO)',                  default: 'RW',                 category: 'advance' },
  { name: 'PREFERRED_HOSTS',      type: 'string',                            default: '',                   category: 'advance' },
  { name: 'CCI_DEFAULT_AUTOCOMMIT', type: 'string(ON|OFF)',                  default: 'ON',                 category: 'advance' },
  { name: 'ENABLE_OPENSSL',       type: 'string(ON|OFF)',                    default: 'OFF',                category: 'advance' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getOptions = (type) => {
  const match = type.match(/\((.+)\)/);
  if (!match || !match[1].includes('|')) return null;
  return match[1].split('|').map((v) => ({ value: v, label: v }));
};

const isNumericType = (type) => type.startsWith('int') || type.startsWith('float');

// ─── ParamRow ─────────────────────────────────────────────────────────────────
function ParamRow({ param, value, isModified, onChange }) {
  const options = getOptions(param.type);
  const isNumeric = isNumericType(param.type);

  return (
    <div className={`flex items-center h-10 px-4 border-b border-slate-100 dark:border-white/4 last:border-0 group transition-colors ${isModified ? 'bg-amber-500/[0.03]' : 'hover:bg-slate-50 dark:hover:bg-white/2'}`}>
      {/* Label */}
      <div className="w-[280px] shrink-0 flex items-center gap-2">
        {isModified && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
        <span className={`text-[10.5px] font-mono truncate ${isModified ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
          {param.name}
        </span>
      </div>

      {/* Type tag */}
      <span className="text-[8.5px] font-bold text-slate-400 dark:text-slate-600 font-mono opacity-60 w-[90px] shrink-0 truncate">
        {param.type.split('(')[0]}
      </span>

      {/* Value */}
      <div className="flex-1 min-w-0">
        {options ? (
          <Select
            size="sm"
            value={value}
            options={options}
            onChange={(e) => onChange(param.name, e.target.value)}
            className="w-full"
          />
        ) : (
          <Input
            size="sm"
            type={isNumeric ? 'number' : 'text'}
            value={value}
            onChange={(e) => onChange(param.name, e.target.value)}
            placeholder={param.default || '—'}
            className="w-full"
          />
        )}
      </div>
    </div>
  );
}

// ─── Constants ──────────────────────────────────────────────────────────────
const ViewStatus = {
  FORM: 'form',
  SAVING: 'saving',
  SUCCESS: 'success',
  ERROR: 'error',
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BrokerPropertyModal() {
  const dispatch = useDispatch();
  const { propertyModal, brokerConfig } = useSelector((state) => state.broker);
  const { isOpen, brokerName, hostUid } = propertyModal;

  const [activeTab, setActiveTab] = useState('common');
  const [localParams, setLocalParams] = useState({});
  const [specificParams, setSpecificParams] = useState(new Set());
  const [initialParams, setInitialParams] = useState({});
  const [initialSpecificParams, setInitialSpecificParams] = useState(new Set());

  const [viewStatus, setViewStatus] = useState(ViewStatus.FORM);
  const [errorMessage, setErrorMessage] = useState('');

  const config = useMemo(
    () => brokerConfig[hostUid] || { data: {}, loading: false },
    [brokerConfig, hostUid]
  );

  useEffect(() => {
    if (isOpen && hostUid) {
      dispatch(fetchBrokerConfig({ hostUid }));
      setViewStatus(ViewStatus.FORM);
      setErrorMessage('');
    }
  }, [isOpen, hostUid, dispatch]);

  useEffect(() => {
    const confLines = config.data?.confdata || config.data?.conflist?.[0]?.confdata;
    if (!confLines || confLines.length === 0) return;
    
    const sections = {};
    let currentSection = 'general';

    confLines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const sectionMatch = trimmed.match(/^\[%?(.+)\]$/);
      if (sectionMatch) {
        currentSection = sectionMatch[1].toLowerCase();
        sections[currentSection] = {};
      } else {
        const [key, value] = trimmed.split('=').map((s) => s.trim());
        if (key && value !== undefined) {
          if (!sections[currentSection]) sections[currentSection] = {};
          sections[currentSection][key] = value;
        }
      }
    });

    const targetBroker = brokerName?.toLowerCase();
    const combined = { ...(sections['broker'] || {}), ...(sections[targetBroker] || {}) };
    const specKeys = new Set(Object.keys(sections[targetBroker] || {}));
    
    setLocalParams(combined);
    setInitialParams(combined);
    setSpecificParams(specKeys);
    setInitialSpecificParams(new Set(specKeys));
  }, [config.data, brokerName, isOpen]);

  const handleParamChange = (name, value) => {
    setLocalParams((prev) => ({ ...prev, [name]: value }));
    setSpecificParams((prev) => { const n = new Set(prev); n.add(name); return n; });
  };

  const handleReset = () => {
    setLocalParams(initialParams);
    setSpecificParams(new Set(initialSpecificParams));
  };

  const handleSave = async () => {
    // Navigate data structure: could be direct .confdata or inside .conflist[0]
    const confLines = config.data?.confdata || config.data?.conflist?.[0]?.confdata;
    
    console.log('Attempting to save broker properties. Current structure:', { 
      hasConfData: !!config.data?.confdata,
      hasConfList: !!config.data?.conflist,
      linesCount: confLines?.length
    });

    if (!confLines || confLines.length === 0) {
      console.warn('Save aborted: No configuration lines found to modify.', config.data);
      alert('Error: Configuration data not loaded. Please wait for synchronization or refresh the modal.');
      return;
    }
    
    setViewStatus(ViewStatus.SAVING);

    const newConfData = [];
    let inTargetSection = false;
    const targetBroker = brokerName?.toLowerCase();
    const updatedInTargetSection = new Set();

    confLines.forEach((line) => {
      const trimmed = line.trim();
      const sectionMatch = trimmed.match(/^\[%?(.+)\]$/);
      if (sectionMatch) {
        const sectionName = sectionMatch[1].toLowerCase();
        if (inTargetSection) {
          specificParams.forEach((paramName) => {
            if (!updatedInTargetSection.has(paramName) && localParams[paramName] !== undefined) {
              newConfData.push(`${paramName}=${localParams[paramName]}`);
            }
          });
        }
        inTargetSection = sectionName === targetBroker;
        newConfData.push(line);
      } else if (inTargetSection) {
        const [key] = trimmed.split('=').map((s) => s.trim());
        if (key && localParams[key] !== undefined && specificParams.has(key)) {
          newConfData.push(`${key}=${localParams[key]}`);
          updatedInTargetSection.add(key);
        } else {
          newConfData.push(line);
        }
      } else {
        newConfData.push(line);
      }
    });

    if (inTargetSection) {
      specificParams.forEach((paramName) => {
        if (!updatedInTargetSection.has(paramName) && localParams[paramName] !== undefined) {
          newConfData.push(`${paramName}=${localParams[paramName]}`);
        }
      });
    }

    try {
      await dispatch(updateBrokerConfig({ hostUid, confdata: newConfData })).unwrap();
      setViewStatus(ViewStatus.SUCCESS);
    } catch (err) {
      console.error('Save failed:', err);
      const msg = typeof err === 'string' ? err : err.message || err.error || 'Failed to update broker configuration';
      setErrorMessage(msg);
      setViewStatus(ViewStatus.ERROR);
    }
  };

  const handleClose = () => dispatch(closeBrokerPropertyModal());

  const isFormModified = JSON.stringify(localParams) !== JSON.stringify(initialParams);
  const modifiedCount = Object.keys(localParams).filter(k => localParams[k] !== initialParams[k]).length;

  const commonParams = BROKER_PARAMETERS.filter((p) => p.category === 'common');
  const advanceParams = BROKER_PARAMETERS.filter((p) => p.category === 'advance');
  const currentParams = activeTab === 'common' ? commonParams : advanceParams;

  const tabs = [
    { id: 'common',   label: 'Common',   icon: 'settings' },
    { id: 'advance',  label: 'Advanced',  icon: 'tune' },
  ];

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Broker Properties"
      icon="hub"
      maxWidth="max-w-[620px]"
      footer={
        config.error ? (
          <Button variant="secondary" onClick={handleClose} className="w-full">
            Close Modal
          </Button>
        ) : viewStatus === ViewStatus.FORM ? (
          <>
            <div className="mr-auto flex items-center gap-2">
              {isFormModified && (
                <Button
                  variant="ghost"
                  onClick={handleReset}
                  icon="restart_alt"
                  className="text-amber-600 hover:text-amber-700 hover:bg-amber-500/5 group"
                >
                  <span className="hidden sm:inline">Reset to Original</span>
                </Button>
              )}
            </div>
            <Button variant="secondary" onClick={handleClose}>
              Discard Changes
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={viewStatus === ViewStatus.SAVING}
              icon="check_circle"
              className="min-w-[140px]"
              disabled={config.loading || modifiedCount === 0}
            >
              Apply and Close
            </Button>
          </>
        ) : viewStatus === ViewStatus.SUCCESS ? (
          <Button variant="primary" onClick={handleClose} className="w-full">
            Great, Done
          </Button>
        ) : viewStatus === ViewStatus.ERROR ? (
          <>
            <Button variant="ghost" onClick={handleClose} icon="close">
              Discard and Exit
            </Button>
            <div className="flex-1" />
            <Button variant="secondary" onClick={() => setViewStatus(ViewStatus.FORM)} icon="arrow_back" className="min-w-[120px]">
              Back to Form
            </Button>
            <Button variant="primary" onClick={handleSave} icon="refresh" className="min-w-[120px]">
              Retry Sync
            </Button>
          </>
        ) : null
      }
    >
      {/* Premium Identity Strip */}
      <div className="relative p-4 overflow-hidden border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
        {/* Abstract background decorative element */}
        <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Icon name="hub" size="lg" weight={300} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight leading-tight truncate">{brokerName}</h2>
              <div className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[9px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">Active</div>
            </div>
          </div>
          {isFormModified && (
            <div className="hidden sm:flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                  {modifiedCount} {modifiedCount === 1 ? 'Change' : 'Changes'} Pending
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {viewStatus === ViewStatus.FORM && (
        <div className="flex flex-col h-[520px]">
          {/* Tab bar */}
          <div className="flex items-center gap-1 px-5 py-3 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-background-dark shrink-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[12px] font-bold tracking-tight transition-all relative group ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/4'
                  }`}
                >
                  <Icon name={tab.icon} size="16px" weight={isActive ? 600 : 400} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-bk-main">
            {config.error ? (
              <div className="p-20 flex flex-col items-center text-center animate-in fade-in duration-500">
                <div className="size-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
                  <Icon name="error_outline" size="32px" className="text-rose-500" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Sync Error</h3>
                <p className="text-[13px] text-slate-500 mt-2 max-w-[320px] mb-8 leading-relaxed font-medium">
                  {typeof config.error === 'string' ? config.error : (config.error?.message || 'Host connection lost or timed out.')}
                </p>
                <div 
                  onClick={() => dispatch(fetchBrokerConfig({ hostUid }))}
                  className="px-6 py-2 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-black text-[11px] font-black uppercase tracking-widest cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                >
                  Reconnect
                </div>
              </div>
            ) : config.loading && Object.keys(localParams).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
                <div className="relative">
                  <div className="h-10 w-10 border-4 border-amber-500/20 rounded-full" />
                  <div className="absolute inset-0 h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-[12px] text-slate-400 font-medium tracking-tight">Synchronizing parameters…</p>
              </div>
            ) : (
              <div className="p-0">
                {/* Table Header */}
                <div className="flex items-center h-10 px-5 bg-slate-50 dark:bg-bk-main border-b border-slate-200 dark:border-white/8 sticky top-0 z-20 shadow-sm shadow-black/5">
                  <span className="w-[280px] shrink-0 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Property Name</span>
                  <span className="w-[90px] shrink-0 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 text-center">Data Type</span>
                  <span className="flex-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Setting Value</span>
                </div>
                
                {/* Scrollable list */}
                <div className="divide-y divide-slate-100 dark:divide-white/4">
                  {currentParams.map((p) => (
                    <ParamRow
                      key={p.name}
                      param={p}
                      value={localParams[p.name] ?? p.default}
                      isModified={localParams[p.name] !== initialParams[p.name]}
                      onChange={handleParamChange}
                    />
                  ))}
                </div>
                
                {/* Helper footer inside content */}
                <div className="p-8 flex flex-col items-center text-center opacity-40">
                  <Icon name="verified_user" size="lg" className="text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[280px] font-medium leading-relaxed">
                    Configuration values are validated against the CUBRID Broker specification. Some changes may require a service restart to take effect.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {(viewStatus === ViewStatus.SAVING || viewStatus === ViewStatus.SUCCESS || viewStatus === ViewStatus.ERROR) && (
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-10 text-center">
          {viewStatus === ViewStatus.SAVING && (
            <div className="flex flex-col items-center gap-7 animate-in fade-in zoom-in duration-300">
              <div className="relative w-[72px] h-[72px]">
                <div className="absolute inset-0 rounded-full border-2 border-slate-100 dark:border-white/5" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-500 animate-spin" style={{ animationDuration: '0.9s' }} />
                <div className="absolute inset-[10px] rounded-full border-[1.5px] border-transparent border-b-amber-500/35 animate-spin" style={{ animationDuration: '1.7s', animationDirection: 'reverse' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-[16px] font-black text-slate-900 dark:text-white tracking-tight uppercase tracking-widest">Deploying Changes</h3>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[320px] mx-auto">
                  Writing updated parameters to <code className="text-amber-500 font-bold bg-amber-500/5 px-1.5 py-0.5 rounded">cubrid_broker.conf</code>
                </p>
              </div>
              <div className="w-44 h-0.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: '50%' }} />
              </div>
            </div>
          )}

          {viewStatus === ViewStatus.SUCCESS && (
            <div className="flex flex-col items-center gap-7 animate-in fade-in zoom-in-95 duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping" style={{ animationDuration: '2.5s' }} />
                <div className="relative w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  <Icon name="verified" size="lg" weight={700} className="text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-[16px] font-black text-slate-900 dark:text-white tracking-tight uppercase tracking-widest">Update Synchronized</h3>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[340px] mx-auto">
                  Broker settings for <span className="font-black text-slate-900 dark:text-white underline decoration-amber-500/30 underline-offset-4">{brokerName}</span> have been applied.
                </p>
              </div>
            </div>
          )}

          {viewStatus === ViewStatus.ERROR && (
            <div className="flex flex-col items-center gap-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-rose-500/10 rounded-full animate-ping" style={{ animationDuration: '2.5s' }} />
                <div className="relative w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(244,63,94,0.3)]">
                  <Icon name="report_problem" size="sm" weight={300} className="text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-[16px] font-black text-rose-600 dark:text-rose-400 tracking-tight uppercase tracking-widest">Transaction Interrupted</h3>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[320px] mx-auto">
                  The configuration sync for <span className="font-black text-slate-900 dark:text-white underline decoration-rose-500/30 underline-offset-4">{brokerName}</span> was halted by the host.
                </p>
              </div>
              <div className="w-full max-w-[420px] bg-rose-500/5 border border-rose-500/15 rounded-2xl px-5 py-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="terminal" size="xs" weight={300} className="text-rose-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-rose-400">System Trace</span>
                </div>
                <p className="text-rose-600 dark:text-rose-400/90 font-mono text-[11px] leading-relaxed break-words">
                  {errorMessage}
                </p>
              </div>
              <div className="pt-2 flex flex-col items-center gap-3">
                <button 
                  onClick={() => setViewStatus(ViewStatus.FORM)}
                  className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-200 text-[11px] font-black uppercase tracking-widest hover:scale-[1.05] active:scale-[0.95] transition-all shadow-xl shadow-black/10 border border-white/5"
                >
                  <Icon name="arrow_back" size="14px" />
                  Back to Forms
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
