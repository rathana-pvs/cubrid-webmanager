import React, { useEffect, useMemo, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDatabaseSpaceInfo } from '../databaseSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Table } from '../../../components/ds/layout/Table';
import { Card } from '../../../components/ds/layout/Card';

// ── Helpers ──
const CATEGORY_META = {
  Permanent_PermanentData: { label: 'Permanent Data', icon: 'hard_drive', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: 'bg-blue-500' },
  Permanent_TemporaryData: { label: 'Permanent Temp', icon: 'storage', color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20', dot: 'bg-violet-500' },
  Temporary_TemporaryData: { label: 'Temporary Data', icon: 'timer', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-500' },
  Active: { label: 'Active Log', icon: 'article', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
  Archive: { label: 'Archive Log', icon: 'inventory_2', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-400/20', dot: 'bg-slate-400' },
};

const formatSize = (pages, pageSize) => {
  const bytes = parseInt(pages) * pageSize;
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(2)} KB`;
};

const formatMB = (pages, pageSize) => ((parseInt(pages) * pageSize) / (1024 * 1024)).toFixed(1);

// ── Sub-components (Memoized) ──

const CategoryHeader = memo(({ meta, summary, usageSeverity, pageSize }) => (
  <header className="px-6 py-4 border-b border-slate-100 dark:border-white/4 flex items-center justify-between shrink-0 bg-white dark:bg-background-dark">
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg ${meta.bg} ${meta.border} border flex items-center justify-center shrink-0`}>
        <Icon name={meta.icon} size="sm" weight={300} className={meta.color} />
      </div>
      <div>
        <Typography variant="h1" className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
          Volume Category Monitor
        </Typography>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          <Typography variant="label" className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            {meta.label}
          </Typography>
        </div>
      </div>
    </div>

    <div className="hidden md:flex items-center gap-6">
      <div className="text-right">
        <Typography variant="label" className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest block mb-0.5">Capacity</Typography>
        <Typography variant="p" className="text-sm font-black text-slate-700 dark:text-slate-200 font-mono leading-none">{formatSize(summary.total, pageSize)}</Typography>
      </div>
      <div className="w-px h-8 bg-slate-200 dark:bg-white/6" />
      <div className="text-right">
        <Typography variant="label" className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest block mb-0.5">Utilization</Typography>
        <Typography variant="p" className={`text-sm font-black font-mono leading-none ${usageSeverity}`}>{summary.pct.toFixed(1)}%</Typography>
      </div>
    </div>
  </header>
));

const CategoryStats = memo(({ volumes, summary, pageSize }) => (
  <div className="grid grid-cols-3 gap-4">
    {[
      { label: 'Volumes', val: volumes.length, icon: 'layers', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-100 dark:border-blue-500/20' },
      { label: 'Used', val: formatSize(summary.used, pageSize), icon: 'data_usage', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20' },
      { label: 'Free', val: formatSize(summary.free, pageSize), icon: 'check_circle', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20' },
    ].map((stat, i) => (
      <div key={i} className={`px-5 py-4 rounded-xl ${stat.bg} border ${stat.border} flex items-center gap-4`}>
        <div className={`w-8 h-8 rounded-lg bg-white dark:bg-black/20 flex items-center justify-center shadow-xs shrink-0 ${stat.color}`}>
          <Icon name={stat.icon} size="sm" weight={300} />
        </div>
        <div>
          <Typography variant="label" className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">{stat.label}</Typography>
          <Typography variant="p" className="text-sm font-black text-slate-700 dark:text-slate-100 font-mono tracking-tight">{stat.val}</Typography>
        </div>
      </div>
    ))}
  </div>
));

const UtilizationBar = memo(({ summary, usageSeverity, pageSize }) => (
  <div className="bg-white dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-xl px-5 py-4">
    <div className="flex items-center justify-between mb-2">
      <Typography variant="label" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Overall Utilization</Typography>
      <Typography variant="label" className={`text-[10px] font-black font-mono ${usageSeverity}`}>{summary.pct.toFixed(2)}%</Typography>
    </div>
    <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-none overflow-hidden">
      <div
        className="h-full bg-amber-500 transition-all duration-1s ease-out relative"
        style={{ width: `${summary.pct}%` }}
      >
        <div className="absolute inset-0 bg-white/20" />
      </div>
    </div>
    <div className="flex justify-between mt-1.5">
      <Typography variant="label" className="text-[9px] text-slate-400 font-mono">{formatSize(summary.used, pageSize)} used</Typography>
      <Typography variant="label" className="text-[9px] text-slate-400 font-mono">{formatSize(summary.free, pageSize)} free</Typography>
    </div>
  </div>
));

const VolumeTableContainer = memo(({ volumes, pageSize }) => (
  <Card bodyClassName="p-0 overflow-hidden" className="border-slate-200 dark:border-white/5 shadow-xs bg-white dark:bg-white/1">
    <Table
      columns={[
        {
          header: 'Volume Name',
          accessor: 'spacename',
          render: (val) => {
            const fileName = val?.split(/[/\\]/).pop() || val;
            return (
              <div className="flex items-center gap-3 py-0.5">
                <div className="w-7 h-7 rounded-sm bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
                  <Icon name="draft" size="sm" weight={300} />
                </div>
                <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 font-mono" title={val}>
                  {fileName}
                </span>
              </div>
            );
          }
        },
        {
          header: 'Allocation',
          accessor: 'usedpage',
          render: (val, row) => {
            const usedPages = parseInt(val || 0);
            const totalPages = parseInt(row.totalpage || 0);
            const pct = totalPages > 0 ? (usedPages / totalPages) * 100 : 0;
            const barColor = pct > 85 ? 'bg-rose-500' : pct > 60 ? 'bg-amber-500' : 'bg-blue-500';
            return (
              <div className="flex flex-col gap-1.5 py-1 min-w-[240px]">
                <div className="w-full h-1.5 bg-slate-100 dark:bg-white/6 overflow-hidden">
                  <div className={`h-full ${barColor} transition-all duration-700ms`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-bold font-mono text-slate-500">{formatMB(usedPages, pageSize)} MB used</span>
                  <span className="text-[10px] font-bold font-mono text-slate-400">{pct.toFixed(1)}%</span>
                </div>
              </div>
            );
          }
        },
        {
          header: 'Provisioned',
          accessor: 'totalpage',
          className: 'text-right',
          render: (val) => (
            <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300 font-mono">{formatSize(val, pageSize)}</span>
          )
        },
        {
          header: 'Pages',
          accessor: 'totalpage',
          className: 'text-right pr-4',
          render: (val) => (
            <span className="text-[12px] text-slate-400 font-mono">
              {parseInt(val).toLocaleString()}
            </span>
          )
        }
      ]}
      data={volumes}
    />
  </Card>
));

// ── Main Component ──

export default function VolumeCategoryMonitor({ hostUid, dbname, category }) {
  const dispatch = useDispatch();
  const { spaceInfo, spaceInfoLoading } = useSelector((state) => state.database);
  const dbSpace = spaceInfo[dbname];
  const isLoading = spaceInfoLoading?.[dbname];

  useEffect(() => {
    if (!dbSpace && !isLoading && hostUid) {
      dispatch(fetchDatabaseSpaceInfo({ hostUid, dbname }));
    }
  }, [dispatch, hostUid, dbname, dbSpace, isLoading]);

  const meta = CATEGORY_META[category] || CATEGORY_META.Permanent_PermanentData;

  const volumes = useMemo(() => {
    if (!dbSpace || !dbSpace.volumes) return [];
    const allVolumes = dbSpace.volumes;
    switch (category) {
      case 'Permanent_PermanentData': return allVolumes.filter(v => v.type === 'PERMANENT' && (v.purpose === 'PERMANENT' || !v.purpose));
      case 'Permanent_TemporaryData': return allVolumes.filter(v => v.type === 'PERMANENT' && v.purpose === 'TEMPORARY');
      case 'Temporary_TemporaryData': return allVolumes.filter(v => v.type === 'TEMPORARY');
      case 'Active': return allVolumes.filter(v => v.type === 'Active_log');
      case 'Archive': return allVolumes.filter(v => v.type === 'Archive_log');
      default: return [];
    }
  }, [dbSpace, category]);

  const pageSize = parseInt(dbSpace?.pagesize || 4096);

  const summary = useMemo(() => {
    let total = 0, used = 0;
    volumes.forEach(v => {
      total += parseInt(v.totalpage || 0);
      used += parseInt(v.usedpage || 0);
    });
    return { total, used, free: total - used, pct: total > 0 ? (used / total) * 100 : 0 };
  }, [volumes]);

  const usageSeverity = summary.pct > 85 ? 'text-rose-500' : summary.pct > 60 ? 'text-amber-500' : 'text-emerald-500';

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-background-dark overflow-hidden select-none animate-in fade-in duration-300">
      <CategoryHeader 
        meta={meta} 
        summary={summary} 
        usageSeverity={usageSeverity} 
        pageSize={pageSize} 
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-5">
          <CategoryStats volumes={volumes} summary={summary} pageSize={pageSize} />
          <UtilizationBar summary={summary} usageSeverity={usageSeverity} pageSize={pageSize} />
          <VolumeTableContainer volumes={volumes} pageSize={pageSize} />
        </div>
      </div>

      <footer className="px-6 py-3 border-t border-slate-100 dark:border-white/4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <Typography variant="label" className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Live</Typography>
        </div>
        <Typography variant="caption" className="text-[9px] text-slate-300 dark:text-slate-600 font-mono">{dbname}</Typography>
      </footer>
    </div>
  );
}
