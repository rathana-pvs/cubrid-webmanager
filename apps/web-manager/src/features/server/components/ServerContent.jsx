import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { hostApi } from '../../host/hostApi';
import { databaseApi } from '../../database/databaseApi';
import { fetchHostEnv } from '../../host/hostSlice';
import { fetchDatabaseStartInfo } from '../../database/databaseSlice';
import { fetchBrokerList } from '../../broker/brokerSlice';
import DatabaseVolumes from './DatabaseVolumes';
import Brokers from './Brokers';
import SystemInfo from './SystemInfo';

import SystemStatusSection from './server/SystemStatusSection';
import DatabaseListSection from './server/DatabaseListSection';
import MonitoringSettingsPopover from '../../user/components/MonitoringSettingsPopover';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Icon } from '../../../components/ds/foundation/Icon';

export default function ServerContent({ hostUid }) {
  const dispatch = useDispatch();
  const { databases, activeDatabases } = useSelector((state) => state.database);
  const { hosts, authorizedHosts } = useSelector((state) => state.host);
  const { preferences } = useSelector((state) => state.user); // Added for dashboard interval
  
  const currentHost = hosts.find(h => h.uid === hostUid);
  const hostLabel = currentHost ? (currentHost.alias || currentHost.id) : 'Unknown Host';
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoStartDBs, setAutoStartDBs] = useState([]);


  const handleRefresh = async (silent = false) => {
    if (!hostUid || (isRefreshing && !silent)) return;
    if (!silent) setIsRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchDatabaseStartInfo(silent ? { hostUid, isBackground: true } : hostUid)),
        dispatch(fetchBrokerList(silent ? { hostUid, isBackground: true } : hostUid)),
        dispatch(fetchHostEnv(hostUid)),
        fetchAutoStartInfo()
      ]);
      // Note: SystemStatusSection handles its own high-frequency monitoring fetch.
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  const fetchAutoStartInfo = async () => {
    try {
      const response = await hostApi.getHostConfig(hostUid, 'cubridconf');
      const lines = response?.conflist?.[0]?.confdata || [];
      let serviceEnabled = false, servers = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || !trimmed) continue;
        if (trimmed.startsWith('service=')) {
          const val = trimmed.split('=')[1] || '';
          if (val.split(',').map(s => s.trim().toLowerCase()).includes('server')) serviceEnabled = true;
        }
        if (trimmed.startsWith('server=')) {
          servers = (trimmed.split('=')[1] || '').split(',').map(s => s.trim());
        }
      }
      setAutoStartDBs(serviceEnabled ? servers : []);
    } catch (err) {
      console.error('Failed to fetch auto-start info:', err);
    }
  };

  const initialLoadDone = React.useRef(false);

  // 1. Initial Load
  useEffect(() => {
    if (!hostUid || !authorizedHosts.includes(hostUid)) return;
    initialLoadDone.current = true;
    handleRefresh(); // Non-silent refresh with spinner
  }, [hostUid, authorizedHosts, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  const { activeMainTab } = useSelector((state) => state.layout);
  const [isBrowserVisible, setIsBrowserVisible] = useState(document.visibilityState === 'visible');
  
  const isTabActive = isBrowserVisible && activeMainTab === `host:${hostUid}`;
  const isActiveRef = React.useRef(isTabActive);

  // 2. Browser Visibility Listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsBrowserVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // 3. Sync Ref and Trigger One-Time Resume Fetch
  useEffect(() => {
    const becameActive = !isActiveRef.current && isTabActive;
    isActiveRef.current = isTabActive;
    
    // Only trigger a silent background refresh if the tab is switching to active
    // AND it's not the very first load (which is handled by the Initial Load effect)
    if (becameActive && initialLoadDone.current) {
      handleRefresh(true);
    }
  }, [isTabActive, hostUid]); // eslint-disable-line react-hooks/exhaustive-deps

  // 3. Background Polling Timer
  useEffect(() => {
    if (!hostUid || !isTabActive || preferences.dashboardInterval <= 0) return;

    const timer = setInterval(() => {
      if (isActiveRef.current) {
        handleRefresh(true);
      }
    }, preferences.dashboardInterval * 1000);

    return () => clearInterval(timer);
  }, [hostUid, isTabActive, preferences.dashboardInterval]);


  const handleAutoStartToggle = async (dbname, isCurrentlyAutoStart) => {
    try {
      const payload = { confname: 'cubridconf', dbname };
      if (isCurrentlyAutoStart) await databaseApi.removeAutoStart(hostUid, payload);
      else await databaseApi.setAutoStart(hostUid, payload);

      const response = await hostApi.getHostConfig(hostUid, 'cubridconf');
      const lines = response?.conflist?.[0]?.confdata || [];
      let servers = [], serviceEnabled = false;
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('service=')) {
          const val = trimmed.split('=')[1] || '';
          if (val.split(',').map(s => s.trim().toLowerCase()).includes('server')) serviceEnabled = true;
        }
        if (trimmed.startsWith('server=')) servers = (trimmed.split('=')[1] || '').split(',').map(s => s.trim());
      }
      setAutoStartDBs(serviceEnabled ? servers : []);
    } catch (err) {
      console.error('Failed to update auto-start:', err);
    }
  };

  const dbListDisplay = databases.map(db => ({
    db: db.dbname,
    autoStart: autoStartDBs.includes(db.dbname),
    status: activeDatabases.includes(db.dbname) ? 'On' : 'Off'
  }));

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-background-dark overflow-hidden">

      {/* ── Header ── */}
      <header className="px-6 py-3 border-b border-slate-100 dark:border-white/4 flex items-center justify-between shrink-0 sticky top-0 z-20 bg-white dark:bg-background-dark font-sans">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Icon name="dns" size="sm" weight={300} className="text-amber-500" />
          </div>
          <div>
            <Typography variant="h1" className="text-sm font-bold text-amber-600 dark:text-amber-500 leading-tight">
              Server Dashboard
            </Typography>

            <Typography variant="label" className="text-[10px] text-slate-400 font-mono tracking-tight">{hostLabel}</Typography>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all active:scale-[0.98]
              ${isRefreshing
                ? 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-white/5 cursor-not-allowed opacity-50'
                : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-400 hover:text-amber-600 dark:hover:text-bk-yellow hover:border-amber-500/50 dark:hover:border-bk-yellow/50 hover:bg-white dark:hover:bg-white/5 shadow-xs'}`}
            title="Refresh dashboard"
          >
            <Icon 
              name="refresh" 
              size="18px" 
              weight={isRefreshing ? 700 : 300} 
              className={isRefreshing ? 'animate-spin' : ''} 
            />
          </button>
          <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-0.5" />
          <MonitoringSettingsPopover />
        </div>
      </header>



      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <DatabaseVolumes hostUid={hostUid} />
        <Brokers hostUid={hostUid} />
        <SystemStatusSection hostUid={hostUid} isTabActive={isTabActive} />
        <DatabaseListSection dbListDisplay={dbListDisplay} handleAutoStartToggle={handleAutoStartToggle} />
        <SystemInfo hostUid={hostUid} />
      </div>
    </div>
  );
}
