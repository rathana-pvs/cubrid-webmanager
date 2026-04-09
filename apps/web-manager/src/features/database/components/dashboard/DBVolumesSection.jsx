import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { fetchDashboardVolumes } from '../../databaseSlice';
import { Icon } from '../../../../components/ds/foundation/Icon';
import { Table } from '../../../../components/ds/layout/Table';
import { Typography } from '../../../../components/ds/foundation/Typography';
import { Card } from '../../../../components/ds/layout/Card';
import { ProgressBar } from '../../../../components/ds/foundation/ProgressBar';
import { StatusBadge } from '../../../../components/ds/foundation/StatusBadge';

export default function DBVolumesSection({ volumes, pollingProps }) {
  const dispatch = useDispatch();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { hostUid, dbname, isTabActive, autoRefresh, refreshInterval } = pollingProps;

  const refresh = () => {
    if (hostUid && dbname) dispatch(fetchDashboardVolumes({ hostUid, dbname }));
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



  const cleanInt = (v) => {
    if (typeof v === 'number') return v;
    if (!v) return 0;
    const cleaned = v.toString().replace(/,/g, '').split(' ')[0];
    return parseInt(cleaned) || 0;
  };

  const columns = [
    {
      header: 'Volume',
      accessor: 'name',
      render: (val) => {
        const name = val.split(/[/\\]/).pop() || val;
        return (
          <div className="flex items-center gap-2 min-w-0">
            <Icon name="draft" size="sm" weight={300} className="text-slate-300 dark:text-slate-600 shrink-0" />
            <span className="font-mono text-[12px] font-semibold text-slate-700 dark:text-slate-200 truncate">{name}</span>
          </div>
        );
      }
    },
    {
      header: 'Type',
      accessor: 'type',
      render: (val) => {
        const t = (val || '').toUpperCase();
        let variant = 'slate';
        if (t.includes('PERMANENT')) variant = 'sky';
        else if (t.includes('TEMPORARY')) variant = 'amber';
        else if (t.includes('ACTIVE_LOG')) variant = 'emerald';
        else if (t.includes('ARCHIVE_LOG')) variant = 'violet';
        
        return <StatusBadge label={val} variant={variant} />;
      }
    },
    { header: 'Purpose', accessor: 'purpose', render: (val) => <span className="font-mono text-[12px] text-slate-400">{val}</span> },
    {
      header: 'Space Usage',
      accessor: 'free',
      render: (val, row) => {
        const rawFree = cleanInt(val);
        const total = cleanInt(row.total);
        const used = Math.max(0, total - rawFree);
        const usedPct = total > 0 ? (used / total) * 100 : 0;
        const isNaNData = total === 0;

        return (
          <div className="min-w-[220px] pr-6">
            <ProgressBar 
              pct={isNaNData ? 0 : usedPct} 
              showValue 
              valueLabel={`${used.toLocaleString()} / ${total.toLocaleString()}`}
              variant="auto"
            />
          </div>
        );
      }
    },
    { header: 'Modified', accessor: 'date', render: (val) => <span className="font-mono text-[11px] text-slate-400">{val}</span> },
    {
      header: 'Path',
      accessor: 'path',
      render: (val) => (
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon name="folder" size="sm" weight={300} className="text-slate-300 dark:text-slate-600 shrink-0" />
          <span className="font-mono text-[11px] text-slate-400 truncate" title={val}>{val}</span>
        </div>
      )
    },
  ];

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <Icon name="storage" size="sm" weight={300} className="text-amber-500" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Storage Volumes</span>
        </div>
      }
      bodyClassName="p-0"
      collapsible
      isCollapsed={isCollapsed}
      onToggle={(v) => setIsCollapsed(v)}
    >
      <Table columns={columns} data={volumes} />
    </Card>
  );
}
