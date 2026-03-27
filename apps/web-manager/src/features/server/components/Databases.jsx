import React from 'react';
import { Card } from '../../../components/ds/layout/Card';
import { Table } from '../../../components/ds/layout/Table';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Icon } from '../../../components/ds/foundation/Icon';

export default function Databases() {
  const columns = [
    { header: 'Database', accessor: 'dbname', className: 'font-bold' },
    { 
      header: 'Auto startup', 
      accessor: 'autoStart',
      render: (val) => (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-colors
          ${val === 'On' 
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
            : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'}`}>
          <span className={`size-1.5 rounded-full ${val === 'On' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-400 dark:bg-slate-600'}`}></span>
          {val}
        </span>
      )
    },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (val) => (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-colors
          ${val === 'Active' 
            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' 
            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'}`}>
          <span className={`size-1.5 rounded-full ${val === 'Active' ? 'bg-blue-500 animate-pulse' : 'bg-rose-500'}`}></span>
          {val}
        </span>
      )
    },
  ];

  const data = [
    { id: 1, dbname: 'demodb', autoStart: 'On', status: 'Active' },
    { id: 2, dbname: 'db1', autoStart: 'Off', status: 'Inactive' },
  ];

  const cardTitle = (
    <div className="flex items-center gap-2">
      <Icon name="database" size="sm" className="text-bk-yellow"  weight={300} />
      <Typography variant="span" className="font-bold">Databases</Typography>
    </div>
  );

  return (
    <Card title={cardTitle} className="lg:col-span-2 shadow-2xl shadow-black/5" bodyClassName="p-0">
      <Table columns={columns} data={data} sortable={true} />
    </Card>
  );
}
