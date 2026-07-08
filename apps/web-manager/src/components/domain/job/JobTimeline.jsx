import React from 'react';
import { Table } from '../../ds/layout/Table';
import { Toggle } from '../../ds/forms/Toggle';
import { Badge } from '../../ds/foundation/Badge';
import { Button } from '../../ds/foundation/Button';
import { useConfirm } from '../../../infrastructure/hooks/useConfirm';
import { useCM } from '../../../constants/useCM';

export const JobTimeline = ({
  jobs = [],
  onRunNow,
  onToggleActive,
  onEdit,
  onDelete,
}) => {
  const CM = useCM();
  const confirm = useConfirm();

  const getStatusVariant = (status) => {
    switch (status) {
      case 'running': return 'info';
      case 'idle': return 'default';
      case 'failed': return 'danger';
      case 'success': return 'success';
      default: return 'default';
    }
  };

  const handleDelete = async (job) => {
    const ok = await confirm({
      title: CM.deleteJobConfirmTitle,
      description: CM.deleteJobConfirmDesc(job.name),
      variant: 'danger',
      confirmLabel: CM.deleteBtn,
    });
    if (ok && onDelete) {
      onDelete(job.id);
    }
  };

  const columns = [
    {
      header: CM.status,
      accessor: 'status',
      width: '100px',
      render: (val) => <Badge variant={getStatusVariant(val)}>{val.toUpperCase()}</Badge>,
    },
    {
      header: CM.jobNameLabel,
      accessor: 'name',
      className: 'font-medium',
    },
    {
      header: CM.cronExpressionLabel,
      accessor: 'cronExpr',
      render: (val) => <span className="font-mono text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-sm">{val}</span>,
    },
    {
      header: CM.nextRunLabel,
      accessor: 'nextRun',
      render: (val) => <span className="text-slate-500">{val}</span>,
    },
    {
      header: CM.active,
      accessor: 'active',
      width: '100px',
      render: (val, row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Toggle checked={val} onChange={(checked) => onToggleActive && onToggleActive(row.id, checked)} />
        </div>
      ),
    },
    {
      header: CM.actions,
      accessor: 'actions',
      width: '140px',
      render: (_, row) => (
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" icon="play_arrow" onClick={() => onRunNow && onRunNow(row.id)} title={CM.runNowTitle} />
          <Button variant="ghost" size="icon" icon="edit" onClick={() => onEdit && onEdit(row)} title={CM.edit} />
          <Button variant="ghost" size="icon" icon="delete" className="text-rose-500 hover:text-rose-600 dark:hover:text-rose-400" onClick={() => handleDelete(row)} title={CM.deleteBtn} />
        </div>
      ),
    },
  ];

  return (
    <div className="group border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
      <Table
        columns={columns}
        data={jobs}
        emptyMessage={CM.noAutomatedJobsMsg}
      />
    </div>
  );
};
