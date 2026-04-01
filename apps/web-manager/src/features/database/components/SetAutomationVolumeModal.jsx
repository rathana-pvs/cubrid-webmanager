import React, { useState, useEffect, useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeSetAutomationVolumeModal, fetchAutoVolumeConfig, updateAutoVolumeConfig } from '../databaseSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Toggle } from '../../../components/ds/forms/Toggle';
import { Typography } from '../../../components/ds/foundation/Typography';

const PAGE_SIZE_BYTES = 16384;
const BYTES_TO_MB = 1024 * 1024;

const VIEW_FORM    = 'form';
const VIEW_LOADING = 'loading';
const VIEW_SUCCESS = 'success';
const VIEW_ERROR   = 'error';

// ── Slider Field ───────────────────────────────────────────────
const SliderField = memo(({ label, value, min, max, step = 1, onChange, unit = '%', disabled }) => {
  const pct = Math.max(0, ((value - min) / (max - min)) * 100);
  return (
    <div className={`space-y-2 transition-opacity duration-300 ${disabled ? 'opacity-30 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between">
        <Typography variant="caption" className="text-[10px] font-semibold text-slate-400">
          {label}
        </Typography>
        <div className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
          <span className="text-[11px] font-bold font-mono text-amber-600 dark:text-amber-400">{Math.max(min, value)}{unit}</span>
        </div>
      </div>
      <div className="relative h-4 flex items-center">
        <div className="absolute inset-x-0 h-[3px] bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full transition-all duration-150" style={{ width: `${pct}%` }} />
        </div>
        <input
          type="range" min={min} max={max} step={step}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute inset-x-0 w-full h-4 opacity-0 cursor-pointer z-10"
        />
        <div
          className="absolute w-3.5 h-3.5 bg-white dark:bg-slate-200 border-2 border-amber-500 rounded-full shadow-md pointer-events-none transition-all duration-150 z-0"
          style={{ left: `calc(${pct}% - 7px)` }}
        />
      </div>
      <div className="flex justify-between">
        <span className="text-[9px] text-slate-300 dark:text-slate-600 font-mono">{min}{unit}</span>
        <span className="text-[9px] text-slate-300 dark:text-slate-600 font-mono">{max}{unit}</span>
      </div>
    </div>
  );
});

// ── Policy Card ────────────────────────────────────────────────
const PolicyCard = memo(({ title, icon, description, enabled, onToggle, threshold, onThresholdChange, addSize, onSizeChange }) => {
  const extensionUnits = Math.floor(addSize * BYTES_TO_MB / PAGE_SIZE_BYTES);
  return (
    <div className={`rounded-sm border transition-all duration-300 overflow-hidden
      ${enabled
        ? 'bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/8'
        : 'bg-slate-50/50 dark:bg-black/10 border-slate-100 dark:border-white/4'
      }`}>

      {/* Card Header */}
      <div className={`px-4 py-3 flex items-center justify-between border-b transition-all duration-300
        ${enabled ? 'border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]' : 'border-transparent'}`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded flex items-center justify-center transition-all duration-300
            ${enabled ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500' : 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/8 text-slate-400'}`}>
            <Icon name={icon} size="14px" weight={300} />
          </div>
          <div>
            <Typography variant="p" className={`text-[12px] font-bold leading-tight transition-colors
              ${enabled ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-600'}`}>
              {title}
            </Typography>
            <Typography variant="caption" className="text-[9px] text-slate-400 font-mono block">
              {description}
            </Typography>
          </div>
        </div>
        <Toggle checked={enabled} onChange={onToggle} variant="primary" />
      </div>

      {/* Card Body */}
      <div className={`px-4 py-4 space-y-4 transition-all duration-300 ${!enabled ? 'opacity-25 pointer-events-none' : ''}`}>
        <SliderField
          label="Trigger threshold"
          value={threshold}
          min={5} max={30}
          onChange={onThresholdChange}
          unit="%"
        />

        <div className="grid grid-cols-2 gap-3 items-end">
          <div className="space-y-1">
            <Typography variant="caption" className="text-[10px] font-semibold text-slate-400 block">
              Expansion size
            </Typography>
            <Input
              type="number"
              value={addSize}
              onChange={(e) => onSizeChange(parseInt(e.target.value) || 0)}
              placeholder="0"
              size="sm"
              suffix={<span className="text-[9px] font-bold text-slate-400">MB</span>}
            />
          </div>
            <Input
              label="Extension pages"
              size="sm"
              readOnly
              value={extensionUnits.toLocaleString()}
              suffix="pages"
              inputClassName="font-mono font-bold text-slate-600 dark:text-slate-300"
            />
        </div>
      </div>
    </div>
  );
});

// ── Main Component ─────────────────────────────────────────────
export default function SetAutomationVolumeModal() {
  const dispatch = useDispatch();
  const { isSetAutomationVolumeModalOpen } = useSelector((state) => state.databaseUI);
  const { selectedDatabase } = useSelector((state) => state.database);
  const { autoVolumeConfigs, autoVolumeLoading } = useSelector((state) => state.databaseConfiguration);
  const { selectedHostUid } = useSelector((state) => state.host);

  const [view, setView] = useState(VIEW_FORM);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [dataEnabled, setDataEnabled]       = useState(false);
  const [dataThreshold, setDataThreshold]   = useState(15);
  const [dataAddSize, setDataAddSize]       = useState(2048);
  const [indexEnabled, setIndexEnabled]     = useState(false);
  const [indexThreshold, setIndexThreshold] = useState(15);
  const [indexAddSize, setIndexAddSize]     = useState(2048);

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
      setDataThreshold(config.data_warn_outofspace ? Math.max(5, Math.round(parseFloat(config.data_warn_outofspace) * 100)) : 15);
      setDataAddSize(config.data_ext_page ? Math.round(parseInt(config.data_ext_page) * PAGE_SIZE_BYTES / BYTES_TO_MB) : 2048);
      setIndexEnabled(config.index === 'ON');
      setIndexThreshold(config.index_warn_outofspace ? Math.max(5, Math.round(parseFloat(config.index_warn_outofspace) * 100)) : 15);
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
      index_ext_page: Math.floor(indexAddSize * BYTES_TO_MB / PAGE_SIZE_BYTES).toString(),
    };
    try {
      await dispatch(updateAutoVolumeConfig({ hostUid: selectedHostUid, dbname: selectedDatabase, payload })).unwrap();
      setSuccessMsg(`Auto-volume policies for "${selectedDatabase}" were saved successfully.`);
      setView(VIEW_SUCCESS);
    } catch (err) {
      setErrorMsg(typeof err === 'string' ? err : (err?.message || 'Failed to save configuration. Please try again.'));
      setView(VIEW_ERROR);
    }
  }, [dataEnabled, dataThreshold, dataAddSize, indexEnabled, indexThreshold, indexAddSize, selectedHostUid, selectedDatabase, dispatch]);

  const handleClose = () => dispatch(closeSetAutomationVolumeModal());

  /* ── LOADING ── */
  if (view === VIEW_LOADING) {
    return (
      <Modal isOpen title="Auto Volume" icon="settings_suggest" onClose={handleClose} maxWidth="max-w-md">
        <div className="flex flex-col items-center justify-center py-14 gap-5 text-center animate-in fade-in duration-300">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-2 border-slate-100 dark:border-white/5" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-500 animate-spin" style={{ animationDuration: '0.8s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon name="storage" size="md" weight={300} className="text-amber-500 animate-pulse" />
            </div>
          </div>
          <div className="space-y-1">
            <Typography variant="h4" className="text-[14px] font-bold text-slate-800 dark:text-white">Saving policies…</Typography>
            <Typography variant="p" className="text-[11px] text-slate-400">
              Updating configuration for <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">{selectedDatabase}</span>
            </Typography>
          </div>
        </div>
      </Modal>
    );
  }

  /* ── SUCCESS ── */
  if (view === VIEW_SUCCESS) {
    return (
      <Modal isOpen title="Auto Volume" icon="settings_suggest" iconVariant="success" onClose={handleClose} maxWidth="max-w-md">
        <div className="flex flex-col items-center justify-center py-12 gap-5 text-center animate-in fade-in duration-300">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400/15 rounded-full animate-ping" style={{ animationDuration: '2.5s' }} />
            <div className="relative w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Icon name="check" size="md" weight={400} className="text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <Typography variant="h4" className="text-[14px] font-bold text-slate-800 dark:text-white">Saved</Typography>
            <Typography variant="p" className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">{successMsg}</Typography>
          </div>
          <Button variant="secondary" onClick={handleClose} size="sm" className="px-8 mt-2">Close</Button>
        </div>
      </Modal>
    );
  }

  /* ── ERROR ── */
  if (view === VIEW_ERROR) {
    return (
      <Modal isOpen title="Auto Volume" icon="settings_suggest" iconVariant="danger" onClose={handleClose} maxWidth="max-w-md">
        <div className="flex flex-col items-center justify-center py-10 gap-5 text-center animate-in fade-in duration-300">
          <div className="w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Icon name="error" size="md" weight={400} className="text-white" />
          </div>
          <div className="space-y-1">
            <Typography variant="h4" className="text-[14px] font-bold text-slate-800 dark:text-white">Failed to Save</Typography>
            <Typography variant="p" className="text-[11px] text-slate-400">Something went wrong. Please check and try again.</Typography>
          </div>
          <div className="w-full bg-rose-500/5 border border-rose-500/15 rounded-sm px-4 py-3 text-left">
            <Typography variant="caption" className="text-rose-400 font-mono text-[10px] leading-relaxed block break-words">
              {errorMsg}
            </Typography>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Button variant="secondary" onClick={handleClose} size="sm">Cancel</Button>
            <Button variant="primary" icon="refresh" onClick={() => { setView(VIEW_FORM); setErrorMsg(''); }} size="sm">Retry</Button>
          </div>
        </div>
      </Modal>
    );
  }

  /* ── FORM ── */
  return (
    <Modal
      isOpen={isSetAutomationVolumeModalOpen}
      onClose={handleClose}
      title="Auto Volume"
      subtitle={selectedDatabase ? `Configure expansion policies for "${selectedDatabase}"` : ''}
      icon="settings_suggest"
      maxWidth="max-w-[580px]"
      footer={
        <div className="flex items-center justify-between w-full">
          <Typography variant="caption" className="text-[9px] text-slate-400 font-mono hidden sm:block">
            Page size: 16K
          </Typography>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose} size="sm">Cancel</Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={autoVolumeLoading}
              icon="save"
              size="sm"
              className="px-6 shadow-sm shadow-amber-500/20"
            >
              Save
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 animate-in fade-in duration-300">

        {/* Database target banner */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-linear-to-r from-amber-500/10 to-transparent border border-amber-500/15 rounded-sm">
          <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Icon name="database" size="14px" weight={300} className="text-amber-500" />
          </div>
          <div className="min-w-0 flex-1">
            <Typography variant="caption" className="text-[9px] font-semibold text-amber-600/70 uppercase tracking-widest block">Target database</Typography>
            <Typography variant="p" className="text-[12px] font-bold text-amber-700 dark:text-amber-400 font-mono truncate">{selectedDatabase}</Typography>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400">Auto-Volume On</span>
          </div>
        </div>

        {/* Loading overlay for initial config fetch */}
        <div className="relative">
          {autoVolumeLoading && (
            <div className="absolute inset-0 z-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs flex items-center justify-center rounded-sm border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-slate-100 dark:border-white/5 border-t-amber-500 animate-spin" />
                <Typography variant="caption" className="text-[10px] text-slate-500">Loading config…</Typography>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <PolicyCard
              title="Data Volume"
              icon="database"
              description="Permanent data volumes"
              enabled={dataEnabled}
              onToggle={setDataEnabled}
              threshold={dataThreshold}
              onThresholdChange={setDataThreshold}
              addSize={dataAddSize}
              onSizeChange={setDataAddSize}
            />
            <PolicyCard
              title="Index Volume"
              icon="list_alt"
              description="Index & search volumes"
              enabled={indexEnabled}
              onToggle={setIndexEnabled}
              threshold={indexThreshold}
              onThresholdChange={setIndexThreshold}
              addSize={indexAddSize}
              onSizeChange={setIndexAddSize}
            />
          </div>
        </div>

        {/* Note */}
        <div className="flex items-center gap-2 px-1">
          <Icon name="info" size="11px" weight={300} className="text-slate-300 dark:text-slate-600 shrink-0" />
          <Typography variant="caption" className="text-[9px] text-slate-400">
            Volumes expand automatically when free space falls below the trigger threshold. Calculations are based on a 16K page size.
          </Typography>
        </div>
      </div>
    </Modal>
  );
}
