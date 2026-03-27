import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeDatabaseInfoModal, fetchDatabaseParamDump } from '../databaseSlice';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import ErrorOverlay from '../../../components/common/ErrorOverlay';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Checkbox } from '../../../components/ds/forms/Checkbox';
import { Divider } from '../../../components/ds/layout/Divider';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Table } from '../../../components/ds/layout/Table';

export default function DatabaseInfoModal() {
  const dispatch = useDispatch();
  const { isDatabaseInfoModalOpen, selectedDatabase, databaseInfoData, databaseInfoLoading, databaseInfoError, activeDatabases } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);

  const [step, setStep] = useState('setup'); // 'setup' or 'results'
  const [dumpBoth, setDumpBoth] = useState(false);

  const isActive = activeDatabases.includes(selectedDatabase);

  // Reset state when modal opens
  useEffect(() => {
    if (isDatabaseInfoModalOpen) {
      setStep('setup');
      setDumpBoth(false);
    }
  }, [isDatabaseInfoModalOpen]);

  if (!isDatabaseInfoModalOpen) return null;

  const handleRunDump = () => {
    if (selectedHostUid && selectedDatabase) {
      dispatch(fetchDatabaseParamDump({ 
        hostUid: selectedHostUid, 
        dbname: selectedDatabase, 
        both: dumpBoth ? 'y' : 'n' 
      })).unwrap().then(() => {
        setStep('results');
      });
    }
  };

  const handleClose = () => {
    dispatch(closeDatabaseInfoModal());
  };

  const rawData = databaseInfoData[selectedDatabase] || {};
  const serverParams = (rawData.server && rawData.server.length > 0) ? rawData.server[0] : {};
  const clientParams = (rawData.client && rawData.client.length > 0) ? rawData.client[0] : null;

  // Merge keys to follow d-cms horizontal comparison
  const allKeys = Array.from(new Set([
    ...Object.keys(serverParams),
    ...(clientParams ? Object.keys(clientParams) : [])
  ])).sort();

  const paramList = allKeys.map(key => ({
    name: key,
    server: serverParams[key] !== undefined ? (typeof serverParams[key] === 'boolean' ? (serverParams[key] ? 'yes' : 'no') : String(serverParams[key])) : '-',
    client: clientParams ? (clientParams[key] !== undefined ? (typeof clientParams[key] === 'boolean' ? (clientParams[key] ? 'yes' : 'no') : String(clientParams[key])) : '-') : null
  }));

  const columns = [
    { header: 'Parameter Identifier', accessor: 'name', render: (val) => (
      <Typography variant="label" className="text-slate-900 dark:text-slate-100 font-bold tracking-tight">
        {val}
      </Typography>
    )},
    { header: 'Server Value', accessor: 'server', className: dumpBoth ? 'w-[150px]' : 'w-[250px]', render: (val) => (
      <Typography variant="span" className="font-mono text-[11px] text-bk-yellow underline decoration-bk-yellow/20 underline-offset-2">{val}</Typography>
    )},
    ...(dumpBoth ? [{ header: 'Client Value', accessor: 'client', className: 'w-[150px] text-center', render: (val) => (
      <Typography variant="span" className={`font-mono text-[11px] ${val === '-' ? 'text-slate-300 dark:text-slate-700' : 'text-slate-900 dark:text-slate-100'}`}>{val}</Typography>
    )}] : [])
  ];

  return (
    <Modal
      isOpen={isDatabaseInfoModalOpen}
      onClose={handleClose}
      title="Used Parameter Dump"
      icon="database"
      maxWidth={step === 'setup' ? '500px' : '900px'}
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={handleClose}>
            {step === 'setup' ? 'Discard' : 'Close'}
          </Button>
          {step === 'setup' ? (
            <Button 
              variant="primary" 
              onClick={handleRunDump} 
              loading={databaseInfoLoading}
              icon="analytics"
            >
              Analyze Parameters
            </Button>
          ) : (
            <Button 
              variant="primary" 
              onClick={() => setStep('setup')}
              icon="settings"
              className="bg-slate-800 hover:bg-slate-900 text-white border-transparent"
            >
              Adjust Settings
            </Button>
          )}
        </div>
      }
    >
      <div className="relative">
        <LoadingOverlay 
          isVisible={databaseInfoLoading} 
          title="Processing Dump" 
          subtitle="Retrieving used parameter values..." 
        />
        <ErrorOverlay 
          isVisible={!!databaseInfoError} 
          error={databaseInfoError} 
          onRetry={handleRunDump}
          onClose={handleClose}
        />

        {step === 'setup' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-400">
            <div className="space-y-4">
              <Divider label="ANALYSIS TARGET" />
              <div className="px-1">
                <Input 
                  label="Database Name"
                  value={selectedDatabase}
                  disabled
                  icon="database"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Divider label="ANALYSIS OPTIONS" />
              <div className="space-y-4">
                <div className="p-4 bg-bk-yellow/5 border border-bk-yellow/10 rounded-2xl flex gap-4 transition-all hover:bg-bk-yellow/10">
                  <div className="w-10 h-10 rounded-xl bg-bk-yellow/10 flex items-center justify-center text-bk-yellow border border-bk-yellow/20 shrink-0">
                    <Icon name="description" size="md" weight={300} />
                  </div>
                  <Typography variant="p" className="text-[11px] text-slate-500 dark:text-slate-400 italic font-medium leading-relaxed">
                    This utility displays a snapshot of parameters currently active in the database memory. It provides visibility into the operational profile of the server instance.
                  </Typography>
                </div>

                <div 
                  className={`flex items-center gap-4 p-4 border rounded-2xl transition-all group ${isActive ? 'bg-slate-50/50 dark:bg-white/2 border-slate-100 dark:border-white/5 cursor-pointer hover:bg-bk-yellow/5 hover:border-bk-yellow/20' : 'bg-slate-100/50 dark:bg-white/1 border-transparent opacity-50 cursor-not-allowed'}`}
                  title={!isActive ? "Database must be active for cross-parameter dump" : ""}
                  onClick={() => isActive && setDumpBoth(!dumpBoth)}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all shrink-0 ${dumpBoth ? 'bg-bk-yellow/10 border-bk-yellow/20 text-bk-yellow' : 'bg-slate-100 dark:bg-white/5 border-transparent text-slate-400'}`}>
                    <Icon name="compare_arrows" size="md" weight={300} />
                  </div>
                  <div className="flex-1">
                    <Typography variant="label" className={`font-bold tracking-tight transition-colors ${dumpBoth ? 'text-bk-yellow' : 'text-slate-900 dark:text-white'}`}>Comparative Dump</Typography>
                    <Typography variant="p" className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Extract both client-side and server-side configurations</Typography>
                  </div>
                  <Checkbox 
                    checked={dumpBoth}
                    onChange={(e) => isActive && setDumpBoth(e.target.checked)}
                    disabled={!isActive}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-[550px] -m-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="px-6 py-4 flex items-center justify-between bg-slate-50/80 dark:bg-black/20 border-b border-slate-100 dark:border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-bk-yellow/10 flex items-center justify-center text-bk-yellow border border-bk-yellow/20">
                  <Icon name="analytics" size="sm" weight={300} />
                </div>
                <Typography variant="label" className="text-slate-400 uppercase tracking-widest font-bold">Analysis Cache: <Typography variant="span" className="text-bk-yellow ml-1">{selectedDatabase}</Typography></Typography>
              </div>
              <div className="flex items-center gap-2">
                <Typography variant="span" className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                  {isActive ? 'Live Instance' : 'Static Schema'}
                </Typography>
              </div>
            </div>

            <div className="flex-1 min-h-0 bg-white dark:bg-transparent flex flex-col">
              <Table 
                columns={columns}
                data={paramList}
                className="h-full"
                emptyMessage="No configuration parameters identified for this instance."
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
