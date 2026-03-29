import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeAutoQueryLogModal, fetchQueryPlanLog } from '../databaseSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Table } from '../../../components/ds/layout/Table';
import { SearchInput } from '../../../components/ds/forms/SearchInput';
import { Typography } from '../../../components/ds/foundation/Typography';

export default function AutoQueryLogModal() {
  const dispatch = useDispatch();
  const { isAutoQueryLogModalOpen } = useSelector((state) => state.databaseUI);
  const { queryPlanLogs, logsLoading } = useSelector((state) => state.databaseOperation);
  const { selectedDatabase } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);
  
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isAutoQueryLogModalOpen && selectedHostUid) {
      dispatch(fetchQueryPlanLog({ hostUid: selectedHostUid }));
    }
  }, [isAutoQueryLogModalOpen, selectedHostUid, dispatch]);

  if (!isAutoQueryLogModalOpen) return null;

  const filteredLogs = (queryPlanLogs || []).filter(log => {
    const matchesDB = selectedDatabase ? log.dbname === selectedDatabase : true;
    const matchesSearch = log.query_id?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.error_desc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.dbname?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDB && matchesSearch;
  });

  const columns = [
    { 
      header: 'Query ID', 
      accessor: 'query_id',
      render: (val) => (
        <span className="text-sky-600 dark:text-sky-400 italic font-mono">{val}</span>
      )
    },
    { 
      header: 'Execution Time', 
      accessor: 'error_time',
      className: 'w-[180px]'
    },
    { 
      header: 'Description', 
      accessor: 'error_desc',
      render: (val) => {
        const isSuccess = val?.toLowerCase().includes('success');
        const isStart = val?.toLowerCase().includes('auto job start');
        
        return (
          <div className="flex items-center gap-2.5">
            {isSuccess ? (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Icon name="check_circle" size="sm" weight={300} className="fill-current" />
                <span>{val}</span>
              </div>
            ) : isStart ? (
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                <Icon name="play_circle" size="sm" weight={300} className="animate-pulse" />
                <span>{val}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-rose-500 dark:text-rose-400">
                <Icon name="report" size="sm" weight={300} />
                <span>{val}</span>
              </div>
            )}
          </div>
        );
      }
    }
  ];

  const footer = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <Typography variant="caption" className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status:</Typography>
        {logsLoading ? (
           <span className="flex items-center gap-1.5 text-[10px] text-sky-500 font-bold animate-pulse uppercase">
             <div className="w-1.5 h-1.5 rounded-full bg-sky-500"></div>
             Buffering
           </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold uppercase">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
             Synchronized
           </span>
        )}
      </div>
      
      <div className="flex gap-3">
        <Button 
          variant="ghost" 
          onClick={() => dispatch(closeAutoQueryLogModal())}
        >
          Cancel
        </Button>
        <Button 
          onClick={() => dispatch(fetchQueryPlanLog({ hostUid: selectedHostUid }))}
          loading={logsLoading}
          icon="refresh"
          className="min-w-[120px]"
        >
          Refresh
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isAutoQueryLogModalOpen}
      onClose={() => dispatch(closeAutoQueryLogModal())}
      title="Auto Query Log"
      subtitle={selectedDatabase ? `History for database: ${selectedDatabase}` : 'Global Query Execution History'}
      icon="history"
      iconVariant="info"
      maxWidth="max-w-[800px]"
      footer={footer}
    >
      <div className="flex flex-col h-[500px]">
        <div className="mb-4">
          <SearchInput 
            placeholder="Filter logs by ID or description..."
            value={searchTerm}
            onChange={setSearchTerm}
            onClear={() => setSearchTerm('')}
            className="max-w-xs"
          />
        </div>

        <div className="flex-1 min-h-0 border border-slate-100 dark:border-white/5 rounded-xl overflow-hidden bg-white/50 dark:bg-bk-side/50">
          <Table 
            columns={columns}
            data={filteredLogs}
            loading={logsLoading}
            emptyMessage="No execution logs found for the current criteria."
            className="h-full"
          />
        </div>
      </div>
    </Modal>
  );
}
