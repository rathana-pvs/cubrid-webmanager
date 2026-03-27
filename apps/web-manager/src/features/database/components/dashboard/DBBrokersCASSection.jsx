import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { fetchDashboardCAS } from '../../databaseSlice';
import { Icon } from '../../../../components/ds/foundation/Icon';
import { Table } from '../../../../components/ds/layout/Table';
import { Card } from '../../../../components/ds/layout/Card';

export default function DBBrokersCASSection({ brokersCAS, pollingProps, onViewSQLLog, onViewSlowQueryLog, onRestartCAS }) {
  const dispatch = useDispatch();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { hostUid, dbname, isTabActive, autoRefresh, refreshInterval } = pollingProps;

  const refresh = () => {
    if (hostUid && dbname) dispatch(fetchDashboardCAS({ hostUid, dbname }));
  };

  const wasActiveAndExpanded = useRef(isTabActive && !isCollapsed);
  useEffect(() => {
    const currentActiveAndExpanded = isTabActive && !isCollapsed;
    if (currentActiveAndExpanded && !wasActiveAndExpanded.current) {
      refresh();
    }
    wasActiveAndExpanded.current = currentActiveAndExpanded;
  }, [isTabActive, isCollapsed, hostUid, dbname]);

  useEffect(() => {
    let interval;
    if (isTabActive && !isCollapsed && autoRefresh && hostUid && dbname) {
      interval = setInterval(refresh, refreshInterval * 1000);
    }
    return () => clearInterval(interval);
  }, [isTabActive, isCollapsed, autoRefresh, refreshInterval, hostUid, dbname]);

  const readyCount = brokersCAS.filter(c => c.status === 'READY').length;
  const busyCount  = brokersCAS.length - readyCount;

  const columns = [
    {
      header: 'Broker',
      accessor: 'broker',
      render: (val) => <span className="font-mono text-[12px] font-semibold text-slate-700 dark:text-slate-200 uppercase">{val}</span>
    },
    { header: 'CAS', accessor: 'id',  render: (val) => <span className="font-mono text-[12px] text-slate-400">{val}</span> },
    { header: 'PID', accessor: 'pid', render: (val) => <span className="font-mono text-[12px] text-slate-400">{val}</span> },
    { header: 'QPS', accessor: 'qps', render: (val) => <span className="font-mono text-[12px] text-amber-600 dark:text-amber-400 font-semibold">{val}</span> },
    { header: 'LQS', accessor: 'lqs', render: (val) => <span className="font-mono text-[12px] text-slate-500">{val}</span> },
    {
      header: 'Status',
      accessor: 'status',
      render: (val) => {
        const ready = val === 'READY';
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
            ${ready
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
              : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${ready ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            {val}
          </span>
        );
      }
    },
    { header: 'Last Conn', accessor: 'lastConn', render: (val) => <span className="font-mono text-[11px] text-slate-400">{val}</span> },
    {
      header: 'Actions',
      accessor: 'actions',
      align: 'center',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => onRestartCAS?.(row)} title="Restart CAS" className="p-1.5 rounded-sm hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-amber-500 transition-colors">
            <Icon name="restart_alt" size="sm" weight={300} />
          </button>
          <button onClick={() => onViewSQLLog?.(row)} title="SQL Logs" className="p-1.5 rounded-sm hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-sky-500 transition-colors">
            <Icon name="terminal" size="sm" weight={300} />
          </button>
          <button onClick={() => onViewSlowQueryLog?.(row)} title="Slow Query Logs" className="p-1.5 rounded-sm hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-rose-500 transition-colors">
            <Icon name="timer_off" size="sm" weight={300} />
          </button>
        </div>
      )
    },
  ];

  return (
    <Card
      title={
        <div className="flex items-center gap-3">
          <Icon name="dns" size="sm" weight={300} className="text-amber-500" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">CAS Brokers</span>
          <div className="flex items-center gap-2 ml-2">
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {readyCount} ready
            </span>
            <span className="text-slate-200 dark:text-white/10">·</span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {busyCount} busy
            </span>
          </div>
        </div>
      }
      bodyClassName="p-0"
      collapsible
      isCollapsed={isCollapsed}
      onToggle={(v) => setIsCollapsed(v)}
    >
      <Table columns={columns} data={brokersCAS} />
    </Card>
  );
}
