import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDetailedBrokerStatus } from '../brokerSlice';
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

/* ══════════════════════════════════════════ */
export default function BrokerStatus({ hostUid, brokerName }) {
  const dispatch  = useDispatch();
  const { detailedStatus } = useSelector((state) => state.broker);
  const status = detailedStatus[brokerName] || { data: {}, loading: false, error: null };

  useEffect(() => {
    if (hostUid && brokerName) {
      dispatch(fetchDetailedBrokerStatus({ hostUid, brokerName }));
      const interval = setInterval(() => {
        dispatch(fetchDetailedBrokerStatus({ hostUid, brokerName }));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [hostUid, brokerName, dispatch]);

  /* Loading */
  if (status.loading && !status.data?.asinfo) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-bk-main">
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
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-bk-main">
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

  const asInfo    = status.data?.asinfo  || [];
  const jobInfo   = status.data?.jobinfo || [];
  const basicInfo = status.data?.binfo?.[0] || {};

  /* Table Columns Definitions */
  const asColumns = [
    { header: 'ID',         accessor: 'as_id',             width: '60px',  render: (v) => <span className="font-mono text-amber-600 dark:text-amber-400">{v}</span> },
    { header: 'PID',        accessor: 'as_pid',            width: '80px',  render: (v) => <span className="font-mono">{v}</span> },
    { header: 'QPS',        accessor: 'as_num_query',      width: '60px',  render: (v) => <span className="font-mono">{v}</span> },
    { header: 'TPS',        accessor: 'as_num_tran',       width: '60px',  render: (v) => <span className="font-mono">{v}</span> },
    { header: 'Port',       accessor: 'as_port',           width: '80px',  render: (v) => <span className="font-mono">{v}</span> },
    { header: 'Memory',     accessor: 'as_psize',          width: '100px', render: (v) => <span className="font-mono">{(parseInt(v) / 1024).toFixed(1)} KB</span> },
    { header: 'Status',     accessor: 'as_status',         width: '100px', render: (v) => <StatusBadge value={v} /> },
    { header: 'Database',   accessor: 'as_dbname',         render: (v) => <span className="text-amber-600/80 dark:text-amber-500/70 font-mono">{v || '—'}</span> },
    { header: 'Last Access', accessor: 'as_last_access_time', render: (v) => <span className="text-slate-400 dark:text-slate-600 text-[11px]">{v}</span> },
    { header: 'Client IP',  accessor: 'as_client_ip',      render: (v) => <span className="font-mono">{v || '—'}</span> },
  ];

  const jobColumns = [
    { header: 'Job ID',     accessor: 'job_id',            width: '100px', render: (v) => <span className="font-mono">{v}</span> },
    { header: 'Priority',   accessor: 'job_priority',      width: '100px', render: (v) => <span className="font-mono">{v}</span> },
    { header: 'IP Address', accessor: 'job_ip',            render: (v) => <span className="font-mono text-amber-600/80 dark:text-amber-500/70">{v}</span> },
    { header: 'Elapsed',    accessor: 'job_time',          width: '100px', render: (v) => <span className="font-mono text-rose-500">{v}s</span> },
    { header: 'Request',    accessor: 'job_request',       render: (v) => <div className="max-w-xs truncate text-slate-500 dark:text-slate-500 font-mono">{v}</div> },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-bk-main">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-white/[0.07] bg-white dark:bg-bk-side/40 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Icon name="hub" size="sm" weight={300} className="text-amber-500" />
          <span className="text-[12px] font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            {brokerName}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-600 font-medium">— Broker Status</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
            </span>
            Live · 5s
          </div>

          <button
            onClick={() => dispatch(fetchDetailedBrokerStatus({ hostUid, brokerName }))}
            disabled={status.loading}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all active:scale-[0.98]
              ${status.loading
                ? 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-white/5 cursor-not-allowed opacity-50'
                : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-400 hover:text-amber-600 dark:hover:text-bk-yellow hover:border-amber-500/50 dark:hover:border-bk-yellow/50 hover:bg-white dark:hover:bg-white/5 shadow-xs'}`}
            title="Refresh status"
          >
            <Icon name="refresh" size="18px" weight={status.loading ? 700 : 300} className={status.loading ? 'animate-spin' : ''} />
          </button>


        </div>
      </div>

      <div className="p-4 space-y-4">

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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-white/5">
            {[
              { label: 'PID',             value: basicInfo.pid             || '—', accent: true },
              { label: 'Port',            value: basicInfo.port            || '—' },
              { label: 'Job Queue',       value: basicInfo.job_queue       || '0' },
              { label: 'Auto Add AS',     value: basicInfo.auto_add_as     || 'OFF' },
              { label: 'SQL Log Mode',    value: basicInfo.sql_log_mode    || 'OFF', badge: true },
              { label: 'Long Trans',      value: `${basicInfo.long_transaction_time || '0'}s` },
              { label: 'Long Query',      value: `${basicInfo.long_query_time       || '0'}s` },
            ].map((m) => (
              <div key={m.label} className="px-4 py-3 flex flex-col gap-1 min-w-0">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">{m.label}</span>
                {m.badge ? (
                  <StatusBadge value={m.value} />
                ) : (
                  <span className={`font-mono text-[13px] font-bold ${m.accent ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-200'}`}>
                    {m.value}
                  </span>
                )}
              </div>
            ))}
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
          subtitle={
             <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-500 px-2 py-0.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/[0.07] rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {asInfo.length} active
                </span>
             </div>
          }
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
          subtitle={
            jobInfo.length > 0 && (
              <div className="mt-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 px-2 py-0.5 bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/20 rounded-full">
                  {jobInfo.length} queued
                </span>
              </div>
            )
          }
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
