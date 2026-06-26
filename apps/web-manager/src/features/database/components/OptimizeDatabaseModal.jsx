import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeOptimizeDatabaseModal } from '../databaseSlice';
import { databaseApi } from '../databaseApi';
import { databaseJobApi } from '../databaseJobApi';
import { useCmsJob } from '../../../infrastructure/hooks/useCmsJob';
import { getCmsJobLoadingSubtitle } from '../../../infrastructure/cmsJob/cmsJobUi';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Spinner } from '../../../components/ds/foundation/Spinner';
import { SectionHeader } from '../../../components/ds/foundation/SectionHeader';
import { InfoBanner } from '../../../components/ds/foundation/InfoBanner';
import { EmptyState } from '../../../components/ds/feedback/EmptyState';
import { useCM } from '../../../constants/useCM';

// view states
const VIEW_FORM    = 'form';
const VIEW_LOADING = 'loading';
const VIEW_SUCCESS = 'success';
const VIEW_ERROR   = 'error';

/**
 * Custom Dropdown for Class Selection
 */
const ClassSelect = ({ value, userClasses, onChange, disabled, isLoading }) => {
  const CM = useCM();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});

  const filteredClasses = useMemo(() => 
    userClasses.filter(c => c.classname.toLowerCase().includes(search.toLowerCase())),
    [userClasses, search]
  );

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const margin = 24; // space from bottom of viewport
      const maxHeight = Math.min(360, window.innerHeight - rect.bottom - margin);
      
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        maxHeight: maxHeight > 120 ? maxHeight : 360,
        zIndex: 9999,
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) setSearch('');
  }, [isOpen]);

  const hasResults = filteredClasses.length > 0;

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled || isLoading}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-11 px-3 flex items-center justify-between bg-white dark:bg-white/3 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xs transition-all text-left outline-hidden ${
          isOpen ? 'ring-2 ring-amber-500/20 border-amber-500/60' : 'hover:border-amber-500/40'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <Icon 
            name={value ? 'table_view' : 'database'} 
            size="sm" 
            weight={300} 
            className={value ? 'text-amber-500' : 'text-slate-400'} 
          />
        <span className={`text-[12px] font-medium truncate ${value ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
          {value ? value : CM.allTables}
        </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isLoading && <Spinner size="xs" />}
          <Icon name="expand_more" size="sm" weight={300} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-500' : ''}`} />
        </div>
      </button>

      {isOpen && createPortal(
        <div 
          style={dropdownStyle}
          className="bg-white dark:bg-bk-side border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-110 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col"
        >
          {/* Search Header */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-white/2">
            <Input 
              size="sm"
              icon="search"
              placeholder={CM.filterObjects}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pb-2">
            {search === '' && (
              <button
                type="button"
                onClick={() => { onChange(''); setIsOpen(false); }}
                className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors border-b border-slate-100 dark:border-slate-800/40 group ${
                  value === '' ? 'bg-amber-500/10' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <div className={`w-2 h-2 rounded-full transition-all ${value === '' ? 'bg-amber-500 scale-125 shadow-[0_0_8px_rgba(255,188,4,0.6)]' : 'bg-slate-300 dark:bg-slate-700 group-hover:bg-amber-500/40'}`}></div>
                <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${value === '' ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400'}`}>{CM.allTables}</span>
              </button>
            )}

            {!hasResults && !isLoading && (
              <div className="py-8">
                <EmptyState
                  icon="search_off"
                  title={CM.noMatches}
                  subtitle={`No tables matching "${search}" were found.`}
                />
              </div>
            )}

            {isLoading && (
              <div className="py-12 text-center space-y-4">
                <Spinner size="md" className="mx-auto" />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em]">{CM.processing}</p>
              </div>
            )}

            {filteredClasses.length > 0 && (
              <div className="py-1 px-1.5 space-y-0.5">
                {filteredClasses.map((cls) => (
                  <button
                    key={cls.classname}
                    type="button"
                    onClick={() => { onChange(cls.classname); setIsOpen(false); }}
                    className={`w-full px-3 py-1.5 flex items-center gap-3 text-left transition-all rounded-xl group ${
                      value === cls.classname 
                        ? 'bg-amber-500 text-status-dark font-bold shadow-lg shadow-amber-500/10' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-amber-500/5 hover:text-amber-500'
                    }`}
                  >
                    <Icon name="table" size="sm" weight={300} className={value === cls.classname ? 'text-status-dark' : 'text-slate-400 group-hover:text-amber-500'} />
                    <span className="text-[12px] font-medium truncate leading-none select-none flex-1 lowercase">{cls.classname}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default function OptimizeDatabaseModal() {
  const CM = useCM();
  const dispatch = useDispatch();
  const { isOptimizeDatabaseModalOpen } = useSelector((state) => state.databaseUI, shallowEqual);
  const { selectedDatabase, activeDatabases } = useSelector((state) => state.database, shallowEqual);
  const { selectedHostUid } = useSelector((state) => state.host, shallowEqual);
  
  const { runJob } = useCmsJob();
  const [view, setView] = useState(VIEW_FORM);
  const [selectedClassName, setSelectedClassName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [jobStatus, setJobStatus] = useState(null);

  // Direct state for classes to follow user requirement for direct getClassInfo usage
  const [classesData, setClassesData] = useState({ userclass: [] });
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

  const isActive = selectedDatabase && activeDatabases.includes(selectedDatabase);
  
  const fetchClasses = useCallback(async () => {
    if (!selectedHostUid || !selectedDatabase) return;
    setIsLoadingClasses(true);
    try {
      const dbstatus = isActive ? 'on' : 'off';
      const res = await databaseApi.getClassInfo(selectedHostUid, selectedDatabase, dbstatus);
      
      const rawUser = res.userclass?.[0]?.class || res.userclass || [];
      
      setClassesData({
        userclass: rawUser.filter(c => c.virtual !== 'view')
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
      const payload = selectedClassName ? { classname: selectedClassName } : {};
        
      await runJob(
        () => databaseJobApi.submitOptimize(selectedHostUid, selectedDatabase, payload),
        { onProgress: (j) => setJobStatus(j.jobStatus ?? j.status) }
      );

      setView(VIEW_SUCCESS);
    } catch (err) {
      setErrorMsg(typeof err === 'string' ? err : (err.message || 'The optimization sequence was interrupted. Please verify database connectivity and state.'));
      setView(VIEW_ERROR);
    }
  };

  const handleClose = () => {
    dispatch(closeOptimizeDatabaseModal());
  };

  const totalTables = classesData.userclass.length;

  /* ─── LOADING view ─── */
  if (view === VIEW_LOADING) {
    return (
      <Modal isOpen title={CM.executingHeuristics} icon="auto_fix_high" onClose={handleClose} maxWidth="460px">
        <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in fade-in duration-200">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-slate-100 dark:border-white/5" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-500 animate-spin" style={{ animationDuration: '0.9s' }} />
            <div className="absolute inset-[10px] rounded-full border-[1.5px] border-transparent border-b-amber-500/30 animate-spin" style={{ animationDuration: '1.7s', animationDirection: 'reverse' }} />
            <div className="absolute inset-0 flex items-center justify-center text-amber-500">
              <Icon name="auto_fix_high" size="md" weight={400} className="animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-1.5 px-8">
            <Typography variant="h4" className="text-[14px] font-black text-slate-800 dark:text-white tracking-tight">{CM.regeneratingStatistics}</Typography>
            <Typography variant="p" className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-[280px] mx-auto">
              {getCmsJobLoadingSubtitle(selectedClassName || selectedDatabase, jobStatus, CM)}
            </Typography>
          </div>
          <div className="w-32 h-[2px] bg-slate-100 dark:bg-white/4 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ animation: 'modalSlide 1.5s ease-in-out infinite' }} />
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
      <Modal isOpen title={CM.optimizationComplete} icon="auto_fix_high" iconVariant="success" onClose={handleClose} maxWidth="460px">
        <div className="flex flex-col items-center justify-center py-12 gap-7 text-center animate-in fade-in duration-200">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.3)]">
              <Icon name="check" size="lg" weight={700} className="text-white" />
            </div>
          </div>

          <div className="space-y-2 px-8">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
              {CM.optimizationSuccess}
            </Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 font-medium leading-relaxed max-w-[280px] mx-auto">
              <span className="font-bold text-slate-900 dark:text-white">{selectedClassName || selectedDatabase}</span>
            </Typography>
          </div>

          <Button variant="secondary" onClick={handleClose} className="min-w-[140px]">{CM.close}</Button>
        </div>
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (view === VIEW_ERROR) {
    return (
      <Modal isOpen title={CM.executionInterrupted} icon="auto_fix_high" iconVariant="danger" onClose={handleClose} maxWidth="460px">
        <div className="flex flex-col items-center justify-center py-10 gap-6 text-center animate-in fade-in duration-200">
          <div className="relative">
            <div className="absolute inset-0 bg-rose-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <Icon name="error_outline" size="md" weight={300} className="text-white" />
            </div>
          </div>

          <div className="space-y-2 px-6">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
              {CM.optimizationFailed}
            </Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 font-medium leading-relaxed">
              <span className="font-black text-slate-900 dark:text-white">{selectedDatabase}</span>
            </Typography>
          </div>

          <div className="w-full max-w-[340px] bg-rose-500/5 border border-rose-500/15 rounded-xl px-4 py-3 text-left">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon name="terminal" size="xs" weight={300} className="text-rose-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-400">{CM.error}</span>
            </div>
            <Typography variant="caption" className="text-rose-400/80 font-mono leading-relaxed break-words">
              {errorMsg}
            </Typography>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleClose}>{CM.dismiss}</Button>
            <Button variant="primary" icon="refresh" onClick={() => { setView(VIEW_FORM); setErrorMsg(''); }}>
              {CM.retryExecution}
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
      title={CM.performanceTuning}
      subtitle={CM.performanceTuningSubtitle}
      icon="auto_fix_high"
      maxWidth="460px"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="ghost" onClick={handleClose}>
            {CM.discard}
          </Button>
          <Button 
            variant="primary" 
            onClick={handleOptimize} 
            icon="play_circle"
            disabled={isLoadingClasses}
            className="min-w-[140px]"
          >
            {CM.executeOptimization}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="px-1.5">
          <SectionHeader title={CM.targetInstanceSection} icon="database" />
          <Input 
            value={selectedDatabase}
            disabled
            icon="database"
            className="mt-2"
          />
        </div>

        <div className="space-y-5">
          <InfoBanner title={CM.optimizerIntel} icon="insights">
            {CM.optimizerHint}
          </InfoBanner>

          <div className="space-y-2 px-1.5">
            <SectionHeader 
              title={CM.optimizationScope} 
              icon="tune" 
              badge={isLoadingClasses ? CM.processing : `${totalTables.toLocaleString()}`}
            />
            
            <ClassSelect 
               value={selectedClassName}
               userClasses={classesData.userclass}
               onChange={setSelectedClassName}
               isLoading={isLoadingClasses}
            />

            {!isLoadingClasses && totalTables > 0 && (
              <p className="text-[9.5px] text-slate-400 font-medium px-3 flex items-center gap-2">
                <Icon name="lock_clock" size="10px" weight={400} />
                {CM.globalScanHint}
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
