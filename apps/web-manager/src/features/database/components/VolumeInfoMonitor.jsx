import { usePollingRefresh } from '../../../infrastructure/hooks/usePollingRefresh';
import React, { useMemo } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { fetchDatabaseSpaceInfo } from '../databaseSlice';
import MonitoringSettingsPopover from '../../user/components/MonitoringSettingsPopover';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Typography } from '../../../components/ds/foundation/Typography';
import { PageLoader } from '../../../components/ds/feedback/PageLoader';
import { EmptyState } from '../../../components/ds/feedback/EmptyState';

export default function VolumeInfoMonitor({ tabId }) {
  const dispatch = useDispatch();
  const { preferences } = useSelector((state) => state.user, shallowEqual);
  const [, hostUid, dbname, volname] = tabId.split(':');

  const { spaceInfo, spaceInfoLoading } = useSelector((state) => state.databaseMonitoring || {}, shallowEqual);
  const dbSpace = spaceInfo?.[dbname];
  const isLoading = spaceInfoLoading?.[dbname];

  const { isManualRefreshing: isRefreshing, lastRefreshed, handleRefresh } = usePollingRefresh({
    hostUid,
    tabId,
    pollingIntervalSeconds: preferences.dashboardInterval,
    onFetch: () => () => dispatch(fetchDatabaseSpaceInfo({ hostUid, dbname }))
  });

  const volume = useMemo(() => {
    if (!dbSpace) return null;
    return dbSpace.volumes.find(v => v.spacename === volname);
  }, [dbSpace, volname]);

  const pageSize = dbSpace?.summary?.[0]?.pagesize || 4096;

  if (isLoading && !volume) {
    return (
      <div className="flex-1 flex h-full bg-white dark:bg-background-dark">
        <PageLoader
          title="Hydrating Volume Matrix"
          subtitle="Streaming real-time allocation maps and page distribution from the IO layer..."
          icon="storage"
        />
      </div>
    );
  }

  if (!volume) {
    return (
      <div className="flex-1 flex h-full bg-white dark:bg-background-dark">
        <EmptyState
          icon="inventory_2"
          title="Volume Not Found"
          subtitle={`"${volname}" could not be resolved in the ${dbname} space catalog.`}
        />
      </div>
    );
  }

  const freePages  = volume.freepage  || 0;
  const totalPages = volume.totalpage || 0;
  const usedPages  = totalPages - freePages;
  const freeM      = (freePages  * pageSize) / (1024 * 1024);
  const totalM     = (totalPages * pageSize) / (1024 * 1024);
  const usedM      = (usedPages  * pageSize) / (1024 * 1024);
  const usedPct    = totalPages > 0 ? (usedPages / totalPages) * 100 : 0;

  // SVG donut math (r=38, circumference ≈ 238.76)
  const R   = 38;
  const C   = 2 * Math.PI * R;
  const arc = (usedPct / 100) * C;

  const severity = usedPct > 85 ? 'text-rose-500' : usedPct > 60 ? 'text-amber-500' : 'text-emerald-500';

  const infoRows = [
    { label: 'Volume Name', val: volume.spacename?.split(/[/\\]/).pop() || volume.spacename },
    { label: 'Location',    val: volume.location },
    { label: 'Type',        val: volume.type },
    { label: 'Purpose',     val: volume.purpose || '—' },
    { label: 'Page Size',   val: `${parseInt(pageSize).toLocaleString()} B` },
    { label: 'Total Pages', val: parseInt(totalPages).toLocaleString() },
    { label: 'Free Pages',  val: parseInt(freePages).toLocaleString() },
    { label: 'Total Size',  val: `${totalM.toFixed(2)} MB` },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-background-dark overflow-hidden select-none animate-in fade-in duration-300">

      {/* ── Header ── */}
      <header className="px-6 py-2.5 border-b border-slate-100 dark:border-white/4 flex items-center justify-between shrink-0 bg-white dark:bg-background-dark sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-sm">
            <Icon name="hard_drive" size="sm" weight={300} className="text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Typography variant="h1" className="text-[13px] font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">Volume Info</Typography>
              <div className={`px-2 py-0.5 rounded-full border flex items-center gap-1.5 shrink-0 transition-all duration-300 ${preferences.dashboardInterval > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
                <div className={`w-1 h-1 rounded-full ${preferences.dashboardInterval > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span className={`text-[9px] font-bold ${preferences.dashboardInterval > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {preferences.dashboardInterval > 0 ? 'Live' : 'Paused'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
              <Typography variant="label" className="text-[10px] text-slate-400 font-mono leading-none truncate max-w-sm">
                {volume.location}
              </Typography>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Typography variant="label" className="text-[10px] text-slate-400 font-mono tracking-tight hidden lg:block mr-2">
            Synced {lastRefreshed.toLocaleTimeString('en-US', { hour12: true })}
          </Typography>

          <button
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all active:scale-[0.98]
              ${(isLoading || isRefreshing)
                ? 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-white/5 cursor-not-allowed opacity-50'
                : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 hover:border-amber-500/50 hover:bg-white dark:hover:bg-white/5'}`}
            title="Refresh volume data"
          >
            <Icon name="refresh" size="18px" className={(isLoading || isRefreshing) ? 'animate-spin' : ''} />
          </button>

          <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 mx-0.5" />
          <MonitoringSettingsPopover />
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 min-h-0 flex gap-0 overflow-hidden">

        {/* Left — Info sidebar */}
        <aside className="w-[380px] shrink-0 border-r border-slate-100 dark:border-white/4 flex flex-col overflow-y-auto">
          {/* Info rows */}
          <div className="p-4 space-y-0 flex-1">
            <Typography variant="label" className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-2 block">
              Properties
            </Typography>
            {infoRows.map((row, i) => (
              <div key={i} className="flex flex-col px-2 py-2 border-b border-slate-50 dark:border-white/3 last:border-0">
                <Typography variant="label" className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">{row.label}</Typography>
                <Typography variant="p" className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 font-mono" title={row.val}>{row.val}</Typography>
              </div>
            ))}
          </div>


          {/* Health note */}
          <div className="m-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/6 border border-amber-100 dark:border-amber-500/20">
            <div className="flex items-center gap-1.5 mb-1 text-amber-600 dark:text-amber-400">
              <Icon name="auto_awesome" size="sm" weight={300} />
              <Typography variant="label" className="text-[9px] font-bold uppercase tracking-wider">Volume Health</Typography>
            </div>
            <Typography variant="p" className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {freeM.toFixed(1)} MB headroom remaining.
            </Typography>
          </div>
        </aside>

        {/* Right — Chart area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8 overflow-hidden">

          {/* Donut chart */}
          <div className="relative w-52 h-52 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {/* Track */}
              <circle
                cx="50" cy="50" r={R}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="14"
                className="dark:opacity-20"
              />
              {/* Used arc */}
              {usedPct > 0 && (
                <circle
                  cx="50" cy="50" r={R}
                  fill="none"
                  stroke="#ffc107"
                  strokeWidth="14"
                  strokeDasharray={`${arc} ${C}`}
                  strokeLinecap="butt"
                  style={{ transition: 'stroke-dasharray 1s ease-out' }}
                />
              )}
            </svg>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-black font-mono leading-none ${severity}`}>
                {usedPct.toFixed(0)}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">%</span>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest">Used</span>
            </div>
          </div>

          {/* Legend cards */}
          <div className="flex gap-4 w-full max-w-sm">
            <div className="flex-1 bg-amber-50 dark:bg-amber-500/6 border border-amber-100 dark:border-amber-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <Typography variant="label" className="text-[9px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-widest">Used</Typography>
              </div>
              <Typography variant="p" className="text-lg font-black text-slate-700 dark:text-slate-200 font-mono">{usedM.toFixed(1)}</Typography>
              <Typography variant="label" className="text-[9px] text-slate-400">MB Physical</Typography>
            </div>

            <div className="flex-1 bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/6 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-white/20 shrink-0" />
                <Typography variant="label" className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Free</Typography>
              </div>
              <Typography variant="p" className="text-lg font-black text-slate-700 dark:text-slate-200 font-mono">{freeM.toFixed(1)}</Typography>
              <Typography variant="label" className="text-[9px] text-slate-400">MB Available</Typography>
            </div>
          </div>

          {/* Utilization bar */}
          <div className="w-full max-w-sm">
            <div className="flex justify-between mb-1.5">
              <Typography variant="label" className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest">Utilization</Typography>
              <Typography variant="label" className={`text-[9px] font-black font-mono ${severity}`}>{usedPct.toFixed(2)}%</Typography>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-white/6 overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-1000 ease-out"
                style={{ width: `${usedPct}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-slate-400 font-mono">{usedM.toFixed(1)} MB used</span>
              <span className="text-[9px] text-slate-400 font-mono">{totalM.toFixed(1)} MB total</span>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
