import React, { useState } from 'react';
import { Icon } from '../foundation/Icon';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';

export const Table = ({
  columns = [],
  data = [],
  onRowClick,
  emptyMessage = 'No data available',
  headersVisible = true,
  sortable = true,
  loading = false,
  zebra = false,
  bordered = false,
  className = '',
}) => {
  const [sortConfig, setSortConfig] = useState(null);

  const handleSort = (accessor) => {
    if (!sortable) return;
    let direction = 'asc';
    if (sortConfig && sortConfig.key === accessor && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: accessor, direction });
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data;
    return [...data].sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  if (loading && data.length === 0) {
    return (
      <div className="w-full space-y-2 p-2">
        <Skeleton variant="rect" height="32px" />
        <Skeleton variant="rect" height="32px" />
        <Skeleton variant="rect" height="32px" />
      </div>
    );
  }

  if (!loading && data.length === 0) {
    return <EmptyState title={emptyMessage} icon="table_chart" />;
  }

  return (
    <div className={`w-full overflow-x-auto ${className} ${bordered ? 'border-b border-slate-200 dark:border-white/[0.08]' : ''}`}>
      <table className="w-full text-left border-collapse">

        {/* ── Header ── */}
        {headersVisible && (
          <thead>
            <tr className="bg-slate-100 dark:bg-white/3 border-b border-slate-200 dark:border-white/[0.07]">
            {columns.map((col, idx) => {
                const isSorted = sortConfig && col.accessor && sortConfig.key === col.accessor;
                const alignCls = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : '';
                return (
                  <th
                    key={col.accessor || idx}
                    className={`group relative px-3 py-2 text-[11px] font-bold uppercase tracking-widest
                      ${isSorted ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}
                      ${bordered ? 'border-r border-slate-200 dark:border-white/[0.08]' : ''}
                      transition-colors whitespace-nowrap ${alignCls}
                      ${col.className || ''} ${sortable ? 'cursor-pointer select-none' : ''}`}
                    style={{ width: col.width }}
                    onClick={() => handleSort(col.accessor)}
                  >
                    {/* Left accent bar for active sort column */}
                    {isSorted && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3.5 rounded-full bg-amber-500" />
                    )}

                    <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : ''}`}>
                      <span className="truncate">{col.header}</span>
                      {sortable && (
                        <span className={`ml-0.5 transition-all duration-150 ${isSorted ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
                          <Icon
                            name={isSorted ? (sortConfig.direction === 'asc' ? 'north' : 'south') : 'unfold_more'}
                            size="11px"
                            weight={isSorted ? 700 : 300}
                            className={isSorted ? 'text-amber-500' : 'text-slate-400'}
                          />
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
        )}

        {/* ── Body ── */}
        <tbody className="divide-y divide-slate-100 dark:divide-white/4">
          {sortedData.map((row, rowIdx) => {
            const isEven = rowIdx % 2 === 0;
            return (
              <tr
                key={row.id || rowIdx}
                className={`group transition-colors duration-100
                  ${zebra && isEven ? 'bg-slate-50/60 dark:bg-white/[0.012]' : ''}
                  hover:bg-amber-500/4 dark:hover:bg-amber-500/5
                  ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((col, colIdx) => {
                  const isFirst = colIdx === 0;
                  const alignCls = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : '';
                  return (
                    <td
                      key={col.accessor || colIdx}
                      className={`px-3 py-2 text-[12px] transition-colors leading-snug
                        ${isFirst
                          ? 'font-semibold text-slate-800 dark:text-slate-200 border-l-2 border-l-transparent group-hover:border-l-amber-500/60'
                          : 'font-medium text-slate-600 dark:text-slate-400'}
                        ${bordered ? 'border-r border-slate-100 dark:border-white/[0.04]' : ''}
                        ${alignCls}
                        ${col.cellClassName || ''}`}
                    >
                      {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
