import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { fetchDashboardPerformance } from '../../databaseSlice';
import { Icon } from '../../../../components/ds/foundation/Icon';
import { Table } from '../../../../components/ds/layout/Table';
import { Typography } from '../../../../components/ds/foundation/Typography';
import { Card } from '../../../../components/ds/layout/Card';

const Bar = ({ pct, colorClass }) => (
  <div className="w-full h-1 bg-slate-100 dark:bg-white/6 rounded-full overflow-hidden mt-1 flex">
    <div className={`h-full ${colorClass} transition-all duration-700 rounded-full`} style={{ width: `${pct}%` }} />
  </div>
);

export default function DBPerformanceSection({ dbStats, pollingProps }) {
  const dispatch = useDispatch();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { hostUid, dbname, isTabActive, autoRefresh, refreshInterval } = pollingProps;

  // Manual refresh helper
  const refresh = () => {
    if (hostUid && dbname) dispatch(fetchDashboardPerformance({ hostUid, dbname }));
  };

  // Logic: Refresh once when becoming visible AND expanded
  const wasActiveAndExpanded = useRef(isTabActive && !isCollapsed);
  useEffect(() => {
    const currentActiveAndExpanded = isTabActive && !isCollapsed;
    if (currentActiveAndExpanded && !wasActiveAndExpanded.current) {
      refresh();
    }
    wasActiveAndExpanded.current = currentActiveAndExpanded;
  }, [isTabActive, isCollapsed, hostUid, dbname]);

  // Logic: Interval polling when active AND expanded AND autoRefresh enabled
  useEffect(() => {
    let interval;
    if (isTabActive && !isCollapsed && autoRefresh && hostUid && dbname) {
      interval = setInterval(refresh, refreshInterval * 1000);
    }
    return () => clearInterval(interval);
  }, [isTabActive, isCollapsed, autoRefresh, refreshInterval, hostUid, dbname]);

  const columns = [
    {
      header: 'CPU',
      accessor: 'cpu',
      render: (val, row) => (
        <div className="min-w-[90px]">
          <span className="font-mono text-[12px] font-semibold text-slate-700 dark:text-slate-200">{val}</span>
          <Bar pct={row.cpuPct} colorClass={row.cpuPct > 85 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : row.cpuPct > 50 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'} />
        </div>
      )
    },
    {
      header: 'Memory',
      accessor: 'memory',
      render: (val, row) => (
        <div className="min-w-[100px]">
          <span className="font-mono text-[12px] font-semibold text-slate-700 dark:text-slate-200">{val}</span>
          <Bar pct={row.memPct} colorClass={row.memPct > 85 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : row.memPct > 50 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'} />
        </div>
      )
    },
    {
      header: 'TPS',
      accessor: 'tps',
      render: (val) => {
        const v = parseFloat(val);
        const color = v > 0 ? 'text-emerald-500' : 'text-slate-400';
        return (
          <div className="flex flex-col">
            <span className={`font-mono text-[18px] font-black leading-none transition-colors duration-500 ${color}`}>{val}</span>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">Trans/sec</span>
          </div>
        );
      }
    },
    {
      header: 'QPS',
      accessor: 'qps',
      render: (val) => {
        const v = parseInt(val.replace(/,/g, ''));
        const color = v > 0 ? 'text-rose-500' : 'text-slate-400';
        return (
          <div className="flex flex-col">
            <span className={`font-mono text-[18px] font-black leading-none transition-colors duration-500 ${color}`}>{val}</span>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">Queries/sec</span>
          </div>
        );
      }
    },
    {
      header: 'Buffer Hit',
      accessor: 'hitRatio',
      render: (val, row) => (
        <div className="min-w-[100px]">
          <span className="font-mono text-[12px] font-semibold text-slate-700 dark:text-slate-200">{val}</span>
          <Bar pct={row.hitPct} colorClass={row.hitPct < 85 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'} />
        </div>
      )
    },
    { header: 'Fetches/s',   accessor: 'fetch',    render: (val) => <span className="font-mono text-[12px] text-slate-500">{val}</span> },
    { header: 'Dirty/s',     accessor: 'dirty',    render: (val) => <span className="font-mono text-[12px] text-slate-500">{val}</span> },
    { header: 'IO Reads/s',  accessor: 'ioReads',  render: (val) => <span className="font-mono text-[12px] text-slate-500">{val}</span> },
    { header: 'IO Writes/s', accessor: 'ioWrites', render: (val) => <span className="font-mono text-[12px] text-slate-500">{val}</span> },
  ];

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <Icon name="monitoring" size="sm" weight={300} className="text-amber-500" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Performance Metrics</span>
          <span className="text-[10px] text-slate-400 font-normal ml-1">· Real-time</span>
        </div>
      }
      bodyClassName="p-0"
      collapsible
      isCollapsed={isCollapsed}
      onToggle={(v) => setIsCollapsed(v)}
    >
      <Table columns={columns} data={dbStats} hoverable={false} />
    </Card>
  );
}
