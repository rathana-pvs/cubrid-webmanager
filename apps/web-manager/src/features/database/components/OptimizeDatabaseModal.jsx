import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeOptimizeDatabaseModal, optimizeDatabase } from '../databaseSlice';
import { databaseApi } from '../databaseApi';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Spinner } from '../../../components/ds/foundation/Spinner';

// view states
const VIEW_FORM    = 'form';
const VIEW_LOADING = 'loading';
const VIEW_SUCCESS = 'success';
const VIEW_ERROR   = 'error';

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
        className={`w-full h-11 px-4 flex items-center justify-between bg-white dark:bg-white/3 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xs transition-all text-left outline-hidden ${
          isOpen ? 'ring-2 ring-bk-yellow/20 border-bk-yellow/60' : 'hover:border-bk-yellow/40'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <Icon 
            name={value ? 'table_view' : 'database'} 
            size="sm" 
            weight={300} 
            className={value ? 'text-bk-yellow' : 'text-slate-400'} 
          />
        <span className={`text-[12px] font-bold truncate ${value ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
          {value ? value : 'Entire Registry (Global Scan)'}
        </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isLoading && <Spinner size="xs" />}
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
                <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${value === '' ? 'text-bk-yellow' : 'text-slate-500 dark:text-slate-400'}`}>Entire database</span>
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
                <Spinner size="md" className="mx-auto" />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em]">Inspecting Schema</p>
              </div>
            )}

            {filteredUserClasses.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-1.5 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-bk-side/95 backdrop-blur-md z-10 border-b border-slate-100 dark:border-slate-800/50 mb-1">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">User Tables</span>
                  <span className="text-[9px] bg-slate-100 dark:bg-bk-main/50 px-2 py-0.5 rounded-full text-slate-500 font-mono font-bold">{filteredUserClasses.length}</span>
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
                        <span className="text-[11px] font-black truncate leading-tight select-none">{cls.classname}</span>
                        <span className={`text-[9px] font-medium truncate transition-opacity ${value === cls.classname ? 'text-bk-side/60' : 'text-slate-400 group-hover:text-bk-yellow/60'}`}>Owner: {cls.owner}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredSystemClasses.length > 0 && (
              <div className="py-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="px-4 py-1.5 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-bk-side/95 backdrop-blur-md z-10 border-b border-slate-100 dark:border-slate-800/50 mb-1">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Internal Catalog</span>
                  <span className="text-[9px] bg-slate-100 dark:bg-bk-main/50 px-2 py-0.5 rounded-full text-slate-500 font-mono font-bold">{filteredSystemClasses.length}</span>
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
                        <span className="text-[11px] font-black truncate leading-tight select-none">{cls.classname}</span>
                        <span className={`text-[9px] font-medium truncate transition-opacity ${value === cls.classname ? 'text-bk-side/60' : 'text-slate-400 group-hover:text-bk-yellow/60'}`}>System object</span>
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
  const { isOptimizeDatabaseModalOpen } = useSelector((state) => state.databaseUI);
  const { selectedDatabase, activeDatabases } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);
  
  const [view, setView] = useState(VIEW_FORM);
  const [selectedClassName, setSelectedClassName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Direct state for classes to follow user requirement for direct getClassInfo usage
  const [classesData, setClassesData] = useState({ userclass: [], systemclass: [] });
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

  const isActive = selectedDatabase && activeDatabases.includes(selectedDatabase);
  
  const fetchClasses = useCallback(async () => {
    if (!selectedHostUid || !selectedDatabase) return;
    setIsLoadingClasses(true);
    try {
      const dbstatus = isActive ? 'on' : 'off';
      const res = await databaseApi.getClassInfo(selectedHostUid, selectedDatabase, dbstatus);
      
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
      setView(VIEW_FORM);
      setSelectedClassName('');
      setErrorMsg('');
      fetchClasses();
    }
  }, [isOptimizeDatabaseModalOpen, selectedDatabase, fetchClasses]);

  if (!isOptimizeDatabaseModalOpen) return null;

  const handleOptimize = async () => {
    if (!selectedHostUid || !selectedDatabase) return;
    
    setView(VIEW_LOADING);
    setErrorMsg('');
    try {
      const payload = selectedClassName && selectedClassName !== '' 
        ? { class: [{ classname: selectedClassName }] }
        : {};
        
      await dispatch(optimizeDatabase({ 
        hostUid: selectedHostUid, 
        dbname: selectedDatabase, 
        payload 
      })).unwrap();
      
      setView(VIEW_SUCCESS);
    } catch (err) {
      setErrorMsg(typeof err === 'string' ? err : (err.message || 'The optimization sequence was interrupted. Please verify database connectivity and state.'));
      setView(VIEW_ERROR);
    }
  };

  const handleClose = () => dispatch(closeOptimizeDatabaseModal());

  const totalTables = classesData.userclass.length + classesData.systemclass.length;

  /* ─── LOADING view ─── */
  if (view === VIEW_LOADING) {
    return (
      <Modal isOpen title="Executing Heuristics" icon="auto_fix_high" onClose={handleClose} maxWidth="460px">
        <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in fade-in duration-200">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-slate-100 dark:border-white/5" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-bk-yellow animate-spin" style={{ animationDuration: '0.9s' }} />
            <div className="absolute inset-[10px] rounded-full border-[1.5px] border-transparent border-b-bk-yellow/30 animate-spin" style={{ animationDuration: '1.7s', animationDirection: 'reverse' }} />
            <div className="absolute inset-0 flex items-center justify-center text-bk-yellow">
              <Icon name="auto_fix_high" size="md" weight={400} className="animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-1.5 px-8">
            <Typography variant="h4" className="text-[14px] font-black text-slate-800 dark:text-white tracking-tight">Regenerating Statistics</Typography>
            <Typography variant="p" className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-[280px] mx-auto">
              Updating the cost-based optimizer for <span className="font-black text-slate-900 dark:text-white">{selectedClassName || selectedDatabase}</span>.
            </Typography>
          </div>
          <div className="w-32 h-[2px] bg-slate-100 dark:bg-white/4 rounded-full overflow-hidden">
            <div className="h-full bg-bk-yellow rounded-full" style={{ animation: 'modalSlide 1.5s ease-in-out infinite' }} />
          </div>
          <style>{`
            @keyframes modalSlide {
              0%   { transform: translateX(-100%); width: 50%; }
              50%  { transform: translateX(100%);  width: 60%; }
              100% { transform: translateX(200%);  width: 50%; }
            }
          `}</style>
        </div>
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  if (view === VIEW_SUCCESS) {
    return (
      <Modal isOpen title="Optimization Complete" icon="auto_fix_high" iconVariant="success" onClose={handleClose} maxWidth="460px">
        <div className="flex flex-col items-center justify-center py-12 gap-7 text-center animate-in fade-in duration-200">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.3)]">
              <Icon name="check" size="lg" weight={700} className="text-white" />
            </div>
          </div>

          <div className="space-y-2 px-8">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
              Performance Restored
            </Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 font-medium leading-relaxed max-w-[280px] mx-auto">
              Query statistics for {selectedClassName ? 'table' : 'database'} <span className="font-bold text-slate-900 dark:text-white">{selectedClassName || selectedDatabase}</span> have been synchronized.
            </Typography>
          </div>

          <Button variant="secondary" onClick={handleClose}>Done</Button>
        </div>
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (view === VIEW_ERROR) {
    return (
      <Modal isOpen title="Execution Interrupted" icon="auto_fix_high" iconVariant="danger" onClose={handleClose} maxWidth="460px">
        <div className="flex flex-col items-center justify-center py-10 gap-6 text-center animate-in fade-in duration-200">
          <div className="relative">
            <div className="absolute inset-0 bg-rose-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <Icon name="error_outline" size="md" weight={300} className="text-white" />
            </div>
          </div>

          <div className="space-y-2 px-6">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
              Optimization Failed
            </Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 font-medium leading-relaxed">
              System was unable to finalize statistics for <span className="font-black text-slate-900 dark:text-white">{selectedDatabase}</span>.
            </Typography>
          </div>

          <div className="w-full max-w-[340px] bg-rose-500/5 border border-rose-500/15 rounded-xl px-4 py-3 text-left">
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
      isOpen={isOptimizeDatabaseModalOpen}
      onClose={handleClose}
      title="Performance Tuning"
      subtitle="Optimize query execution plans"
      icon="auto_fix_high"
      maxWidth="460px"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="ghost" onClick={handleClose}>
            Discard
          </Button>
          <Button 
            variant="primary" 
            onClick={handleOptimize} 
            icon="play_circle"
            disabled={isLoadingClasses}
          >
            Execute Tuning
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="px-1">
          <Input 
            label="Target Instance"
            value={selectedDatabase}
            disabled
            icon="database"
          />
        </div>

        <div className="space-y-5">
          <div className="p-4 bg-bk-yellow/5 border border-bk-yellow/15 rounded-2xl flex gap-4 transition-all">
            <div className="w-10 h-10 rounded-xl bg-bk-yellow/10 flex items-center justify-center text-bk-yellow border border-bk-yellow/20 shrink-0">
              <Icon name="insights" size="md" weight={300} />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
              Regenerating statistics allows the query optimizer to choose the most efficient execution paths for complex JOIN and SELECT operations.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Optimization Scope</span>
              {isLoadingClasses ? (
                <div className="flex items-center gap-1.5">
                  <Spinner size="xs" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Traversing Catalog</span>
                </div>
              ) : (
                <span className="text-[9px] font-black uppercase tracking-widest text-bk-yellow">{totalTables.toLocaleString()} objects found</span>
              )}
            </div>
            
            <ClassSelect 
               value={selectedClassName}
               userClasses={classesData.userclass}
               systemClasses={classesData.systemclass}
               onChange={setSelectedClassName}
               isLoading={isLoadingClasses}
            />

            {!isLoadingClasses && totalTables > 0 && (
              <p className="text-[9.5px] text-slate-400 font-medium px-1 flex items-center gap-1.5">
                <Icon name="lock_clock" size="10px" weight={400} />
                Global scans may briefly locking schema metadata during analysis.
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
