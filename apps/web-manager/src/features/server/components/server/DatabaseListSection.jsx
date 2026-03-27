import React from 'react';
import { Card } from '../../../../components/ds/layout/Card';
import { Table } from '../../../../components/ds/layout/Table';
import { Icon } from '../../../../components/ds/foundation/Icon';
import { Typography } from '../../../../components/ds/foundation/Typography';

export default function DatabaseListSection({ dbListDisplay, handleAutoStartToggle }) {
  const columns = [
    {
      header: 'Database',
      accessor: 'db',
      render: (val) => (
        <div className="flex items-center gap-2">
          <Icon name="database" size="sm" weight={300} className="text-slate-300 dark:text-slate-600 shrink-0" />
          <span className="font-mono text-[12px] font-semibold text-slate-700 dark:text-slate-200">{val}</span>
        </div>
      )
    },
    {
      header: 'Auto Startup',
      accessor: 'autoStart',
      className: 'text-center',
      render: (val, row) => (
        <input
          type="checkbox"
          className="size-3.5 rounded-sm border-slate-300 dark:border-slate-700 bg-white dark:bg-background-dark text-amber-500 focus:ring-amber-500/50 cursor-pointer accent-amber-500"
          checked={val}
          onChange={() => handleAutoStartToggle(row.db, val)}
        />
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (val) => (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
          ${val === 'On'
            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
            : 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'}`}
        >
          <span className={`size-1.5 rounded-full ${val === 'On' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          {val}
        </span>
      )
    },
  ];

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <Icon name="database" size="sm" weight={300} className="text-amber-500" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Databases</span>
          <span className="text-[10px] text-slate-400 font-normal ml-1">({dbListDisplay.length})</span>
        </div>
      }
      bodyClassName="p-0"
      collapsible
    >
      <Table columns={columns} data={dbListDisplay} />
    </Card>
  );
}
