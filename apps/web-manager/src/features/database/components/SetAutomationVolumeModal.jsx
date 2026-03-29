import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeSetAutomationVolumeModal, fetchAutoVolumeConfig, updateAutoVolumeConfig } from '../databaseSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Toggle } from '../../../components/ds/forms/Toggle';
import { Input } from '../../../components/ds/forms/Input';
import { Typography } from '../../../components/ds/foundation/Typography';

// view states
const VIEW_FORM    = 'form';
const VIEW_LOADING = 'loading';
const VIEW_SUCCESS = 'success';
const VIEW_ERROR   = 'error';

export default function SetAutomationVolumeModal() {
  const dispatch = useDispatch();
  const { isSetAutomationVolumeModalOpen } = useSelector((state) => state.databaseUI);
  const { selectedDatabase } = useSelector((state) => state.database);
  const { autoVolumeConfigs, autoVolumeLoading } = useSelector((state) => state.databaseConfiguration);
  const { selectedHostUid } = useSelector((state) => state.host);
  
  const [view, setView] = useState(VIEW_FORM);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Data Settings
  const [dataEnabled, setDataEnabled] = useState(false);
  const [dataThreshold, setDataThreshold] = useState(15);
  const [dataAddSize, setDataAddSize] = useState(2048);
  
  // Index Settings
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
      setDataAddSize(config.data_ext_page ? (parseInt(config.data_ext_page) * 16384 / 1024 / 1024) : 2048);
      
      setIndexEnabled(config.index === 'ON');
      setIndexThreshold(config.index_warn_outofspace ? Math.round(parseFloat(config.index_warn_outofspace) * 100) : 15);
      setIndexAddSize(config.index_ext_page ? (parseInt(config.index_ext_page) * 16384 / 1024 / 1024) : 2048);
    }
  }, [autoVolumeConfigs, selectedDatabase]);

  if (!isSetAutomationVolumeModalOpen) return null;

  const handleSave = async () => {
    setView(VIEW_LOADING);
    setErrorMsg('');

    const payload = {
      data: dataEnabled ? 'ON' : 'OFF',
      data_warn_outofspace: (dataThreshold / 100).toFixed(2),
      data_ext_page: Math.floor(dataAddSize * 1024 * 1024 / 16384).toString(),
      index: indexEnabled ? 'ON' : 'OFF',
      index_warn_outofspace: (indexThreshold / 100).toFixed(2),
      index_ext_page: Math.floor(indexAddSize * 1024 * 1024 / 16384).toString()
    };

    try {
      await dispatch(updateAutoVolumeConfig({ 
        hostUid: selectedHostUid, 
        dbname: selectedDatabase, 
        payload 
      })).unwrap();
      setSuccessMsg(`Automation policies for ${selectedDatabase} have been successfully committed and synchronized with the storage controller.`);
      setView(VIEW_SUCCESS);
    } catch (err) {
      setErrorMsg(typeof err === 'string' ? err : (err.message || 'Operation failed at service layer. Protocol synchronization error or insufficient storage controller permissions.'));
      setView(VIEW_ERROR);
    }
  };

  const handleClose = () => dispatch(closeSetAutomationVolumeModal());

  const ConfigGroup = ({ title, icon, enabled, setEnabled, threshold, setThreshold, addSize, setAddSize, color = 'amber' }) => (
    <div className={`p-5 rounded-3xl border transition-all duration-300 ${enabled ? 'bg-white dark:bg-white/3 border-slate-200 dark:border-white/10 shadow-sm' : 'bg-slate-50 dark:bg-black/10 border-slate-100 dark:border-white/5 opacity-80'}`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${enabled ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-slate-200/50 dark:bg-white/5 border-slate-200/30 dark:border-white/5 text-slate-400'}`}>
            <Icon name={icon} size="md" weight={300} />
          </div>
          <div className="min-w-0">
             <Typography variant="p" className={`text-[13px] font-black transition-colors ${enabled ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>{title}</Typography>
             <Typography variant="caption" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{enabled ? 'Active Policy' : 'Disabled'}</Typography>
          </div>
        </div>
        <Toggle checked={enabled} onChange={(e) => setEnabled(e.target.checked)} color="amber" />
      </div>

      <div className={`space-y-6 transition-all duration-500 ${enabled ? 'translate-y-0 opacity-100 h-auto' : 'translate-y-2 opacity-30 pointer-events-none grayscale'}`}>
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <Typography variant="caption" className="font-black text-[10px] uppercase tracking-widest text-slate-400">Trigger threshold</Typography>
            <div className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
               <span className="text-[11px] font-black font-mono text-amber-600 dark:text-amber-500">{threshold}%</span>
            </div>
          </div>
          <div className="relative h-6 flex items-center px-1">
             <div className="absolute inset-x-1 h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(threshold - 5) / (30 - 5) * 100}%` }} />
             </div>
             <input 
               type="range" min="5" max="30" step="1"
               value={threshold}
               onChange={(e) => setThreshold(e.target.value)}
               className="absolute inset-x-1 w-[calc(100%-8px)] h-1 opacity-0 cursor-pointer z-10"
             />
             <div className="absolute w-3.5 h-3.5 bg-white dark:bg-slate-100 border-2 border-amber-500 rounded-full shadow-lg pointer-events-none transition-all duration-100" style={{ left: `calc(${(threshold - 5) / (30 - 5) * 100}% + 4px)`, transform: 'translateX(-50%)' }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-1.5">
             <Typography variant="caption" className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Expansion Size</Typography>
             <div className="relative group">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-40">
                   <span className="text-[9px] font-black uppercase tracking-widest">MB</span>
                   <Icon name="layers" size="xs" weight={300} />
                </div>
                <input 
                  type="number" 
                  value={addSize}
                  onChange={(e) => setAddSize(e.target.value)}
                  className="w-full h-11 pl-4 pr-12 bg-slate-50/50 dark:bg-white/2 border border-slate-200/50 dark:border-white/5 rounded-2xl text-[13px] font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500/30 transition-all shadow-inner"
                />
             </div>
          </div>
          <div className="space-y-1.5">
            <Typography variant="caption" className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Extension units</Typography>
            <div className="h-11 px-4 flex items-center justify-between bg-slate-50/30 dark:bg-white/1 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
               <span className="text-[13px] font-mono font-black text-slate-500">{Math.floor(addSize * 1024 * 1024 / 16384)}</span>
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-60">Pages (16K)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ─── LOADING view ─── */
  if (view === VIEW_LOADING) {
    return (
      <Modal isOpen title="Set automation volume" icon="settings_suggest" onClose={handleClose} maxWidth="540px">
        <div className="flex flex-col items-center justify-center py-12 gap-7 text-center animate-in fade-in duration-200">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-slate-100 dark:border-white/5" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-500 animate-spin" style={{ animationDuration: '0.9s' }} />
            <div className="absolute inset-[10px] rounded-full border-[1.5px] border-transparent border-b-amber-500/30 animate-spin" style={{ animationDuration: '1.7s', animationDirection: 'reverse' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon name="storage" size="md" weight={400} className="text-amber-500 animate-pulse" />
            </div>
          </div>

          <div className="space-y-1.5 px-8">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">Updating Policies</Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium max-w-[320px] mx-auto leading-relaxed">
              Synchronizing automation triggers for <span className="text-slate-900 dark:text-white font-black font-mono">{selectedDatabase}</span> storage pool.
            </Typography>
          </div>

          <div className="w-32 h-[2px] bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ animation: 'modalSlide 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  if (view === VIEW_SUCCESS) {
    return (
      <Modal isOpen title="Policy Applied" icon="settings_suggest" iconVariant="success" onClose={handleClose} maxWidth="540px">
        <div className="flex flex-col items-center justify-center py-12 gap-7 text-center animate-in fade-in duration-200">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.3)]">
              <Icon name="verified" size="lg" weight={700} className="text-white" />
            </div>
          </div>

          <div className="space-y-2 px-8">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">Persistence Optimized</Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[360px] mx-auto">
              Storage automation policies for <span className="font-bold text-slate-900 dark:text-white font-mono">{selectedDatabase}</span> have been updated successfully.
            </Typography>
          </div>

          {successMsg && (
            <div className="w-full max-w-[440px] bg-emerald-500/5 border border-emerald-500/15 rounded-2xl px-4 py-3.5 text-left flex gap-3">
              <Icon name="task_alt" size="sm" weight={300} className="text-emerald-500 shrink-0 mt-0.5" />
              <Typography variant="caption" className="text-emerald-600 dark:text-emerald-400 font-medium leading-relaxed italic block">
                {successMsg}
              </Typography>
            </div>
          )}

          <Button variant="secondary" onClick={handleClose}>Confirm</Button>
        </div>
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (view === VIEW_ERROR) {
    return (
      <Modal isOpen title="Policy Interrupted" icon="settings_suggest" iconVariant="danger" onClose={handleClose} maxWidth="540px">
        <div className="flex flex-col items-center justify-center py-10 gap-6 text-center animate-in fade-in duration-200">
          <div className="relative w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)]">
            <Icon name="error" size="md" weight={300} className="text-white" />
          </div>

          <div className="space-y-2 px-6">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">Controller Fault</Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">The storage controller rejected the configuration payload.</Typography>
          </div>

          <div className="w-full max-w-[440px] bg-rose-500/5 border border-rose-500/15 rounded-2xl px-5 py-4 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="terminal" size="xs" weight={300} className="text-rose-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-400">Error Manifest</span>
            </div>
            <Typography variant="caption" className="text-rose-400/90 font-mono leading-relaxed block break-words text-[11px] font-medium italic">
              {errorMsg}
            </Typography>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleClose}>Dismiss</Button>
            <Button variant="primary" icon="refresh" onClick={() => { setView(VIEW_FORM); setErrorMsg(''); }}>Retry Submission</Button>
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── FORM view ─── */
  return (
    <Modal
      isOpen={isSetAutomationVolumeModalOpen}
      onClose={handleClose}
      title="Set automation volume"
      subtitle={selectedDatabase?.toUpperCase()}
      icon="settings_suggest"
      maxWidth="max-w-[540px]"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="ghost" onClick={handleClose}>Discard</Button>
          <Button 
            variant="primary"
            onClick={handleSave}
            loading={autoVolumeLoading}
            icon="save"
            className="px-8 min-w-[160px]"
          >
            Apply Policy
          </Button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-4 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
             <Icon name="info" size="sm" weight={300} className="text-amber-500" />
          </div>
          <Typography variant="p" className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium italic">
            Configure automatic volume expansion for Data and Index storage. Thresholds define the <span className="text-amber-600 font-bold">trigger point</span> for system-automatic volume creation when storage nears capacity.
          </Typography>
        </div>

        <div className="space-y-5 relative">
          {autoVolumeLoading && (
            <div className="absolute inset-0 z-10 bg-white/60 dark:bg-bk-side/60 backdrop-blur-xs flex flex-col items-center justify-center rounded-3xl animate-in fade-in duration-300">
               <div className="w-12 h-12 rounded-full border-2 border-slate-100 dark:border-white/5 border-t-amber-500 animate-spin mb-3" />
               <Typography variant="caption" className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Retrieving Registry...</Typography>
            </div>
          )}

          <ConfigGroup 
            title="Data parameters" 
            icon="database" 
            enabled={dataEnabled} setEnabled={setDataEnabled}
            threshold={dataThreshold} setThreshold={setDataThreshold}
            addSize={dataAddSize} setAddSize={setDataAddSize}
          />

          <ConfigGroup 
            title="Index parameters" 
            icon="list_alt" 
            enabled={indexEnabled} setEnabled={setIndexEnabled}
            threshold={indexThreshold} setThreshold={setIndexThreshold}
            addSize={indexAddSize} setAddSize={setIndexAddSize}
          />
        </div>
      </div>
    </Modal>
  );
}
