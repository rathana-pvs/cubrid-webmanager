import { usePollingRefresh } from '../../../infrastructure/hooks/usePollingRefresh';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDetailedBrokerStatus } from '../brokerSlice';
import MonitoringSettingsPopover from '../../user/components/MonitoringSettingsPopover';
import { Icon } from '../../../components/ds/foundation/Icon';
import { Card } from '../../../components/ds/layout/Card';
import { Table } from '../../../components/ds/layout/Table';

/* ── helpers ── */
const StatusBadge = ({ value }) => {
  const isActive = value && value !== 'IDLE' && value !== 'OFF';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border
      ${isActive
        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
        : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-white/4 dark:text-slate-500 dark:border-white/[0.07]'}`}>
      <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {value || 'IDLE'}
    </span>
  );
};

export default function BrokerStatus({ hostUid, brokerName }) {
  const dispatch = useDispatch();
  const { detailedStatus } = useSelector((state) => state.broker);
  const { preferences } = useSelector((state) => state.user);
  const status = detailedStatus[brokerName] || { data: {}, loading: false, error: null };

  const { isManualRefreshing, lastRefreshed, handleRefresh } = usePollingRefresh({
    hostUid,
    tabId: `broker_status:${hostUid}:${brokerName}`,
    pollingIntervalSeconds: preferences.brokerStatusInterval,
    onFetch: (silent) => (dispatch) => dispatch(fetchDetailedBrokerStatus({ hostUid, brokerName, isBackground: silent }))
  });

  /* Loading */
  if (status.loading && !status.data?.asinfo) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-bk-main h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <span className="text-[12px] text-slate-400 font-medium">Loading broker status…</span>
        </div>
      </div>
    );
  }

  /* Error */
  if (status.error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-bk-main h-full">
        <div className="max-w-sm w-full p-5 bg-rose-50 dark:bg-rose-500/6 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-start gap-3">
          <Icon name="error_outline" size="sm" weight={300} className="text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-bold text-rose-700 dark:text-rose-400 mb-1">Failed to load status</p>
            <p className="text-[12px] text-rose-600/70 dark:text-rose-400/60 leading-relaxed">{status.error}</p>
          </div>
        </div>
      </div>
    );
  }

  const asInfo = status.data?.asinfo || [];
  const jobInfo = status.data?.jobinfo || [];
  const basicInfo = status.data?.binfo?.[0] || {};

  /* Table Columns Definitions */
  const asColumns = [
    { header: 'ID', accessor: 'as_id', width: '60px', render: (v) => <span className="font-mono text-amber-600 dark:text-amber-400">{v}</span> },
    { header: 'PID', accessor: 'as_pid', width: '80px', render: (v) => <span className="font-mono">{v}</span> },
    { header: 'QPS', accessor: 'as_num_query', width: '60px', render: (v) => <span className="font-mono">{v}</span> },
    { header: 'TPS', accessor: 'as_num_tran', width: '60px', render: (v) => <span className="font-mono">{v}</span> },
    { header: 'Port', accessor: 'as_port', width: '80px', render: (v) => <span className="font-mono">{v}</span> },
    { header: 'Memory', accessor: 'as_psize', width: '100px', render: (v) => <span className="font-mono">{(parseInt(v) / 1024).toFixed(1)} KB</span> },
    { header: 'Status', accessor: 'as_status', width: '100px', render: (v) => <StatusBadge value={v} /> },
    { header: 'Database', accessor: 'as_dbname', render: (v) => <span className="text-amber-600/80 dark:text-amber-500/70 font-mono">{v || '—'}</span> },
    { header: 'Last Access', accessor: 'as_last_access_time', render: (v) => <span className="text-slate-400 dark:text-slate-600 text-[11px]">{v}</span> },
    { header: 'Client IP', accessor: 'as_client_ip', render: (v) => <span className="font-mono">{v || '—'}</span> },
  ];

  const jobColumns = [
    { header: 'Job ID', accessor: 'job_id', width: '100px', render: (v) => <span className="font-mono">{v}</span> },
    { header: 'Priority', accessor: 'job_priority', width: '100px', render: (v) => <span className="font-mono">{v}</span> },
    { header: 'IP Address', accessor: 'job_ip', render: (v) => <span className="font-mono text-amber-600/80 dark:text-amber-500/70">{v}</span> },
    { header: 'Elapsed', accessor: 'job_time', width: '100px', render: (v) => <span className="font-mono text-rose-500">{v}s</span> },
    { header: 'Request', accessor: 'job_request', render: (v) => <div className="max-w-xs truncate text-slate-500 dark:text-slate-500 font-mono">{v}</div> },
  ];

  const asActiveBadge = (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full animate-in fade-in transition duration-300">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      {asInfo.length} active
    </span>
  );

  const jobQueuedBadge = (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full animate-in fade-in transition duration-300">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      {jobInfo.length} queued
    </span>
  );

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
              <span className="text-[13px] font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">{brokerName}</span>
              <div className={`px-2 py-0.5 rounded-full border flex items-center gap-1.5 shrink-0 transition-all duration-300 ${preferences.brokerStatusInterval > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
                <div className={`w-1 h-1 rounded-full ${preferences.brokerStatusInterval > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span className={`text-[9px] font-bold ${preferences.brokerStatusInterval > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {preferences.brokerStatusInterval > 0 ? 'Live' : 'Paused'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Broker Status</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 font-mono tracking-tight hidden lg:block mr-2">
            Synced {lastRefreshed.toLocaleTimeString('en-US', { hour12: true })}
          </span>

          <button
            onClick={() => handleRefresh(false)}
            disabled={status.loading || isManualRefreshing}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all active:scale-[0.98]
              ${(status.loading || isManualRefreshing)
                ? 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-white/5 cursor-not-allowed opacity-50'
                : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 hover:border-amber-500/50 hover:bg-white dark:hover:bg-white/5 shadow-xs'}`}
            title="Refresh broker status"
          >
            <Icon name="refresh" size="18px" className={(status.loading || isManualRefreshing) ? 'animate-spin' : ''} />
          </button>

          <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 mx-0.5" />
          <MonitoringSettingsPopover />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ── Basic Info ── */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <Icon name="info" size="sm" weight={300} className="text-amber-500" />
              <span className="text-[12px] font-bold">Basic Information</span>
            </div>
          }
          bodyClassName="p-0"
          collapsible
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 text-left">
            {[
              { label: 'PID',          value: basicInfo.pid                           || '—',    accent: 'emerald' },
              { label: 'Port',         value: basicInfo.port                          || '—',    accent: 'amber'   },
              { label: 'Job Queue',    value: basicInfo.job_queue                     ?? '0',    accent: 'slate'   },
              { label: 'Auto Add AS',  value: basicInfo.auto_add_as                  || 'OFF',  badge: true       },
              { label: 'SQL Log Mode', value: basicInfo.sql_log_mode                 || 'OFF',  badge: true       },
              { label: 'Long Trans',   value: `${basicInfo.long_transaction_time      || '0'}s`, accent: 'slate'   },
              { label: 'Long Query',   value: `${basicInfo.long_query_time            || '0'}s`, accent: 'slate'   },
            ].map((m, i, arr) => {
              const isActive = m.badge && m.value && m.value !== 'IDLE' && m.value !== 'OFF';
              const accentBar = m.accent === 'emerald'
                ? 'bg-emerald-500'
                : m.accent === 'amber'
                ? 'bg-amber-500'
                : 'bg-slate-300 dark:bg-slate-700';
              return (
                <div
                  key={m.label}
                  className={`relative flex flex-col gap-2 px-4 py-3.5 min-w-0
                    ${i < arr.length - 1 ? 'border-r border-slate-100 dark:border-white/5' : ''}
                  `}
                >
                  <div className={`absolute top-0 left-4 right-4 h-[2px] rounded-b-full opacity-30 ${accentBar || 'bg-slate-300 dark:bg-slate-700'}`} />
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.12em] leading-none">
                    {m.label}
                  </span>
                  {m.badge ? (
                    <span className={`inline-flex items-center gap-1.5 self-start px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border
                      ${isActive
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                        : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-white/4 dark:text-slate-400 dark:border-white/[0.07]'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {m.value}
                    </span>
                  ) : (
                    <span className={`font-mono text-[15px] font-bold leading-none
                      ${m.accent === 'emerald' ? 'text-emerald-500 dark:text-emerald-400'
                      : m.accent === 'amber'   ? 'text-amber-500 dark:text-amber-400'
                      : 'text-slate-800 dark:text-slate-200'}`}
                    >
                      {m.value}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* ── Application Servers ── */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <Icon name="dns" size="sm" weight={300} className="text-amber-500" />
              <span className="text-[12px] font-bold">Application Servers (AS)</span>
            </div>
          }
          rightContent={(isCollapsed) => isCollapsed && asActiveBadge}
          bodyClassName="p-0"
          collapsible
        >
          <Table 
            columns={asColumns} 
            data={asInfo} 
            sortable 
            zebra 
            emptyMessage="No application servers currently active." 
          />
        </Card>

        {/* ── Job Queue ── */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <Icon name="queue" size="sm" weight={300} className="text-amber-500" />
              <span className="text-[12px] font-bold">Job Queue</span>
            </div>
          }
          rightContent={(isCollapsed) => isCollapsed && jobInfo.length > 0 && jobQueuedBadge}
          bodyClassName="p-0"
          collapsible
        >
          <Table 
            columns={jobColumns} 
            data={jobInfo} 
            sortable 
            zebra 
            emptyMessage="Job queue is empty." 
          />
        </Card>
      </div>
    </div>
  );
}
