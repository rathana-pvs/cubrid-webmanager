import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeUnloadDBModal, openUnloadResultModal } from '../databaseSlice';
import { databaseApi } from '../databaseApi';

import UnloadConfigSection from './unload/UnloadConfigSection';
import UnloadContentSection from './unload/UnloadContentSection';
import UnloadAdvancedOptions from './unload/UnloadAdvancedOptions';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Typography } from '../../../components/ds/foundation/Typography';

export default function UnloadDatabaseModal() {
  const dispatch = useDispatch();
  const { isUnloadDBModalOpen, selectedDatabase, databases, activeDatabases } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);
  
  const currentDb = databases.find(db => db.dbname === selectedDatabase);

  const [formData, setFormData] = useState({
    targetDbName: '',
    targetDirectory: '',
    dbUsername: '',
    dbPassword: '',
    schemaOption: 'All', // All, Selected tables, Not include
    dataOption: 'Selected tables', // Selected tables, Not include
    selectedTables: [],
    asDba: false,
    splitSchema: false,
    classOnly: false,
    skipIndex: false,
    useDelimitedIdentifier: false,
    includeReferencedTables: false,
    usePrefixOutputFile: false,
    prefixOutputFile: '',
    useFileForHash: false,
    fileForHash: '',
    useCachedPages: false,
    cachedPages: '',
    useEstimateInstances: false,
    estimateInstances: '',
    useLoFileDirectory: false,
    loFileDirectory: ''
  });

  const [dynamicTables, setDynamicTables] = useState([]);
  const [isTablesLoading, setIsTablesLoading] = useState(false);
  const [isUnloading, setIsUnloading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTables = useCallback(async () => {
    if (!selectedHostUid || !selectedDatabase) return;
    setIsTablesLoading(true);
    try {
      const status = activeDatabases.includes(selectedDatabase) ? 'on' : 'off';
      const res = await databaseApi.getClassInfo(selectedHostUid, selectedDatabase, status);
      
      const userTables = res.userclass?.[0]?.class?.map(c => c.classname) || [];
      setDynamicTables(userTables);
      
      setFormData(prev => {
        if (prev.schemaOption === 'All') {
          return { ...prev, selectedTables: userTables };
        }
        return prev;
      });
    } catch (err) {
      console.error('Failed to fetch tables:', err);
    } finally {
      setIsTablesLoading(false);
    }
  }, [selectedHostUid, selectedDatabase, activeDatabases]);


  useEffect(() => {
    if (isUnloadDBModalOpen && selectedDatabase) {
      setFormData(prev => ({
        ...prev,
        targetDbName: selectedDatabase,
        targetDirectory: currentDb?.dbdir || `/home/cubrid/databases/${selectedDatabase}`,
        dbUsername: 'dba',
        fileForHash: currentDb?.dbdir ? `${currentDb.dbdir}/hashfile` : `/home/cubrid/databases/${selectedDatabase}/hashfile`
      }));
      fetchTables();
    }
  }, [isUnloadDBModalOpen, selectedDatabase, currentDb, fetchTables]);

  if (!isUnloadDBModalOpen) return null;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSchemaChange = (e) => {
    const { value } = e.target;
    setFormData(prev => {
      let newSelectedTables = prev.selectedTables;
      if (value === 'All') {
        newSelectedTables = [...dynamicTables];
      } else if (value === 'Selected tables' || value === 'Not include') {
        newSelectedTables = [];
      }
      
      return {
        ...prev,
        schemaOption: value,
        selectedTables: newSelectedTables
      };
    });
  };

  const handleTableToggle = (table) => {
    setFormData(prev => ({
      ...prev,
      selectedTables: prev.selectedTables.includes(table)
        ? prev.selectedTables.filter(t => t !== table)
        : [...prev.selectedTables, table]
    }));
  };

  const handleUnloadDatabase = async () => {
    if (!selectedHostUid || !selectedDatabase) return;
    
    setIsUnloading(true);
    setError(null);
    try {
      const payload = {
        targetdir: formData.targetDirectory,
        isSchemaIncluded: formData.schemaOption !== 'Not include',
        isDataIncluded: formData.dataOption !== 'Not include',
        dbuser: formData.dbUsername,
        dbpasswd: formData.dbPassword,
        usehash: formData.useFileForHash ? 'yes' : 'no',
        hashdir: formData.useFileForHash ? formData.fileForHash : '',
        class: formData.selectedTables.map(t => ({ classname: t })),
        ref: formData.includeReferencedTables ? 'yes' : 'no',
        classonly: formData.classOnly ? 'yes' : 'no',
        "as-dba": formData.asDba ? 'yes' : 'no',
        "skip-index-detail": formData.skipIndex ? 'yes' : 'no',
        "split-schema-files": formData.splitSchema ? 'yes' : 'no',
        delimit: formData.useDelimitedIdentifier ? 'yes' : 'no',
        estimate: formData.useEstimateInstances ? String(formData.estimateInstances) : '',
        prefix: formData.usePrefixOutputFile ? formData.prefixOutputFile : '',
        cach: formData.useCachedPages ? String(formData.cachedPages) : '',
        lofile: formData.useLoFileDirectory ? String(formData.loFileDirectory) : ''
      };

      const response = await databaseApi.unloadDatabase(selectedHostUid, selectedDatabase, payload);
      dispatch(closeUnloadDBModal());
      dispatch(openUnloadResultModal(response));
    } catch (err) {
      console.error('Failed to unload database:', err);
      setError(err.response?.data?.note || err.response?.data?.message || 'The unload operation failed. Check permissions.');
    } finally {
      setIsUnloading(false);
    }
  };

  const footer = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-widest italic group transition-colors hover:text-amber-500/70">
        <Icon name="verified_user" size="14px" className="animate-pulse" />
        <span>DBA credentials required for extraction</span>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={() => dispatch(closeUnloadDBModal())}
          className="text-[12px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors px-4"
        >
          Discard
        </button>
        <Button 
          onClick={handleUnloadDatabase}
          loading={isUnloading}
          icon="upload"
          className="px-6 min-w-[140px]"
        >
          Initialize Export
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isUnloadDBModalOpen}
      onClose={() => dispatch(closeUnloadDBModal())}
      title="Extract Database Data"
      subtitle="Export schema and records to portable flat files"
      icon="upload"
      footer={footer}
      loading={isUnloading}
      error={error}
      onErrorClose={() => setError(null)}
      onErrorRetry={handleUnloadDatabase}
      maxWidth="max-w-[740px]"
    >
      <div className="space-y-8 pb-4">
        
        {/* Source Instance Banner */}
        <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-linear-to-r from-amber-500/8 to-transparent dark:from-amber-500/10 dark:to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-inner">
                <Icon name="database" size="md" weight={300} className="text-amber-500" />
              </div>
              <div className="min-w-0 flex-1">
                <Typography variant="p" className="text-[10px] font-bold uppercase tracking-widest text-amber-600/70 dark:text-amber-400/60 mb-0.5">
                  Extraction Source
                </Typography>
                <div className="flex items-center gap-2">
                  <Typography variant="p" className="text-[14px] font-bold text-amber-700 dark:text-amber-400 font-mono truncate">
                    {selectedDatabase}
                  </Typography>
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-xs border ${activeDatabases.includes(selectedDatabase) ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>
                    {activeDatabases.includes(selectedDatabase) ? 'Active' : 'Standby'}
                  </span>
                </div>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/5 backdrop-blur-xs">
              <Icon name="description" size="sm" className="text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Target Type: .sql / .csv</span>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <UnloadConfigSection 
            formData={formData} 
            handleInputChange={handleInputChange} 
          />

          <UnloadContentSection 
            formData={formData}
            handleInputChange={handleInputChange}
            handleSchemaChange={handleSchemaChange}
            handleTableToggle={handleTableToggle}
            dynamicTables={dynamicTables}
            isTablesLoading={isTablesLoading}
          />

          <UnloadAdvancedOptions 
            formData={formData}
            handleInputChange={handleInputChange}
          />
        </div>

        {/* Action Disclaimer */}
        <div className="flex items-start gap-4 p-4 bg-slate-100 dark:bg-white/2 border border-slate-200 dark:border-white/8 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/5 flex items-center justify-center shrink-0 border border-slate-200 dark:border-white/10 shadow-xs">
            <Icon name="info" size="sm" weight={300} className="text-sky-500" />
          </div>
          <div>
            <Typography variant="p" className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1 leading-tight uppercase tracking-tight">
              Export Logic Disclaimer
            </Typography>
            <Typography variant="p" className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Extraction is executed via the <span className="font-mono text-amber-500/80 italic">cubrid_unload</span> utility. Depending on data volume, this process may consume significant CPU cycles and temporarily reduce instance throughput.
            </Typography>
          </div>
        </div>

      </div>
    </Modal>
  );
}
