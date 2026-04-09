import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { fetchDashboardLocks } from '../../databaseSlice';
import { Icon } from '../../../../components/ds/foundation/Icon';
import { Table } from '../../../../components/ds/layout/Table';
import { Card } from '../../../../components/ds/layout/Card';
import { StatusBadge } from '../../../../components/ds/foundation/StatusBadge';
import { EmptyState } from '../../../../components/ds/feedback/EmptyState';

export default function DBLockTransactionSection({ locks, pollingProps }) {
  const dispatch = useDispatch();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { hostUid, dbname, isTabActive, autoRefresh, refreshInterval } = pollingProps;

  const refresh = () => {
    if (hostUid && dbname) dispatch(fetchDashboardLocks({ hostUid, dbname }));
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

  const columns = [
    { header: '#',       accessor: 'index', render: (val) => <span className="font-mono text-[12px] text-slate-400">{val}</span> },
    { header: 'User',    accessor: 'user',  render: (val) => <span className="font-mono text-[12px] font-semibold text-slate-700 dark:text-slate-200">{val}</span> },
    { header: 'Host',    accessor: 'host',  render: (val) => <span className="font-mono text-[12px] text-slate-400">{val}</span> },
    { header: 'PID',     accessor: 'pid',   render: (val) => <span className="font-mono text-[12px] text-slate-400">{val}</span> },
    { header: 'Object',  accessor: 'obj',   render: (val) => <span className="font-mono text-[12px] text-slate-500">{val}</span> },
    {
      header: 'Lock Mode',
      accessor: 'mode',
      render: (val) => {
        const isX = val?.includes('X_');
        return (
          <StatusBadge 
            label={val} 
            variant={isX ? 'rose' : 'amber'} 
            pulse={isX} 
          />
        );
      }
    },
  ];

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <Icon name="lock" size="sm" weight={300} className="text-amber-500" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Active Transactions & Locks</span>
          <span className="text-[10px] text-slate-400 font-normal ml-1">· Concurrency Status</span>
          {locks.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-sm bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 text-[10px] font-bold">
              {locks.length}
            </span>
          )}
        </div>
      }
      bodyClassName="p-0"
      collapsible
      isCollapsed={isCollapsed}
      onToggle={(v) => setIsCollapsed(v)}
    >
      <Table 
        columns={columns} 
        data={locks} 
        emptyState={
          <EmptyState 
            icon="verified_user" 
            title="Clean Concurrency" 
            subtitle="No active transactions or locks are currently contending for resources."
            py="py-12"
          />
        }
      />
    </Card>
  );
}
