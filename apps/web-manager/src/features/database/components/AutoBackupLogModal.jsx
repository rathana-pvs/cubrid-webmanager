import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeAutoBackupLogModal, fetchAutoBackupLog } from '../databaseSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Table } from '../../../components/ds/layout/Table';
import { SearchInput } from '../../../components/ds/forms/SearchInput';
import { Typography } from '../../../components/ds/foundation/Typography';

export default function AutoBackupLogModal() {
  const dispatch = useDispatch();
  const { isAutoBackupLogModalOpen } = useSelector((state) => state.databaseUI);
  const { selectedDatabase } = useSelector((state) => state.database);
  const {
    autoBackupLogs,
    logsLoading,
    logsError,
  } = useSelector((state) => state.databaseOperation);
  const { selectedHostUid } = useSelector((state) => state.host);
  
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isAutoBackupLogModalOpen && selectedHostUid) {
      dispatch(fetchAutoBackupLog({ hostUid: selectedHostUid }));
    }
  }, [isAutoBackupLogModalOpen, selectedHostUid, dispatch]);

  if (!isAutoBackupLogModalOpen) return null;

  const filteredLogs = (autoBackupLogs || []).filter(log => {
    const matchesDB = selectedDatabase ? log.dbname === selectedDatabase : true;
    const matchesSearch = log.backupid?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.error_desc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.dbname?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDB && matchesSearch;
  });

  const columns = [
    { 
      header: 'Backup ID', 
      accessor: 'backupid',
      render: (val) => (
        <span className="text-amber-600 dark:text-bk-yellow italic font-mono">{val}</span>
      )
    },
    { 
      header: 'Log Time', 
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
           <span className="flex items-center gap-1.5 text-[10px] text-amber-500 font-bold animate-pulse uppercase">
             <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
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
          onClick={() => dispatch(closeAutoBackupLogModal())}
        >
          Cancel
        </Button>
        <Button 
          onClick={() => dispatch(fetchAutoBackupLog({ hostUid: selectedHostUid }))}
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
      isOpen={isAutoBackupLogModalOpen}
      onClose={() => dispatch(closeAutoBackupLogModal())}
      title="Auto Backup Log"
      subtitle={selectedDatabase ? `History for database: ${selectedDatabase}` : 'Global Backup History'}
      icon="history"
      iconVariant="warning"
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
            emptyMessage="No backup logs found for the current criteria."
            className="h-full"
          />
        </div>
      </div>
    </Modal>
  );
}
