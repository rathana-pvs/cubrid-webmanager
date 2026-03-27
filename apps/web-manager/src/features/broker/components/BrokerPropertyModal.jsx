import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { closeBrokerPropertyModal, fetchBrokerConfig, updateBrokerConfig } from '../brokerSlice';
import SelectField from '../../../components/common/SelectField';

import { Icon } from '../../../components/ds/foundation/Icon';

const BROKER_PARAMETERS = [
  { name: 'SERVICE', type: 'string(ON|OFF)', default: 'ON', category: 'common' },
  { name: 'BROKER_PORT', type: 'int(1024~65535)', default: '', category: 'common' },
  { name: 'MIN_NUM_APPL_SERVER', type: 'int', default: '5', category: 'common' },
  { name: 'MAX_NUM_APPL_SERVER', type: 'int', default: '40', category: 'common' },
  { name: 'APPL_SERVER_SHM_ID', type: 'int(1024~65535)', default: '', category: 'common' },
  { name: 'LOG_DIR', type: 'string', default: 'log/broker/sql_log', category: 'common' },
  { name: 'ERROR_LOG_DIR', type: 'string', default: 'log/broker/error_log', category: 'common' },
  { name: 'SQL_LOG', type: 'string(ON|OFF|ERROR|NOTICE|TIMEOUT)', default: 'ON', category: 'common' },
  { name: 'TIME_TO_KILL', type: 'int', default: '120', category: 'common' },
  { name: 'SESSION_TIMEOUT', type: 'int', default: '300', category: 'common' },
  { name: 'KEEP_CONNECTION', type: 'string(ON|OFF|AUTO)', default: 'AUTO', category: 'common' },
  { name: 'STATEMENT_POOLING', type: 'string(ON|OFF)', default: 'ON', category: 'advance' },
  { name: 'LONG_QUERY_TIME', type: 'int', default: '60', category: 'advance' },
  { name: 'LONG_TRANSACTION_TIME', type: 'int', default: '60', category: 'advance' },
  { name: 'SQL_LOG_MAX_SIZE', type: 'int', default: '100000', category: 'advance' },
  { name: 'LOG_BACKUP', type: 'string(ON|OFF)', default: 'OFF', category: 'advance' },
  { name: 'SOURCE_ENV', type: 'string', default: 'cubrid.env', category: 'advance' },
  { name: 'MAX_STRING_LENGTH', type: 'int', default: '-1', category: 'advance' },
  { name: 'APPL_SERVER_PORT', type: 'int', default: '', category: 'advance' },
  { name: 'ACCESS_LOG', type: 'string(ON|OFF)', default: 'ON', category: 'advance' },
  { name: 'ACCESS_LIST', type: 'string', default: '', category: 'advance' },
  { name: 'CCI_PCONNECT', type: 'string(ON|OFF)', default: 'OFF', category: 'advance' },
  { name: 'SELECT_AUTO_COMMIT', type: 'string(ON|OFF)', default: 'OFF', category: 'advance' },
  { name: 'ACCESS_MODE', type: 'string(RW|RO|SO)', default: 'RW', category: 'advance' },
  { name: 'PREFERRED_HOSTS', type: 'string', default: '', category: 'advance' },
  { name: 'CCI_DEFAULT_AUTOCOMMIT', type: 'string(ON|OFF)', default: 'ON', category: 'advance' },
  { name: 'ENABLE_OPENSSL', type: 'string(ON|OFF)', default: 'OFF', category: 'advance' }
];

export default function BrokerPropertyModal() {
  const dispatch = useDispatch();
  const { propertyModal, brokerConfig, actionLoading } = useSelector((state) => state.broker);
  const { isOpen, brokerName, hostUid } = propertyModal;

  const [activeTab, setActiveTab] = useState('parameters'); // parameters, refresh
  const [localParams, setLocalParams] = useState({});
  const [specificParams, setSpecificParams] = useState(new Set());
  const [refreshEnabled, setRefreshEnabled] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5);

  const config = useMemo(() => brokerConfig[hostUid] || { data: {}, loading: false }, [brokerConfig, hostUid]);

  useEffect(() => {
    if (isOpen && hostUid) {
      dispatch(fetchBrokerConfig({ hostUid }));
    }
  }, [isOpen, hostUid, dispatch]);

  useEffect(() => {
    if (config.data && config.data.confdata) {
      const sections = {};
      let currentSection = 'general';
      
      config.data.confdata.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        const sectionMatch = trimmed.match(/^\[%?(.+)\]$/);
        if (sectionMatch) {
          currentSection = sectionMatch[1].toLowerCase();
          sections[currentSection] = {};
        } else {
          const [key, value] = trimmed.split('=').map(s => s.trim());
          if (key && value !== undefined) {
            if (!sections[currentSection]) sections[currentSection] = {};
            sections[currentSection][key] = value;
          }
        }
      });

      const targetBroker = brokerName?.toLowerCase();
      const brokerCommonParams = sections['broker'] || {};
      const brokerSpecificParams = sections[targetBroker] || {};
      
      const combinedParams = {
        ...brokerCommonParams,
        ...brokerSpecificParams
      };

      setLocalParams(combinedParams);
      setSpecificParams(new Set(Object.keys(brokerSpecificParams)));
    }
  }, [config.data, brokerName, isOpen]);

  const handleParamChange = (name, value) => {
    setLocalParams(prev => ({ ...prev, [name]: value }));
    setSpecificParams(prev => {
      const next = new Set(prev);
      next.add(name);
      return next;
    });
  };

  const handleSave = () => {
    if (!config.data?.confdata) return;

    const newConfData = [];
    let inTargetSection = false;
    const targetBroker = brokerName?.toLowerCase();
    const updatedInTargetSection = new Set();

    config.data.confdata.forEach(line => {
        const trimmed = line.trim();
        const sectionMatch = trimmed.match(/^\[%?(.+)\]$/);
        
        if (sectionMatch) {
            const sectionName = sectionMatch[1].toLowerCase();
            if (inTargetSection) {
                specificParams.forEach(paramName => {
                    if (!updatedInTargetSection.has(paramName) && localParams[paramName] !== undefined) {
                        newConfData.push(`${paramName}=${localParams[paramName]}`);
                    }
                });
            }
            inTargetSection = sectionName === targetBroker;
            newConfData.push(line);
        } else if (inTargetSection) {
            const [key] = trimmed.split('=').map(s => s.trim());
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
        specificParams.forEach(paramName => {
            if (!updatedInTargetSection.has(paramName) && localParams[paramName] !== undefined) {
                newConfData.push(`${paramName}=${localParams[paramName]}`);
            }
        });
    }

    dispatch(updateBrokerConfig({ hostUid, confdata: newConfData }))
      .unwrap()
      .then(() => {
        dispatch(closeBrokerPropertyModal());
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-600 flex items-center justify-center bg-bk-main/40 backdrop-blur-xs animate-in fade-in duration-300">
      <div className="bg-bk-side w-full max-w-2xl rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Subtle Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-bk-yellow/60"></div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-bk-side shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-bk-yellow/10 flex items-center justify-center border border-bk-yellow/20">
              <Icon name="tune" size="sm" weight={300} className="text-bk-yellow text-xl" />
            </div>
            <div>
              <h3 className="text-[12px] font-medium text-slate-100 leading-none tracking-wide">BROKER PROPERTIES</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] font-medium uppercase text-slate-500 tracking-wide">{brokerName}</span>
                <span className="w-0.5 h-0.5 rounded-full bg-slate-700"></span>
                <span className="text-[9px] font-medium text-slate-500 font-mono">@{hostUid}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => dispatch(closeBrokerPropertyModal())}
            className="w-7 h-7 rounded-md hover:bg-white/5 transition-all text-slate-500 hover:text-white flex items-center justify-center group"
          >
            <Icon name="close" size="sm" weight={300} className="text-lg group-hover:rotate-90" />
          </button>
        </div>

        {/* Tabs */}
        {/* Tabs */}
        <div className="flex px-5 bg-bk-main/30 border-b border-white/5">
          <button 
            className={`px-4 py-2.5 text-[11px] font-medium transition-all relative group ${activeTab === 'parameters' ? 'text-bk-yellow' : 'text-slate-500 hover:text-slate-300'}`}
            onClick={() => setActiveTab('parameters')}
          >
            PARAMETERS
            {activeTab === 'parameters' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-bk-yellow"></div>}
          </button>
          <button 
            className={`px-4 py-2.5 text-[11px] font-medium transition-all relative group ${activeTab === 'refresh' ? 'text-bk-yellow' : 'text-slate-500 hover:text-slate-300'}`}
            onClick={() => setActiveTab('refresh')}
          >
            MONITORING
            {activeTab === 'refresh' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-bk-yellow"></div>}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-bk-main/20 custom-scrollbar">
          {activeTab === 'parameters' ? (
            <div className="min-h-full">
              {config.loading && Object.keys(localParams).length === 0 ? (
                <div className="py-32 flex flex-col items-center gap-6">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-bk-yellow/5 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-bk-yellow rounded-full animate-spin"></div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-sm font-medium text-slate-300">Fetching Configuration</span>
                    <span className="text-[10px] text-slate-500 font-medium">Please wait a moment...</span>
                  </div>
                </div>
              ) : (
                <div className="p-0">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-bk-side border-b border-white/5">
                      <tr className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        <th className="px-6 py-2.5 w-[35%]">PARAMETER</th>
                        <th className="px-6 py-2.5 w-[30%] text-center">TYPE</th>
                        <th className="px-6 py-2.5 w-[35%]">VALUE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/3">
                      {BROKER_PARAMETERS.map((p) => {
                        const isSpecific = specificParams.has(p.name);
                        const isCommon = p.category === 'common';
                        const isHighlight = isCommon || isSpecific;
                        const currentValue = localParams[p.name] || p.default;
                        
                        return (
                          <tr 
                            key={p.name} 
                            className="group hover:bg-white/2 border-b border-white/3 transition-colors"
                          >
                            <td className="px-6 py-2.5 text-[12px] font-medium text-slate-100 tracking-tight">
                              {p.name}
                            </td>
                            <td className="px-6 py-2.5 text-center text-[10px] font-mono text-slate-500 uppercase">
                              {p.type.split('(')[0]}
                            </td>
                            <td className="px-6 py-1.5 min-w-[180px]">
                              {p.type.includes('ON|OFF') ? (
                                <SelectField 
                                  value={currentValue}
                                  onChange={(val) => handleParamChange(p.name, val)}
                                  isHighlight={true}
                                  options={(() => {
                                    const match = p.type.match(/\((.+)\)/);
                                    if (!match) return [{ value: 'ON', label: 'ON' }, { value: 'OFF', label: 'OFF' }];
                                    return match[1].split('|').map(v => ({ value: v, label: v }));
                                  })()}
                                />
                              ) : (
                                <input 
                                  type="text"
                                  value={currentValue}
                                  onChange={(e) => handleParamChange(p.name, e.target.value)}
                                  placeholder={p.default}
                                  className="w-full h-9 rounded-lg px-3 py-1.5 text-[12px] font-medium outline-hidden transition-all bg-bk-side border border-white/10 text-slate-100 placeholder:text-slate-600 focus:border-bk-yellow focus:ring-4 focus:ring-bk-yellow/10 shadow-lg"
                                />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-10 max-w-lg mx-auto py-20 px-6">
              <div className="bg-bk-yellow/5 border border-bk-yellow/10 rounded-2xl p-6 flex gap-5 ring-1 ring-bk-yellow/20">
                <div className="w-12 h-12 rounded-xl bg-bk-yellow/20 shrink-0 flex items-center justify-center">
                  <Icon name="update" size="sm" weight={300} className="text-bk-yellow text-2xl" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-bk-yellow mb-1">Status Monitoring</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                    Configure the auto-refresh interval for the broker status dashboard. 
                    Real-time updates help in diagnosing performance bottlenecks and monitoring active application servers.
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-slate-200">Auto Refresh</span>
                    <span className="text-[10px] text-slate-500 font-medium">Synchronize status automatically</span>
                  </div>
                  <button 
                    onClick={() => setRefreshEnabled(!refreshEnabled)}
                    className={`w-14 h-7 rounded-full transition-all relative ${refreshEnabled ? 'bg-bk-yellow shadow-[0_0_15px_rgba(255,184,0,0.3)]' : 'bg-slate-800'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${refreshEnabled ? 'left-8 scale-110' : 'left-1'}`}></div>
                  </button>
                </div>

                <div className={`space-y-4 transition-all duration-300 ${refreshEnabled ? 'opacity-100 translate-y-0' : 'opacity-20 translate-y-4 pointer-events-none'}`}>
                  <div className="flex flex-col gap-1 px-4">
                    <label className="text-[10px] font-medium text-slate-500 uppercase tracking-widest block">Update Frequency</label>
                  </div>
                  <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
                    <input 
                      type="range"
                      min="1"
                      max="60"
                      value={refreshInterval}
                      onChange={(e) => setRefreshInterval(e.target.value)}
                      className="flex-1 accent-bk-yellow"
                    />
                    <div className="bg-bk-side border border-white/10 px-4 py-2 rounded-xl min-w-[100px] text-center shadow-inner">
                      <span className="text-sm font-medium text-bk-yellow">{refreshInterval}</span>
                      <span className="text-[9px] font-medium text-slate-500 ml-1.5">SEC</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-bk-main/80 backdrop-blur-xs border-t border-white/5 flex items-center justify-end gap-3 shrink-0">
          <button 
            onClick={() => dispatch(closeBrokerPropertyModal())}
            className="px-5 py-1.5 text-[11px] font-medium tracking-wide text-slate-400 border border-white/10 rounded-sm hover:bg-white/5 transition-all uppercase"
          >
            DISCARD
          </button>
          <button 
            onClick={handleSave}
            disabled={config.loading || actionLoading}
            className="
              px-6 py-1.5 bg-bk-yellow hover:bg-[#ffd700] active:scale-[0.98] text-bk-side text-[11px] font-medium rounded border border-bk-yellow/50 shadow-xs transition-all flex items-center justify-center gap-2 min-w-[140px] uppercase
            "
          >
            {actionLoading ? (
              <div className="w-3 h-3 border-2 border-bk-side/30 border-t-bk-side rounded-full animate-spin"></div>
            ) : (
                <>
                  <Icon name="check_circle" size="sm" weight={300} />
                  <span>APPLY CHANGES</span>
                </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
