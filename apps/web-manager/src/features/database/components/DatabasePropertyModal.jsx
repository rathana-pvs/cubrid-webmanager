import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeDatabasePropertyModal } from '../databaseSlice';
import { hostApi } from '../../host/hostApi';
import { brokerApi } from '../../broker/brokerApi';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Select } from '../../../components/ds/forms/Select';
import { Typography } from '../../../components/ds/foundation/Typography';

// View states
const VIEW_FORM    = 'form';
const VIEW_LOADING = 'loading';
const VIEW_SUCCESS = 'success';
const VIEW_ERROR   = 'error';

const ADVANCED_PARAMS_SCHEMA = [
  { key: 'access_ip_control', type: 'bool(yes|no)', default: 'no', scope: 'SERVER' },
  { key: 'access_ip_control_file', type: 'string', default: '', scope: 'SERVER' },
  { key: 'async_commit', type: 'bool(yes|no)', default: 'no', scope: 'SERVER' },
  { key: 'backup_volume_max_size_bytes', type: 'int', default: '-1', scope: 'SERVER' },
  { key: 'block_ddl_statement', type: 'bool(yes|no)', default: 'no', scope: 'CLIENT' },
  { key: 'block_nowhere_statement', type: 'bool(yes|no)', default: 'no', scope: 'CLIENT' },
  { key: 'call_stack_dump_activation_list', type: 'string', default: '', scope: 'BOTH' },
  { key: 'call_stack_dump_deactivation_list', type: 'string', default: '', scope: 'BOTH' },
  { key: 'call_stack_dump_on_error', type: 'bool(yes|no)', default: 'no', scope: 'BOTH' },
  { key: 'compactdb_page_reclaim_only', type: 'int', default: '0', scope: 'SERVER' },
  { key: 'compat_numeric_division_scale', type: 'bool(yes|no)', default: 'no', scope: 'BOTH' },
  { key: 'compat_primary_key', type: 'bool(yes|no)', default: 'no', scope: 'CLIENT' },
  { key: 'csql_history_num', type: 'int', default: '50', scope: 'CLIENT' },
  { key: 'db_hosts', type: 'string', default: '', scope: 'CLIENT' },
  { key: 'dont_reuse_heap_file', type: 'bool(yes|no)', default: 'no', scope: 'SERVER' },
  { key: 'error_log', type: 'string', default: 'cubrid.err', scope: 'BOTH' },
  { key: 'file_lock', type: 'bool(yes|no)', default: 'yes', scope: 'SERVER' },
  { key: 'garbage_collection', type: 'bool(yes|no)', default: 'no', scope: 'CLIENT' },
  { key: 'group_commit_interval_in_msecs', type: 'int', default: '0', scope: 'SERVER' },
  { key: 'ha_mode', type: 'string(on|off|yes|no|replica)', default: 'off', scope: 'SERVER' },
  { key: 'ha_node_list', type: 'string', default: '', scope: 'SERVER' },
  { key: 'ha_port_id', type: 'int', default: '', scope: 'SERVER' },
  { key: 'hostvar_late_binding', type: 'bool(yes|no)', default: 'no', scope: 'CLIENT' },
  { key: 'index_scan_in_oid_order', type: 'bool(yes|no)', default: 'no', scope: 'CLIENT' },
  { key: 'index_scan_oid_buffer_pages', type: 'int', default: '4', scope: 'SERVER' },
  { key: 'index_scan_oid_buffer_size', type: 'int', default: '65536', scope: 'SERVER' },
  { key: 'insert_execution_mode', type: 'int', default: '1', scope: 'CLIENT' },
  { key: 'intl_mbs_support', type: 'bool(yes|no)', default: 'no', scope: 'CLIENT' },
  { key: 'lock_timeout_message_type', type: 'int', default: '0', scope: 'SERVER' },
  { key: 'max_plan_cache_entries', type: 'int', default: '1000', scope: 'BOTH' },
  { key: 'max_query_cache_entries', type: 'int', default: '-1', scope: 'SERVER' },
  { key: 'media_failure_support', type: 'bool(yes|no)', default: 'yes', scope: 'SERVER' },
  { key: 'oracle_style_empty_string', type: 'bool(yes|no)', default: 'no', scope: 'CLIENT' },
  { key: 'oracle_style_outerjoin', type: 'bool(yes|no)', default: 'no', scope: 'CLIENT' },
  { key: 'pthread_scope_process', type: 'bool(yes|no)', default: 'yes', scope: 'SERVER' },
  { key: 'query_cache_mode', type: 'int', default: '0', scope: 'SERVER' },
  { key: 'query_cache_size_in_pages', type: 'int', default: '-1', scope: 'SERVER' },
  { key: 'single_byte_compare', type: 'bool(yes|no)', default: 'no', scope: 'SERVER' },
  { key: 'temp_file_max_size_in_pages', type: 'int', default: '-1', scope: 'SERVER' },
  { key: 'temp_file_memory_size_in_pages', type: 'int', default: '4', scope: 'SERVER' },
  { key: 'temp_volume_path', type: 'string', default: '', scope: 'SERVER' },
  { key: 'uj_job_timeout', type: 'int', default: '0', scope: 'SERVER' },
  { key: 'unfill_factor', type: 'float', default: '0.1', scope: 'SERVER' },
  { key: 'volume_extension_path', type: 'string', default: '', scope: 'SERVER' }
];

const GENERAL_PARAMS_SCHEMA = {
  data_buffer_pages: '25000',
  data_buffer_size: '512MB',
  sort_buffer_pages: '16',
  sort_buffer_size: '2MB',
  log_buffer_pages: '50',
  log_buffer_size: '4MB',
  lock_escalation: '100000',
  lock_timeout_in_secs: '-1',
  deadlock_detection_interval_in_secs: '1',
  checkpoint_interval_in_mins: '1000',
  isolation_level: 'TRAN_REP_CLASS_UNCOMMIT_INSTANCE',
  cubrid_port_id: '1523',
  max_clients: '100',
  auto_restart_server: 'no',
  replication: 'no'
};

const GENERAL_PARAMS_KEYS = Object.keys(GENERAL_PARAMS_SCHEMA);

/* ─── BufferCard ─── */
function BufferCard({ type, label, pagesKey, sizeKey, params, bufferSettings, units, setParams, setBufferSettings, setUnits }) {
  const isPages = bufferSettings[type] === 'pages';
  const isSize = bufferSettings[type] === 'size';
  const hasPages = params[pagesKey] !== undefined;
  const hasSize = params[sizeKey] !== undefined;

  const BUFFER_ICONS = { data: 'memory', sort: 'sort', log: 'history' };

  return (
    <div className="space-y-2">
      {/* Section Header */}
      <div className="flex items-center gap-2 pb-1">
        <div className="w-5 h-5 rounded-md bg-bk-yellow/10 flex items-center justify-center">
          <Icon name={BUFFER_ICONS[type]} size="12px" weight={400} className="text-bk-yellow" />
        </div>
        <span className="text-[9.5px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{label}</span>
        <div className="flex-1 h-px bg-slate-100 dark:bg-white/5" />
      </div>

      {/* Two Option Cards side by side */}
      <div className="grid grid-cols-2 gap-2">
        {/* Pages Count card */}
        <button
          type="button"
          onClick={() => setBufferSettings(s => ({ ...s, [type]: 'pages' }))}
          className={`relative text-left p-3 rounded-xl border transition-all duration-150 group ${
            isPages
              ? 'bg-bk-yellow/[0.02] border-bk-yellow/40'
              : 'bg-slate-50/60 dark:bg-white/2 border-slate-100 dark:border-white/6 hover:border-slate-200 dark:hover:border-white/10'
          }`}
        >
          {isPages && <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-bk-yellow to-transparent opacity-40" />}
          <div className="flex items-center justify-between mb-2">
            <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${isPages ? 'text-bk-yellow' : 'text-slate-400 dark:text-slate-500'}`}>
              <Icon name="tag" size="10px" weight={700} />
              Pages Count
            </div>
            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all ${isPages ? 'border-bk-yellow' : 'border-slate-300 dark:border-slate-700'}`}>
              {isPages && <div className="w-1.5 h-1.5 rounded-full bg-bk-yellow" />}
            </div>
          </div>
          <p className="text-[9px] font-mono text-slate-400 dark:text-slate-600 mb-2.5 truncate">{pagesKey}</p>
          <Input
            type="number"
            size="sm"
            value={hasPages ? params[pagesKey] : (GENERAL_PARAMS_SCHEMA[pagesKey] || '')}
            onChange={e => setParams({ ...params, [pagesKey]: e.target.value })}
            disabled={!isPages}
            placeholder="Default"
            className={isPages ? '' : 'opacity-40'}
            onClick={e => e.stopPropagation()}
          />
        </button>

        {/* Physical Size card */}
        <button
          type="button"
          onClick={() => setBufferSettings(s => ({ ...s, [type]: 'size' }))}
          className={`relative text-left p-3 rounded-xl border transition-all duration-150 group ${
            isSize
              ? 'bg-bk-yellow/[0.02] border-bk-yellow/40'
              : 'bg-slate-50/60 dark:bg-white/2 border-slate-100 dark:border-white/6 hover:border-slate-200 dark:hover:border-white/10'
          }`}
        >
          {isSize && <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-bk-yellow to-transparent opacity-40" />}
          <div className="flex items-center justify-between mb-2">
            <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${isSize ? 'text-bk-yellow' : 'text-slate-400 dark:text-slate-500'}`}>
              <Icon name="straighten" size="10px" weight={700} />
              Physical Size
            </div>
            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all ${isSize ? 'border-bk-yellow' : 'border-slate-300 dark:border-slate-700'}`}>
              {isSize && <div className="w-1.5 h-1.5 rounded-full bg-bk-yellow" />}
            </div>
          </div>
          <p className="text-[9px] font-mono text-slate-400 dark:text-slate-600 mb-2.5 truncate">{sizeKey}</p>
          <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
            <Input
              type="number"
              size="sm"
              value={hasSize ? params[sizeKey] : (GENERAL_PARAMS_SCHEMA[sizeKey]?.replace(/[A-Z]/g, '') || '')}
              onChange={e => setParams({ ...params, [sizeKey]: e.target.value })}
              disabled={!isSize}
              placeholder="Default"
              className="flex-1 min-w-0"
            />
            <div className="w-[86px] shrink-0" onClick={e => e.stopPropagation()}>
              <Select
                size="sm"
                disabled={!isSize}
                value={units[type]}
                options={['KB', 'MB', 'GB', 'TB'].map(u => ({ value: u, label: u }))}
                onChange={e => setUnits(u => ({ ...u, [type]: e.target.value }))}
                className="w-full"
              />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

/* ─── ParamRow ─── */
function ParamRow({ label, value, defaultValue, onChange, children }) {
  const isModified = value !== undefined && value !== null;

  return (
    <div className="flex items-center gap-4 h-9 group hover:bg-slate-50/50 dark:hover:bg-white/2 rounded-lg px-2 -mx-2 transition-colors">
      <div className="w-[320px] shrink-0 flex items-center gap-1.5">
        {isModified && <div className="w-1.5 h-1.5 rounded-full bg-bk-yellow shrink-0" />}
        <span className={`text-[10.5px] font-mono truncate transition-colors ${isModified ? 'text-bk-yellow font-bold' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'}`}>
          {label}
        </span>
      </div>
      <div className="w-[280px] shrink-0 ml-auto flex items-center">
        {children || (
          <Input
            type={label.includes('level') || label.includes('restart') || label.includes('replication') ? 'text' : 'number'}
            size="sm"
            value={isModified ? value : (defaultValue || '')}
            onChange={onChange}
            placeholder={defaultValue || '—'}
            className="w-full"
            error={isModified && !value && !defaultValue}
          />
        )}
      </div>
    </div>
  );
}

/* ─── AdvancedRow ─── */
function AdvancedRow({ param, value, isModified, onValueChange }) {
  const scopeColors = {
    SERVER: 'text-sky-400 bg-sky-500/8 border-sky-500/15',
    CLIENT: 'text-violet-400 bg-violet-500/8 border-violet-500/15',
    BOTH: 'text-emerald-400 bg-emerald-500/8 border-emerald-500/15',
  };

  const hasBoolOptions = param.type.includes('yes|no') || param.type.includes('on|off');
  const boolOptions = param.type.includes('on|off') && param.type.includes('yes|no')
    ? (param.type.includes('replica') ? ['on', 'off', 'yes', 'no', 'replica'] : ['on', 'off', 'yes', 'no'])
    : param.type.includes('on|off') ? ['on', 'off'] : ['yes', 'no'];

  return (
    <div className={`flex items-center gap-3 h-10 px-4 border-b border-slate-100 dark:border-white/4 last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-white/2 transition-colors group ${isModified ? 'bg-bk-yellow/3' : ''}`}>
      <div className="w-[320px] shrink-0 flex items-center gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isModified && <div className="w-1.5 h-1.5 rounded-full bg-bk-yellow shrink-0 animate-pulse" />}
          <span className={`text-[10px] font-mono truncate ${isModified ? 'text-bk-yellow font-bold' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'}`}>
            {param.key}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${scopeColors[param.scope]}`}>
            {param.scope}
          </span>
          <span className="text-[8.5px] text-slate-400 dark:text-slate-500 font-mono opacity-60">
            {param.type.split('(')[0]}
          </span>
        </div>
      </div>
      <div className="w-[280px] shrink-0 ml-auto">
        {hasBoolOptions ? (
          <Select
            value={value}
            size="sm"
            options={boolOptions.map(o => ({ value: o, label: o.toUpperCase() }))}
            onChange={e => onValueChange(param.key, e.target.value)}
            className="w-full"
          />
        ) : (
          <Input
            type={['int', 'short', 'numeric', 'float', 'double'].some(t => param.type.toLowerCase().startsWith(t)) ? 'number' : 'text'}
            size="sm"
            value={value}
            onChange={e => onValueChange(param.key, e.target.value)}
            className="w-full"
          />
        )}
      </div>
    </div>
  );
}

export default function DatabasePropertyModal() {
  const dispatch = useDispatch();
  const { isDatabasePropertyModalOpen } = useSelector((state) => state.databaseUI);
  const { selectedDatabase } = useSelector((state) => state.database);
  const { selectedHostUid, authorizedHosts } = useSelector((state) => state.host);
  const isAuthorized = selectedHostUid && authorizedHosts.includes(selectedHostUid);

  const [view, setView] = useState(VIEW_FORM);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('General');
  const [activeSidebar, setActiveSidebar] = useState('Server Parameter');
  const [fetching, setFetching] = useState(false);
  const [params, setParams] = useState({});
  const [rawLines, setRawLines] = useState([]);
  const [units, setUnits] = useState({ data: 'KB', sort: 'KB', log: 'KB' });
  const [bufferSettings, setBufferSettings] = useState({ data: 'size', sort: 'size', log: 'size' });
  const [brokers, setBrokers] = useState([]);
  const [connectionInfo, setConnectionInfo] = useState({ brokerIp: 'localhost', brokerPort: '', charset: 'UTF-8' });

  useEffect(() => {
    if (isDatabasePropertyModalOpen) {
      setView(VIEW_FORM);
      setErrorMsg('');
      setActiveSidebar(selectedDatabase ? 'Connection Information' : 'Server Parameter');
    }
  }, [isDatabasePropertyModalOpen, selectedDatabase]);

  useEffect(() => {
    if (isDatabasePropertyModalOpen && selectedHostUid && isAuthorized) {
      const fetchBrokers = async () => {
        try {
          const response = await brokerApi.getBrokerList(selectedHostUid);
          const brokerList = response.result || (Array.isArray(response) ? response[0]?.broker : []);
          if (brokerList && Array.isArray(brokerList)) {
            const list = brokerList.map(b => ({ label: `${b.name} [${b.port}/${b.status || b.state}]`, port: b.port }));
            setBrokers(list);
            setConnectionInfo(prev => (!prev.brokerPort && list.length > 0) ? { ...prev, brokerPort: list[0].label } : prev);
          }
        } catch (err) { console.error('Failed to fetch brokers:', err); }
      };
      fetchBrokers();
    }
  }, [isDatabasePropertyModalOpen, selectedHostUid, isAuthorized]);

  useEffect(() => {
    if (isDatabasePropertyModalOpen && selectedHostUid && isAuthorized && activeSidebar !== 'Connection Information') {
      const fetchParams = async () => {
        setFetching(true);
        try {
          const response = await hostApi.getHostConfig(selectedHostUid, 'cubridconf');
          const lines = response?.conflist?.[0]?.confdata || [];
          setRawLines(lines);
          let currentSection = '';
          const newParams = {};
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) { currentSection = trimmed.slice(1, -1).toLowerCase(); continue; }
            const target = selectedDatabase ? `@${selectedDatabase.toLowerCase()}` : 'common';
            if (currentSection === 'common' || (selectedDatabase && currentSection === target)) {
              const [key, ...valueParts] = trimmed.split('=');
              const k = key?.trim();
              let v = valueParts.join('=').trim();
              if (k) {
                if (k.endsWith('_buffer_size')) {
                  const unit = v.slice(-1).toUpperCase();
                  if (['K', 'M', 'G', 'T'].includes(unit)) {
                    const unitMap = { 'K': 'KB', 'M': 'MB', 'G': 'GB', 'T': 'TB' };
                    setUnits(prev => ({ ...prev, [k.split('_')[0]]: unitMap[unit] || 'MB' }));
                    v = v.slice(0, -1);
                  }
                  setBufferSettings(prev => ({ ...prev, [k.split('_')[0]]: 'size' }));
                } else if (k.endsWith('_buffer_pages')) {
                  setBufferSettings(prev => ({ ...prev, [k.split('_')[0]]: 'pages' }));
                }
                newParams[k] = v;
              }
            }
          }
          setParams(newParams);
        } catch (err) { console.error('Failed to fetch config:', err); }
        finally { setFetching(false); }
      };
      fetchParams();
    }
  }, [isDatabasePropertyModalOpen, selectedDatabase, selectedHostUid, activeSidebar, isAuthorized]);

  const handleApply = async () => {
    if (activeSidebar === 'Connection Information') { dispatch(closeDatabasePropertyModal()); return; }
    setView(VIEW_LOADING);
    setErrorMsg('');
    try {
      const saveParams = { ...params };
      ['data', 'sort', 'log'].forEach(prefix => {
        const setting = bufferSettings[prefix];
        const pagesKey = `${prefix}_buffer_pages`;
        const sizeKey = `${prefix}_buffer_size`;
        if (setting === 'size') {
          const val = params[sizeKey];
          const unit = units[prefix].charAt(0);
          if (val) saveParams[sizeKey] = `${val}${unit}`;
          delete saveParams[pagesKey];
        } else { delete saveParams[sizeKey]; }
      });
      const sectionName = selectedDatabase ? `[@${selectedDatabase.toLowerCase()}]` : '[common]';
      let lines = [...rawLines];
      let sectionStartIndex = -1, sectionEndIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().toLowerCase() === sectionName.toLowerCase()) {
          sectionStartIndex = i;
          for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].trim().startsWith('[') && lines[j].trim().endsWith(']')) { sectionEndIndex = j; break; }
          }
          if (sectionEndIndex === -1) sectionEndIndex = lines.length;
          break;
        }
      }
      if (sectionStartIndex === -1) { lines.push(''); lines.push(sectionName); sectionStartIndex = lines.length - 1; sectionEndIndex = lines.length; }
      const sectionLines = lines.slice(sectionStartIndex + 1, sectionEndIndex);
      const otherBefore = lines.slice(0, sectionStartIndex + 1);
      const otherAfter = lines.slice(sectionEndIndex);
      const updatedSection = [...sectionLines];
      Object.entries(saveParams).forEach(([key, value]) => {
        let found = false;
        for (let i = 0; i < updatedSection.length; i++) {
          const trimmed = updatedSection[i].trim();
          if (trimmed.startsWith('#')) continue;
          if (trimmed.split('=')[0].trim().toLowerCase() === key.toLowerCase()) { updatedSection[i] = `${key}=${value}`; found = true; break; }
        }
        if (!found) updatedSection.push(`${key}=${value}`);
      });
      await hostApi.setHostConfig(selectedHostUid, { confname: 'cubridconf', confdata: [...otherBefore, ...updatedSection, ...otherAfter] });
      setView(VIEW_SUCCESS);
    } catch (err) {
      setErrorMsg(typeof err === 'string' ? err : (err.message || 'System controller rejected the configuration patch.'));
      setView(VIEW_ERROR);
    }
  };

  useEffect(() => {
    if (!isDatabasePropertyModalOpen) {
      setTimeout(() => setView(VIEW_FORM), 300);
    }
  }, [isDatabasePropertyModalOpen]);

  const handleClose = () => {
    dispatch(closeDatabasePropertyModal());
    setParams({});
  };

  const advancedData = useMemo(() => ADVANCED_PARAMS_SCHEMA
    .filter(p => !GENERAL_PARAMS_KEYS.includes(p.key))
    .map(p => ({ ...p, currentValue: params[p.key] !== undefined ? params[p.key] : p.default, isModified: params[p.key] !== undefined }))
  , [params]);

  const navItems = selectedDatabase
    ? [{ id: 'Connection Information', icon: 'cable', label: 'Connection' }, { id: 'Server Parameter', icon: 'tune', label: 'Server' }]
    : [{ id: 'Server Parameter', icon: 'tune', label: 'Server' }];

  /* ─── LOADING VIEW ─── */
  if (view === VIEW_LOADING) return (
    <Modal isOpen title="Syncing Configuration" icon="settings" onClose={handleClose} maxWidth="900px">
      <div className="flex flex-col items-center justify-center py-28 space-y-8 animate-in fade-in duration-200">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-2 border-bk-yellow/10" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-bk-yellow animate-spin" style={{ animationDuration: '0.8s' }} />
          <div className="absolute inset-[6px] rounded-full border border-bk-yellow/20 border-b-bk-yellow/60 animate-spin" style={{ animationDuration: '1.4s', animationDirection: 'reverse' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-bk-yellow shadow-[0_0_8px_3px_rgba(212,163,0,0.4)]" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-[13px] font-black text-slate-900 dark:text-white tracking-tight">Updating Registry</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium max-w-[300px] italic">Patching cubrid.conf on host runtime…</p>
        </div>
      </div>
    </Modal>
  );

  /* ─── SUCCESS VIEW ─── */
  if (view === VIEW_SUCCESS) return (
    <Modal isOpen={isDatabasePropertyModalOpen} title="Update Successful" icon="check_circle" iconVariant="success" onClose={handleClose} maxWidth="900px">
      <div className="flex flex-col items-center justify-center py-20 gap-6 text-center animate-in fade-in duration-200">
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.3)]">
          <Icon name="check" size="md" weight={400} className="text-white" />
        </div>
        <div className="space-y-1.5">
          <p className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">Configuration Re-Indexed</p>
          <p className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium">Changes to the <span className="font-bold text-slate-900 dark:text-slate-200">{selectedDatabase}</span> configuration have been committed and synchronized.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleClose} className="px-10">Confirm & Return</Button>
        </div>
      </div>
    </Modal>
  );

  /* ─── ERROR VIEW ─── */
  if (view === VIEW_ERROR) return (
    <Modal isOpen={isDatabasePropertyModalOpen} title="Update Rejected" icon="error" iconVariant="danger" onClose={handleClose} maxWidth="900px">
      <div className="flex flex-col items-center justify-center py-20 gap-6 text-center animate-in fade-in duration-200">
        <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(244,63,94,0.3)]">
          <Icon name="block" size="md" weight={400} className="text-white" />
        </div>
        <div className="space-y-1.5">
          <p className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">Synchronization Halted</p>
          <p className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium">The target host rejected the configuration amendment signal.</p>
        </div>
        <div className="w-full max-w-[560px] bg-rose-500/5 border border-rose-500/10 rounded-xl px-5 py-3.5">
          <p className="text-[10.5px] text-rose-400 font-mono break-all text-center">{errorMsg}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={handleClose}>Discard Changes</Button>
          <Button variant="primary" icon="refresh" onClick={() => { setView(VIEW_FORM); setErrorMsg(''); }}>Retry Patch</Button>
        </div>
      </div>
    </Modal>
  );

  const handleReset = () => {
    setParams({});
  };

  /* ─── FORM VIEW ─── */
  return (
    <Modal
      isOpen={isDatabasePropertyModalOpen}
      onClose={handleClose}
      title={activeSidebar === 'Connection Information'
        ? `${selectedDatabase} · Connection`
        : (selectedDatabase ? `${selectedDatabase} · Registry` : 'Kernel Parameters')}
      subtitle={activeSidebar === 'Connection Information'
        ? 'Broker and charset configuration for this database'
        : 'Deep system configuration for the CUBRID instance'}
      icon={activeSidebar === 'Connection Information' ? 'cable' : 'tune'}
      maxWidth="900px"
      footer={
        <div className="flex justify-between items-center w-full">
          <div>
            {Object.keys(params).length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                icon="restart_alt" 
                onClick={handleReset}
                className="text-amber-500 hover:bg-amber-500/5"
              >
                Reset to Original
              </Button>
            )}
          </div>
          <div className="flex gap-2.5">
            <Button variant="ghost" onClick={handleClose}>Discard</Button>
            <Button variant="primary" onClick={handleApply} icon="save" className="min-w-[140px]">Apply Changes</Button>
          </div>
        </div>
      }
    >
      <div className="flex h-[600px] -m-5 overflow-hidden">

        {/* ─── Sidebar ─── */}
        <div className="w-[180px] bg-slate-900/60 dark:bg-black/40 border-r border-white/6 flex flex-col shrink-0">
          <div className="px-4 py-4 border-b border-white/5">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Navigation</p>
          </div>
          <div className="py-2 flex-1">
            {navItems.map(({ id, icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveSidebar(id)}
                className={`relative w-full flex items-center gap-3 px-4 py-3.5 text-left group ${
                  activeSidebar === id
                    ? 'bg-bk-yellow/10 text-bk-yellow'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/4'
                }`}
              >
                {activeSidebar === id && (
                  <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-bk-yellow rounded-r-full shadow-[2px_0_8px_rgba(212,163,0,0.4)]" />
                )}
                <Icon
                  name={icon}
                  size="15px"
                  weight={activeSidebar === id ? 500 : 300}
                  className={activeSidebar === id ? 'text-bk-yellow' : 'text-slate-600 group-hover:text-slate-400'}
                />
                <span className="text-[10.5px] font-black uppercase tracking-widest">{label}</span>
              </button>
            ))}
          </div>
          {/* Bottom context info */}
          {selectedDatabase && (
            <div className="px-4 py-3 border-t border-white/5">
              <p className="text-[8.5px] uppercase tracking-widest text-slate-600 font-bold mb-1">Context</p>
              <p className="text-[10px] font-mono font-black text-bk-yellow/80 truncate">{selectedDatabase}</p>
            </div>
          )}
        </div>

        {/* ─── Main Content ─── */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-transparent overflow-hidden">

          {/* Tab bar — only for Server Parameter */}
          {activeSidebar === 'Server Parameter' && (
            <div className="flex items-center px-1 border-b border-slate-100 dark:border-white/6 bg-slate-50/30 dark:bg-white/1 shrink-0">
              {['General', 'Advanced'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative flex items-center gap-2 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest ${
                    activeTab === tab ? 'text-bk-yellow' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon
                    name={tab === 'General' ? 'tune' : 'settings_applications'}
                    size="12px"
                    weight={activeTab === tab ? 600 : 300}
                  />
                  {tab} Registry
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-bk-yellow rounded-t-full shadow-[0_0_8px_rgba(212,163,0,0.6)]" />
                  )}
                </button>
              ))}
              <div className="flex-1" />
              {/* Modified indicator */}
              {Object.keys(params).length > 0 && (
                <div className="flex items-center gap-1.5 px-4 text-[9px] text-bk-yellow/70 font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-bk-yellow animate-pulse" />
                  {Object.keys(params).length} modified
                </div>
              )}
            </div>
          )}

          {/* Content area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
            {fetching ? (
              <div className="h-full flex flex-col items-center justify-center gap-5">
                <div className="w-10 h-10 border-2 border-bk-yellow/10 border-t-bk-yellow rounded-full animate-spin" />
                <div className="text-center">
                  <p className="text-[9.5px] uppercase tracking-[0.2em] text-slate-400 font-black mb-1">Loading</p>
                  <p className="text-[10.5px] text-slate-400 dark:text-slate-500 italic font-medium">Querying host runtime registry…</p>
                </div>
              </div>

            ) : activeSidebar === 'Connection Information' ? (
              /* ─── CONNECTION INFO ─── */
              <div className="p-6 space-y-5">
                {/* Header Banner */}
                <div className="flex items-center gap-4 p-4 bg-bk-yellow/5 border border-bk-yellow/15 rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-bk-yellow/10 border border-bk-yellow/20 flex items-center justify-center shrink-0">
                    <Icon name="cable" size="md" weight={300} className="text-bk-yellow" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-900 dark:text-white tracking-tight">Broker Connection</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Configure how Web Manager connects to <span className="text-bk-yellow font-bold">{selectedDatabase}</span></p>
                  </div>
                </div>

                <div className="space-y-3 p-5 bg-slate-50 dark:bg-white/2 border border-slate-100 dark:border-white/6 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-[140px] shrink-0">
                      <p className="text-[9px] uppercase tracking-widest text-slate-400 font-black mb-0.5">Broker IP</p>
                      <p className="text-[8.5px] font-mono text-slate-400 dark:text-slate-600">Public address</p>
                    </div>
                    <div className="flex-1">
                      <Input
                        value={connectionInfo.brokerIp}
                        onChange={e => setConnectionInfo({ ...connectionInfo, brokerIp: e.target.value })}
                        size="sm"
                        icon="dns"
                      />
                    </div>
                  </div>
                  <div className="h-px bg-slate-100 dark:bg-white/5" />
                  <div className="flex items-center gap-4">
                    <div className="w-[140px] shrink-0">
                      <p className="text-[9px] uppercase tracking-widest text-slate-400 font-black mb-0.5">Service Port</p>
                      <p className="text-[8.5px] font-mono text-slate-400 dark:text-slate-600">Active broker</p>
                    </div>
                    <div className="flex-1">
                      <Select
                        value={connectionInfo.brokerPort}
                        options={brokers.map(b => ({ value: b.label, label: b.label }))}
                        onChange={e => setConnectionInfo({ ...connectionInfo, brokerPort: e.target.value })}
                        size="sm"
                      />
                    </div>
                  </div>
                  <div className="h-px bg-slate-100 dark:bg-white/5" />
                  <div className="flex items-center gap-4">
                    <div className="w-[140px] shrink-0">
                      <p className="text-[9px] uppercase tracking-widest text-slate-400 font-black mb-0.5">Text Encoding</p>
                      <p className="text-[8.5px] font-mono text-slate-400 dark:text-slate-600">Charset</p>
                    </div>
                    <div className="flex-1">
                      <Select
                        value={connectionInfo.charset}
                        options={['UTF-8', 'EUC-KR', 'ISO-8859-1', 'UHC'].map(o => ({ value: o, label: o }))}
                        onChange={e => setConnectionInfo({ ...connectionInfo, charset: e.target.value })}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-sky-500/5 border border-sky-500/10 rounded-xl">
                  <Icon name="info" size="sm" weight={300} className="text-sky-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic">
                    Broker parameters define how the Web Manager communicates with the CUBRID Broker. Changes only impact Manager-to-Host synchronization logic.
                  </p>
                </div>
              </div>

            ) : activeTab === 'General' ? (
              /* ─── GENERAL REGISTRY ─── */
              <div className="p-6 space-y-8 pb-10">

                {/* Buffer Allocation Cards */}
                {[
                  { type: 'data', label: 'Data Buffer Allocation', pagesKey: 'data_buffer_pages', sizeKey: 'data_buffer_size' },
                  { type: 'sort', label: 'Sort Buffer Allocation', pagesKey: 'sort_buffer_pages', sizeKey: 'sort_buffer_size' },
                  { type: 'log',  label: 'Log Buffer Allocation',  pagesKey: 'log_buffer_pages',  sizeKey: 'log_buffer_size'  },
                ].map(cfg => (
                  <BufferCard
                    key={cfg.type}
                    {...cfg}
                    params={params}
                    bufferSettings={bufferSettings}
                    units={units}
                    setParams={setParams}
                    setBufferSettings={setBufferSettings}
                    setUnits={setUnits}
                  />
                ))}

                {/* Standard Parameters */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 pb-1">
                    <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-white/6 flex items-center justify-center">
                      <Icon name="settings" size="12px" weight={400} className="text-slate-400" />
                    </div>
                    <span className="text-[9.5px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Standard Parameters</span>
                    <div className="flex-1 h-px bg-slate-100 dark:bg-white/5" />
                  </div>

                  <div className="rounded-xl border border-slate-100 dark:border-white/6 overflow-hidden">
                    {/* Lock params */}
                    <div className="px-4 py-1 bg-slate-50/60 dark:bg-white/2 border-b border-slate-100 dark:border-white/5">
                      <p className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">Locking</p>
                    </div>
                    <div className="px-4 py-1.5 divide-y divide-slate-50 dark:divide-white/4">
                      <ParamRow label="lock_escalation" value={params.lock_escalation} defaultValue={GENERAL_PARAMS_SCHEMA.lock_escalation} onChange={e => setParams({ ...params, lock_escalation: e.target.value })} />
                      <ParamRow label="lock_timeout_in_secs" value={params.lock_timeout_in_secs} defaultValue={GENERAL_PARAMS_SCHEMA.lock_timeout_in_secs} onChange={e => setParams({ ...params, lock_timeout_in_secs: e.target.value })} />
                      <ParamRow label="deadlock_detection_interval_in_secs" value={params.deadlock_detection_interval_in_secs} defaultValue={GENERAL_PARAMS_SCHEMA.deadlock_detection_interval_in_secs} onChange={e => setParams({ ...params, deadlock_detection_interval_in_secs: e.target.value })} />
                    </div>

                    {/* Checkpoint + isolation */}
                    <div className="px-4 py-1 bg-slate-50/60 dark:bg-white/2 border-y border-slate-100 dark:border-white/5">
                      <p className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">Transaction</p>
                    </div>
                    <div className="px-4 py-1.5 divide-y divide-slate-50 dark:divide-white/4">
                      <ParamRow label="checkpoint_interval_in_mins" value={params.checkpoint_interval_in_mins} defaultValue={GENERAL_PARAMS_SCHEMA.checkpoint_interval_in_mins} onChange={e => setParams({ ...params, checkpoint_interval_in_mins: e.target.value })} />
                      <ParamRow label="isolation_level" value={params.isolation_level} defaultValue={GENERAL_PARAMS_SCHEMA.isolation_level}>
                        <Select
                          value={params.isolation_level || GENERAL_PARAMS_SCHEMA.isolation_level}
                          options={['TRAN_SERIALIZABLE', 'TRAN_REP_CLASS_REP_INSTANCE', 'TRAN_REP_CLASS_COMMIT_INSTANCE', 'TRAN_REP_CLASS_UNCOMMIT_INSTANCE', 'TRAN_COMMIT_CLASS_COMMIT_INSTANCE', 'TRAN_COMMIT_CLASS_UNCOMMIT_INSTANCE'].map(o => ({ value: o, label: o }))}
                          onChange={e => setParams({ ...params, isolation_level: e.target.value })}
                          size="sm"
                          className={params.isolation_level !== undefined ? 'font-black!' : ''}
                        />
                      </ParamRow>
                    </div>

                    {/* System */}
                    <div className="px-4 py-1 bg-slate-50/60 dark:bg-white/2 border-y border-slate-100 dark:border-white/5">
                      <p className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">System</p>
                    </div>
                    <div className="px-4 py-1.5 divide-y divide-slate-50 dark:divide-white/4">
                      <ParamRow label="max_clients" value={params.max_clients} defaultValue={GENERAL_PARAMS_SCHEMA.max_clients} onChange={e => setParams({ ...params, max_clients: e.target.value })} />
                      <ParamRow label="cubrid_port_id" value={params.cubrid_port_id} defaultValue={GENERAL_PARAMS_SCHEMA.cubrid_port_id} onChange={e => setParams({ ...params, cubrid_port_id: e.target.value })} />
                      <ParamRow label="auto_restart_server" value={params.auto_restart_server} defaultValue={GENERAL_PARAMS_SCHEMA.auto_restart_server}>
                        <Select value={params.auto_restart_server || GENERAL_PARAMS_SCHEMA.auto_restart_server} options={['yes','no'].map(o => ({ value: o, label: o.toUpperCase() }))} onChange={e => setParams({ ...params, auto_restart_server: e.target.value })} size="sm" className={params.auto_restart_server !== undefined ? 'font-black!' : ''} />
                      </ParamRow>
                      <ParamRow label="replication" value={params.replication} defaultValue={GENERAL_PARAMS_SCHEMA.replication}>
                        <Select value={params.replication || GENERAL_PARAMS_SCHEMA.replication} options={['yes','no'].map(o => ({ value: o, label: o.toUpperCase() }))} onChange={e => setParams({ ...params, replication: e.target.value })} size="sm" className={params.replication !== undefined ? 'font-black!' : ''} />
                      </ParamRow>
                    </div>
                  </div>
                </div>
              </div>

            ) : (
              /* ─── ADVANCED REGISTRY ─── */
              <div>
                <div className="px-6 py-3 border-b border-slate-100 dark:border-white/6 flex items-center gap-3">
                  <Icon name="warning_amber" size="sm" weight={300} className="text-amber-400" />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium italic">Advanced parameters — changes may affect server stability</p>
                </div>
                <div className="border-b border-slate-100 dark:border-white/6">
                  {advancedData.map(p => (
                    <AdvancedRow
                      key={p.key}
                      param={p}
                      value={p.currentValue}
                      isModified={p.isModified}
                      onValueChange={(key, val) => setParams({ ...params, [key]: val })}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
