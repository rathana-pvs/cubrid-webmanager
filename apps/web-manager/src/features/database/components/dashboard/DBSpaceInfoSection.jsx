import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { fetchDatabaseSpaceInfo } from '../../databaseSlice';
import { Icon } from '../../../../components/ds/foundation/Icon';
import { Table } from '../../../../components/ds/layout/Table';
import { Card } from '../../../../components/ds/layout/Card';

export default function DBSpaceInfoSection({ spaceInfo, pollingProps }) {
  const dispatch = useDispatch();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { hostUid, dbname, isTabActive, autoRefresh, refreshInterval } = pollingProps;

  const refresh = () => {
    if (hostUid && dbname) dispatch(fetchDatabaseSpaceInfo({ hostUid, dbname }));
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
    {
      header: 'Type',
      accessor: 'type',
      render: (val) => (
        <span className="px-2 py-0.5 rounded-sm bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 font-bold text-[10px] uppercase tracking-wide">
          {val}
        </span>
      )
    },
    { header: 'Files',     accessor: 'fileCount',      render: (val) => <span className="font-mono text-[12px]">{val}</span> },
    { header: 'Used',      accessor: 'usedPages',      render: (val) => <span className="font-mono text-[12px] font-semibold text-slate-700 dark:text-slate-200">{val}</span> },
    { header: 'File Table',accessor: 'fileTablePages',  render: (val) => <span className="font-mono text-[12px] text-slate-400">{val}</span> },
    { header: 'Reserved',  accessor: 'reservedPages',   render: (val) => <span className="font-mono text-[12px] text-slate-400">{val}</span> },
    { header: 'Total',     accessor: 'totalPages',      render: (val) => <span className="font-mono text-[12px] font-bold">{val}</span> },
  ];

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <Icon name="file_present" size="sm" weight={300} className="text-amber-500" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">File Distribution</span>
          <span className="text-[10px] text-slate-400 font-normal ml-1">· Logical Partitioning</span>
        </div>
      }
      bodyClassName="p-0"
      collapsible
      isCollapsed={isCollapsed}
      onToggle={(v) => setIsCollapsed(v)}
    >
      <Table columns={columns} data={spaceInfo} />
    </Card>
  );
}
