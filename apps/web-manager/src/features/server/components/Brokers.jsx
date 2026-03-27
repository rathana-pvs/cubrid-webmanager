import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBrokerList } from '../../broker/brokerSlice';
import { openTab } from '../../layout/layoutSlice';
import { Card } from '../../../components/ds/layout/Card';
import { Table } from '../../../components/ds/layout/Table';
import { Icon } from '../../../components/ds/foundation/Icon';
import { Spinner } from '../../../components/ds/foundation/Spinner';
import { useEffect } from 'react';

export default function Brokers({ hostUid }) {
  const dispatch = useDispatch();
  const { brokers, loading } = useSelector((state) => state.broker);
  const { authorizedHosts } = useSelector((state) => state.host);

  useEffect(() => {
    if (hostUid && authorizedHosts.includes(hostUid)) dispatch(fetchBrokerList(hostUid));
  }, [hostUid, authorizedHosts, dispatch]);

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
      render: (_, row) => <span className="font-mono text-[11px] text-slate-400">{row.long_tran || '0'} / {parseFloat(row.long_tran_time || 0) * 1000}ms</span>
    },
    {
      header: 'Long-Q', accessor: 'long_query',
      render: (_, row) => <span className="font-mono text-[11px] text-slate-400">{row.long_query || '0'} / {parseFloat(row.long_query_time || 0) * 1000}ms</span>
    },
    { header: 'Err-Q', accessor: 'error_query', render: (val) => <span className={`font-mono text-[12px] font-bold ${parseInt(val) > 0 ? 'text-rose-500' : 'text-slate-400'}`}>{val}</span> },
  ];

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <Icon name="hub" size="sm" weight={300} className="text-amber-500" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Brokers</span>
          {loading && <Spinner size="xs" className="ml-1" />}
        </div>
      }
      bodyClassName="p-0"
      collapsible
    >
      <Table
        columns={columns}
        data={brokers}
        loading={loading}
        onRowClick={(row) => dispatch(openTab(`broker_status:${hostUid}:${row.name}`))}
        className="font-mono text-[12px]"
      />
    </Card>
  );
}
