import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAutoVolumeLog, closeAutoVolumeLogModal } from '../databaseSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Table } from '../../../components/ds/layout/Table';
import { SearchInput } from '../../../components/ds/forms/SearchInput';
import { Typography } from '../../../components/ds/foundation/Typography';

export default function AutoVolumeLogModal() {
  const dispatch = useDispatch();
  const { isAutoVolumeLogModalOpen, selectedDatabase, autoVolumeLogs, logsLoading } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);
  
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isAutoVolumeLogModalOpen && selectedHostUid) {
      dispatch(fetchAutoVolumeLog({ hostUid: selectedHostUid }));
    }
  }, [isAutoVolumeLogModalOpen, selectedHostUid, dispatch]);

  if (!isAutoVolumeLogModalOpen) return null;

  const filteredLogs = (autoVolumeLogs || []).filter(log => {
      const matchesDB = selectedDatabase ? log.dbname === selectedDatabase : true;
      const matchesSearch = log.volname?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            log.outcome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            log.dbname?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDB && matchesSearch;
  });

  const columns = [
    { header: 'Database', accessor: 'dbname' },
    { 
      header: 'Volume Name', accessor: 'volname',
      render: (val) => <span className="text-amber-600 dark:text-bk-yellow font-mono italic">{val}</span>
    },
    { 
      header: 'Purpose', accessor: 'purpose',
      render: (val) => (
        <span className="px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-[9px] uppercase font-bold tracking-tighter text-slate-500">
          {val}
        </span>
      )
    },
    { header: 'Pages', accessor: 'page' },
    { header: 'Time', accessor: 'time' },
    { 
      header: 'Outcome', accessor: 'outcome',
      render: (val) => {
        const isSuccess = val?.toLowerCase() === 'success';
        const isStart = val?.toLowerCase() === 'start';
        return (
          <div className={`flex items-center gap-2 text-[11px] font-bold ${isSuccess ? 'text-emerald-500' : isStart ? 'text-amber-500' : 'text-rose-500'}`}>
            <Icon name={isSuccess ? 'check_circle' : isStart ? 'play_circle' : 'report'} size="sm" weight={300} />
            <span className="uppercase tracking-tight">{val}</span>
          </div>
        );
      }
    }
  ];

  const footer = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
         <Typography variant="caption" className="font-bold text-slate-400 uppercase tracking-widest">Server:</Typography>
         <Typography variant="caption" className="font-bold text-emerald-500">Connected</Typography>
      </div>
      <Button 
        variant="ghost" 
        onClick={() => dispatch(closeAutoVolumeLogModal())}
      >
        Close audit
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isAutoVolumeLogModalOpen}
      onClose={() => dispatch(closeAutoVolumeLogModal())}
      title="Auto volume log"
      subtitle={selectedDatabase ? `Audit history for: ${selectedDatabase}` : 'Global automation history'}
      icon="history_edu"
      iconVariant="warning"
      maxWidth="max-w-[900px]"
      footer={footer}
    >
      <div className="flex flex-col h-[540px]">
        <div className="mb-4">
          <SearchInput 
            placeholder="Filter logs..."
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
            emptyMessage="No automation logs found."
            className="h-full"
          />
        </div>
      </div>
    </Modal>
  );
}
