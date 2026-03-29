import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardData } from '../databaseSlice';
import DBPerformanceSection from './dashboard/DBPerformanceSection';
import DBVolumesSection from './dashboard/DBVolumesSection';
import DBSpaceInfoSection from './dashboard/DBSpaceInfoSection';
import DBBrokersCASSection from './dashboard/DBBrokersCASSection';
import DBLockTransactionSection from './dashboard/DBLockTransactionSection';
import CASLogModal from './CASLogModal';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Select } from '../../../components/ds/forms/Select';
import { Typography } from '../../../components/ds/foundation/Typography';

export default function DatabaseDashboard({ dbname }) {
  const dispatch = useDispatch();
  const { selectedHostUid, hosts } = useSelector((state) => state.host);
  const { dashboardData, dashboardLoading } = useSelector((state) => state.databaseMonitoring);

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(10);
  const [showSettings, setShowSettings] = useState(false);
  const [logModal, setLogModal] = useState({ isOpen: false, brokerName: '', casId: '', type: 'sql' });
  
  const [isTabActive, setIsTabActive] = useState(document.visibilityState === 'visible');

  const activeHost = hosts.find(h => h.uid === selectedHostUid);
  const hostUid = selectedHostUid;
  const data = dashboardData[dbname] || { volumes: [], spaceInfo: [], locks: [], performance: {} };
  const isLoading = dashboardLoading[dbname];

  useEffect(() => {
    const handleVisibilityChange = () => setIsTabActive(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleRefresh = () => {
    if (hostUid && dbname) dispatch(fetchDashboardData({ hostUid, dbname }));
  };

  // Initial load or tab activation
  // Requirement: "when switching back to active. it should refresh once... then start checking time interval"
  const wasActiveRef = useRef(isTabActive);
  useEffect(() => {
    if (isTabActive && !wasActiveRef.current) {
      handleRefresh();
    }
    wasActiveRef.current = isTabActive;
  }, [isTabActive, hostUid, dbname]);

  useEffect(() => {
    if (hostUid && dbname) handleRefresh();
  }, [hostUid, dbname]);

  // Pass polling props to sections
  const pollingProps = { hostUid, dbname, isTabActive, autoRefresh, refreshInterval };

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

  const mappedSummary = (data.volumeSummary || []).map(s => ({
    purpose: s.purpose,
    type: s.type,
    volCount: s.volume_count,
    used: s.used_size ? `${s.used_size} pages` : '-',
    free: s.free_size ? `${s.free_size} pages` : '-',
    total: s.total_size ? `${s.total_size} pages` : '-'
  }));

  const perf = data.performance || {};
  const brokersCAS = data.brokersCAS || [];
  
  // d-cms Logic: Aggregate stats from all CAS processes serving this database
  const casStats = brokersCAS.reduce((acc, cas) => {
    acc.cpu += parseFloat(cas.cpu || 0);
    acc.memKB += parseFloat(cas.psize || 0);
    acc.activeCount += (cas.status?.toLowerCase() === 'busy' ? 1 : 0);
    return acc;
  }, { cpu: 0, memKB: 0, activeCount: 0 });

  const totalQps = brokersCAS.reduce((a, c) => a + parseInt(c.qps || 0), 0);
  const totalMemMB = (casStats.memKB / 1024).toFixed(1);  const rates = perf.calculatedRates || { tps: 0, qps: 0, fetchPerSec: 0, dirtyPerSec: 0, ioReadPerSec: 0, ioWritePerSec: 0 };
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

  const btnCls = "h-8 flex items-center justify-center rounded-sm border transition-all active:scale-[0.98]";
  const iconBtnCls = `${btnCls} w-8 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/6 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200`;

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-background-dark overflow-hidden font-sans">
      <header className="px-6 py-3 border-b border-slate-100 dark:border-white/4 flex items-center justify-between shrink-0 sticky top-0 z-20 bg-white dark:bg-background-dark">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Icon name="database" size="sm" weight={300} className="text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Typography variant="h1" className="text-sm font-bold text-amber-600 dark:text-amber-500 leading-tight uppercase tracking-tight">{dbname}</Typography>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              </div>
            </div>
            <Typography variant="label" className="text-[10px] text-slate-400 font-mono">{activeHost?.address}:{activeHost?.port}</Typography>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Manual Refresh */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all active:scale-[0.98]
              ${isLoading
                ? 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-white/5 cursor-not-allowed opacity-50'
                : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-400 hover:text-amber-600 dark:hover:text-bk-yellow hover:border-amber-500/50 dark:hover:border-bk-yellow/50 hover:bg-white dark:hover:bg-white/5 shadow-xs'}`}
            title="Manual refresh"
          >
            <Icon name="refresh" size="18px" weight={isLoading ? 700 : 300} className={isLoading ? 'animate-spin' : ''} />
          </button>

          {/* Live/Paused Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            title={autoRefresh ? 'Live monitoring active' : 'Auto refresh off'}
            className={`h-8 px-2.5 flex items-center gap-1.5 rounded-lg border transition-all active:scale-[0.98] text-[11px] font-bold
              ${autoRefresh 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-400 hover:text-amber-600 dark:hover:text-bk-yellow hover:border-amber-500/50 dark:hover:border-bk-yellow/50 hover:bg-white dark:hover:bg-white/5 shadow-xs'}`}
          >
            <Icon name={autoRefresh ? 'timer' : 'timer_off'} size="18px" weight={300} />
            {autoRefresh ? 'Live' : 'Paused'}
          </button>

          <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-0.5" />

          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all active:scale-[0.98]
              ${showSettings 
                ? 'bg-amber-500/10 text-amber-600 dark:text-bk-yellow border-amber-500/50 dark:border-bk-yellow/50' 
                : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-400 hover:text-amber-600 dark:hover:text-bk-yellow hover:border-amber-500/50 dark:hover:border-bk-yellow/50 hover:bg-white dark:hover:bg-white/5 shadow-xs'}`}
            title="Dashboard settings"
          >
            <Icon name="tune" size="18px" weight={300} />
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all active:scale-[0.98] bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-400 hover:text-amber-600 dark:hover:text-bk-yellow hover:border-amber-500/50 dark:hover:border-bk-yellow/50 hover:bg-white dark:hover:bg-white/5 shadow-xs`}
            title="Export metrics as CSV"
          >
            <Icon name="ios_share" size="18px" weight={300} />
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="mx-6 mt-4 p-4 bg-white dark:bg-white/2 border border-slate-200 dark:border-white/6 rounded-xl flex items-center gap-6">
          <div className="flex items-center gap-2 shrink-0">
            <Icon name="tune" size="sm" weight={300} className="text-amber-500" />
            <Typography variant="label" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Auto Refresh</Typography>
          </div>
          <div className="w-52">
            <Select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
              options={[
                { label: '1 second (Realtime)', value: 1 },
                { label: '5 seconds', value: 5 },
                { label: '10 seconds', value: 10 },
                { label: '30 seconds', value: 30 },
                { label: '1 minute', value: 60 },
              ]}
            />
          </div>
          <Typography variant="label" className="text-[10px] text-slate-400 italic leading-relaxed">
            Lower intervals increase polling frequency and may impact server performance.
          </Typography>
          <button onClick={() => setShowSettings(false)} className="ml-auto p-1 rounded-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0">
            <Icon name="close" size="sm" weight={300} />
          </button>
        </div>
      )}

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
