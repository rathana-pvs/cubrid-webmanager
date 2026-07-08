import React from 'react';
import { Table } from '../../ds/layout/Table';
import { Badge } from '../../ds/foundation/Badge';
import { Button } from '../../ds/foundation/Button';
import { Typography } from '../../ds/foundation/Typography';
import { InfoBanner } from '../../ds/foundation/InfoBanner';
import { useCM } from '../../../constants/useCM';

export const QueryResultGrid = ({
  columns = [],
  rows = [],
  totalRows = 0,
  executionTime = 0,
  loading = false,
  error = null,
  onExport,
}) => {
  const CM = useCM();
  if (error) {
    return (
      <InfoBanner variant="danger" title={CM.queryFailedTitle} icon="error_outline" className="m-4">
        {error}
      </InfoBanner>
    );
  }

  const formattedColumns = columns.map(col => ({
    header: col,
    accessor: col,
  }));

  return (
    <div className="flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 h-full">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Typography variant="span" className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {CM.resultsLabel} <span className="text-slate-400 font-normal">({rows.length} of {totalRows})</span>
          </Typography>
          {executionTime > 0 && (
            <Badge variant="info" size="sm">
              {executionTime}s
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onExport && (
            <>
              <Button
                variant="outline"
                size="sm"
                icon="download"
                onClick={() => onExport('csv')}
                className="px-2 py-1 text-xs"
                disabled={loading || rows.length === 0}
              >
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon="grid_on"
                onClick={() => onExport('xlsx')}
                className="px-2 py-1 text-xs"
                disabled={loading || rows.length === 0}
              >
                Excel
              </Button>
            </>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto relative min-h-[200px]">
        <Table
          columns={formattedColumns}
          data={rows}
          loading={loading}
          emptyMessage={CM.noResultsFoundMsg}
          className="h-full"
        />
      </div>
    </div>
  );
};
