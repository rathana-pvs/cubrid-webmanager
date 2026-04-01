import { usePollingRefresh } from '../../../infrastructure/hooks/usePollingRefresh';
import React, { useState, useCallback, useMemo, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { databaseApi } from '../databaseApi';
import { openTab } from '../../layout/layoutSlice';
import MonitoringSettingsPopover from '../../user/components/MonitoringSettingsPopover';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Card } from '../../../components/ds/layout/Card';
import { Table } from '../../../components/ds/layout/Table';

// ── Helpers ──
const TYPE_BADGE = (val = '') => {
  const t = val.toUpperCase();
  if (t.includes('PERMANENT')) return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
  if (t.includes('TEMPORARY')) return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
  if (t.includes('ACTIVE_LOG')) return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
  if (t.includes('ARCHIVE_LOG')) return 'bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20';
  return 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
};

const cleanInt = (v) => {
  if (typeof v === 'number') return v;
  if (!v) return 0;
  const cleaned = v.toString().replace(/,/g, '').split(' ')[0];
  return parseInt(cleaned) || 0;
};

const formatSize = (bytes) => {
  const b = cleanInt(bytes);
  if (b === 0) return '0 B';
  if (b >= 1024 ** 4) return `${(b / 1024 ** 4).toFixed(2)} TB`;
  if (b >= 1024 ** 3) return `${(b / 1024 ** 3).toFixed(2)} GB`;
  if (b >= 1024 ** 2) return `${(b / 1024 ** 2).toFixed(2)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(2)} KB`;
  return `${b} B`;
};

const formatPages = (pages) => cleanInt(pages).toLocaleString();

const getFreeSeverity = (pct) => {
  if (pct < 10) return 'text-rose-500';
  if (pct < 25) return 'text-amber-500';
  return 'text-emerald-500';
};

const usageSeverity = (pct) => pct > 85 ? 'text-rose-500' : pct > 60 ? 'text-amber-500' : 'text-emerald-500';
const barColor = (pct) => pct > 85 ? 'bg-rose-500' : 'bg-amber-500';

// ── Sub-components (Memoized) ──

const StatusHeader = memo(({ dbname, lastRefreshed, loading, onRefresh, dashboardInterval }) => (
  <header className="px-6 py-2.5 border-b border-slate-100 dark:border-white/4 flex items-center justify-between shrink-0 sticky top-0 z-10 bg-white dark:bg-background-dark">
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-sm">
        <Icon name="donut_small" size="sm" weight={300} className="text-amber-500" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <Typography variant="h1" className="text-[13px] font-bold text-slate-800 dark:text-slate-100 leading-tight">
            Database Space Monitor
          </Typography>
          <div className={`px-2 py-0.5 rounded-full border flex items-center gap-1.5 shrink-0 transition-all duration-300 ${dashboardInterval > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
            <div className={`w-1 h-1 rounded-full ${dashboardInterval > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className={`text-[9px] font-bold ${dashboardInterval > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
              {dashboardInterval > 0 ? 'Live' : 'Paused'}
            </span>
          </div>
        </div>
        <Typography variant="label" className="text-[9px] text-slate-400 font-mono tracking-tight">{dbname}</Typography>
      </div>
    </div>
    
    <div className="flex items-center gap-1.5">
      <Typography variant="label" className="text-[10px] text-slate-400 font-mono tracking-tight hidden lg:block mr-2">
        Synced {lastRefreshed.toLocaleTimeString('en-US', { hour12: true })}
      </Typography>
      <button
        onClick={onRefresh}
        disabled={loading}
        className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all active:scale-[0.98]
          ${loading
            ? 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-white/5 cursor-not-allowed opacity-50'
            : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 hover:border-amber-500/50 hover:bg-white dark:hover:bg-white/5'}`}
        title="Refresh space metrics"
      >
        <Icon name="refresh" size="18px" weight={300} className={loading ? 'animate-spin' : ''} />
      </button>

      <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 mx-0.5" />
      <MonitoringSettingsPopover />
    </div>
  </header>
));

const SummaryCards = memo(({ dbname, data, totals }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    <div className="bg-white dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-sm p-3.5 flex flex-col gap-1.5">
      <Typography variant="label" className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Database</Typography>
      <Typography variant="p" className="text-[13px] font-bold text-slate-700 dark:text-slate-200 font-mono truncate">{data?.dbname || dbname}</Typography>
    </div>
    <div className="bg-white dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-sm p-3.5 flex flex-col gap-1">
      <Typography variant="label" className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Used</Typography>
      <Typography variant="p" className="text-base font-black text-slate-700 dark:text-slate-100 font-mono leading-none">{formatSize(totals?.used)}</Typography>
      <Typography variant="label" className="text-[9px] text-slate-400">of {formatSize(totals?.total)}</Typography>
    </div>
    <div className="bg-white dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-sm p-3.5 flex flex-col gap-1">
      <Typography variant="label" className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Free</Typography>
      <Typography variant="p" className="text-base font-black text-emerald-500 font-mono leading-none">{formatSize(totals?.free)}</Typography>
      <Typography variant="label" className="text-[9px] text-slate-400">headroom available</Typography>
    </div>
    <div className="bg-white dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-sm p-3.5 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <Typography variant="label" className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Usage</Typography>
        <Typography variant="label" className={`text-[9px] font-black font-mono ${usageSeverity(totals?.pct || 0)}`}>{(totals?.pct || 0).toFixed(1)}%</Typography>
      </div>
      <div className="w-full h-1 bg-slate-100 dark:bg-white/6 overflow-hidden mt-1.5">
        <div
          className={`h-full ${barColor(totals?.pct || 0)} transition-all duration-1000`}
          style={{ width: `${totals?.pct || 0}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <Typography variant="label" className="text-[9px] text-slate-400 font-mono">PG {data?.pagesize}B</Typography>
        <Typography variant="label" className="text-[9px] text-slate-400 font-mono">LOG {data?.logpagesize}B</Typography>
      </div>
    </div>
  </div>
));

const VolumeCategorization = memo(({ hostUid, dbname, dbinfo }) => {
  const dispatch = useDispatch();

  const handleOpenCategory = (type) => {
    let category = 'Permanent_PermanentData';
    const t = type.toUpperCase();
    if (t.includes('TEMPORARY')) {
       category = t.includes('PERMANENT') ? 'Permanent_TemporaryData' : 'Temporary_TemporaryData';
    } else if (t.includes('ACTIVE')) {
       category = 'Active';
    } else if (t.includes('ARCHIVE')) {
       category = 'Archive';
    }
    
    dispatch(openTab(`vol_category:${hostUid}:${dbname}:${category}`));
  };

  return (
    <Card
      title={
        <div className="flex items-center gap-1.5">
          <Icon name="layers" size="xs" weight={300} className="text-amber-500" />
          <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">Volume Categorization</span>
        </div>
      }
      bodyClassName="p-0"
      collapsible
    >
      <Table
        columns={[
          {
            header: 'Type',
            accessor: 'type',
            width: '140px',
            render: (val) => (
              <button 
                onClick={() => handleOpenCategory(val)}
                className={`px-1.5 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-tight border hover:brightness-110 active:scale-95 transition-all text-left ${TYPE_BADGE(val)}`}
              >
                {val}
              </button>
            )
          },
          { header: 'Qty', accessor: 'volume_count', className: 'text-center', width: '60px' },
          { header: 'Used', accessor: 'used_size', render: (val) => <span className="font-mono text-[11px]">{formatSize(val)}</span> },
          { header: 'Free', accessor: 'free_size', render: (val) => <span className="font-mono text-[11px] text-slate-400">{formatSize(val)}</span> },
          { header: 'Total', accessor: 'total_size', render: (val) => <span className="font-mono text-[11px] font-bold">{formatSize(val)}</span> },
          {
            header: 'Usage',
            accessor: 'pct',
            render: (_, row) => {
              const used = cleanInt(row.used_size);
              const total = cleanInt(row.total_size);
              const pct = total > 0 ? (used / total) * 100 : 0;
              return (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-slate-100 dark:bg-white/4 overflow-hidden">
                    <div className={`h-full ${barColor(pct)}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`text-[10px] font-bold font-mono w-7 text-right ${usageSeverity(pct)}`}>{pct.toFixed(0)}%</span>
                </div>
              );
            }
          }
        ]}
        data={dbinfo || []}
      />
    </Card>
  );
});

const VolumeTopology = memo(({ hostUid, dbname, spaceinfo }) => {
  const dispatch = useDispatch();

  return (
    <Card
      title={
        <div className="flex items-center gap-1.5">
          <Icon name="dataset" size="xs" weight={300} className="text-amber-500" />
          <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">Physical Volume Topology</span>
        </div>
      }
      bodyClassName="p-0"
      collapsible
    >
      <Table
        columns={[
          {
            header: 'Volume',
            accessor: 'spacename',
            width: '150px',
            render: (val) => {
              const name = val?.split(/[/\\]/).pop() || val;
              return (
                <button 
                  onClick={() => dispatch(openTab(`vol_info:${hostUid}:${dbname}:${val}`))}
                  className="flex items-center gap-1.5 min-w-0 group hover:bg-slate-50 dark:hover:bg-white/5 px-2 py-1 rounded transition-colors w-full text-left"
                >
                  <Icon name="draft" size="xs" weight={300} className="text-slate-300 dark:text-slate-600 shrink-0 group-hover:text-amber-500" />
                  <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate group-hover:text-amber-600 dark:group-hover:text-amber-500" title={val}>{name}</span>
                </button>
              );
            }
          },
          {
            header: 'Type',
            accessor: 'type',
            width: '110px',
            render: (val) => (
              <span className={`px-1 py-0.5 rounded-sm text-[10px] font-bold uppercase border ${TYPE_BADGE(val)}`}>{val}</span>
            )
          },
          {
            header: 'Allocation',
            accessor: 'usedpage',
            render: (val, row) => {
              const usedPages = cleanInt(val);
              const totalPages = cleanInt(row.totalpage);
              const freePages = Math.max(0, totalPages - usedPages);
              const freePct = totalPages > 0 ? (freePages / totalPages) * 100 : 0;
              const usedPct = 100 - freePct;
              const isZero = totalPages === 0;
  
              return (
                <div className="flex flex-col gap-0.5 min-w-[140px]">
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      <span className="text-slate-700 dark:text-slate-200 font-bold">{formatPages(usedPages)}</span> / {formatPages(totalPages)}
                    </span>
                    <span className={`text-[10px] font-mono font-black ${getFreeSeverity(freePct)} ml-2`}>
                      {isZero ? '0' : Math.round(freePct)}% <span className="opacity-50 text-[8px] font-sans uppercase">free</span>
                    </span>
                  </div>
                  <div className="w-full h-0.5 bg-slate-100 dark:bg-white/4 rounded-full overflow-hidden">
                    <div className={`h-full ${usedPct > 90 ? 'bg-rose-500' : 'bg-amber-500/80'}`} style={{ width: `${isZero ? 0 : usedPct}%` }} />
                  </div>
                </div>
              );
            }
          },
          { 
            header: 'Path', 
            accessor: 'location',
            render: (val) => (
              <div className="flex items-center gap-1 group min-w-0">
                <Icon name="folder" size="xs" weight={300} className="text-slate-300 dark:text-slate-600 shrink-0 group-hover:text-amber-500/50 transition-colors" />
                <span className="text-[10px] text-slate-400 font-mono truncate" title={val}>{val?.toString().trim()}</span>
              </div>
            )
          }
        ]}
        data={spaceinfo || []}
      />
    </Card>
  );
});

const FileSpaceUsage = memo(({ fileinfo }) => (
  <Card
    title={
      <div className="flex items-center gap-1.5">
        <Icon name="analytics" size="xs" weight={300} className="text-amber-500" />
        <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">File Space Usage</span>
      </div>
    }
    bodyClassName="p-0"
  >
    <Table
      columns={[
        { header: 'Data Type', accessor: 'data_type' },
        { header: 'Qty', accessor: 'file_count', className: 'text-center' },
        { header: 'Used', accessor: 'used_size', className: 'text-right', render: (val) => <span className="font-mono text-[11px] font-bold">{formatPages(val)}</span> },
        { header: 'Total', accessor: 'total_size', className: 'text-right', render: (val) => <span className="font-mono text-[11px] text-slate-400">{formatPages(val)}</span> },
      ]}
      data={fileinfo || []}
    />
  </Card>
));

const DistributionChart = memo(({ totals }) => (
  <div className="bg-white dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-sm p-4 flex flex-col gap-4 h-full">
    <div className="flex items-center gap-1.5">
      <Icon name="pie_chart" size="xs" weight={300} className="text-amber-500" />
      <Typography variant="p" className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">Distribution</Typography>
    </div>

    <div className="flex items-center gap-6 flex-1">
      <div className="relative w-20 h-20 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e8f0" strokeWidth="12" className="dark:opacity-10" />
          <circle
            cx="50" cy="50" r="38"
            fill="none"
            stroke="#ffc107"
            strokeWidth="12"
            strokeDasharray={`${(totals?.pct / 100) * 238.76} 238.76`}
            style={{ transition: 'stroke-dasharray 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-base font-black font-mono leading-none ${usageSeverity(totals?.pct || 0)}`}>{(totals?.pct || 0).toFixed(0)}%</span>
          <span className="text-[7px] text-slate-400 uppercase tracking-widest mt-0.5 font-bold">Used</span>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Used</span>
          </div>
          <span className="text-[11px] font-black font-mono text-slate-700 dark:text-slate-200">{formatSize(totals?.used)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-white/10" />
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Free</span>
          </div>
          <span className="text-[11px] font-black font-mono text-slate-700 dark:text-slate-200">{formatSize(totals?.free)}</span>
        </div>
      </div>
    </div>
  </div>
));

// ── Main Component ──

export default function DatabaseSpaceMonitor({ hostUid, dbname }) {
  const { preferences } = useSelector((state) => state.user);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const { isManualRefreshing: loading, lastRefreshed, handleRefresh: fetchSpaceInfo } = usePollingRefresh({
    hostUid,
    tabId: `db_space:${hostUid}:${dbname}`,
    pollingIntervalSeconds: preferences.dashboardInterval,
    onFetch: () => async () => {
      try {
        const response = await databaseApi.getVolumeInfo(hostUid, dbname);
        setData(response);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch space info');
      }
    }
  });

  const totals = useMemo(() => {
    if (!data?.dbinfo) return null;
    let total = 0, free = 0;
    data.dbinfo.forEach(i => { total += cleanInt(i.total_size); free += cleanInt(i.free_size); });
    return { total, free, used: total - free, pct: total > 0 ? ((total - free) / total) * 100 : 0 };
  }, [data?.dbinfo]);

  if (loading && !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-background-dark gap-3">
        <div className="h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <Typography variant="p" className="text-xs text-slate-400">Analyzing storage capacity…</Typography>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-background-dark overflow-hidden select-none text-[12px]">
      <StatusHeader 
        dbname={dbname} 
        lastRefreshed={lastRefreshed} 
        loading={loading} 
        onRefresh={fetchSpaceInfo}
        dashboardInterval={preferences.dashboardInterval}
      />

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {error && (
          <div className="p-2.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-sm flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
            <Icon name="error" size="xs" weight={300} />
            <span className="text-[11px] font-medium">{error}</span>
          </div>
        )}

        <SummaryCards dbname={dbname} data={data} totals={totals} />
        
        <VolumeCategorization 
          hostUid={hostUid} 
          dbname={dbname} 
          dbinfo={data?.dbinfo} 
        />
        
        <VolumeTopology 
          hostUid={hostUid} 
          dbname={dbname} 
          spaceinfo={data?.spaceinfo} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FileSpaceUsage fileinfo={data?.fileinfo} />
          <DistributionChart totals={totals} />
        </div>
      </div>
    </div>
  );
}
