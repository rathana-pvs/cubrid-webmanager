import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { fetchDashboardPerformance } from '../../databaseSlice';
import { Icon } from '../../../../components/ds/foundation/Icon';
import { Table } from '../../../../components/ds/layout/Table';
import { Typography } from '../../../../components/ds/foundation/Typography';
import { Card } from '../../../../components/ds/layout/Card';
import { ProgressBar } from '../../../../components/ds/foundation/ProgressBar';



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
        <div className="min-w-[90px] pr-4">
          <ProgressBar 
            pct={row.cpuPct} 
            showValue 
            valueLabel={val} 
            variant="auto"
          />
        </div>
      )
    },
    {
      header: 'Memory',
      accessor: 'memory',
      render: (val, row) => (
        <div className="min-w-[100px] pr-4">
          <ProgressBar 
            pct={row.memPct} 
            showValue 
            valueLabel={val} 
            variant="auto"
          />
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
        <div className="min-w-[100px] pr-4">
          <ProgressBar 
            pct={row.hitPct} 
            showValue 
            valueLabel={val} 
            variant={row.hitPct < 85 ? 'rose' : 'emerald'}
          />
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
