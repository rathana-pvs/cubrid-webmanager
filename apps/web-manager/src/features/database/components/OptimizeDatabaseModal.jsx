import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeOptimizeDatabaseModal, optimizeDatabase } from '../databaseSlice';
import { databaseApi } from '../databaseApi';
import { showStatusModal } from '../../layout/layoutSlice';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import ErrorOverlay from '../../../components/common/ErrorOverlay';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Select } from '../../../components/ds/forms/Select';
import { Divider } from '../../../components/ds/layout/Divider';
import { Typography } from '../../../components/ds/foundation/Typography';

/**
 * Custom Searchable Select for Class List
 */
const ClassSelect = ({ value, userClasses, systemClasses, onChange, disabled, isLoading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredUserClasses = useMemo(() => 
    userClasses.filter(c => c.classname.toLowerCase().includes(search.toLowerCase())),
    [userClasses, search]
  );

  const filteredSystemClasses = useMemo(() => 
    systemClasses.filter(c => c.classname.toLowerCase().includes(search.toLowerCase())),
    [systemClasses, search]
  );

  const hasResults = filteredUserClasses.length > 0 || filteredSystemClasses.length > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-10 px-4 flex items-center justify-between bg-white dark:bg-white/3 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xs transition-all text-left outline-hidden ${
          isOpen ? 'ring-2 ring-bk-yellow/20 border-bk-yellow/60' : 'hover:border-bk-yellow/40'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <Icon 
            name={value ? 'table_view' : 'database'} 
            size="sm" 
            weight={300} 
            className={value ? 'text-bk-yellow' : 'text-slate-400'} 
          />
        <span className={`text-[12px] font-bold truncate ${value ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
          <Typography variant="span">{value ? value : 'Entire Registry (Global Scan)'}</Typography>
        </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isLoading && <div className="w-3.5 h-3.5 border-2 border-bk-yellow/30 border-t-bk-yellow rounded-full animate-spin"></div>}
          <Icon name="expand_more" size="sm" weight={300} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-bk-yellow' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white dark:bg-bk-side border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-110 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[320px]">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-bk-main/40">
            <div className="relative">
              <Icon name="search" size="sm" weight={300} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                autoFocus
                type="text"
                placeholder="Lookup schema objects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-white dark:bg-bk-main border border-slate-200 dark:border-slate-800/80 rounded-xl text-[11px] font-medium text-slate-700 dark:text-white placeholder:text-slate-400 focus:border-bk-yellow/60 outline-hidden transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {search === '' && (
              <button
                type="button"
                onClick={() => { onChange(''); setIsOpen(false); }}
                className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors border-b border-slate-100 dark:border-slate-800/40 group ${
                  value === '' ? 'bg-bk-yellow/10' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <div className={`w-2 h-2 rounded-full transition-all ${value === '' ? 'bg-bk-yellow scale-125 shadow-[0_0_8px_rgba(255,188,4,0.6)]' : 'bg-slate-300 dark:bg-slate-700 group-hover:bg-bk-yellow/40'}`}></div>
                <Typography variant="label" className={`text-[10px] font-bold uppercase tracking-[0.15em] ${value === '' ? 'text-bk-yellow' : 'text-slate-500 dark:text-slate-400'}`}>Entire database</Typography>
              </button>
            )}

            {!hasResults && !isLoading && (
              <div className="py-12 text-center space-y-3">
                <Icon name="search_off" size="xl" weight={100} className="text-slate-200 dark:text-slate-800" />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">No matches for "{search}"</p>
              </div>
            )}

            {isLoading && (
              <div className="py-12 text-center space-y-4">
                <div className="w-8 h-8 border-2 border-bk-yellow/20 border-t-bk-yellow rounded-full animate-spin mx-auto shadow-xs"></div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em]">Inspecting Schema</p>
              </div>
            )}

            {filteredUserClasses.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-1.5 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-bk-side/95 backdrop-blur-md z-10 border-b border-slate-100 dark:border-slate-800/50 mb-1">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">User Tables</span>
                  <span className="text-[9px] bg-slate-100 dark:bg-bk-main/50 px-2 py-0.5 rounded-full text-slate-500 font-mono">{filteredUserClasses.length}</span>
                </div>
                <div className="px-1.5 space-y-0.5">
                  {filteredUserClasses.map((cls) => (
                    <button
                      key={cls.classname}
                      type="button"
                      onClick={() => { onChange(cls.classname); setIsOpen(false); }}
                      className={`w-full px-3 py-2.5 flex items-center gap-3 text-left transition-all rounded-xl group ${
                        value === cls.classname 
                          ? 'bg-bk-yellow text-bk-side font-bold shadow-lg shadow-bk-yellow/10' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-bk-yellow/5 hover:text-bk-yellow'
                      }`}
                    >
                      <Icon name="table" size="sm" weight={300} className={value === cls.classname ? 'text-bk-side' : 'text-slate-400 group-hover:text-bk-yellow'} />
                      <div className="flex flex-col min-w-0">
                        <Typography variant="label" className="text-[11px] font-bold truncate leading-tight select-none">{cls.classname}</Typography>
                        <Typography variant="span" className={`text-[9px] truncate transition-opacity ${value === cls.classname ? 'text-bk-side/60' : 'text-slate-400 group-hover:text-bk-yellow/60'}`}>Owner: {cls.owner}</Typography>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredSystemClasses.length > 0 && (
              <div className="py-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="px-4 py-1.5 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-bk-side/95 backdrop-blur-md z-10 border-b border-slate-100 dark:border-slate-800/50 mb-1">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Internal Catalog</span>
                  <span className="text-[9px] bg-slate-100 dark:bg-bk-main/50 px-2 py-0.5 rounded-full text-slate-500 font-mono">{filteredSystemClasses.length}</span>
                </div>
                <div className="px-1.5 space-y-0.5">
                  {filteredSystemClasses.map((cls) => (
                    <button
                      key={cls.classname}
                      type="button"
                      onClick={() => { onChange(cls.classname); setIsOpen(false); }}
                      className={`w-full px-3 py-2.5 flex items-center gap-3 text-left transition-all rounded-xl group ${
                        value === cls.classname 
                        ? 'bg-bk-yellow text-bk-side font-bold shadow-lg shadow-bk-yellow/10' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-bk-yellow/5 hover:text-bk-yellow'
                      }`}
                    >
                      <Icon name="manufacturing" size="sm" weight={300} className={value === cls.classname ? 'text-bk-side' : 'text-slate-400 group-hover:text-bk-yellow'} />
                      <div className="flex flex-col min-w-0">
                        <Typography variant="label" className="text-[11px] font-bold truncate leading-tight select-none">{cls.classname}</Typography>
                        <Typography variant="span" className={`text-[9px] truncate transition-opacity ${value === cls.classname ? 'text-bk-side/60' : 'text-slate-400 group-hover:text-bk-yellow/60'}`}>System object</Typography>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function OptimizeDatabaseModal() {
  const dispatch = useDispatch();
  const { 
    isOptimizeDatabaseModalOpen, 
    selectedDatabase, 
    activeDatabases
  } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);
  
  const [selectedClassName, setSelectedClassName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Direct state for classes to follow user requirement for direct getClassInfo usage
  const [classesData, setClassesData] = useState({ userclass: [], systemclass: [] });
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

  const isActive = selectedDatabase && activeDatabases.includes(selectedDatabase);
  
  const fetchClasses = useCallback(async () => {
    if (!selectedHostUid || !selectedDatabase) return;
    setIsLoadingClasses(true);
    try {
      const dbstatus = isActive ? 'on' : 'off';
      // Calling the API exactly as requested: getClassInfo: (hostUid, dbname, dbstatus)
      const res = await databaseApi.getClassInfo(selectedHostUid, selectedDatabase, dbstatus);
      
      // Robust extraction handling potential nesting or direct arrays
      const rawUser = res.userclass?.[0]?.class || res.userclass || [];
      const rawSystem = res.systemclass?.[0]?.class || res.systemclass || [];
      
      setClassesData({
        userclass: rawUser.filter(c => c.virtual !== 'view'),
        systemclass: rawSystem.filter(c => c.virtual !== 'view')
      });
    } catch (err) {
      console.error('Failed to fetch optimized classes:', err);
    } finally {
      setIsLoadingClasses(false);
    }
  }, [selectedHostUid, selectedDatabase, isActive]);

  useEffect(() => {
    if (isOptimizeDatabaseModalOpen && selectedDatabase) {
      fetchClasses();
    } else {
      // Reset state when closing
      setSelectedClassName('');
      setClassesData({ userclass: [], systemclass: [] });
    }
  }, [isOptimizeDatabaseModalOpen, selectedDatabase, fetchClasses]);

  if (!isOptimizeDatabaseModalOpen) return null;

  const handleOptimize = async () => {
    if (!selectedHostUid || !selectedDatabase) return;
    
    setLoading(true);
    setError(null);
    try {
      const payload = selectedClassName && selectedClassName !== '' 
        ? { class: [{ classname: selectedClassName }] }
        : {};
        
      await dispatch(optimizeDatabase({ 
        hostUid: selectedHostUid, 
        dbname: selectedDatabase, 
        payload 
      })).unwrap();
      
      dispatch(closeOptimizeDatabaseModal());
      dispatch(showStatusModal({
        type: 'success',
        title: 'Optimization Success',
        message: selectedClassName 
          ? `Table "${selectedClassName}" in database ${selectedDatabase} optimized successfully.`
          : `Database ${selectedDatabase} optimized successfully.`
      }));
    } catch (err) {
      setError(err || 'Failed to optimize database. Please ensure the database is accessible and try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalTables = classesData.userclass.length + classesData.systemclass.length;

  return (
    <Modal
      isOpen={isOptimizeDatabaseModalOpen}
      onClose={() => dispatch(closeOptimizeDatabaseModal())}
      title="Database Performance Optimization"
      icon="auto_fix_high"
      maxWidth="460px"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={() => dispatch(closeOptimizeDatabaseModal())} disabled={loading}>
            Discard
          </Button>
          <Button 
            variant="primary" 
            onClick={handleOptimize} 
            loading={loading}
            icon="play_circle"
            disabled={isLoadingClasses}
          >
            Execute Optimization
          </Button>
        </div>
      }
    >
      <div className="relative">
        <LoadingOverlay 
          isVisible={loading} 
          title="Optimizing Database" 
          subtitle="Regenerating index and query optimization statistics..." 
        />
        <ErrorOverlay 
          isVisible={!!error} 
          error={error} 
          onRetry={handleOptimize}
          onClose={() => setError(null)}
        />

        <div className="space-y-8">
          {/* Section: Target Information */}
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <Divider label="MAINTENANCE CONTEXT" />
            <div className="px-1">
              <Input 
                label="Environment Identifier"
                value={selectedDatabase}
                disabled
                icon="database"
              />
            </div>
          </div>

          {/* Section: Configuration */}
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <Divider label="OPTIMIZATION CONFIGURATION" />
            
            <div className="px-1 space-y-5">
              <div className="p-4 bg-bk-yellow/5 border border-bk-yellow/10 rounded-2xl flex gap-4 transition-all hover:bg-bk-yellow/10">
                <div className="w-10 h-10 rounded-xl bg-bk-yellow/10 flex items-center justify-center text-bk-yellow border border-bk-yellow/20 shrink-0">
                  <Icon name="info" size="md" weight={300} />
                </div>
                <Typography variant="p" className="text-[11px] text-slate-500 dark:text-slate-400 italic font-medium leading-relaxed">
                  Optimization regenerates statistics for the cost-based query optimizer. It is highly recommended to perform this after bulk data ingestion or significant schema restructuring.
                </Typography>
              </div>

              <div className="space-y-2">
                <Typography variant="label" className="text-slate-500 dark:text-slate-400 font-medium ml-1 flex items-center gap-1.5">
                  Scope selection
                  <span className="text-[9px] text-slate-300 uppercase tracking-widest">(Class / Table)</span>
                </Typography>
                <ClassSelect 
                   value={selectedClassName}
                   userClasses={classesData.userclass}
                   systemClasses={classesData.systemclass}
                   onChange={setSelectedClassName}
                   disabled={loading}
                   isLoading={isLoadingClasses}
                />

                <div className="flex items-center justify-between px-1.5 pt-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isLoadingClasses ? 'bg-slate-300 animate-pulse' : 'bg-bk-yellow/60'}`}></div>
                    <Typography variant="p" className="text-[10px] text-slate-500 font-bold tracking-tight">
                      {isLoadingClasses ? 'Searching Registry...' : `${totalTables.toLocaleString()} objects indexed`}
                    </Typography>
                  </div>
                  {!isLoadingClasses && totalTables > 0 && (
                    <Typography variant="p" className="text-[9px] text-slate-400 italic font-medium">
                      Select specific target to minimize lock time
                    </Typography>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
