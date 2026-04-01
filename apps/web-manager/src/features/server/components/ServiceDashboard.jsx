import { usePollingRefresh } from '../../../infrastructure/hooks/usePollingRefresh';
import React, { useState } from 'react';
import { useSelector, useDispatch , shallowEqual } from 'react-redux';
import { formatSize } from '../../../infrastructure/utils/format';
import { fetchHostSummary } from '../globalMonitoringSlice';
import { setActiveMainTab } from '../../layout/layoutSlice';
import { setSelectedHost, startService, stopService } from '../../host/hostSlice';
import MonitoringSettingsPopover from '../../user/components/MonitoringSettingsPopover';
import { Table } from '../../../components/ds/layout/Table';
import { Card } from '../../../components/ds/layout/Card';
import { Icon } from '../../../components/ds/foundation/Icon';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Badge } from '../../../components/ds/foundation/Badge';
import { Spinner } from '../../../components/ds/foundation/Spinner';

const MetricBar = ({ pct }) => (
  <div className="w-full h-1 bg-slate-100 dark:bg-white/6 overflow-hidden mt-1 rounded-full">
    <div className={`h-full transition-all duration-700 ease-out ${pct > 85 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
  </div>
);

const Component = function ServiceDashboard() {
  const dispatch = useDispatch();
  const { hosts, authorizedHosts } = useSelector((state) => state.host, shallowEqual);
  const { summaries } = useSelector((state) => state.globalMonitoring, shallowEqual);
  const { preferences } = useSelector((state) => state.user, shallowEqual);
  const { refreshCounter, activeMainTab } = useSelector((state) => state.layout, shallowEqual);
  const { isManualRefreshing, lastRefreshed, handleRefresh: refreshAll } = usePollingRefresh({
    hostUid: 'global',
    tabId: 'service_dashboard',
    pollingIntervalSeconds: preferences.dashboardInterval,
    onFetch: (silent) => async (dispatch) => {
      if (authorizedHosts.length === 0) return;
      await Promise.all(authorizedHosts.map(hostUid => 
        dispatch(fetchHostSummary(silent ? { hostUid, isBackground: true } : hostUid)).unwrap().catch(() => {})
      ));
    }
  });

  const handleRowDoubleClick = (row) => {
    const hostUid = row.uid;
    dispatch(setSelectedHost(hostUid));
    dispatch(setActiveMainTab(`host:${hostUid}`));
  };

  const handleStartService = (e, hostUid) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to start all CUBRID services on this host?')) {
      dispatch(startService(hostUid));
    }
  };

  const handleStopService = (e, hostUid) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to stop all CUBRID services on this host? This will stop all brokers and databases.')) {
      dispatch(stopService(hostUid));
    }
  };


  const columns = React.useMemo(() => [
    {
      header: 'GROUP/HOST',
      accessor: 'alias',
      render: (val, row) => {
        const isConnected = authorizedHosts.includes(row.uid);
        return (
          <div className="flex items-center gap-2">
            <Icon name={isConnected ? 'dns' : 'storage'} size="16px" className={isConnected ? 'text-amber-500' : 'text-slate-400'} />
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200 leading-tight">{val || row.id}</span>
              {isConnected && <span className="text-[10px] text-slate-400 font-normal">Active</span>}
            </div>
          </div>
        );
      }
    },
    { header: 'ADDRESS', accessor: 'ip', render: (v) => <span className="font-mono text-[11px] text-slate-500">{v || 'Localhost'}</span> },
    { header: 'PORT', accessor: 'port', render: (v) => <span className="font-mono text-[11px] text-slate-500">{v}</span> },
    { header: 'USER', accessor: 'user', render: (v, row) => <span className="text-[12px] text-slate-600 dark:text-slate-400">{row.user || row.id}</span> },
    { 
      header: 'PERMANENT', 
      accessor: 'permFree',
      render: (_, row) => {
        const v = summaries[row.uid]?.permFree;
        if (v === undefined || v === -1) return <span className="text-slate-300">—</span>;
        return <Badge variant={v > 30 ? 'success' : v > 10 ? 'warning' : 'danger'}>{v}%</Badge>;
      }
    },
    { 
      header: 'PERMANENTTEMP', 
      accessor: 'permTempFree',
      render: (_, row) => {
        const v = summaries[row.uid]?.permTempFree;
        if (v === undefined || v === -1) return <span className="text-slate-300">—</span>;
        return <Badge variant={v > 30 ? 'success' : v > 10 ? 'warning' : 'danger'}>{v}%</Badge>;
      }
    },
    { 
      header: 'TEMPTEMP', 
      accessor: 'tempTempFree',
      render: (_, row) => {
        const v = summaries[row.uid]?.tempTempFree;
        if (v === undefined || v === -1) return <span className="text-slate-300">—</span>;
        return <Badge variant={v > 30 ? 'success' : v > 10 ? 'warning' : 'danger'}>{v}%</Badge>;
      }
    },
    { 
      header: 'TPS', 
      accessor: 'tps',
      render: (_, row) => {
        const v = summaries[row.uid]?.tps || 0;
        return <span className="font-mono text-[12px] text-emerald-600 dark:text-emerald-400 font-bold">{v}</span>;
      }
    },
    { 
      header: 'QPS', 
      accessor: 'qps',
      render: (_, row) => <span className="font-mono text-[12px] text-slate-600 dark:text-slate-300">{summaries[row.uid]?.qps || 0}</span>
    },
    { 
      header: 'MEMORY', 
      accessor: 'memory',
      render: (_, row) => {
        const s = summaries[row.uid];
        if (!s) return <span className="text-slate-300">—</span>;
        return (
          <div className="min-w-[120px]">
            <span className="text-[11px] text-slate-700 dark:text-slate-200 font-mono font-semibold">{formatSize(s.memUsed)} / {formatSize(s.memTotal)}</span>
            <MetricBar pct={s.memory} />
          </div>
        );
      }
    },
    { 
      header: 'CPU', 
      accessor: 'cpu',
      render: (_, row) => {
        const s = summaries[row.uid];
        if (!s) return <span className="text-slate-300">—</span>;
        return (
          <div className="min-w-[80px]">
            <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-200">{(s.cpu || 0).toFixed(1)}%</span>
            <MetricBar pct={s.cpu} />
          </div>
        );
      }
    },
    { 
      header: 'DB STATUS', 
      accessor: 'dbStatus',
      render: (_, row) => {
        const s = summaries[row.uid];
        if (!s) return <span className="text-slate-300">—</span>;
        return (
          <div className="flex items-center gap-1.5 font-bold text-[10px]">
            <span className="text-emerald-500">ON: {s.dbOn}</span>
            <span className="text-slate-400">OFF: {s.dbOff}</span>
          </div>
        );
      }
    },
    { 
      header: 'ACTIONS', 
      accessor: 'actions',
      render: (_, row) => {
        const isConnected = authorizedHosts.includes(row.uid);
        if (!isConnected) return null;
        return (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => handleStartService(e, row.uid)}
              className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-90"
              title="Start Services"
            >
              <Icon name="play_arrow" size="16px" weight={400} />
            </button>
            <button 
              onClick={(e) => handleStopService(e, row.uid)}
              className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90"
              title="Stop Services"
            >
              <Icon name="stop" size="16px" weight={400} />
            </button>
          </div>
        );
      }
    },
  ], [authorizedHosts, summaries]);

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-background-dark overflow-hidden font-sans">
      <header className="px-6 py-2.5 border-b border-slate-100 dark:border-white/4 flex items-center justify-between shrink-0 sticky top-0 z-20 bg-linear-to-r from-amber-500/[0.03] to-transparent bg-white dark:bg-background-dark">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-sm">
            <Icon name="monitoring" size="sm" weight={300} className="text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Typography variant="h1" className="text-[13px] font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">Service Dashboard</Typography>
              <div className={`px-2 py-0.5 rounded-full border flex items-center gap-1.5 shrink-0 transition-all duration-300 ${preferences.dashboardInterval > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
                <div className={`w-1 h-1 rounded-full ${preferences.dashboardInterval > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span className={`text-[9px] font-bold ${preferences.dashboardInterval > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {preferences.dashboardInterval > 0 ? 'Live' : 'Paused'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
              <Typography variant="label" className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Global Health Overview</Typography>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[12px]">
          <Typography variant="label" className="text-[10px] text-slate-400 font-mono tracking-tight hidden lg:block mr-2">
            Synced {lastRefreshed.toLocaleTimeString('en-US', { hour12: true })}
          </Typography>

          <button
            onClick={refreshAll}
            disabled={isManualRefreshing || authorizedHosts.length === 0}
            className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all active:scale-[0.98]
              ${isManualRefreshing
                ? 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-white/5 cursor-not-allowed opacity-50'
                : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 hover:border-amber-500/50 hover:bg-white dark:hover:bg-white/5'}`}
            title="Refresh health status"
          >
            <Icon name="refresh" size="18px" className={isManualRefreshing ? 'animate-spin' : ''} />
          </button>

          <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 mx-0.5" />
          <MonitoringSettingsPopover />

          <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1" />
          <div className="flex items-center gap-4 px-3 py-1 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-lg shadow-xs">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-slate-400 leading-none">Hosts</span>
              <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200 leading-none mt-1">{hosts?.length || 0}</span>
            </div>
            <div className="w-px h-5 bg-slate-200 dark:bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-emerald-500 leading-none tracking-tight">Active</span>
              <span className="text-[13px] font-bold text-emerald-500 leading-none mt-1">{authorizedHosts?.length || 0}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <Card noPadding className="overflow-hidden border-slate-200 dark:border-white/10 shadow-sm rounded-xl bg-white dark:bg-white/1">
          <Table 
            columns={columns} 
            data={hosts} 
            onRowDoubleClick={handleRowDoubleClick}
            className="border-none text-[12px]" 
            hoverable
          />
        </Card>
        
        {authorizedHosts.length === 0 && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/10 flex items-center gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Icon name="dns" size="20px" />
            </div>
            <div className="flex flex-col">
              <Typography variant="body2" className="text-[12px] text-amber-800 dark:text-amber-400 font-bold uppercase tracking-tight">Sensors Offline</Typography>
              <Typography variant="caption" className="text-[11px] text-amber-600 dark:text-amber-500/70 font-medium">Connect to a host server from the navigator to activate global resource monitoring.</Typography>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(Component);
