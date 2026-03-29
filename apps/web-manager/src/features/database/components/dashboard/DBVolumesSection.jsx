import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { fetchDashboardVolumes } from '../../databaseSlice';
import { Icon } from '../../../../components/ds/foundation/Icon';
import { Table } from '../../../../components/ds/layout/Table';
import { Typography } from '../../../../components/ds/foundation/Typography';
import { Card } from '../../../../components/ds/layout/Card';

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

  const getFreeSeverity = (pct) => {
    if (pct < 10) return 'text-rose-500';
    if (pct < 25) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const getBarColor = (usedPct) => {
    if (usedPct > 85) return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]';
    if (usedPct > 50) return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]';
    return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
  };

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
        const cls = t.includes('PERMANENT')   ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                  : t.includes('TEMPORARY')   ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                  : t.includes('ACTIVE_LOG')  ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                  : t.includes('ARCHIVE_LOG') ? 'bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20'
                  : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
        return <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wide border ${cls}`}>{val}</span>;
      }
    },
    { header: 'Purpose', accessor: 'purpose', render: (val) => <span className="font-mono text-[12px] text-slate-400">{val}</span> },
    {
      header: 'Space Usage',
      accessor: 'free',
      render: (val, row) => {
        const rawFree = cleanInt(val);
        const total = cleanInt(row.total);
        const freePct = total > 0 ? (rawFree / total) * 100 : 0;
        const used = Math.max(0, total - rawFree);
        const usedPct = 100 - freePct;
        const isNaNData = total === 0;

        return (
          <div className="min-w-[220px] flex flex-col gap-1">
            <div className="flex justify-between items-end">
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                <span className="text-slate-700 dark:text-slate-200 font-bold">{used.toLocaleString()}</span> / {total.toLocaleString()}
              </span>

              <div className="flex items-center gap-2">
                <span className={`font-mono text-[11px] font-black tracking-tight ${getFreeSeverity(freePct)}`}>
                  {isNaNData ? '0' : Math.round(freePct)}% <span className="opacity-50 text-[9px] font-bold font-sans uppercase">free</span>
                </span>
              </div>
            </div>
            <div className="w-full h-1 bg-slate-100 dark:bg-white/6 rounded-full overflow-hidden flex">
               <div 
                className={`h-full transition-all duration-700 rounded-full ${getBarColor(usedPct)}`}
                style={{ width: `${isNaNData ? 0 : usedPct}%` }} 
              />
            </div>
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
