import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeUnloadDatabaseModal, openUnloadResultModal } from '../databaseSlice';
import { databaseApi } from '../databaseApi';

import UnloadConfigSection from './unload/UnloadConfigSection';
import UnloadContentSection from './unload/UnloadContentSection';
import UnloadAdvancedOptions from './unload/UnloadAdvancedOptions';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Spinner } from '../../../components/ds/foundation/Spinner';

// view states
const VIEW_FORM    = 'form';
const VIEW_LOADING = 'loading';
const VIEW_SUCCESS = 'success';
const VIEW_ERROR   = 'error';

export default function UnloadDatabaseModal() {
  const dispatch = useDispatch();
  const { isUnloadDatabaseModalOpen: isUnloadDBModalOpen } = useSelector((state) => state.databaseUI);
  const { selectedDatabase, databases, activeDatabases } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);
  
  const currentDb = databases.find(db => db.dbname === selectedDatabase);

  const [view, setView] = useState(VIEW_FORM);
  const [errorMsg, setErrorMsg] = useState('');

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
      setView(VIEW_FORM);
      setErrorMsg('');
      setFormData(prev => ({
        ...prev,
        targetDbName: selectedDatabase,
        targetDirectory: currentDb?.dbdir || `/home/cubrid/databases/${selectedDatabase}`,
        dbUsername: 'dba',
        dbPassword: '',
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
    
    setView(VIEW_LOADING);
    setErrorMsg('');
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
      // Instead of manual succession, we use the result modal as intended by legacy
      // but wrap it in our VIEW_SUCCESS pattern
      dispatch(closeUnloadDatabaseModal());
      dispatch(openUnloadResultModal(response));
    } catch (err) {
      setErrorMsg(typeof err === 'string' ? err : (err.message || 'The extraction process was interrupted. Ensure the target directory is writable.'));
      setView(VIEW_ERROR);
    }
  };

  const handleClose = () => dispatch(closeUnloadDatabaseModal());

  /* ─── LOADING view ─── */
  if (view === VIEW_LOADING) {
    return (
      <Modal isOpen title="Extracting Instance" icon="upload" onClose={handleClose} maxWidth="740px">
        <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in fade-in duration-200">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-slate-100 dark:border-white/5" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-500 animate-spin" style={{ animationDuration: '0.9s' }} />
            <div className="absolute inset-[10px] rounded-full border-[1.5px] border-transparent border-b-amber-500/30 animate-spin" style={{ animationDuration: '1.7s', animationDirection: 'reverse' }} />
            <div className="absolute inset-0 flex items-center justify-center text-amber-500">
              <Icon name="upload" size="md" weight={400} className="animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-1.5 px-8">
            <Typography variant="h4" className="text-[14px] font-black text-slate-800 dark:text-white tracking-tight">Generating Export Payload</Typography>
            <Typography variant="p" className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-[280px] mx-auto">
              Serializing schema and data records for <span className="font-black text-slate-900 dark:text-white">{selectedDatabase}</span>.
            </Typography>
          </div>
          <div className="w-32 h-[2px] bg-slate-100 dark:bg-white/4 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ animation: 'modalSlide 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (view === VIEW_ERROR) {
    return (
      <Modal isOpen title="Extraction Failed" icon="upload" iconVariant="danger" onClose={handleClose} maxWidth="740px">
        <div className="flex flex-col items-center justify-center py-10 gap-6 text-center animate-in fade-in duration-200">
          <div className="relative">
            <div className="absolute inset-0 bg-rose-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <Icon name="error" size="md" weight={300} className="text-white" />
            </div>
          </div>

          <div className="space-y-2 px-6">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
              Action Interrupted
            </Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 font-medium leading-relaxed">
              System could not finalize the export of <span className="font-black text-slate-900 dark:text-white">{selectedDatabase}</span>.
            </Typography>
          </div>

          <div className="w-full max-w-[420px] bg-rose-500/5 border border-rose-500/15 rounded-xl px-4 py-3 text-left">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon name="terminal" size="xs" weight={300} className="text-rose-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-400">Error Manifest</span>
            </div>
            <Typography variant="caption" className="text-rose-400/80 font-mono leading-relaxed break-words">
              {errorMsg}
            </Typography>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleClose}>Dismiss</Button>
            <Button variant="primary" icon="refresh" onClick={() => { setView(VIEW_FORM); setErrorMsg(''); }}>
              Retry Task
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── FORM view ─── */
  return (
    <Modal
      isOpen={isUnloadDBModalOpen}
      onClose={handleClose}
      title="Extract Database Assets"
      subtitle="Export schema and records to portable flat files"
      icon="upload"
      maxWidth="740px"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[11px] font-black uppercase tracking-widest italic">
            <Icon name="shield" size="14px" className="text-amber-500/50" />
            <span>DBA credentials required for extraction</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleClose}>Discard</Button>
            <Button 
              onClick={handleUnloadDatabase}
              icon="upload"
              className="px-6 min-w-[140px]"
            >
              Initialize Export
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-8 pb-4">
        
        {/* Source Instance Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-linear-to-r from-amber-500/8 to-transparent dark:from-amber-500/10 dark:to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-inner">
                <Icon name="database" size="md" weight={300} className="text-amber-500" />
              </div>
              <div className="min-w-0 flex-1">
                <Typography variant="caption" className="font-black uppercase tracking-widest text-amber-600/70 dark:text-amber-400/60 mb-0.5">
                  Extraction Source
                </Typography>
                <div className="flex items-center gap-2">
                  <Typography variant="h4" className="text-[14px] font-black text-amber-700 dark:text-amber-400 font-mono truncate">
                    {selectedDatabase}
                  </Typography>
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${activeDatabases.includes(selectedDatabase) ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>
                    <div className={`w-1 h-1 rounded-full ${activeDatabases.includes(selectedDatabase) ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    <span className="text-[8px] font-black uppercase tracking-widest">
                      {activeDatabases.includes(selectedDatabase) ? 'Active' : 'Standby'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/5 backdrop-blur-xs">
              <Icon name="description" size="sm" className="text-slate-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Target Type: .sql / .csv</span>
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
        <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/8 rounded-2xl shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center shrink-0 border border-slate-200 dark:border-white/10">
            <Icon name="info" size="sm" weight={300} className="text-sky-500" />
          </div>
          <div>
            <Typography variant="p" className="text-[11px] font-black text-slate-700 dark:text-slate-200 mb-1 leading-tight uppercase tracking-tight">
              Resource Management
            </Typography>
            <Typography variant="p" className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Extraction is executed via the <span className="font-mono text-amber-500/80 italic font-bold">cubrid_unload</span> utility. High-volume datasets may consume significant I/O and CPU resources.
            </Typography>
          </div>
        </div>

      </div>
    </Modal>
  );
}
