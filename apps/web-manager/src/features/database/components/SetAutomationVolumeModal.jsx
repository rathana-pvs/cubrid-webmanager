import React, { useState, useEffect, useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeSetAutomationVolumeModal, fetchAutoVolumeConfig, updateAutoVolumeConfig } from '../databaseSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Toggle } from '../../../components/ds/forms/Toggle';
import { Typography } from '../../../components/ds/foundation/Typography';

/**
 * Technical constants for storage expansion
 */
const PAGE_SIZE_BYTES = 16384; // 16K
const BYTES_TO_MB = 1024 * 1024;

/**
 * View States for the View Machine
 */
const VIEW_FORM    = 'form';
const VIEW_LOADING = 'loading';
const VIEW_SUCCESS = 'success';
const VIEW_ERROR   = 'error';

/**
 * Sub-component for a parameter configuration card
 */
const ParameterCard = memo(({ 
  title, 
  icon, 
  enabled, 
  onToggle, 
  threshold, 
  onThresholdChange, 
  addSize, 
  onSizeChange 
}) => {
  const extensionUnits = Math.floor(addSize * BYTES_TO_MB / PAGE_SIZE_BYTES);

  return (
    <div className={`group relative p-5 rounded-2xl border transition-all duration-400 
      ${enabled 
        ? 'bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/10 shadow-sm' 
        : 'bg-slate-50/50 dark:bg-black/20 border-slate-100 dark:border-white/5 opacity-80'
      }`}>
      
      {/* Active Indicator Line */}
      <div className={`absolute left-0 top-6 bottom-6 w-[3px] rounded-full transition-all duration-500 
        ${enabled ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]' : 'bg-transparent'}`} 
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500 
            ${enabled 
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 scale-105' 
              : 'bg-slate-200/50 dark:bg-white/5 border-slate-200/30 dark:border-white/5 text-slate-400'
            }`}>
            <Icon name={icon} size="sm" weight={300} />
          </div>
          <div className="min-w-0">
             <Typography variant="p" className={`text-[14px] font-black tracking-tight leading-loose transition-colors 
               ${enabled ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
               {title}
             </Typography>
             <Typography variant="caption" className="text-[10px] font-bold text-slate-400 tracking-tight block -mt-1">
               {enabled ? 'Active Policy' : 'Disabled'}
             </Typography>
          </div>
        </div>
        <Toggle checked={enabled} onChange={onToggle} variant="primary" />
      </div>

      {/* Content Area */}
      <div className={`space-y-6 transition-all duration-500 origin-top 
        ${enabled ? 'opacity-100 scale-100' : 'opacity-20 scale-[0.98] pointer-events-none grayscale'}`}>
        
        {/* Threshold Slider Section */}
        <div className="space-y-3.5">
          <div className="flex justify-between items-center px-0.5">
            <div className="flex items-center gap-1.5">
               <Icon name="speed" size="13px" className="text-amber-500" />
               <Typography variant="caption" className="font-black text-[10px] text-slate-400">
                Trigger Threshold
               </Typography>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-slate-400 tracking-tight">Remaining Space</span>
              <div className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 min-w-[48px] text-center">
                 <span className="text-[12px] font-black font-mono text-amber-600 dark:text-amber-500">{threshold}%</span>
              </div>
            </div>
          </div>
          
          <div className="relative h-5 flex items-center group/slider px-0.5">
             {/* Slider Track */}
             <div className="absolute inset-x-0.5 h-[3px] bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]" 
                  style={{ width: `${(threshold - 5) / (30 - 5) * 100}%` }} 
                />
             </div>
             
             {/* Interaction Layer */}
             <input 
               type="range" min="5" max="30" step="1"
               value={threshold}
               onChange={(e) => onThresholdChange(parseInt(e.target.value))}
               className="absolute inset-x-0 w-full h-3 opacity-0 cursor-pointer z-10"
             />
             
             {/* Custom Thumb */}
             <div 
               className="absolute w-4 h-4 bg-white dark:bg-slate-200 border-[3px] border-amber-500 rounded-full shadow-lg pointer-events-none transition-all duration-150 group-hover/slider:scale-125 z-0" 
               style={{ 
                 left: `calc(${(threshold - 5) / (30 - 5) * 100}%)`, 
                 transform: 'translateX(-50%)' 
               }} 
             />
          </div>
          <div className="flex justify-between px-0.5 -mt-1.5">
            <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600">5% Min</span>
            <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600">30% Max</span>
          </div>
        </div>

        {/* Input Fields Grid */}
        <div className="grid grid-cols-2 gap-5 p-4 bg-slate-50/50 dark:bg-white/2 rounded-xl border border-slate-100 dark:border-white/5 shadow-inner">
          <div className="space-y-2">
             <div className="flex items-center gap-1.5 ml-0.5">
                <Icon name="add_circle" size="13px" className="text-amber-500" />
                <Typography variant="caption" className="font-black text-[9px] text-slate-400">Expansion Size</Typography>
             </div>
             <Input 
                type="number" 
                value={addSize}
                onChange={(e) => onSizeChange(parseInt(e.target.value) || 0)}
                placeholder="0"
                size="sm"
                suffix={<span className="text-[9px] font-black text-slate-400">MB</span>}
             />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 ml-0.5">
                <Icon name="layers" size="13px" className="text-slate-400" />
                <Typography variant="caption" className="font-black text-[9px] text-slate-400">Extension Units</Typography>
            </div>
            <div className="h-11 px-3.5 flex items-center justify-between bg-slate-100/50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
               <span className="text-[13px] font-mono font-black text-slate-500 dark:text-slate-400">{extensionUnits.toLocaleString()}</span>
               <span className="text-[9px] font-black text-slate-400 opacity-60">Pages</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function SetAutomationVolumeModal() {
  const dispatch = useDispatch();
  const { isSetAutomationVolumeModalOpen } = useSelector((state) => state.databaseUI);
  const { selectedDatabase } = useSelector((state) => state.database);
  const { autoVolumeConfigs, autoVolumeLoading } = useSelector((state) => state.databaseConfiguration);
  const { selectedHostUid } = useSelector((state) => state.host);
  
  const [view, setView] = useState(VIEW_FORM);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Data Settings State
  const [dataEnabled, setDataEnabled] = useState(false);
  const [dataThreshold, setDataThreshold] = useState(15);
  const [dataAddSize, setDataAddSize] = useState(2048);
  
  // Index Settings State
  const [indexEnabled, setIndexEnabled] = useState(false);
  const [indexThreshold, setIndexThreshold] = useState(15);
  const [indexAddSize, setIndexAddSize] = useState(2048);

  useEffect(() => {
    if (isSetAutomationVolumeModalOpen && selectedHostUid && selectedDatabase) {
      dispatch(fetchAutoVolumeConfig({ hostUid: selectedHostUid, dbname: selectedDatabase }));
      setView(VIEW_FORM);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isSetAutomationVolumeModalOpen, selectedHostUid, selectedDatabase, dispatch]);

  useEffect(() => {
    if (!selectedDatabase || !autoVolumeConfigs) return;
    const config = autoVolumeConfigs[selectedDatabase];
    if (config) {
      setDataEnabled(config.data === 'ON');
      setDataThreshold(config.data_warn_outofspace ? Math.round(parseFloat(config.data_warn_outofspace) * 100) : 15);
      setDataAddSize(config.data_ext_page ? Math.round(parseInt(config.data_ext_page) * PAGE_SIZE_BYTES / BYTES_TO_MB) : 2048);
      
      setIndexEnabled(config.index === 'ON');
      setIndexThreshold(config.index_warn_outofspace ? Math.round(parseFloat(config.index_warn_outofspace) * 100) : 15);
      setIndexAddSize(config.index_ext_page ? Math.round(parseInt(config.index_ext_page) * PAGE_SIZE_BYTES / BYTES_TO_MB) : 2048);
    }
  }, [autoVolumeConfigs, selectedDatabase]);

  const handleSave = useCallback(async () => {
    setView(VIEW_LOADING);
    setErrorMsg('');

    const payload = {
      data: dataEnabled ? 'ON' : 'OFF',
      data_warn_outofspace: (dataThreshold / 100).toFixed(2),
      data_ext_page: Math.floor(dataAddSize * BYTES_TO_MB / PAGE_SIZE_BYTES).toString(),
      index: indexEnabled ? 'ON' : 'OFF',
      index_warn_outofspace: (indexThreshold / 100).toFixed(2),
      index_ext_page: Math.floor(indexAddSize * BYTES_TO_MB / PAGE_SIZE_BYTES).toString()
    };

    try {
      await dispatch(updateAutoVolumeConfig({ 
        hostUid: selectedHostUid, 
        dbname: selectedDatabase, 
        payload 
      })).unwrap();
      setSuccessMsg(`Persistence policies for ${selectedDatabase} have been successfully committed to the controller registry.`);
      setView(VIEW_SUCCESS);
    } catch (err) {
      setErrorMsg(typeof err === 'string' ? err : (err.message || 'The storage controller rejected the transaction. Ensure policy write permissions are active.'));
      setView(VIEW_ERROR);
    }
  }, [dataEnabled, dataThreshold, dataAddSize, indexEnabled, indexThreshold, indexAddSize, selectedHostUid, selectedDatabase, dispatch]);

  const handleClose = () => dispatch(closeSetAutomationVolumeModal());

  /* ─── LOADING ─── */
  if (view === VIEW_LOADING) {
    return (
      <Modal isOpen title="Set Automation Volume" icon="settings_suggest" onClose={handleClose} maxWidth="640px">
        <div className="flex flex-col items-center justify-center py-12 gap-6 text-center animate-in fade-in duration-300">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-slate-100 dark:border-white/5" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-500 animate-spin" style={{ animationDuration: '0.8s' }} />
            <div className="absolute inset-[10px] rounded-full border-[1.5px] border-transparent border-b-amber-500/20 animate-spin" style={{ animationDuration: '1.4s', animationDirection: 'reverse' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon name="storage" size="md" weight={300} className="text-amber-500 animate-pulse" />
            </div>
          </div>

          <div className="space-y-1.5 px-10">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">Synchronizing Policies</Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium max-w-[320px] mx-auto leading-relaxed">
              Updating expansion parameters for <span className="font-black text-slate-900 dark:text-white font-mono">{selectedDatabase}</span>.
            </Typography>
          </div>

          <div className="w-32 h-[2px] bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ animation: 'modalSlide 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── SUCCESS ─── */
  if (view === VIEW_SUCCESS) {
    return (
      <Modal isOpen title="Set Automation Volume" icon="settings_suggest" iconVariant="success" onClose={handleClose} maxWidth="640px">
        <div className="flex flex-col items-center justify-center py-12 gap-7 text-center animate-in fade-in duration-300">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/15 rounded-full animate-ping" style={{ animationDuration: '2.5s' }} />
            <div className="relative w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)]">
              <Icon name="verified_user" size="md" weight={400} className="text-white" />
            </div>
          </div>

          <div className="space-y-1.5 px-10">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">Configuration Locked</Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium max-w-[360px] mx-auto leading-relaxed">
              Automation triggers for <span className="font-black font-mono text-emerald-600 dark:text-emerald-500">{selectedDatabase}</span> are now active.
            </Typography>
          </div>

          <div className="w-full max-w-[500px] bg-emerald-500/[0.03] border border-emerald-500/15 rounded-xl px-5 py-3.5 text-left flex gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/10">
               <Icon name="info" size="xs" weight={300} className="text-emerald-600" />
            </div>
            <Typography variant="caption" className="text-emerald-600/90 dark:text-emerald-400 font-medium leading-relaxed italic text-[11px]">
              {successMsg}
            </Typography>
          </div>

          <Button variant="secondary" onClick={handleClose} className="px-10">Return to Dashboard</Button>
        </div>
      </Modal>
    );
  }

  /* ─── ERROR ─── */
  if (view === VIEW_ERROR) {
    return (
      <Modal isOpen title="Set Automation Volume" icon="settings_suggest" iconVariant="danger" onClose={handleClose} maxWidth="640px">
        <div className="flex flex-col items-center justify-center py-12 gap-7 text-center animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.3)]">
            <Icon name="warning" size="md" weight={400} className="text-white" />
          </div>

          <div className="space-y-1.5 px-10">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">Registry Fault</Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium">The service layer failed to commit changes.</Typography>
          </div>

          <div className="w-full max-w-[500px] bg-rose-500/[0.03] border border-rose-500/15 rounded-xl px-5 py-4 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="terminal" size="xs" weight={300} className="text-rose-400" />
              <span className="text-[9.5px] font-black text-rose-400">Fault Context</span>
            </div>
            <Typography variant="caption" className="text-rose-400/90 font-mono leading-relaxed block break-words text-[10.5px] font-medium italic">
              {errorMsg}
            </Typography>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleClose} className="px-8">Discard</Button>
            <Button variant="primary" icon="refresh" onClick={() => { setView(VIEW_FORM); setErrorMsg(''); }} className="px-10">Retry Sync</Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isSetAutomationVolumeModalOpen}
      onClose={handleClose}
      title="Set Automation Volume"
      subtitle={`Configure expansion policies for ${selectedDatabase}`}
      icon="settings_suggest"
      maxWidth="max-w-[640px]"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="ghost" onClick={handleClose} size="sm">Discard Policies</Button>
          <Button 
            variant="primary"
            onClick={handleSave}
            loading={autoVolumeLoading}
            icon="verified_user"
            size="sm"
            className="px-8 min-w-[200px] shadow-lg shadow-amber-500/20"
          >
            Commit Policies
          </Button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-400">
        
        {/* Source Instance Banner */}
        <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-linear-to-r from-amber-500/8 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Icon name="database" size="sm" weight={300} className="text-amber-500" />
              </div>
              <div className="min-w-0">
                <Typography variant="caption" className="font-black text-amber-600/70 block -mb-0.5">Storage Controller Active</Typography>
                <Typography variant="h4" className="text-[15px] font-black text-amber-700 dark:text-amber-400 font-mono truncate">
                  {selectedDatabase}
                </Typography>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/5 shadow-xs">
              <Icon name="settings_suggest" size="12px" className="text-amber-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-600 dark:text-slate-400">Automation Mode</span>
            </div>
          </div>
        </div>

        {/* Configuration Section Header */}
        <div className="flex items-center gap-2.5 px-0.5">
           <Icon name="tune" size="12px" weight={400} className="text-amber-500" />
           <span className="text-[10px] font-black text-slate-400">Policy Configuration</span>
        </div>

        {/* Configuration Cards */}
        <div className="space-y-4 relative">
          {autoVolumeLoading && (
            <div className="absolute inset-0 z-20 bg-white/60 dark:bg-bk-side/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl animate-in fade-in duration-300 border border-slate-100 dark:border-white/5">
               <div className="w-10 h-10 rounded-full border-2 border-slate-100 dark:border-white/5 border-t-amber-500 animate-spin mb-3" />
               <Typography variant="caption" className="font-black text-slate-500 text-[10px]">Retrieving State...</Typography>
            </div>
          )}

          <ParameterCard 
            title="Data Volume Policy" 
            icon="database" 
            enabled={dataEnabled} onToggle={setDataEnabled}
            threshold={dataThreshold} onThresholdChange={setDataThreshold}
            addSize={dataAddSize} onSizeChange={setDataAddSize}
          />

          <ParameterCard 
            title="Index Volume Policy" 
            icon="list_alt" 
            enabled={indexEnabled} onToggle={setIndexEnabled}
            threshold={indexThreshold} onThresholdChange={setIndexThreshold}
            addSize={indexAddSize} onSizeChange={setIndexAddSize}
          />
        </div>

        {/* System Compliance / Compliance Banner */}
        <div className="flex items-start gap-3.5 p-4 bg-slate-50/50 dark:bg-white/2 border border-slate-200 dark:border-white/8 rounded-xl shadow-inner shrink-0">
          <div className="w-9 h-9 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center shrink-0 border border-slate-200 dark:border-white/10">
            <Icon name="shield" size="xs" weight={300} className="text-sky-500" />
          </div>
          <div className="space-y-0.5">
            <Typography variant="p" className="text-[10.5px] font-black text-slate-700 dark:text-slate-200 tracking-tight">Expansion Protocol Compliance</Typography>
            <Typography variant="caption" className="text-slate-500 dark:text-slate-500 font-medium leading-relaxed italic block text-[10.5px]">
              Storage triggers are handled by the system scheduler. Volume expansion units are calculated based on a <span className="font-bold non-italic text-amber-500">16K page size</span>.
            </Typography>
          </div>
        </div>

        {/* Technical Footer Note */}
        <div className="flex items-center justify-center gap-3 pt-2 opacity-30 group hover:opacity-100 transition-opacity">
           <div className="h-px w-8 bg-slate-200 dark:bg-slate-800" />
           <Icon name="terminal" size="xs" weight={300} className="text-slate-500" />
           <Typography variant="caption" className="text-[9px] font-black text-slate-500">
             Controller Protocol v4.2 Integrated
           </Typography>
           <div className="h-px w-8 bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>

      <style>{`
        @keyframes modalSlide {
          0%   { transform: translateX(-100%); width: 40%; }
          50%  { transform: translateX(100%);  width: 60%; }
          100% { transform: translateX(250%);  width: 40%; }
        }
      `}</style>
    </Modal>
  );
}

