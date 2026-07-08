import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeDatabasePropertyModal } from '../databaseSlice';
import { hostApi } from '../../host/hostApi';
import { brokerApi } from '../../broker/brokerApi';
import { useCM } from '../../../constants/useCM';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { TabGroup } from '../../../components/ds/layout/TabGroup';
import { Input } from '../../../components/ds/forms/Input';
import { Select } from '../../../components/ds/forms/Select';
import { Typography } from '../../../components/ds/foundation/Typography';
import { SectionHeader } from '../../../components/ds/foundation/SectionHeader';
import { StatusBadge } from '../../../components/ds/foundation/StatusBadge';
import { InfoBanner } from '../../../components/ds/foundation/InfoBanner';
import { useActionState } from '../../../infrastructure/hooks/useActionState';
import { 
  ModalStatusLoading, 
  ModalStatusSuccess, 
  ModalStatusError 
} from '../../../components/ds/feedback/ActionStatus';

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
  const CM = useCM();
  const isPages = bufferSettings[type] === 'pages';
  const isSize = bufferSettings[type] === 'size';
  const hasPages = params[pagesKey] !== undefined;
  const hasSize = params[sizeKey] !== undefined;

  const BUFFER_ICONS = { data: 'memory', sort: 'sort', log: 'history' };

  return (
    <div className="space-y-2">
      {/* Section Header */}
      <SectionHeader title={label} icon={BUFFER_ICONS[type]} />

      {/* Two Option Cards side by side */}
      <div className="grid grid-cols-2 gap-2">
        {/* Pages Count card */}
        <button
          type="button"
          onClick={() => setBufferSettings(s => ({ ...s, [type]: 'pages' }))}
          className={`relative text-left p-3 rounded-xl border transition-all duration-150 group ${
            isPages
              ? 'bg-amber-500/[0.02] border-amber-500/40'
              : 'bg-slate-50/60 dark:bg-white/2 border-slate-100 dark:border-white/6 hover:border-slate-200 dark:hover:border-white/10'
          }`}
        >
          {isPages && <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-40" />}
          <div className="flex items-center justify-between mb-2">
            <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${isPages ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'}`}>
              <Icon name="tag" size="10px" weight={700} />
              {CM.pagesCountTitle}
            </div>
            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all ${isPages ? 'border-amber-500' : 'border-slate-300 dark:border-slate-700'}`}>
              {isPages && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
            </div>
          </div>
          <p className="text-[9px] font-mono text-slate-400 dark:text-slate-600 mb-2.5 truncate">{pagesKey}</p>
          <Input
            type="number"
            size="sm"
            value={hasPages ? params[pagesKey] : (GENERAL_PARAMS_SCHEMA[pagesKey] || '')}
            onChange={e => setParams({ ...params, [pagesKey]: e.target.value })}
            disabled={!isPages}
            placeholder={CM.defaultValuePlaceholder}
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
              ? 'bg-amber-500/[0.02] border-amber-500/40'
              : 'bg-slate-50/60 dark:bg-white/2 border-slate-100 dark:border-white/6 hover:border-slate-200 dark:hover:border-white/10'
          }`}
        >
          {isSize && <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-40" />}
          <div className="flex items-center justify-between mb-2">
            <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${isSize ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'}`}>
              <Icon name="straighten" size="10px" weight={700} />
              {CM.physicalSizeLabel}
            </div>
            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all ${isSize ? 'border-amber-500' : 'border-slate-300 dark:border-slate-700'}`}>
              {isSize && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
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
              placeholder={CM.defaultValuePlaceholder}
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
        {isModified && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
        <span className={`text-[10.5px] font-mono truncate transition-colors ${isModified ? 'text-amber-500 font-bold' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'}`}>
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
    <div className={`flex items-center gap-3 h-10 px-4 border-b border-slate-100 dark:border-white/4 last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-white/2 transition-colors group ${isModified ? 'bg-amber-500/3' : ''}`}>
      <div className="w-[320px] shrink-0 flex items-center gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isModified && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />}
          <span className={`text-[10px] font-mono truncate ${isModified ? 'text-amber-500 font-bold' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'}`}>
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
  const CM = useCM();
  const dispatch = useDispatch();
  const { isDatabasePropertyModalOpen } = useSelector((state) => state.databaseUI, shallowEqual);
  const { selectedDatabase } = useSelector((state) => state.database, shallowEqual);
  const { selectedHostUid, authorizedHosts } = useSelector((state) => state.host, shallowEqual);
  const isAuthorized = selectedHostUid && authorizedHosts.includes(selectedHostUid);
  const { 
    error: actionError, 
    startAction, 
    endSuccess, 
    endError, 
    resetAction,
    isLoading,
    isSuccess,
    isError
  } = useActionState();

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
      resetAction();
      setParams({});
      setRawLines([]);
      setActiveSidebar(selectedDatabase ? 'Connection Information' : 'Server Parameter');
    }
  }, [isDatabasePropertyModalOpen, selectedDatabase, resetAction]);

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
    startAction();
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
      endSuccess(`Changes to the ${selectedDatabase || 'kernel'} configuration have been committed and synchronized.`);
    } catch (err) {
      endError(typeof err === 'string' ? err : (err.message || CM.configPatchRejectedMsg));
    }
  };

  useEffect(() => {
    if (!isDatabasePropertyModalOpen) {
      setTimeout(() => resetAction(), 300);
    }
  }, [isDatabasePropertyModalOpen, resetAction]);

  const handleClose = () => {
    dispatch(closeDatabasePropertyModal());
    setParams({});
  };

  const advancedData = useMemo(() => ADVANCED_PARAMS_SCHEMA
    .filter(p => !GENERAL_PARAMS_KEYS.includes(p.key))
    .map(p => ({ ...p, currentValue: params[p.key] !== undefined ? params[p.key] : p.default, isModified: params[p.key] !== undefined }))
  , [params]);

  const navItems = selectedDatabase
    ? [{ id: 'Connection Information', icon: 'cable', label: CM.connectionNavLabel }, { id: 'Server Parameter', icon: 'tune', label: CM.serverNavLabel }]
    : [{ id: 'Server Parameter', icon: 'tune', label: CM.serverNavLabel }];

  const SERVER_TABS = [
    { id: 'General', label: CM.generalParamsTab, icon: 'tune' },
    { id: 'Advanced', label: CM.advancedParamsTab, icon: 'settings_applications' },
  ];

  if (!isDatabasePropertyModalOpen) return null;

  /* ─── LOADING VIEW ─── */
  if (isLoading) return (
    <Modal isOpen title={CM.syncingConfiguration} icon="settings" onClose={handleClose} maxWidth="900px" showCloseButton={false}>
      <ModalStatusLoading 
        title={CM.updatingRegistry} 
        subtitle={CM.syncingRegistrySubtitle} 
      />
    </Modal>
  );

  /* ─── SUCCESS VIEW ─── */
  if (isSuccess) return (
    <Modal isOpen title={CM.updateSuccessful} icon="check_circle" iconVariant="success" onClose={handleClose} maxWidth="900px">
      <ModalStatusSuccess 
        title={CM.configurationReIndexed}
        message={`Changes to the ${selectedDatabase || 'kernel'} configuration have been committed and synchronized.`}
        onConfirm={handleClose}
        confirmText={CM.confirmReturn}
      />
    </Modal>
  );

  /* ─── ERROR VIEW ─── */
  if (isError) return (
    <Modal isOpen title={CM.updateRejected} icon="error" iconVariant="danger" onClose={resetAction} maxWidth="900px">
      <ModalStatusError 
        title={CM.synchronizationHalted}
        error={actionError}
        onRetry={handleApply}
        onCancel={resetAction}
        retryText={CM.retryPatch}
        cancelText={CM.discardChanges}
      />
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
        : (selectedDatabase ? CM.registrySubtitle(selectedDatabase) : CM.kernelParamsTitle)}
      subtitle={activeSidebar === 'Connection Information'
        ? CM.brokerCharsetConfigDesc
        : CM.deepSystemConfigDesc}
      icon={activeSidebar === 'Connection Information' ? 'cable' : 'tune'}
      maxWidth="900px"
      footer={
        <div className="flex justify-between items-center w-full">
          <div>
            {Object.keys(params).length > 0 && (
              <Button 
                variant="ghost" 
                icon="restart_alt" 
                onClick={handleReset}
                className="text-amber-500 hover:bg-amber-500/5"
              >
                {CM.resetToOriginalBtn}
              </Button>
            )}
          </div>
          <div className="flex gap-2.5">
            <Button variant="ghost" onClick={handleClose}>{CM.discard}</Button>
            <Button variant="primary" onClick={handleApply} icon="save" className="min-w-[140px]">{CM.applyChanges}</Button>
          </div>
        </div>
      }
    >
      <div className="flex h-[600px] -m-5 overflow-hidden">

        {/* ─── Sidebar ─── */}
        <div className="w-[180px] bg-slate-900/60 dark:bg-black/40 border-r border-white/6 flex flex-col shrink-0">
          <div className="px-4 py-4 border-b border-white/5">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{CM.navigation}</p>
          </div>
          <div className="py-2 flex-1">
            {navItems.map(({ id, icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveSidebar(id)}
                className={`relative w-full flex items-center gap-3 px-4 py-3.5 text-left group ${
                  activeSidebar === id
                    ? 'bg-amber-500/10 text-amber-500'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/4'
                }`}
              >
                {activeSidebar === id && (
                  <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-amber-500 rounded-r-full shadow-[2px_0_8px_rgba(212,163,0,0.4)]" />
                )}
                <Icon
                  name={icon}
                  size="15px"
                  weight={activeSidebar === id ? 500 : 300}
                  className={activeSidebar === id ? 'text-amber-500' : 'text-slate-600 group-hover:text-slate-400'}
                />
                <span className="text-[10.5px] font-black uppercase tracking-widest">{label}</span>
              </button>
            ))}
          </div>
          {/* Bottom context info */}
          {selectedDatabase && (
            <div className="px-4 py-3 border-t border-white/5">
              <p className="text-[8.5px] uppercase tracking-widest text-slate-600 font-bold mb-1">{CM.context}</p>
              <p className="text-[10px] font-mono font-black text-amber-500/80 truncate">{selectedDatabase}</p>
            </div>
          )}
        </div>

        {/* ─── Main Content ─── */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-transparent overflow-hidden">

          {/* Tab bar — only for Server Parameter */}
          {activeSidebar === 'Server Parameter' && (
            <div className="p-4 border-b border-slate-100 dark:border-white/6 flex items-center justify-between">
              <TabGroup 
                tabs={SERVER_TABS} 
                active={activeTab} 
                onChange={setActiveTab} 
                fullWidth={false}
              />
              {/* Modified indicator */}
              {Object.keys(params).length > 0 && (
                <StatusBadge label={`${Object.keys(params).length} modified`} variant="amber" pulse={true} className="rounded-full" />
              )}
            </div>
          )}

          {/* Content area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
            {fetching ? (
              <div className="h-full flex flex-col items-center justify-center gap-5">
                <div className="w-10 h-10 border-2 border-amber-500/10 border-t-amber-500 rounded-full animate-spin" />
                <div className="text-center">
                  <p className="text-[9.5px] uppercase tracking-[0.2em] text-slate-400 font-black mb-1">{CM.loadingLabel}</p>
                  <p className="text-[10.5px] text-slate-400 dark:text-slate-500 italic font-medium">{CM.queryingHostRegistry}</p>
                </div>
              </div>

            ) : activeSidebar === 'Connection Information' ? (
              /* ─── CONNECTION INFO ─── */
              <div className="p-6 space-y-5">
                {/* Header Banner */}
                <InfoBanner title={CM.brokerConnection}>
                  {CM.webManagerConnectionDesc(selectedDatabase)}
                </InfoBanner>

                <div className="space-y-3 p-5 bg-slate-50 dark:bg-white/2 border border-slate-100 dark:border-white/6 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-[140px] shrink-0">
                      <p className="text-[9px] uppercase tracking-widest text-slate-400 font-black mb-0.5">{CM.brokerIp}</p>
                      <p className="text-[8.5px] font-mono text-slate-400 dark:text-slate-600">{CM.publicAddress}</p>
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
                      <p className="text-[9px] uppercase tracking-widest text-slate-400 font-black mb-0.5">{CM.servicePort}</p>
                      <p className="text-[8.5px] font-mono text-slate-400 dark:text-slate-600">{CM.activeBroker}</p>
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
                      <p className="text-[9px] uppercase tracking-widest text-slate-400 font-black mb-0.5">{CM.textEncoding}</p>
                      <p className="text-[8.5px] font-mono text-slate-400 dark:text-slate-600">{CM.charset}</p>
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

                <InfoBanner title={CM.synchronizationNotice}>
                  {CM.brokerParamsNotice}
                </InfoBanner>
              </div>

            ) : activeTab === 'General' ? (
              /* ─── GENERAL REGISTRY ─── */
              <div className="p-6 space-y-8 pb-10">

                {/* Buffer Allocation Cards */}
                {[
                  { type: 'data', label: CM.dataBufferAllocLabel, pagesKey: 'data_buffer_pages', sizeKey: 'data_buffer_size' },
                  { type: 'sort', label: CM.sortBufferAllocLabel, pagesKey: 'sort_buffer_pages', sizeKey: 'sort_buffer_size' },
                  { type: 'log',  label: CM.logBufferAllocLabel,  pagesKey: 'log_buffer_pages',  sizeKey: 'log_buffer_size'  },
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
                  <SectionHeader title={CM.standardParameters} icon="settings" />

                  <div className="rounded-xl border border-slate-100 dark:border-white/6 overflow-hidden">
                    {/* Lock params */}
                    <div className="px-4 py-1 bg-slate-50/60 dark:bg-white/2 border-b border-slate-100 dark:border-white/5">
                      <p className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">{CM.lockingSection}</p>
                    </div>
                    <div className="px-4 py-1.5 divide-y divide-slate-50 dark:divide-white/4">
                      <ParamRow label="lock_escalation" value={params.lock_escalation} defaultValue={GENERAL_PARAMS_SCHEMA.lock_escalation} onChange={e => setParams({ ...params, lock_escalation: e.target.value })} />
                      <ParamRow label="lock_timeout_in_secs" value={params.lock_timeout_in_secs} defaultValue={GENERAL_PARAMS_SCHEMA.lock_timeout_in_secs} onChange={e => setParams({ ...params, lock_timeout_in_secs: e.target.value })} />
                      <ParamRow label="deadlock_detection_interval_in_secs" value={params.deadlock_detection_interval_in_secs} defaultValue={GENERAL_PARAMS_SCHEMA.deadlock_detection_interval_in_secs} onChange={e => setParams({ ...params, deadlock_detection_interval_in_secs: e.target.value })} />
                    </div>

                    {/* Checkpoint + isolation */}
                    <div className="px-4 py-1 bg-slate-50/60 dark:bg-white/2 border-y border-slate-100 dark:border-white/5">
                      <p className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">{CM.transactionSection}</p>
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
                      <p className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">{CM.systemSection}</p>
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
                <div className="px-6 py-6">
                  <InfoBanner title={CM.advancedHeuristics}>
                    {CM.advancedParamsWarning}
                  </InfoBanner>
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
