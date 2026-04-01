import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeAddVolumeModal, addVolume } from '../databaseSlice';
import { databaseApi } from '../databaseApi';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Typography } from '../../../components/ds/foundation/Typography';

// view states
const VIEW_FORM    = 'form';
const VIEW_LOADING = 'loading';
const VIEW_SUCCESS = 'success';
const VIEW_ERROR   = 'error';

const PURPOSE_OPTIONS = [
  {
    value: 'data',
    label: 'Data',
    icon: 'database',
    desc: 'Table & Row',
    color: 'text-sky-500',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/25',
    activeBg: 'bg-sky-500/8',
    activeBorder: 'border-sky-500/40',
  },
  {
    value: 'index',
    label: 'Index',
    icon: 'list_alt',
    desc: 'B-tree Acceleration',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/25',
    activeBg: 'bg-violet-500/8',
    activeBorder: 'border-violet-500/40',
  },
  {
    value: 'generic',
    label: 'Generic',
    icon: 'full_stacked_bar_chart',
    desc: 'Mixed Use',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/25',
    activeBg: 'bg-amber-500/8',
    activeBorder: 'border-amber-500/40',
  },
  {
    value: 'temp',
    label: 'Temporary',
    icon: 'timer',
    desc: 'Query Workspace',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/25',
    activeBg: 'bg-emerald-500/8',
    activeBorder: 'border-emerald-500/40',
  },
];

const SIZE_PRESETS = [
  { label: '128 MB', mb: 128 },
  { label: '256 MB', mb: 256 },
  { label: '512 MB', mb: 512 },
  { label: '1 GB', mb: 1024 },
  { label: '2 GB', mb: 2048 },
  { label: '4 GB', mb: 4096 },
];

export default function AddVolumeModal() {
  const dispatch = useDispatch();
  const { isAddVolumeModalOpen } = useSelector((state) => state.databaseUI, shallowEqual);
  const { selectedDatabase } = useSelector((state) => state.database, shallowEqual);
  const { selectedHostUid } = useSelector((state) => state.host, shallowEqual);

  const [view, setView] = useState(VIEW_FORM);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [volStatus, setVolStatus] = useState({ freespace: '', volpath: '' });
  const [volName, setVolName] = useState('');
  const [purpose, setPurpose] = useState('generic');
  const [path, setPath] = useState('');
  const [sizeMB, setSizeMB] = useState(512);
  const [fetchingStatus, setFetchingStatus] = useState(false);

  const numberOfPages = Math.floor(sizeMB * 1024 / 16);
  const selectedPurpose = PURPOSE_OPTIONS.find(o => o.value === purpose);

  useEffect(() => {
    if (isAddVolumeModalOpen && selectedHostUid && selectedDatabase) {
      setView(VIEW_FORM);
      setErrorMsg('');
      const fetchStatus = async () => {
        setFetchingStatus(true);
        try {
          const response = await databaseApi.getAddVolStatus(selectedHostUid, selectedDatabase);
          setVolStatus(response);
          setPath(response.volpath || '');
        } catch (err) {
          console.error('Failed to fetch add volume status:', err);
        } finally {
          setFetchingStatus(false);
        }
      };
      fetchStatus();
      setVolName('');
      setPurpose('generic');
      setSizeMB(512);
    }
  }, [isAddVolumeModalOpen, selectedHostUid, selectedDatabase]);

  if (!isAddVolumeModalOpen) return null;

  const handleAdd = async () => {
    if (!selectedHostUid || !selectedDatabase) return;
    
    setView(VIEW_LOADING);
    setErrorMsg('');

    try {
      const payload = {
        volname: volName,
        purpose,
        path,
        numberofpages: numberOfPages.toString(),
        size_need_mb: `${sizeMB.toFixed(3)}(MB)`
      };
      await dispatch(addVolume({ hostUid: selectedHostUid, dbname: selectedDatabase, payload })).unwrap();
      setView(VIEW_SUCCESS);
    } catch (err) {
      setErrorMsg(typeof err === 'string' ? err : (err.message || 'The volume allocation process was interrupted. Ensure the target directory is writable.'));
      setView(VIEW_ERROR);
    }
  };

  const handleClose = () => dispatch(closeAddVolumeModal());
  const formatSize = (mb) => mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;

  /* ─── LOADING view ─── */
  if (view === VIEW_LOADING) {
    return (
      <Modal isOpen title="Provisioning Storage" icon="add_to_drive" onClose={handleClose} maxWidth="560px">
        <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in fade-in duration-200">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-slate-100 dark:border-white/5" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-bk-yellow animate-spin" style={{ animationDuration: '0.9s' }} />
            <div className="absolute inset-[10px] rounded-full border-[1.5px] border-transparent border-b-bk-yellow/30 animate-spin" style={{ animationDuration: '1.7s', animationDirection: 'reverse' }} />
            <div className="absolute inset-0 flex items-center justify-center text-bk-yellow">
              <Icon name="storage" size="md" weight={400} className="animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-1.5 px-8">
            <Typography variant="h4" className="text-[14px] font-black text-slate-800 dark:text-white tracking-tight">Allocating Block Storage</Typography>
            <Typography variant="p" className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-[280px] mx-auto">
              Provisioning <span className="font-black text-slate-900 dark:text-white">{formatSize(sizeMB)}</span> for <span className="font-black text-slate-900 dark:text-white">{selectedDatabase}</span> instance.
            </Typography>
          </div>
          <div className="w-32 h-[2px] bg-slate-100 dark:bg-white/4 rounded-full overflow-hidden">
            <div className="h-full bg-bk-yellow rounded-full" style={{ animation: 'modalSlide 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  if (view === VIEW_SUCCESS) {
    return (
      <Modal isOpen title="Volume Provisioned" icon="add_to_drive" iconVariant="success" onClose={handleClose} maxWidth="560px">
        <div className="flex flex-col items-center justify-center py-12 gap-7 text-center animate-in fade-in duration-200">
          <div className="relative w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.3)]">
            <Icon name="verified" size="lg" weight={700} className="text-white" />
          </div>

          <div className="space-y-2 px-8">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
              Storage Expanded
            </Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 font-medium leading-relaxed max-w-[340px] mx-auto">
              A new <span className="font-bold text-slate-900 dark:text-white">{formatSize(sizeMB)} {purpose}</span> volume has been successfully attached and mounted.
            </Typography>
          </div>

          <Button variant="secondary" onClick={handleClose}>Access Instance</Button>
        </div>
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (view === VIEW_ERROR) {
    return (
      <Modal isOpen title="Provisioning Failed" icon="add_to_drive" iconVariant="danger" onClose={handleClose} maxWidth="560px">
        <div className="flex flex-col items-center justify-center py-10 gap-6 text-center animate-in fade-in duration-200">
          <div className="relative w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)]">
            <Icon name="error" size="md" weight={300} className="text-white" />
          </div>

          <div className="space-y-2 px-6">
            <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
              Allocation Interrupted
            </Typography>
            <Typography variant="p" className="text-[11.5px] text-slate-500 font-medium leading-relaxed">
              System could not finalize the volume provision for <span className="font-black text-slate-900 dark:text-white">{selectedDatabase}</span>.
            </Typography>
          </div>

          <div className="w-full max-w-[420px] bg-rose-500/5 border border-rose-500/15 rounded-xl px-4 py-3 text-left">
            <Typography variant="caption" className="text-rose-400 font-mono leading-relaxed break-words block text-center uppercase tracking-widest text-[10px] font-bold">
              {errorMsg}
            </Typography>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleClose}>Dismiss</Button>
            <Button variant="primary" icon="refresh" onClick={() => { setView(VIEW_FORM); setErrorMsg(''); }}>
              Retry Provision
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  /* ─── FORM view ─── */
  return (
    <Modal
      isOpen={isAddVolumeModalOpen}
      onClose={handleClose}
      title="Provision Storage Volume"
      subtitle={`Extend disk capacity for ${selectedDatabase}`}
      icon="add_to_drive"
      maxWidth="560px"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest italic">
            <Icon name="info" size="14px" weight={300} />
            <span>Active Instance Required</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={handleClose}>Discard</Button>
            <Button
              variant="primary"
              onClick={handleAdd}
              icon="add_to_drive"
              disabled={!path || !sizeMB || fetchingStatus}
            >
              Provision Volume
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-8 pb-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
        
        {/* Target Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-linear-to-r from-amber-500/8 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Icon name="database" size="md" weight={300} className="text-amber-500" />
              </div>
              <div className="min-w-0">
                <Typography variant="caption" className="font-black uppercase tracking-widest text-amber-600/70 dark:text-amber-400/60 mb-0.5">
                  Extending Environment
                </Typography>
                <Typography variant="h4" className="text-[14px] font-black text-amber-700 dark:text-amber-400 font-mono truncate">
                  {selectedDatabase}
                </Typography>
              </div>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <Typography variant="caption" className="font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 text-[9px]">Available Payload</Typography>
              {fetchingStatus ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-100 dark:border-white/8">
                  <div className="w-2 h-2 border-[1.5px] border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">Calculating…</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[12px] font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                    {volStatus.freespace || '—'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Purpose Selector */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <Icon name="architecture" size="14px" weight={400} className="text-bk-yellow" />
             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Storage Optimization</span>
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {PURPOSE_OPTIONS.map((opt) => {
              const isActive = purpose === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPurpose(opt.value)}
                  className={`flex flex-col items-center text-center p-3.5 rounded-2xl border transition-all duration-200 group relative overflow-hidden
                    ${isActive
                      ? `${opt.activeBg} ${opt.activeBorder} shadow-xs`
                      : 'bg-white dark:bg-white/1 border-slate-100 dark:border-white/4 hover:border-slate-200 dark:hover:border-white/10'
                    }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 border transition-all
                    ${isActive ? `${opt.bg} ${opt.border}` : 'bg-slate-50 dark:bg-white/5 border-transparent'}`}
                  >
                    <Icon name={opt.icon} size="xs" weight={300} className={isActive ? opt.color : 'text-slate-400'} />
                  </div>
                  <Typography variant="p" className={`font-black text-[11px] mb-0.5 transition-colors leading-none tracking-tight ${isActive ? opt.color : 'text-slate-600 dark:text-slate-400'}`}>
                    {opt.label}
                  </Typography>
                  <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">{opt.desc}</span>
                  {isActive && (
                    <div className={`absolute top-2 right-2 w-4 h-4 rounded-full ${opt.bg} border ${opt.border} flex items-center justify-center shadow-xs`}>
                      <Icon name="check" size="10px" weight={800} className={opt.color} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Allocation Size */}
        <div className="space-y-5">
           <div className="flex items-center gap-3">
             <Icon name="straighten" size="14px" weight={400} className="text-bk-yellow" />
             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Allocation Strategy</span>
          </div>

          <div className="flex flex-wrap gap-1.5 px-0.5">
            {SIZE_PRESETS.map((preset) => (
              <button
                key={preset.mb}
                type="button"
                onClick={() => setSizeMB(preset.mb)}
                className={`px-3 py-1.5 rounded-xl border text-[10px] font-black transition-all uppercase tracking-[0.1em]
                  ${sizeMB === preset.mb
                    ? 'bg-bk-yellow/10 border-bk-yellow/40 text-bk-yellow shadow-xs'
                    : 'bg-white dark:bg-white/2 border-slate-100 dark:border-white/5 text-slate-400 hover:border-bk-yellow/30 hover:text-bk-yellow'
                  }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Custom Capacity"
              value={sizeMB}
              onChange={(e) => setSizeMB(parseFloat(e.target.value) || 0)}
              icon="memory"
              suffix="MB"
              min={1}
              size="sm"
            />
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 block">Blocks Allocated</span>
              <div className="h-10 px-4 flex items-center justify-between bg-slate-50/50 dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-xl">
                <span className="text-[13px] font-black font-mono text-bk-yellow tabular-nums">{numberOfPages.toLocaleString()}</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black">pages</span>
              </div>
            </div>
          </div>

          {/* Progress bar visual */}
          <div className="p-4 bg-slate-50/50 dark:bg-white/1 border border-slate-100 dark:border-white/5 rounded-2xl space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Provision Visualizer</span>
              <div className="flex items-center gap-2">
                <span className={`text-[13px] font-black font-mono ${selectedPurpose?.color || 'text-bk-yellow'}`}>
                  {formatSize(sizeMB)}
                </span>
                <Icon name="keyboard_double_arrow_right" size="14px" className="text-slate-300 dark:text-white/10" />
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-white/8 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  purpose === 'data' ? 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.4)]' :
                  purpose === 'index' ? 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.4)]' :
                  purpose === 'temp' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                  'bg-bk-yellow shadow-[0_0_8px_rgba(255,193,7,0.4)]'
                }`}
                style={{ width: `${Math.min((sizeMB / 4096) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest">
              <span>Empty</span><span>1 GB</span><span>2 GB</span><span>Max (4GB)</span>
            </div>
          </div>
        </div>

        {/* Volume Identification */}
        <div className="space-y-4">
           <div className="flex items-center gap-3">
             <Icon name="label" size="14px" weight={400} className="text-bk-yellow" />
             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Instance Registry</span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Input label="Volume Identifier" value={volName} onChange={(e) => setVolName(e.target.value)} placeholder="e.g. DATA_VOL_PROD_1 (optional)" icon="badge" size="sm" />
            <Input label="Environment Path" value={path} onChange={(e) => setPath(e.target.value)} placeholder="/var/lib/cubrid/volumes" icon="folder_zip" size="sm" className="font-mono!" />
          </div>
        </div>

        {/* Guidance Disclaimer */}
        <div className="flex items-start gap-4 p-4 bg-slate-50/50 dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-2xl shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center shrink-0 border border-slate-200 dark:border-white/10">
            <Icon name="shield_lock" size="sm" weight={300} className="text-bk-yellow" />
          </div>
          <div className="space-y-0.5">
            <Typography variant="p" className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">Privileged Operation</Typography>
            <Typography variant="caption" className="text-slate-500 dark:text-slate-500 font-medium leading-relaxed italic block">
              Ensure target mount points have <span className="font-bold non-italic text-bk-yellow">write permissions</span> for the engine service account. Configuration updates persist instantly.
            </Typography>
          </div>
        </div>

      </div>
    </Modal>
  );
}
