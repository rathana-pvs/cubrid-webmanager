import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { fetchMonitoringData, clearMonitoring } from '../../monitoringSlice';
import { Card } from '../../../../components/ds/layout/Card';
import { Table } from '../../../../components/ds/layout/Table';
import { Icon } from '../../../../components/ds/foundation/Icon';
import { Button } from '../../../../components/ds/foundation/Button';
import { Spinner } from '../../../../components/ds/foundation/Spinner';
import { Typography } from '../../../../components/ds/foundation/Typography';

const getStatusColor = (p) => {
  if (p > 85) return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]';
  if (p > 50) return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]';
  return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
};

const MetricBar = ({ pct }) => (
  <div className="w-full h-1 bg-slate-100 dark:bg-white/6 overflow-hidden mt-1 rounded-full">
    <div className={`h-full transition-all duration-700 ease-out ${getStatusColor(pct)}`} style={{ width: `${pct}%` }} />
  </div>
);

export default function SystemStatusSection({ hostUid, isTabActive = true }) {
  const dispatch = useDispatch();
  const hostData = useSelector((state) => state.monitoring.hostsData[hostUid] || {});
  const { currentStatus = {}, averages = {}, history = [], loading = false, error = null } = hostData;
  const { authorizedHosts } = useSelector((state) => state.host, shallowEqual);
  const isAuthorized = hostUid && authorizedHosts.includes(hostUid);

  const [isStopped, setIsStopped] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true); // Default to expanded
  const pollTimer     = useRef(null);
  const fetchCountRef = useRef(0);
  
  // Monitoring is active only if tab is visible AND section is expanded
  const isEffectivelyActive = isTabActive && isExpanded;
  const isActiveRef = useRef(isEffectivelyActive);

  // Sync ref with prop to avoid stale closures in timeouts
  useEffect(() => {
    isActiveRef.current = isEffectivelyActive;
    if (!isEffectivelyActive && pollTimer.current) {
      clearTimeout(pollTimer.current);
    }
  }, [isEffectivelyActive]);

  const scheduleNext = (delay) => {
    if (!isActiveRef.current) return;
    
    pollTimer.current = setTimeout(() => {
      if (!isAuthorized || !isActiveRef.current) { setIsStopped(true); return; }
      dispatch(fetchMonitoringData(hostUid));
      fetchCountRef.current += 1;
      const nextDelay = fetchCountRef.current < 15 ? 1000 : 30000;
      if (fetchCountRef.current < 30) scheduleNext(nextDelay);
      else setIsStopped(true);
    }, delay);
  };

  const startPolling = () => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    if (!isAuthorized || !isActiveRef.current) return;
    setIsStopped(false);
    fetchCountRef.current = 0;
    dispatch(clearMonitoring());
    dispatch(fetchMonitoringData(hostUid));
    scheduleNext(1000);
  };

  useEffect(() => {
    if (!hostUid || !isAuthorized || !isEffectivelyActive) {
      if (pollTimer.current) clearTimeout(pollTimer.current);
      return;
    }
    
    fetchCountRef.current = 0; 
    dispatch(fetchMonitoringData(hostUid));
    scheduleNext(1000);
    
    return () => { if (pollTimer.current) clearTimeout(pollTimer.current); };
  }, [hostUid, isAuthorized, isEffectivelyActive, dispatch]);

  const formatBytes = (bytes) => {
    if (bytes === undefined || bytes === null || isNaN(bytes)) return '-';
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const rows = [
    {
      id: 'now', time: 'Now',
      memory: currentStatus?.memTotal ? { 
        display: `${formatBytes(currentStatus.memUsed)} / ${formatBytes(currentStatus.memTotal)} (${(currentStatus.memory || 0).toFixed(1)}%)`, 
        pct: currentStatus.memory 
      } : null,
      disk: history[history.length - 1]?.disk || '-',
      cpu: { display: `${(currentStatus?.cpu || 0).toFixed(1)}%`, pct: currentStatus?.cpu || 0 },
      tps: (currentStatus?.tps || 0).toFixed(2),
      qps: (currentStatus?.qps || 0).toFixed(2),
    },
    {
      id: 'avg', time: '5 min Avg',
      memory: currentStatus?.memTotal ? { 
        display: `${formatBytes(currentStatus.memTotal * (averages?.memory || 0) / 100)} / ${formatBytes(currentStatus.memTotal)} (${(averages?.memory || 0).toFixed(1)}%)`,
        pct: averages?.memory || 0 
      } : { display: `${(averages?.memory || 0).toFixed(1)}%`, pct: averages?.memory || 0 },
      disk: '-',
      cpu: { display: `${(averages?.cpu || 0).toFixed(1)}%`, pct: averages?.cpu || 0 },
      tps: (averages?.tps || 0).toFixed(2),
      qps: (averages?.qps || 0).toFixed(2),
    }
  ];

  const columns = [
    { header: 'Period', accessor: 'time', render: (val) => <span className="font-semibold text-[12px] text-slate-600 dark:text-slate-300">{val}</span> },
    {
      header: 'Memory',
      accessor: 'memory',
      render: (val) => val ? (
        <div className="min-w-[150px]">
          <span className="font-mono text-[12px] font-semibold text-slate-700 dark:text-slate-200">{val.display}</span>
          <MetricBar pct={val.pct} />
        </div>
      ) : <span className="text-slate-300">—</span>
    },
    { header: 'Disk', accessor: 'disk', render: (val) => <span className="font-mono text-[12px] text-slate-500">{val}</span> },
    {
      header: 'CPU',
      accessor: 'cpu',
      render: (val) => val ? (
        <div className="min-w-[100px]">
          <span className="font-mono text-[12px] font-semibold text-slate-700 dark:text-slate-200">{val.display}</span>
          <MetricBar pct={val.pct} />
        </div>
      ) : <span className="text-slate-300">—</span>
    },
    { 
      header: 'TPS', 
      accessor: 'tps', 
      render: (val) => {
        const v = parseFloat(val);
        const color = v === 0 ? 'text-slate-400 dark:text-slate-600' : v > 500 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400';
        return <span className={`font-mono text-[12px] ${color} font-semibold transition-colors duration-500`}>{val}</span>;
      }
    },
    { 
      header: 'QPS', 
      accessor: 'qps', 
      render: (val) => {
        const v = parseFloat(val);
        const color = v === 0 ? 'text-slate-400 dark:text-slate-600' : v > 1000 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400';
        return <span className={`font-mono text-[12px] ${color} font-semibold transition-colors duration-500`}>{val}</span>;
      }
    },
  ];

  return (
    <Card
      title={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Icon name="bar_chart" size="sm" weight={300} className="text-amber-500" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">System Status</span>
            <span className="text-[10px] text-slate-400 font-normal ml-1">
              {isStopped ? '· Paused' : '· Live'}
            </span>
          </div>
          {isStopped && (
            <button 
              onClick={startPolling}
              className="px-2 py-0.5 rounded-sm bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-bold text-amber-500 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex items-center gap-1"
            >
              <Icon name="refresh" size="12px" />
              Resume
            </button>
          )}
        </div>
      }
      collapsible
      isCollapsed={!isExpanded}
      onToggle={(collapsed) => setIsExpanded(!collapsed)}
    >
      {error && (
        <div className="px-4 py-2 text-[11px] text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-b border-rose-200 dark:border-rose-500/20">
          {typeof error === 'object' ? (error.message || error.note || JSON.stringify(error)) : error}
        </div>
      )}
      <Table columns={columns} data={rows} className="font-mono text-[12px]" />
    </Card>
  );
}
