import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardData } from '../databaseSlice';
import DBPerformanceSection from './dashboard/DBPerformanceSection';
import DBVolumesSection from './dashboard/DBVolumesSection';
import DBSpaceInfoSection from './dashboard/DBSpaceInfoSection';
import DBBrokersCASSection from './dashboard/DBBrokersCASSection';
import DBLockTransactionSection from './dashboard/DBLockTransactionSection';
import CASLogModal from './CASLogModal';

import MonitoringSettingsPopover from '../../user/components/MonitoringSettingsPopover';
import { Icon } from '../../../components/ds/foundation/Icon';
import { Typography } from '../../../components/ds/foundation/Typography';

export default function DatabaseDashboard({ dbname }) {
  const dispatch = useDispatch();
  const { selectedHostUid, hosts } = useSelector((state) => state.host);
  const { dashboardData, dashboardLoading } = useSelector((state) => state.databaseMonitoring);
  const { preferences } = useSelector((state) => state.user);
  const { refreshCounter, activeMainTab } = useSelector((state) => state.layout);

  const [logModal, setLogModal] = useState({ isOpen: false, brokerName: '', casId: '', type: 'sql' });
  
  const [isBrowserVisible, setIsBrowserVisible] = useState(document.visibilityState === 'visible');
  const isTabActive = isBrowserVisible && activeMainTab === `db:${dbname}`;
  const isActiveRef = useRef(isTabActive);
  const initialLoadDone = useRef(false);

  const activeHost = hosts.find(h => h.uid === selectedHostUid);
  const hostUid = selectedHostUid;
  const data = dashboardData[dbname] || { volumes: [], spaceInfo: [], locks: [], performance: {} };
  const isLoading = dashboardLoading[dbname];
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // 1. Browser Visibility Listener
  useEffect(() => {
    const handleVisibilityChange = () => setIsBrowserVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleRefresh = useCallback(async (silent = false) => {
    if (hostUid && dbname) {
      if (!silent) setIsManualRefreshing(true);
      try {
        await dispatch(fetchDashboardData({ hostUid, dbname, isBackground: silent })).unwrap();
        setLastRefreshed(new Date());
      } catch (err) {
        console.error('Failed to refresh dashboard:', err);
      } finally {
        if (!silent) setIsManualRefreshing(false);
      }
    }
  }, [dispatch, hostUid, dbname]);

  // 2. Global Refresh (F5) Listener
  useEffect(() => {
    if (refreshCounter > 0 && isTabActive) {
      handleRefresh();
    }
  }, [refreshCounter, handleRefresh, isTabActive]);

  // 3. Initial Load
  useEffect(() => {
    if (hostUid && dbname && !initialLoadDone.current) {
      initialLoadDone.current = true;
      handleRefresh();
    }
  }, [hostUid, dbname, handleRefresh]);

  // 4. Sync Ref and Trigger One-Time Resume Fetch
  useEffect(() => {
    const becameActive = !isActiveRef.current && isTabActive;
    isActiveRef.current = isTabActive;
    if (becameActive && initialLoadDone.current && preferences.dashboardInterval > 0) handleRefresh(true);
  }, [isTabActive, handleRefresh, preferences.dashboardInterval]);

  // 5. Background Polling Timer
  useEffect(() => {
    if (!isTabActive || preferences.dashboardInterval <= 0) return;
    const timer = setInterval(() => {
      if (isActiveRef.current) handleRefresh(true);
    }, preferences.dashboardInterval * 1000);
    return () => clearInterval(timer);
  }, [isTabActive, preferences.dashboardInterval, handleRefresh]);

  // Pass polling props to sections
  const pollingProps = { hostUid, dbname, isTabActive, refreshInterval: preferences.dashboardInterval };

  const mappedVolumes = (data.volumes || []).map(v => ({
    name: v.spacename, 
    type: v.type, 
    purpose: v.purpose || '-',
    free: v.freepage && v.freepage.trim() !== '' ? `${v.freepage} pages` : '-',
    total: v.totalpage && v.totalpage.trim() !== '' ? `${v.totalpage} pages` : '-',
    freePct: v.totalpage && parseInt(v.totalpage) > 0 && v.freepage && v.freepage.trim() !== '' ? (parseInt(v.freepage) / parseInt(v.totalpage)) * 100 : 0,
    date: v.date || '-', 
    path: v.location
  }));

  const mappedSpaceInfo = (data.spaceInfo || []).map(f => ({
    type: f.data_type, 
    fileCount: f.file_count, 
    usedPages: f.used_size ? `${f.used_size} pages` : '-',
    fileTablePages: f.file_table_size ? `${f.file_table_size} pages` : '-', 
    reservedPages: f.reserved_size ? `${f.reserved_size} pages` : '-', 
    totalPages: f.total_size ? `${f.total_size} pages` : '-'
  }));

  const perf = data.performance || {};
  const brokersCAS = data.brokersCAS || [];
  
  const casStats = brokersCAS.reduce((acc, cas) => {
    acc.cpu += parseFloat(cas.cpu || 0);
    acc.memKB += parseFloat(cas.psize || 0);
    acc.activeCount += (cas.status?.toLowerCase() === 'busy' ? 1 : 0);
    return acc;
  }, { cpu: 0, memKB: 0, activeCount: 0 });

  const totalQps = brokersCAS.reduce((a, c) => a + parseInt(c.qps || 0), 0);
  const totalMemMB = (casStats.memKB / 1024).toFixed(1);
  const rates = perf.calculatedRates || { tps: 0, qps: 0, fetchPerSec: 0, dirtyPerSec: 0, ioReadPerSec: 0, ioWritePerSec: 0 };
  
  const dbStats = [{
    cpu: casStats.cpu.toFixed(1) + '%', 
    cpuPct: Math.min(casStats.cpu, 100),
    memory: totalMemMB + 'MB', 
    memPct: Math.min((casStats.memKB / 1024) / 4, 100),
    tps: rates.tps.toFixed(1),
    qps: totalQps.toLocaleString(), 
    hitRatio: (perf.data_page_buffer_hit_ratio || '0.00') + '%',
    hitPct: parseFloat(perf.data_page_buffer_hit_ratio || '0'),
    fetch: rates.fetchPerSec.toFixed(1),
    dirty: rates.dirtyPerSec.toFixed(1),
    ioReads: rates.ioReadPerSec.toFixed(1),
    ioWrites: rates.ioWritePerSec.toFixed(1)
  }];
  
  const mappedBrokers = brokersCAS.map(c => ({ broker: c.broker, id: c.id, pid: c.pid, qps: c.qps, lqs: c.lqs, status: c.status, lastConn: c.lastConn, dbname: c.dbname }));
  const mappedLocks = (data.locks || []).map((l, i) => ({ index: l.index || i + 1, user: l.uid || '-', host: l.host || '-', pid: l.pid || '-', obj: l.object || '-', mode: l.granted_mode || '-' }));

  const handleExport = () => {
    const headers = ['Section', 'Key', 'Value'];
    const rows = [
      ['Summary', 'Database', dbname],
      ['Summary', 'Host', `${activeHost?.address}:${activeHost?.port}`],
      ['Performance', 'TPS', dbStats[0].tps],
      ['Performance', 'QPS', dbStats[0].qps],
      ['Performance', 'Hit Ratio', dbStats[0].hitRatio],
      ['Performance', 'Fetch/s', dbStats[0].fetch],
      ['Performance', 'Dirty/s', dbStats[0].dirty],
      ['Performance', 'IO Reads/s', dbStats[0].ioReads],
      ['Performance', 'IO Writes/s', dbStats[0].ioWrites],
      ...mappedVolumes.map(v => ['Volume', v.name, `${v.free} / ${v.total}`])
    ];
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${dbname}_dashboard_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-background-dark overflow-hidden font-sans">
      <header className="px-6 py-2.5 border-b border-slate-100 dark:border-white/4 flex items-center justify-between shrink-0 sticky top-0 z-20 bg-white dark:bg-background-dark">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-sm">
            <Icon name="database" size="sm" weight={300} className="text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Typography variant="h1" className="text-[13px] font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">Database Dashboard</Typography>
              <div className={`px-2 py-0.5 rounded-full border flex items-center gap-1.5 shrink-0 transition-all duration-300 ${preferences.dashboardInterval > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
                <div className={`w-1 h-1 rounded-full ${preferences.dashboardInterval > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span className={`text-[9px] font-bold ${preferences.dashboardInterval > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {preferences.dashboardInterval > 0 ? 'Live' : 'Paused'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
              <Typography variant="label" className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">@{dbname}</Typography>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Typography variant="label" className="text-[10px] text-slate-400 font-mono tracking-tight hidden lg:block mr-2">
            Synced {lastRefreshed.toLocaleTimeString('en-US', { hour12: true })}
          </Typography>

          <button
            onClick={handleRefresh}
            disabled={isLoading || isManualRefreshing}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all active:scale-[0.98]
              ${(isLoading || isManualRefreshing)
                ? 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-white/5 cursor-not-allowed opacity-50'
                : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 hover:border-amber-500/50 hover:bg-white dark:hover:bg-white/5 shadow-xs'}`}
            title="Refresh database status"
          >
            <Icon name="refresh" size="18px" className={(isLoading || isManualRefreshing) ? 'animate-spin' : ''} />
          </button>

          <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 mx-0.5" />
          <MonitoringSettingsPopover />

          <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-0.5" />
          <button
            onClick={handleExport}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all active:scale-[0.98] bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 hover:border-amber-500/50 hover:bg-white dark:hover:bg-white/5 shadow-xs`}
            title="Export metrics as CSV"
          >
            <Icon name="ios_share" size="18px" weight={300} />
          </button>
        </div>
      </header>



      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {isLoading && (!data.volumes || data.volumes.length === 0) ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <Typography variant="label" className="text-[11px] text-slate-400 uppercase tracking-widest">Loading Dashboard…</Typography>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <DBPerformanceSection dbStats={dbStats} pollingProps={pollingProps} />
            <DBVolumesSection volumes={mappedVolumes} pollingProps={pollingProps} />
            <DBSpaceInfoSection spaceInfo={mappedSpaceInfo} pollingProps={pollingProps} />
            <DBBrokersCASSection
              brokersCAS={mappedBrokers}
              pollingProps={pollingProps}
              onViewSQLLog={(row) => setLogModal({ isOpen: true, brokerName: row.broker, casId: row.id, type: 'sql' })}
              onViewSlowQueryLog={(row) => setLogModal({ isOpen: true, brokerName: row.broker, casId: row.id, type: 'slow' })}
              onRestartCAS={(row) => alert(`Restart request sent for CAS ${row.id} on broker ${row.broker}.`)}
            />
            <DBLockTransactionSection locks={mappedLocks} pollingProps={pollingProps} />
          </div>
        )}
      </div>

      <CASLogModal
        isOpen={logModal.isOpen}
        onClose={() => setLogModal(prev => ({ ...prev, isOpen: false }))}
        hostUid={hostUid}
        brokerName={logModal.brokerName}
        casId={logModal.casId}
        type={logModal.type}
      />
    </div>
  );
}
