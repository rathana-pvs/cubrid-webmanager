import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBrokerList } from '../../broker/brokerSlice';
import { openTab } from '../../layout/layoutSlice';
import MonitoringSettingsPopover from '../../user/components/MonitoringSettingsPopover';
import { Card } from '../../../components/ds/layout/Card';
import { Table } from '../../../components/ds/layout/Table';
import { Icon } from '../../../components/ds/foundation/Icon';
import { Spinner } from '../../../components/ds/foundation/Spinner';

export default function Brokers({ hostUid, isSection = false }) {
  const dispatch = useDispatch();
  const { brokers, loading } = useSelector((state) => state.broker);
  const { authorizedHosts } = useSelector((state) => state.host);
  const { preferences } = useSelector((state) => state.user);
  const { refreshCounter, activeMainTab } = useSelector((state) => state.layout);

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const [isBrowserVisible, setIsBrowserVisible] = useState(document.visibilityState === 'visible');
  const isTabActive = isBrowserVisible && activeMainTab === `brokers_status:${hostUid}`;
  const isActiveRef = useRef(isTabActive);
  const initialLoadDone = useRef(false);

  // 1. Browser Visibility Listener
  useEffect(() => {
    const handleVisibilityChange = () => setIsBrowserVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleRefresh = useCallback(async (silent = false) => {
    if (hostUid && authorizedHosts.includes(hostUid)) {
      if (!silent) setIsManualRefreshing(true);
      try {
        await dispatch(fetchBrokerList(hostUid)).unwrap();
        setLastRefreshed(new Date());
      } catch (err) {
        console.error('Failed to refresh brokers summary:', err);
      } finally {
        if (!silent) setIsManualRefreshing(false);
      }
    }
  }, [dispatch, hostUid, authorizedHosts]);

  // 2. Global Refresh (F5) Listener
  useEffect(() => {
    if (refreshCounter > 0 && isTabActive) {
      handleRefresh();
    }
  }, [refreshCounter, handleRefresh, isTabActive]);

  // 3. Initial Load
  useEffect(() => {
    if (hostUid && authorizedHosts.includes(hostUid) && !initialLoadDone.current) {
      initialLoadDone.current = true;
      handleRefresh();
    }
  }, [hostUid, authorizedHosts, handleRefresh]);

  // 4. On Tab Resume
  useEffect(() => {
    const becameActive = !isActiveRef.current && isTabActive;
    isActiveRef.current = isTabActive;
    if (becameActive && initialLoadDone.current && preferences.brokerStatusInterval > 0) handleRefresh(true);
  }, [isTabActive, handleRefresh, preferences.brokerStatusInterval]);

  // 5. Polling Timer
  useEffect(() => {
    if (!isTabActive || preferences.brokerStatusInterval <= 0) return;
    const timer = setInterval(() => {
      if (isActiveRef.current) handleRefresh(true);
    }, preferences.brokerStatusInterval * 1000);
    return () => clearInterval(timer);
  }, [isTabActive, preferences.brokerStatusInterval, handleRefresh]);

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      render: (val) => <span className="font-mono text-[12px] font-semibold text-slate-700 dark:text-slate-200">{val}</span>
    },
    {
      header: 'Status',
      accessor: 'state',
      render: (val) => (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
          ${val === 'ON'
            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
            : 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'}`}
        >
          <span className={`size-1.5 rounded-full ${val === 'ON' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          {val}
        </span>
      )
    },
    { header: 'PID',  accessor: 'pid',         render: (val) => <span className="font-mono text-[12px] text-slate-500">{val}</span> },
    { header: 'Port', accessor: 'port',         render: (val) => <span className="font-mono text-[12px] text-slate-500">{val}</span> },
    { header: 'AS',   accessor: 'as',           render: (val) => <span className="font-mono text-[12px]">{val}</span> },
    { header: 'JQ',   accessor: 'jq',           render: (val) => <span className="font-mono text-[12px]">{val}</span> },
    { header: 'REQ',  accessor: 'req',          render: (val) => <span className="font-mono text-[12px] font-semibold">{val}</span> },
    { header: 'TPS',  accessor: 'tps',          render: (val) => <span className="font-mono text-[12px] text-amber-600 dark:text-amber-400 font-semibold">{val}</span> },
    { header: 'QPS',  accessor: 'qps',          render: (val) => <span className="font-mono text-[12px] text-amber-600 dark:text-amber-400 font-semibold">{val}</span> },
    {
      header: 'Long-T', accessor: 'long_tran',
      render: (_, row) => <span className="font-mono text-[11px] text-slate-400">{row.long_tran || '0'} / {(parseFloat(row.long_tran_time || 0) * 1000).toFixed(0)}ms</span>
    },
    {
      header: 'Long-Q', accessor: 'long_query',
      render: (_, row) => <span className="font-mono text-[11px] text-slate-400">{row.long_query || '0'} / {(parseFloat(row.long_query_time || 0) * 1000).toFixed(0)}ms</span>
    },
    { header: 'Err-Q', accessor: 'error_query', render: (val) => <span className={`font-mono text-[12px] font-bold ${parseInt(val) > 0 ? 'text-rose-500' : 'text-slate-400'}`}>{val}</span> },
  ];

  const content = (
    <Card
      title={
        <div className="flex items-center gap-2">
          <Icon name="hub" size="sm" weight={300} className="text-amber-500" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Brokers Control</span>
        </div>
      }
      bodyClassName="p-0"
      collapsible
    >
      <Table
        columns={columns}
        data={brokers}
        loading={loading && !isManualRefreshing}
        onRowClick={(row) => dispatch(openTab(`broker_status:${hostUid}:${row.name}`))}
      />
    </Card>
  );

  if (isSection) return content;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-bk-main overflow-hidden">
      
      {/* ── Top bar ── */}
      <header className="px-6 py-2.5 border-b border-slate-100 dark:border-white/4 flex items-center justify-between shrink-0 sticky top-0 z-20 bg-white dark:bg-bk-side/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-sm">
            <Icon name="hub" size="sm" weight={300} className="text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">Brokers Status</span>
              <div className={`px-2 py-0.5 rounded-full border flex items-center gap-1.5 shrink-0 transition-all duration-300 ${preferences.brokerStatusInterval > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
                <div className={`w-1 h-1 rounded-full ${preferences.brokerStatusInterval > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span className={`text-[9px] font-bold ${preferences.brokerStatusInterval > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {preferences.brokerStatusInterval > 0 ? 'Live' : 'Paused'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Cluster Overview</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 font-mono tracking-tight hidden lg:block mr-2">
            Synced {lastRefreshed.toLocaleTimeString('en-US', { hour12: true })}
          </span>

          <button
            onClick={() => handleRefresh()}
            disabled={loading || isManualRefreshing}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all active:scale-[0.98]
              ${(loading || isManualRefreshing)
                ? 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-white/5 cursor-not-allowed opacity-50'
                : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 hover:border-amber-500/50 hover:bg-white dark:hover:bg-white/5 shadow-xs'}`}
            title="Refresh brokers list"
          >
            <Icon name="refresh" size="18px" className={(loading || isManualRefreshing) ? 'animate-spin' : ''} />
          </button>

          <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 mx-0.5" />
          <MonitoringSettingsPopover />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {content}
      </div>
    </div>
  );
}

