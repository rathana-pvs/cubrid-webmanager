import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const { preferences } = useSelector((state) => state.user);
  const { refreshCounter } = useSelector((state) => state.layout);
  
  const currentHost = hosts.find(h => h.uid === hostUid);
  const hostLabel = currentHost ? (currentHost.alias || currentHost.id) : 'Unknown Host';
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [autoStartDBs, setAutoStartDBs] = useState([]);

  const handleRefresh = useCallback(async (silent = false) => {
    if (!hostUid || (isRefreshing && !silent)) return;
    if (!silent) setIsRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchDatabaseStartInfo(silent ? { hostUid, isBackground: true } : hostUid)),
        dispatch(fetchBrokerList(silent ? { hostUid, isBackground: true } : hostUid)),
        dispatch(fetchHostEnv(hostUid)),
        fetchAutoStartInfo()
      ]);
      setLastRefreshed(new Date());
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  }, [dispatch, hostUid]);

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

  // 0. Global Refresh (F5) Listener
  useEffect(() => {
    if (refreshCounter > 0) handleRefresh();
  }, [refreshCounter, handleRefresh]);

  const initialLoadDone = useRef(false);

  // 1. Initial Load
  useEffect(() => {
    if (!hostUid || !authorizedHosts.includes(hostUid)) return;
    initialLoadDone.current = true;
    handleRefresh(); // Non-silent refresh with spinner
  }, [hostUid, authorizedHosts, handleRefresh]);

  const { activeMainTab } = useSelector((state) => state.layout);
  const [isBrowserVisible, setIsBrowserVisible] = useState(document.visibilityState === 'visible');
  
  const isTabActive = isBrowserVisible && activeMainTab === `host:${hostUid}`;
  const isActiveRef = useRef(isTabActive);

  // 2. Browser Visibility Listener
  useEffect(() => {
    const handleVisibilityChange = () => setIsBrowserVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // 3. Sync Ref and Trigger One-Time Resume Fetch
  useEffect(() => {
    const becameActive = !isActiveRef.current && isTabActive;
    isActiveRef.current = isTabActive;
    if (becameActive && initialLoadDone.current) handleRefresh(true);
  }, [isTabActive, hostUid, handleRefresh]);

  // 4. Background Polling Timer
  useEffect(() => {
    if (!hostUid || !isTabActive || preferences.dashboardInterval <= 0) return;
    const timer = setInterval(() => {
      if (isActiveRef.current) handleRefresh(true);
    }, preferences.dashboardInterval * 1000);
    return () => clearInterval(timer);
  }, [hostUid, isTabActive, preferences.dashboardInterval, handleRefresh]);

  const handleAutoStartToggle = async (dbname, isCurrentlyAutoStart) => {
    try {
      const payload = { confname: 'cubridconf', dbname };
      if (isCurrentlyAutoStart) await databaseApi.removeAutoStart(hostUid, payload);
      else await databaseApi.setAutoStart(hostUid, payload);
      fetchAutoStartInfo();
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
      <header className="px-6 py-2.5 border-b border-slate-100 dark:border-white/4 flex items-center justify-between shrink-0 sticky top-0 z-20 bg-linear-to-r from-amber-500/[0.03] to-transparent bg-white dark:bg-background-dark font-sans shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Icon name="dns" size="sm" weight={300} className="text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Typography variant="h1" className="text-[13px] font-bold text-slate-800 dark:text-slate-100 leading-tight">
                Server Dashboard
              </Typography>
              <div className={`px-2 py-0.5 rounded-full border flex items-center gap-1.5 shrink-0 transition-all duration-300 ${preferences?.dashboardInterval > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
                <div className={`w-1 h-1 rounded-full ${preferences?.dashboardInterval > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span className={`text-[9px] font-bold ${preferences?.dashboardInterval > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {preferences?.dashboardInterval > 0 ? 'Live' : 'Paused'}
                </span>
              </div>
            </div>
            <Typography variant="label" className="text-[10px] text-slate-400 font-mono tracking-tight">{hostLabel}</Typography>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[12px]">
          <Typography variant="label" className="text-[10px] text-slate-400 font-mono tracking-tight hidden lg:block mr-2">
            Synced {lastRefreshed.toLocaleTimeString('en-US', { hour12: true })}
          </Typography>

          <button
            onClick={() => handleRefresh()}
            disabled={isRefreshing}
            className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all active:scale-[0.98]
              ${isRefreshing
                ? 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-white/5 cursor-not-allowed opacity-50'
                : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 hover:border-amber-500/50 hover:bg-white dark:hover:bg-white/5 shadow-sm'}`}
            title="Refresh dashboard"
          >
            <Icon 
              name="refresh" 
              size="18px" 
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
