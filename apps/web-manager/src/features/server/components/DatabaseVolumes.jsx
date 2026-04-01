import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { fetchDatabaseVolumes } from '../../database/databaseSlice';
import { Card } from '../../../components/ds/layout/Card';
import { Table } from '../../../components/ds/layout/Table';
import { Icon } from '../../../components/ds/foundation/Icon';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Spinner } from '../../../components/ds/foundation/Spinner';

const getSizeFormat = (size) => {
  if (size >= 1024 ** 3) return `${(size / 1024 ** 3).toFixed(1)}GB`;
  if (size >= 1024 ** 2) return `${(size / 1024 ** 2).toFixed(1)}MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)}KB`;
  return `${size}B`;
};

const getVolumeColumn = (dbSpace, type) => {
  if (!dbSpace?.spaceinfo) return { display: '-', pct: 0 };
  let totalPage = 0, freePage = 0;
  const pageSize = parseInt(dbSpace.pagesize || 0);
  if (!pageSize) return { display: '-', pct: 0 };
  for (const space of dbSpace.spaceinfo) {
    if (space.type === type) {
      totalPage += parseInt(space.totalpage || 0);
      freePage += parseInt(space.freepage || 0);
    }
  }
  if (totalPage > 0) {
    const used = (totalPage - freePage) * pageSize;
    const total = totalPage * pageSize;
    const freePct = ((freePage * 100) / totalPage).toFixed(0);
    return { display: `${getSizeFormat(used)} / ${getSizeFormat(total)} / ${freePct}%`, pct: 100 - parseInt(freePct) };
  }
  return { display: '-', pct: 0 };
};

const getLogColumn = (dbSpace, type) => {
  let totalPage = 0;
  const pageSize = parseInt(dbSpace.pagesize);
  for (const space of dbSpace.spaceinfo) {
    if (space.type === type) totalPage += parseInt(space.totalpage);
  }
  return totalPage > 0 ? getSizeFormat(totalPage * pageSize) : '-';
};

const BarCell = ({ val }) => {
  const getProgressColor = (pct) => {
    if (pct > 85) return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]';
    if (pct > 50) return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]';
    return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
  };

  return (
    <div className="flex flex-col gap-1 min-w-[160px]">
      <div className="flex items-center justify-between pr-2">
        <span className="text-[12px] font-mono font-semibold text-slate-600 dark:text-slate-300">{val.display}</span>
      </div>
      <div className="w-full h-1 bg-slate-100 dark:bg-white/6 overflow-hidden rounded-full">
        <div 
          className={`h-full ${getProgressColor(val.pct)} transition-all duration-700 ease-out`} 
          style={{ width: `${val.pct}%` }} 
        />
      </div>
    </div>
  );
};

export default function DatabaseVolumes({ hostUid }) {
  const dispatch = useDispatch();
  const { authorizedHosts } = useSelector((state) => state.host, shallowEqual);
  const { activeDatabases } = useSelector((state) => state.database, shallowEqual);
  const { volumes, volumesLoading: loading } = useSelector((state) => state.databaseMonitoring, shallowEqual);

  const fetchVolumes = useCallback(() => {
    if (!hostUid || !authorizedHosts.includes(hostUid) || activeDatabases.length === 0) return;
    dispatch(fetchDatabaseVolumes({ hostUid, activeDatabases }));
  }, [hostUid, authorizedHosts, activeDatabases, dispatch]);

  useEffect(() => { fetchVolumes(); }, [fetchVolumes]);

  const volumeData = volumes?.map((result) => {
    if (!result?.spaceinfo) return { id: result.dbname, db: result.dbname, permanent: { display: '-', pct: 0 }, temporary: { display: '-', pct: 0 }, activeLog: '-', archiveLog: '-', storageFree: '-' };
    return {
      id: result.dbname,
      db: result.dbname,
      permanent: getVolumeColumn(result, 'PERMANENT'),
      temporary: getVolumeColumn(result, 'TEMPORARY'),
      activeLog: getLogColumn(result, 'Active_log'),
      archiveLog: getLogColumn(result, 'Archive_log'),
      storageFree: result.freespace ? getSizeFormat(parseInt(result.freespace) * 1024) : '-',
    };
  }) || [];

  const columns = [
    {
      header: 'Database',
      accessor: 'db',
      render: (val) => <span className="font-mono text-[12px] font-semibold text-slate-700 dark:text-slate-200">{val}</span>
    },
    { header: 'Permanent', accessor: 'permanent', render: (val) => <BarCell val={val} /> },
    { header: 'Temporary', accessor: 'temporary', render: (val) => <BarCell val={val} /> },
    { header: 'Active Log', accessor: 'activeLog', render: (val) => <span className="font-mono text-[12px] text-slate-500">{val}</span> },
    { header: 'Archive Log', accessor: 'archiveLog', render: (val) => <span className="font-mono text-[12px] text-slate-500">{val}</span> },
    { header: 'Free Storage', accessor: 'storageFree', render: (val) => <span className="font-mono text-[12px] text-emerald-600 dark:text-emerald-400 font-semibold">{val}</span> },
  ];

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <Icon name="storage" size="sm" weight={300} className="text-amber-500" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Storage Volumes</span>
          {loading && <Spinner size="xs" className="ml-1" />}
        </div>
      }
      bodyClassName="p-0"
      collapsible
    >
      <Table columns={columns} data={volumeData} loading={loading} className="text-[12px]" />
    </Card>
  );
}
