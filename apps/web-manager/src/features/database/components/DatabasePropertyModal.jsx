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
import { Divider } from '../../../components/ds/layout/Divider';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Table } from '../../../components/ds/layout/Table';

// Metadata for CUBRID Advanced Parameters based on d-cms ConfConstants.java
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

const PropertyField = ({ label, value, defaultValue, onChange, disabled }) => {
  const isModified = value !== undefined && value !== null;
  const displayValue = isModified ? value : defaultValue;
  
  return (
    <div className="flex items-center gap-4 py-1">
      <div className="w-[180px] shrink-0">
        <Typography variant="label" className="text-slate-500 dark:text-slate-400 font-medium">{label}</Typography>
      </div>
      <div className="flex-1">
        <Input 
          value={displayValue || ''}
          onChange={onChange}
          disabled={disabled}
          size="sm"
          className={isModified ? 'text-bk-yellow font-bold' : 'italic text-slate-400'}
        />
      </div>
    </div>
  );
};

export default function DatabasePropertyModal() {
  const dispatch = useDispatch();
  const { isDatabasePropertyModalOpen, selectedDatabase } = useSelector((state) => state.database);
  const { selectedHostUid, authorizedHosts } = useSelector((state) => state.host);
  const isAuthorized = selectedHostUid && authorizedHosts.includes(selectedHostUid);
  
  const [activeTab, setActiveTab] = useState('General');
  const [activeSidebar, setActiveSidebar] = useState('Server Parameter');
  const [loading, setLoading] = useState(false);
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

  // Load selection state on modal open
  useEffect(() => {
    if (isDatabasePropertyModalOpen) {
      if (selectedDatabase) {
        setActiveSidebar('Connection Information');
      } else {
        setActiveSidebar('Server Parameter');
      }
    }
  }, [isDatabasePropertyModalOpen, selectedDatabase]);

  // Fetch brokers only once when modal opens
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

  // Fetch parameters
  useEffect(() => {
    if (isDatabasePropertyModalOpen && selectedHostUid && isAuthorized) {
      if (activeSidebar === 'Connection Information') return;
      
      const fetchParams = async () => {
        setLoading(true);
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
            // Match 'common' always, and also match the specific database section if it exists
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
          setLoading(false);
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
    setLoading(true);
    try {
      // 1. Prepare the parameters to save
      const saveParams = { ...params };
      ['data', 'sort', 'log'].forEach(prefix => {
        const setting = bufferSettings[prefix];
        const pagesKey = `${prefix}_buffer_pages`;
        const sizeKey = `${prefix}_buffer_size`;
        
        if (setting === 'size') {
          const val = params[sizeKey];
          const unit = units[prefix].charAt(0); // K, M, G, T
          if (val) saveParams[sizeKey] = `${val}${unit}`;
          delete saveParams[pagesKey];
        } else {
          delete saveParams[sizeKey];
        }
      });

      // 2. Modify rawLines to apply changes
      const sectionName = selectedDatabase ? `[@${selectedDatabase.toLowerCase()}]` : '[common]';
      let lines = [...rawLines];
      
      // Find section start and end
      let sectionStartIndex = -1;
      let sectionEndIndex = -1;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().toLowerCase() === sectionName.toLowerCase()) {
          sectionStartIndex = i;
          // Find next section
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
        // Section not found, append to end
        lines.push("");
        lines.push(sectionName);
        sectionStartIndex = lines.length - 1;
        sectionEndIndex = lines.length;
      }

      const sectionLines = lines.slice(sectionStartIndex + 1, sectionEndIndex);
      const otherBefore = lines.slice(0, sectionStartIndex + 1);
      const otherAfter = lines.slice(sectionEndIndex);

      // Update existing or add new
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
      dispatch(closeDatabasePropertyModal());
    } catch (err) {
      console.error('Failed to save properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const advancedData = useMemo(() => ADVANCED_PARAMS_SCHEMA
    .filter(p => !GENERAL_PARAMS_KEYS.includes(p.key))
    .map(p => ({
      ...p,
      currentValue: params[p.key] !== undefined ? params[p.key] : p.default,
      isModified: params[p.key] !== undefined
    })), [params]);

  if (!isDatabasePropertyModalOpen) return null;

  const advancedColumns = [
    { header: 'Parameter', accessor: 'key', width: '220px', render: (val, row) => (
      <Typography variant="label" className={row.isModified ? 'text-bk-yellow font-bold' : 'text-slate-700 dark:text-slate-100'}>
        {val}
      </Typography>
    )},
    { header: 'Target', accessor: 'scope', width: '70px', className: 'text-center uppercase tracking-tighter', render: (val) => (
      <Typography variant="span" className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-[9px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10">{val}</Typography>
    )},
    { header: 'Type', accessor: 'type', width: '80px', className: 'text-center uppercase tracking-tighter opacity-70', render: (val) => (
      <Typography variant="span" className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{val.split('(')[0]}</Typography>
    )},
    { header: 'Value', accessor: 'currentValue', width: '180px', render: (val, row) => (
      <div className="flex items-center w-full">
        {row.type.includes('yes|no') || row.type.includes('on|off') ? (
          <Select 
            value={val} 
            size="sm"
            options={(row.type.includes('on|off') && row.type.includes('yes|no') 
              ? (row.type.includes('replica') ? ['on', 'off', 'yes', 'no', 'replica'] : ['on', 'off', 'yes', 'no']) 
              : row.type.includes('on|off') ? ['on', 'off'] : ['yes', 'no']).map(o => ({ value: o, label: o.toUpperCase() }))} 
            onChange={(e) => setParams({ ...params, [row.key]: e.target.value })} 
            className="w-full"
          />
        ) : (
          <Input 
            value={val} 
            onChange={(e) => setParams({ ...params, [row.key]: e.target.value })} 
            size="sm"
            className={row.isModified ? 'text-bk-yellow font-bold' : 'italic text-slate-400'}
          />
        )}
      </div>
    )}
  ];

  return (
    <Modal
      isOpen={isDatabasePropertyModalOpen}
      onClose={() => dispatch(closeDatabasePropertyModal())}
      title={(activeSidebar === 'Connection Information' ? `${selectedDatabase} CONNECTION` : (selectedDatabase ? `${selectedDatabase} PROPERTIES` : 'SERVER PROPERTIES'))}
      icon="tune"
      maxWidth="900px"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={() => dispatch(closeDatabasePropertyModal())}>
            Discard
          </Button>
          <Button 
            variant="primary" 
            onClick={handleApply} 
            loading={loading}
            icon="save"
          >
            Apply Changes
          </Button>
        </div>
      }
    >
      <div className="flex h-[540px] -m-5 overflow-hidden">
        {/* Sidebar */}
        <div className="w-[220px] bg-slate-50/50 dark:bg-black/20 border-r border-slate-100 dark:border-white/5 flex flex-col py-4 gap-0.5 shrink-0 overflow-y-auto custom-scrollbar">
          {(selectedDatabase ? ['Connection Information', 'Server Parameter'] : ['Server Parameter']).map(id => (
            <button 
              key={id} 
              onClick={() => setActiveSidebar(id)} 
              className={`flex items-center gap-3 px-6 py-3.5 text-[11px] font-bold transition-all relative group ${activeSidebar === id ? 'text-bk-yellow bg-bk-yellow/10' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-white/5 uppercase tracking-wider'}`}
            >
              <Icon name={id === 'Connection Information' ? 'settings_ethernet' : 'hub'} size="sm" weight={300} className={activeSidebar === id ? 'text-bk-yellow' : 'opacity-60'} />
              <Typography variant="span" className="truncate text-left">{id}</Typography>
              {activeSidebar === id && <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-bk-yellow rounded-r-full shadow-[0_0_10px_rgba(255,215,0,0.4)]"></div>}
            </button>
          ))}
        </div>

        {/* Content Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-transparent overflow-hidden">
          {activeSidebar === 'Server Parameter' && (
            <div className="flex px-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/2 shrink-0">
              {['General', 'Advanced'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)} 
                  className={`px-6 py-4 text-[11px] uppercase font-bold transition-all relative ${activeTab === tab ? 'text-bk-yellow' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  {tab}
                  {activeTab === tab && <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-bk-yellow rounded-t-full shadow-[0_0_8px_rgba(255,215,0,0.5)]"></div>}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-6 custom-scrollbar">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 opacity-70 animate-in fade-in duration-300">
                <div className="w-10 h-10 border-[3px] border-bk-yellow/10 border-t-bk-yellow rounded-full animate-spin"></div>
                <Typography variant="label" className="uppercase tracking-widest text-slate-500 font-bold">Synchronizing Data...</Typography>
              </div>
            ) : activeSidebar === 'Connection Information' ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-400">
                <div className="space-y-6">
                  <Divider label="Broker Connectivity" />
                  <div className="space-y-4">
                    <PropertyField 
                      label="Broker IP Address" 
                      value={connectionInfo.brokerIp} 
                      onChange={(e) => setConnectionInfo({ ...connectionInfo, brokerIp: e.target.value })} 
                    />
                    <div className="flex items-center gap-4 py-1">
                      <div className="w-[180px] shrink-0">
                        <Typography variant="label" className="text-slate-500 dark:text-slate-400 font-medium">Broker Service Port</Typography>
                      </div>
                      <div className="flex-1">
                        <Select 
                          value={connectionInfo.brokerPort} 
                          options={brokers.map(b => ({ value: b.label, label: b.label }))} 
                          onChange={(val) => setConnectionInfo({ ...connectionInfo, brokerPort: val })} 
                          size="sm"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 py-1">
                      <div className="w-[180px] shrink-0">
                        <Typography variant="label" className="text-slate-500 dark:text-slate-400 font-medium">Character Encoding</Typography>
                      </div>
                      <div className="flex-1">
                        <Select 
                          value={connectionInfo.charset} 
                          options={['UTF-8', 'EUC-KR', 'ISO-8859-1', 'UHC'].map(o => ({ value: o, label: o }))} 
                          onChange={(val) => setConnectionInfo({ ...connectionInfo, charset: val })} 
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-bk-yellow/5 border border-bk-yellow/10 rounded-2xl flex gap-4 transition-all hover:bg-bk-yellow/10">
                  <div className="w-10 h-10 rounded-xl bg-bk-yellow/10 flex items-center justify-center text-bk-yellow border border-bk-yellow/20 shrink-0">
                    <Icon name="info" size="md" weight={300} />
                  </div>
                  <div className="space-y-1">
                    <Typography variant="label" className="text-bk-yellow/80 font-bold uppercase tracking-tight text-[12px]">Configuration Note</Typography>
                    <Typography variant="p" className="text-[12px] text-slate-500 dark:text-slate-400 italic font-medium leading-relaxed">
                      These settings establish a communication channel via CUBRID Broker. Changes affect local manager connectivity only and do not modify server-side database configuration.
                    </Typography>
                  </div>
                </div>
              </div>
            ) : activeTab === 'General' ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-400">
                {['data', 'sort', 'log'].map(prefix => {
                  const pagesKey = `${prefix}_buffer_pages`;
                  const sizeKey = `${prefix}_buffer_size`;
                  const hasPages = params[pagesKey] !== undefined;
                  const hasSize = params[sizeKey] !== undefined;
                  
                  return (
                    <div key={prefix} className="space-y-4">
                      <Divider label={`${prefix.toUpperCase()} BUFFER CONFIGURATION`} />
                      <Typography variant="label" className="text-[10px] font-medium tracking-wide text-slate-400 dark:text-slate-500">
                        Database: <Typography variant="span" className="text-bk-yellow">{selectedDatabase}</Typography>
                      </Typography>
                      <div className="space-y-3 px-2">
                        <div className="flex items-center gap-6 group">
                          <Radio 
                            checked={bufferSettings[prefix] === 'pages'} 
                            onChange={() => setBufferSettings(s => ({ ...s, [prefix]: 'pages' }))} 
                          />
                          <Typography variant="label" className={`w-[160px] font-bold tracking-tight transition-colors ${bufferSettings[prefix] !== 'pages' ? 'text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>{pagesKey}</Typography>
                          <div className="flex-1">
                            <Input 
                              value={hasPages ? params[pagesKey] : GENERAL_PARAMS_SCHEMA[pagesKey] || ''} 
                              onChange={(e) => setParams({ ...params, [pagesKey]: e.target.value })} 
                              disabled={bufferSettings[prefix] !== 'pages'} 
                              size="sm"
                              className={hasPages ? 'text-bk-yellow/90 font-bold' : 'italic text-slate-500/80'}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-6 group">
                          <Radio 
                            checked={bufferSettings[prefix] === 'size'} 
                            onChange={() => setBufferSettings(s => ({ ...s, [prefix]: 'size' }))} 
                          />
                          <Typography variant="label" className={`w-[160px] font-bold tracking-tight transition-colors ${bufferSettings[prefix] !== 'size' ? 'text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>{sizeKey}</Typography>
                          <div className="flex-1 flex gap-2">
                            <Input 
                              className={`flex-1 ${hasSize ? 'text-bk-yellow/90 font-bold' : 'italic text-slate-500/80'}`}
                              value={hasSize ? params[sizeKey] : (GENERAL_PARAMS_SCHEMA[sizeKey] ? GENERAL_PARAMS_SCHEMA[sizeKey].replace(/[A-Z]/g, '') : '')} 
                              onChange={(e) => setParams({ ...params, [sizeKey]: e.target.value })} 
                              disabled={bufferSettings[prefix] !== 'size'} 
                              size="sm"
                            />
                            <Select 
                              value={units[prefix]} 
                              options={['KB', 'MB', 'GB', 'TB'].map(o => ({ value: o, label: o }))} 
                              onChange={(e) => setUnits(u => ({ ...u, [prefix]: e.target.value }))} 
                              disabled={bufferSettings[prefix] !== 'size'}
                              className="w-[84px]"
                              size="sm"
                              placeholder=""
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <div className="space-y-6">
                  <Divider label="SYSTEM PARAMETERS" />
                  <div className="space-y-2 px-2">
                    <PropertyField label="lock_escalation" value={params.lock_escalation} defaultValue={GENERAL_PARAMS_SCHEMA.lock_escalation} onChange={(e) => setParams({ ...params, lock_escalation: e.target.value })} />
                    <PropertyField label="lock_timeout_in_secs" value={params.lock_timeout_in_secs} defaultValue={GENERAL_PARAMS_SCHEMA.lock_timeout_in_secs} onChange={(e) => setParams({ ...params, lock_timeout_in_secs: e.target.value })} />
                    <PropertyField label="deadlock_interval" value={params.deadlock_detection_interval_in_secs} defaultValue={GENERAL_PARAMS_SCHEMA.deadlock_detection_interval_in_secs} onChange={(e) => setParams({ ...params, deadlock_detection_interval_in_secs: e.target.value })} />
                    <PropertyField label="checkpoint_interval" value={params.checkpoint_interval_in_mins} defaultValue={GENERAL_PARAMS_SCHEMA.checkpoint_interval_in_mins} onChange={(e) => setParams({ ...params, checkpoint_interval_in_mins: e.target.value })} />
                    
                    <div className="flex items-center gap-4 py-1">
                      <div className="w-[180px] shrink-0">
                        <Typography variant="label" className="text-slate-500 dark:text-slate-400 font-medium">isolation_level</Typography>
                      </div>
                      <div className="flex-1">
                        <Select 
                          value={params.isolation_level || GENERAL_PARAMS_SCHEMA.isolation_level} 
                          options={['TRAN_SERIALIZABLE','TRAN_REP_CLASS_REP_INSTANCE','TRAN_REP_CLASS_COMMIT_INSTANCE','TRAN_REP_CLASS_UNCOMMIT_INSTANCE','TRAN_COMMIT_CLASS_COMMIT_INSTANCE','TRAN_COMMIT_CLASS_UNCOMMIT_INSTANCE'].map(o => ({ value: o, label: o }))} 
                          onChange={(val) => setParams({ ...params, isolation_level: val })}
                          size="sm"
                          className={params.isolation_level !== undefined ? 'text-bk-yellow font-bold' : ''}
                        />
                      </div>
                    </div>

                    <PropertyField label="max_clients" value={params.max_clients} defaultValue={GENERAL_PARAMS_SCHEMA.max_clients} onChange={(e) => setParams({ ...params, max_clients: e.target.value })} />
                    
                    <div className="flex items-center gap-4 py-1">
                      <div className="w-[180px] shrink-0">
                        <Typography variant="label" className="text-slate-500 dark:text-slate-400 font-medium">auto_restart_server</Typography>
                      </div>
                      <div className="flex-1">
                        <Select 
                          value={params.auto_restart_server || GENERAL_PARAMS_SCHEMA.auto_restart_server} 
                          options={['yes', 'no'].map(o => ({ value: o, label: o.toUpperCase() }))} 
                          onChange={(val) => setParams({ ...params, auto_restart_server: val })}
                          size="sm"
                          className={params.auto_restart_server !== undefined ? 'text-bk-yellow font-bold' : ''}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 py-1">
                      <div className="w-[180px] shrink-0">
                        <Typography variant="label" className="text-slate-500 dark:text-slate-400 font-medium">replication</Typography>
                      </div>
                      <div className="flex-1">
                        <Select 
                          value={params.replication || GENERAL_PARAMS_SCHEMA.replication} 
                          options={['yes', 'no'].map(o => ({ value: o, label: o.toUpperCase() }))} 
                          onChange={(val) => setParams({ ...params, replication: val })}
                          size="sm"
                          className={params.replication !== undefined ? 'text-bk-yellow font-bold' : ''}
                        />
                      </div>
                    </div>
                    
                    <PropertyField label="cubrid_port_id" value={params.cubrid_port_id} defaultValue={GENERAL_PARAMS_SCHEMA.cubrid_port_id} onChange={(e) => setParams({ ...params, cubrid_port_id: e.target.value })} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-400">
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
