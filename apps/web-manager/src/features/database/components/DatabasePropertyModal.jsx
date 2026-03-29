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
import { Radio } from '../../../components/ds/forms/Radio';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Table } from '../../../components/ds/layout/Table';

// View states
const VIEW_FORM    = 'form';
const VIEW_LOADING = 'loading';
const VIEW_SUCCESS = 'success';
const VIEW_ERROR   = 'error';

// Metadata for CUBRID Advanced Parameters
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

const PropertyField = ({ label, value, defaultValue, onChange, disabled, icon }) => {
  const isModified = value !== undefined && value !== null;
  const displayValue = isModified ? value : defaultValue;
  
  return (
    <div className="flex items-center gap-6 py-1 group/field transition-all">
      <div className="w-[180px] shrink-0 flex items-center gap-2">
         {icon && <Icon name={icon} size="12px" weight={400} className="text-slate-400 group-hover/field:text-bk-yellow transition-colors" />}
        <Typography variant="label" className="text-slate-500 dark:text-slate-400 font-black tracking-tight uppercase text-[10px] truncate">{label.replace(/_/g, ' ')}</Typography>
      </div>
      <div className="flex-1">
        <Input 
          value={displayValue || ''}
          onChange={onChange}
          disabled={disabled}
          size="sm"
          className={isModified ? 'text-bk-yellow font-black!' : 'italic text-slate-400 font-medium opacity-80'}
        />
      </div>
    </div>
  );
};

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
  const [units, setUnits] = useState({ data: 'MB', sort: 'MB', log: 'MB' });
  const [bufferSettings, setBufferSettings] = useState({
    data: 'size', sort: 'size', log: 'size'
  });

  const [brokers, setBrokers] = useState([]);
  const [connectionInfo, setConnectionInfo] = useState({
    brokerIp: 'localhost',
    brokerPort: '',
    charset: 'UTF-8'
  });

  useEffect(() => {
    if (isDatabasePropertyModalOpen) {
      setView(VIEW_FORM);
      setErrorMsg('');
      if (selectedDatabase) {
        setActiveSidebar('Connection Information');
      } else {
        setActiveSidebar('Server Parameter');
      }
    }
  }, [isDatabasePropertyModalOpen, selectedDatabase]);

  useEffect(() => {
    if (isDatabasePropertyModalOpen && selectedHostUid && isAuthorized) {
      const fetchBrokers = async () => {
        try {
          const response = await brokerApi.getBrokerList(selectedHostUid);
          const brokerList = response.result || (Array.isArray(response) ? response[0]?.broker : []);
          if (brokerList && Array.isArray(brokerList)) {
            const list = brokerList.map(b => ({
              label: `${b.name} [${b.port}/${b.status || b.state}]`,
              port: b.port
            }));
            setBrokers(list);
            setConnectionInfo(prev => {
              if (!prev.brokerPort && list.length > 0) {
                return { ...prev, brokerPort: list[0].label };
              }
              return prev;
            });
          }
        } catch (err) {
          console.error('Failed to fetch brokers:', err);
        }
      };
      fetchBrokers();
    }
  }, [isDatabasePropertyModalOpen, selectedHostUid, isAuthorized]);

  useEffect(() => {
    if (isDatabasePropertyModalOpen && selectedHostUid && isAuthorized) {
      if (activeSidebar === 'Connection Information') return;
      
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
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
              currentSection = trimmed.slice(1, -1).toLowerCase();
              continue;
            }
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
                    const prefix = k.split('_')[0];
                    setUnits(prev => ({ ...prev, [prefix]: unitMap[unit] || 'MB' }));
                    v = v.slice(0, -1);
                  }
                  const prefix = k.split('_')[0];
                  setBufferSettings(prev => ({ ...prev, [prefix]: 'size' }));
                } else if (k.endsWith('_buffer_pages')) {
                  const prefix = k.split('_')[0];
                  setBufferSettings(prev => ({ ...prev, [prefix]: 'pages' }));
                }
                newParams[k] = v;
              }
            }
          }
          setParams(newParams);
        } catch (err) {
          console.error('Failed to fetch config:', err);
        } finally {
          setFetching(false);
        }
      };
      fetchParams();
    }
  }, [isDatabasePropertyModalOpen, selectedDatabase, selectedHostUid, activeSidebar, isAuthorized]);

  const handleApply = async () => {
    if (activeSidebar === 'Connection Information') {
      dispatch(closeDatabasePropertyModal());
      return;
    }
    
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
        } else {
          delete saveParams[sizeKey];
        }
      });

      const sectionName = selectedDatabase ? `[@${selectedDatabase.toLowerCase()}]` : '[common]';
      let lines = [...rawLines];
      
      let sectionStartIndex = -1;
      let sectionEndIndex = -1;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().toLowerCase() === sectionName.toLowerCase()) {
          sectionStartIndex = i;
          for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].trim().startsWith('[') && lines[j].trim().endsWith(']')) {
              sectionEndIndex = j;
              break;
            }
          }
          if (sectionEndIndex === -1) sectionEndIndex = lines.length;
          break;
        }
      }

      if (sectionStartIndex === -1) {
        lines.push("");
        lines.push(sectionName);
        sectionStartIndex = lines.length - 1;
        sectionEndIndex = lines.length;
      }

      const sectionLines = lines.slice(sectionStartIndex + 1, sectionEndIndex);
      const otherBefore = lines.slice(0, sectionStartIndex + 1);
      const otherAfter = lines.slice(sectionEndIndex);

      const updatedSection = [...sectionLines];
      Object.entries(saveParams).forEach(([key, value]) => {
        let found = false;
        for (let i = 0; i < updatedSection.length; i++) {
          const trimmed = updatedSection[i].trim();
          if (trimmed.startsWith('#')) continue;
          if (trimmed.split('=')[0].trim().toLowerCase() === key.toLowerCase()) {
            updatedSection[i] = `${key}=${value}`;
            found = true;
            break;
          }
        }
        if (!found) {
          updatedSection.push(`${key}=${value}`);
        }
      });

      const finalConfData = [...otherBefore, ...updatedSection, ...otherAfter];
      const payload = {
        confname: 'cubridconf',
        confdata: finalConfData
      };

      await hostApi.setHostConfig(selectedHostUid, payload);
      setView(VIEW_SUCCESS);
    } catch (err) {
      setErrorMsg(typeof err === 'string' ? err : (err.message || 'System controller rejected the configuration patch.'));
      setView(VIEW_ERROR);
    }
  };

  const handleClose = () => dispatch(closeDatabasePropertyModal());

  const advancedData = useMemo(() => ADVANCED_PARAMS_SCHEMA
    .filter(p => !GENERAL_PARAMS_KEYS.includes(p.key))
    .map(p => ({
      ...p,
      currentValue: params[p.key] !== undefined ? params[p.key] : p.default,
      isModified: params[p.key] !== undefined
    })), [params]);

  const advancedColumns = [
    { header: 'Property Identifier', accessor: 'key', width: '220px', render: (val, row) => (
      <Typography variant="label" className={`text-[11px] font-black uppercase tracking-tight ${row.isModified ? 'text-bk-yellow' : 'text-slate-600 dark:text-slate-200'}`}>
        {val}
      </Typography>
    )},
    { header: 'Scope', accessor: 'scope', width: '70px', className: 'text-center', render: (val) => (
      <Typography variant="span" className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/4 text-[8px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-white/5">{val}</Typography>
    )},
    { header: 'Metric', accessor: 'type', width: '80px', className: 'text-center opacity-70', render: (val) => (
      <Typography variant="span" className="text-[9px] text-slate-400 font-black tracking-tighter uppercase italic">{val.split('(')[0]}</Typography>
    )},
    { header: 'Registry Value', accessor: 'currentValue', width: '180px', render: (val, row) => (
      <div className="flex items-center w-full">
        {row.type.includes('yes|no') || row.type.includes('on|off') ? (
          <Select 
            value={val} 
            size="sm"
            options={(row.type.includes('on|off') && row.type.includes('yes|no') 
              ? (row.type.includes('replica') ? ['on', 'off', 'yes', 'no', 'replica'] : ['on', 'off', 'yes', 'no']) 
              : row.type.includes('on|off') ? ['on', 'off'] : ['yes', 'no']).map(o => ({ value: o, label: o.toUpperCase() }))} 
            onChange={(val) => setParams({ ...params, [row.key]: val })} 
            className="w-full font-black!"
          />
        ) : (
          <Input 
            value={val} 
            onChange={(e) => setParams({ ...params, [row.key]: e.target.value })} 
            size="sm"
            className={row.isModified ? 'text-bk-yellow font-black! bg-bk-yellow/5 border-bk-yellow/20' : 'italic text-slate-400 font-medium'}
          />
        )}
      </div>
    )}
  ];

  /* ─── LOADING view ─── */
  if (view === VIEW_LOADING) {
    return (
      <Modal isOpen title="Syncing Configuration" icon="settings" onClose={handleClose} maxWidth="900px">
        <div className="flex flex-col items-center justify-center py-24 space-y-7 animate-in fade-in duration-200">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-white/5" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-bk-yellow animate-spin" style={{ animationDuration: '1s' }} />
            <div className="absolute inset-0 flex items-center justify-center text-bk-yellow">
              <Icon name="sync" size="lg" weight={300} className="animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <Typography variant="h4" className="text-[16px] font-black text-slate-900 dark:text-white tracking-tight">Updating Registry</Typography>
            <Typography variant="p" className="text-[12px] text-slate-500 font-medium max-w-[340px] italic">Patching cubrid.conf on host runtime. This may trigger a server restart signal if applicable.</Typography>
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  if (view === VIEW_SUCCESS) {
    return (
      <Modal isOpen title="Update Successful" icon="verified" iconVariant="success" onClose={handleClose} maxWidth="900px">
        <div className="flex flex-col items-center justify-center py-24 gap-8 text-center animate-in fade-in duration-200">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_32px_rgba(16,185,129,0.3)]">
            <Icon name="done_all" size="lg" weight={700} className="text-white text-3xl" />
          </div>
          <div className="space-y-2 px-8">
            <Typography variant="h4" className="text-[18px] font-black text-slate-900 dark:text-white tracking-tight">Configuration Re-Indexed</Typography>
            <Typography variant="p" className="text-[12.5px] text-slate-500 font-medium max-w-[420px] mx-auto">
              Changes to the {selectedDatabase || 'server'} configuration have been successfully committed to the primary registry and synchronized.
            </Typography>
          </div>
          <Button variant="secondary" onClick={handleClose} className="px-10">Confirm & Return</Button>
        </div>
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (view === VIEW_ERROR) {
    return (
      <Modal isOpen title="Update Rejected" icon="error" iconVariant="danger" onClose={handleClose} maxWidth="900px">
        <div className="flex flex-col items-center justify-center py-20 gap-7 text-center animate-in fade-in duration-200">
          <div className="relative w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(244,63,94,0.3)]">
            <Icon name="block" size="md" weight={400} className="text-white" />
          </div>
          <div className="space-y-2 px-6">
            <Typography variant="h4" className="text-[18px] font-black text-slate-900 dark:text-white tracking-tight">Synchronization Halted</Typography>
            <Typography variant="p" className="text-[12.5px] text-slate-500 font-medium max-w-[400px]">The target host rejected the configuration amendment signal.</Typography>
          </div>
          <div className="w-full max-w-[580px] bg-rose-500/5 border border-rose-500/10 rounded-2xl px-6 py-4 text-left">
            <Typography variant="caption" className="text-rose-400 font-mono leading-relaxed break-all block text-center uppercase tracking-widest text-[11px] font-black">
              {errorMsg}
            </Typography>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={handleClose}>Discard Changes</Button>
            <Button variant="primary" icon="refresh" onClick={() => { setView(VIEW_FORM); setErrorMsg(''); }}>Retry Patch</Button>
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── FORM view ─── */
  return (
    <Modal
      isOpen={isDatabasePropertyModalOpen}
      onClose={handleClose}
      title={activeSidebar === 'Connection Information' ? 'COMMUNICATION BRIDGE' : (selectedDatabase ? `${selectedDatabase} REGISTRY` : 'KERNEL PARAMETERS')}
      subtitle={selectedDatabase ? `Management of logic and communication for ${selectedDatabase}` : 'Deep system configuration for parent CUBRID instance'}
      icon="tune"
      maxWidth="900px"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="ghost" onClick={handleClose}>Discard</Button>
          <Button variant="primary" onClick={handleApply} icon="save" className="min-w-[150px]">Apply Changes</Button>
        </div>
      }
    >
      <div className="flex h-[580px] -m-5 overflow-hidden">
        {/* Sidebar */}
        <div className="w-[200px] bg-slate-50/50 dark:bg-black/20 border-r border-slate-100 dark:border-white/5 flex flex-col py-3 gap-0.5 shrink-0 overflow-y-auto custom-scrollbar">
          {(selectedDatabase ? ['Connection Information', 'Server Parameter'] : ['Server Parameter']).map(id => (
            <button 
              key={id} 
              onClick={() => setActiveSidebar(id)} 
              className={`flex items-center gap-3 px-5 py-3.5 text-[10px] font-black transition-all relative group uppercase tracking-widest ${activeSidebar === id ? 'text-bk-yellow bg-bk-yellow/10' : 'text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/4'}`}
            >
              <Icon name={id === 'Connection Information' ? 'settings_ethernet' : 'hub'} size="14px" weight={400} className={activeSidebar === id ? 'text-bk-yellow' : 'opacity-40 group-hover:opacity-100'} />
              <Typography variant="span" className="truncate text-left shrink-0">{id.split(' ')[0]}</Typography>
              {activeSidebar === id && <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-bk-yellow rounded-r-full" />}
            </button>
          ))}
        </div>

        {/* Content Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-transparent overflow-hidden">
          {activeSidebar === 'Server Parameter' && (
            <div className="flex px-2 border-b border-slate-100 dark:border-white/4 bg-slate-50/20 dark:bg-white/1 shrink-0">
              {['General', 'Advanced'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)} 
                  className={`px-6 py-4 text-[10px] uppercase font-black tracking-widest transition-all relative ${activeTab === tab ? 'text-bk-yellow' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  {tab} Registry
                  {activeTab === tab && <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-bk-yellow rounded-t-full shadow-[0_0_8px_rgba(255,215,0,0.5)]"></div>}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 custom-scrollbar">
            {fetching ? (
              <div className="h-full flex flex-col items-center justify-center gap-6 animate-in fade-in duration-300">
                <div className="w-12 h-12 border-4 border-bk-yellow/5 border-t-bk-yellow rounded-full animate-spin"></div>
                <div className="text-center">
                  <Typography variant="label" className="uppercase tracking-[0.2em] text-slate-400 font-black text-[10px] block mb-1">Retrieving State</Typography>
                  <Typography variant="caption" className="text-slate-400 italic font-medium">Querying host runtime registry...</Typography>
                </div>
              </div>
            ) : activeSidebar === 'Connection Information' ? (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-400 pb-10">
                <div className="space-y-6">
                   <div className="flex items-center gap-3 mb-2">
                     <Icon name="link" size="14px" weight={400} className="text-bk-yellow" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Communication Link</span>
                  </div>
                  <div className="space-y-4 p-5 bg-slate-50/50 dark:bg-white/2 border border-slate-100 dark:border-white/4 rounded-2xl shadow-xs">
                    <PropertyField 
                      label="Public IP Hash" 
                      value={connectionInfo.brokerIp} 
                      onChange={(e) => setConnectionInfo({ ...connectionInfo, brokerIp: e.target.value })} 
                      icon="dns"
                    />
                    <div className="flex items-center gap-6 py-1 group/field">
                      <div className="w-[180px] shrink-0 flex items-center gap-2">
                        <Icon name="lan" size="12px" weight={400} className="text-slate-400 group-hover/field:text-bk-yellow transition-colors" />
                        <Typography variant="label" className="text-slate-500 dark:text-slate-400 font-black tracking-tight uppercase text-[10px]">Service Port</Typography>
                      </div>
                      <div className="flex-1">
                        <Select 
                          value={connectionInfo.brokerPort} 
                          options={brokers.map(b => ({ value: b.label, label: b.label }))} 
                          onChange={(val) => setConnectionInfo({ ...connectionInfo, brokerPort: val })} 
                          size="sm"
                          className="font-black!"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-6 py-1 group/field">
                      <div className="w-[180px] shrink-0 flex items-center gap-2">
                        <Icon name="font_download" size="12px" weight={400} className="text-slate-400 group-hover/field:text-bk-yellow transition-colors" />
                        <Typography variant="label" className="text-slate-500 dark:text-slate-400 font-black tracking-tight uppercase text-[10px]">Text Encoding</Typography>
                      </div>
                      <div className="flex-1">
                        <Select 
                          value={connectionInfo.charset} 
                          options={['UTF-8', 'EUC-KR', 'ISO-8859-1', 'UHC'].map(o => ({ value: o, label: o }))} 
                          onChange={(val) => setConnectionInfo({ ...connectionInfo, charset: val })} 
                          size="sm"
                          className="font-black!"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-bk-yellow/5 border border-bk-yellow/10 rounded-2xl flex gap-5 transition-all hover:bg-bk-yellow/10 group shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-bk-yellow/10 flex items-center justify-center text-bk-yellow border border-bk-yellow/20 shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <Icon name="verified_user" size="md" weight={300} />
                  </div>
                  <div className="space-y-1.5">
                    <Typography variant="label" className="text-bk-yellow font-black uppercase tracking-widest text-[10px]">Bridge Compliance</Typography>
                    <Typography variant="p" className="text-[12px] text-slate-500 dark:text-slate-400 italic font-medium leading-relaxed">
                      Bridge parameters define how the Web Manager authenticates with the CUBRID Broker. Changes only impact <span className="text-slate-900 dark:text-white font-bold">Manager-to-Host</span> synchronization logic.
                    </Typography>
                  </div>
                </div>
              </div>
            ) : activeTab === 'General' ? (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-400 pb-10">
                {['data', 'sort', 'log'].map(prefix => {
                  const pagesKey = `${prefix}_buffer_pages`;
                  const sizeKey = `${prefix}_buffer_size`;
                  const hasPages = params[pagesKey] !== undefined;
                  const hasSize = params[sizeKey] !== undefined;
                  
                  return (
                    <div key={prefix} className="space-y-5">
                       <div className="flex items-center gap-3">
                         <Icon name="memory" size="14px" weight={400} className="text-bk-yellow" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{prefix} Buffer Allocation</span>
                      </div>

                      <div className="space-y-4 px-1">
                        <div className={`flex items-center gap-6 p-4 rounded-2xl border transition-all shadow-xs group cursor-pointer ${bufferSettings[prefix] === 'pages' ? 'bg-bk-yellow/5 border-bk-yellow/30' : 'bg-slate-50/40 dark:bg-white/2 border-slate-100 dark:border-white/4 hover:border-slate-200'}`} onClick={() => setBufferSettings(s => ({ ...s, [prefix]: 'pages' }))}>
                          <Radio checked={bufferSettings[prefix] === 'pages'} readOnly size="sm" />
                          <div className="w-[140px] shrink-0">
                            <Typography variant="label" className={`font-black uppercase tracking-tight text-[10px] transition-colors ${bufferSettings[prefix] === 'pages' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>Pages Count</Typography>
                            <Typography variant="caption" className="text-[9px] text-slate-400 font-bold block leading-none">{pagesKey}</Typography>
                          </div>
                          <div className="flex-1">
                            <Input 
                              value={hasPages ? params[pagesKey] : GENERAL_PARAMS_SCHEMA[pagesKey] || ''} 
                              onChange={(e) => setParams({ ...params, [pagesKey]: e.target.value })} 
                              disabled={bufferSettings[prefix] !== 'pages'} 
                              size="sm"
                              className={hasPages ? 'text-bk-yellow font-black! bg-bk-yellow/5 border-bk-yellow/20' : 'italic text-slate-500/60 font-medium'}
                              placeholder="Default 25000"
                            />
                          </div>
                        </div>

                        <div className={`flex items-center gap-6 p-4 rounded-2xl border transition-all shadow-xs group cursor-pointer ${bufferSettings[prefix] === 'size' ? 'bg-bk-yellow/5 border-bk-yellow/30' : 'bg-slate-50/40 dark:bg-white/2 border-slate-100 dark:border-white/4 hover:border-slate-200'}`} onClick={() => setBufferSettings(s => ({ ...s, [prefix]: 'size' }))}>
                          <Radio checked={bufferSettings[prefix] === 'size'} readOnly size="sm" />
                          <div className="w-[140px] shrink-0">
                            <Typography variant="label" className={`font-black uppercase tracking-tight text-[10px] transition-colors ${bufferSettings[prefix] === 'size' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>Physical Size</Typography>
                            <Typography variant="caption" className="text-[9px] text-slate-400 font-bold block leading-none">{sizeKey}</Typography>
                          </div>
                          <div className="flex-1 flex gap-2">
                            <Input 
                              className={`flex-1 ${hasSize ? 'text-bk-yellow font-black! bg-bk-yellow/5 border-bk-yellow/20' : 'italic text-slate-500/60 font-medium'}`}
                              value={hasSize ? params[sizeKey] : (GENERAL_PARAMS_SCHEMA[sizeKey] ? GENERAL_PARAMS_SCHEMA[sizeKey].replace(/[A-Z]/g, '') : '')} 
                              onChange={(e) => setParams({ ...params, [sizeKey]: e.target.value })} 
                              disabled={bufferSettings[prefix] !== 'size'} 
                              size="sm"
                              placeholder="Default 512"
                            />
                            <Select 
                              value={units[prefix]} 
                              options={['KB', 'MB', 'GB', 'TB'].map(o => ({ value: o, label: o }))} 
                              onChange={(val) => setUnits(u => ({ ...u, [prefix]: val }))} 
                              disabled={bufferSettings[prefix] !== 'size'}
                              className="w-[84px] font-black!"
                              size="sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                     <Icon name="database" size="14px" weight={400} className="text-bk-yellow" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Standard System Parameters</span>
                  </div>
                  <div className="space-y-3 p-6 bg-slate-50/50 dark:bg-white/2 border border-slate-100 dark:border-white/4 rounded-2xl shadow-xs">
                    <PropertyField label="lock_escalation" value={params.lock_escalation} defaultValue={GENERAL_PARAMS_SCHEMA.lock_escalation} onChange={(e) => setParams({ ...params, lock_escalation: e.target.value })} icon="lock_open" />
                    <PropertyField label="lock_timeout_in_secs" value={params.lock_timeout_in_secs} defaultValue={GENERAL_PARAMS_SCHEMA.lock_timeout_in_secs} onChange={(e) => setParams({ ...params, lock_timeout_in_secs: e.target.value })} icon="timer" />
                    <PropertyField label="deadlock_interval" value={params.deadlock_detection_interval_in_secs} defaultValue={GENERAL_PARAMS_SCHEMA.deadlock_detection_interval_in_secs} onChange={(e) => setParams({ ...params, deadlock_detection_interval_in_secs: e.target.value })} icon="bolt" />
                    <PropertyField label="checkpoint_interval" value={params.checkpoint_interval_in_mins} defaultValue={GENERAL_PARAMS_SCHEMA.checkpoint_interval_in_mins} onChange={(e) => setParams({ ...params, checkpoint_interval_in_mins: e.target.value })} icon="save" />
                    
                    <div className="flex items-center gap-6 py-1 group/field">
                      <div className="w-[180px] shrink-0 flex items-center gap-2">
                        <Icon name="rule" size="12px" weight={400} className="text-slate-400 group-hover/field:text-bk-yellow transition-colors" />
                        <Typography variant="label" className="text-slate-500 dark:text-slate-400 font-black tracking-tight uppercase text-[10px]">isolation_level</Typography>
                      </div>
                      <div className="flex-1">
                        <Select 
                          value={params.isolation_level || GENERAL_PARAMS_SCHEMA.isolation_level} 
                          options={['TRAN_SERIALIZABLE','TRAN_REP_CLASS_REP_INSTANCE','TRAN_REP_CLASS_COMMIT_INSTANCE','TRAN_REP_CLASS_UNCOMMIT_INSTANCE','TRAN_COMMIT_CLASS_COMMIT_INSTANCE','TRAN_COMMIT_CLASS_UNCOMMIT_INSTANCE'].map(o => ({ value: o, label: o }))} 
                          onChange={(val) => setParams({ ...params, isolation_level: val })}
                          size="sm"
                          className={params.isolation_level !== undefined ? 'text-bk-yellow font-black!' : 'font-medium opacity-80'}
                        />
                      </div>
                    </div>

                    <PropertyField label="max_clients" value={params.max_clients} defaultValue={GENERAL_PARAMS_SCHEMA.max_clients} onChange={(e) => setParams({ ...params, max_clients: e.target.value })} icon="groups" />
                    
                    <div className="flex items-center gap-6 py-1 group/field">
                      <div className="w-[180px] shrink-0 flex items-center gap-2">
                        <Icon name="restart_alt" size="12px" weight={400} className="text-slate-400 group-hover/field:text-bk-yellow transition-colors" />
                        <Typography variant="label" className="text-slate-500 dark:text-slate-400 font-black tracking-tight uppercase text-[10px]">auto_restart</Typography>
                      </div>
                      <div className="flex-1">
                        <Select 
                          value={params.auto_restart_server || GENERAL_PARAMS_SCHEMA.auto_restart_server} 
                          options={['yes', 'no'].map(o => ({ value: o, label: o.toUpperCase() }))} 
                          onChange={(val) => setParams({ ...params, auto_restart_server: val })}
                          size="sm"
                          className={params.auto_restart_server !== undefined ? 'text-bk-yellow font-black!' : 'font-medium opacity-80'}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-6 py-1 group/field">
                      <div className="w-[180px] shrink-0 flex items-center gap-2">
                        <Icon name="share" size="12px" weight={400} className="text-slate-400 group-hover/field:text-bk-yellow transition-colors" />
                        <Typography variant="label" className="text-slate-500 dark:text-slate-400 font-black tracking-tight uppercase text-[10px]">replication</Typography>
                      </div>
                      <div className="flex-1">
                        <Select 
                          value={params.replication || GENERAL_PARAMS_SCHEMA.replication} 
                          options={['yes', 'no'].map(o => ({ value: o, label: o.toUpperCase() }))} 
                          onChange={(val) => setParams({ ...params, replication: val })}
                          size="sm"
                          className={params.replication !== undefined ? 'text-bk-yellow font-black!' : 'font-medium opacity-80'}
                        />
                      </div>
                    </div>
                    
                    <PropertyField label="cubrid_port_id" value={params.cubrid_port_id} defaultValue={GENERAL_PARAMS_SCHEMA.cubrid_port_id} onChange={(e) => setParams({ ...params, cubrid_port_id: e.target.value })} icon="tag" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-400 pb-10 px-1">
                <div className="border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden shadow-xs bg-slate-50/20 dark:bg-black/10">
                  <Table 
                    columns={advancedColumns}
                    data={advancedData}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
