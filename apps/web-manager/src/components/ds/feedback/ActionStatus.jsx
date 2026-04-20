import React from 'react';
import { Icon } from '../foundation/Icon';
import { Button } from '../foundation/Button';
import { Typography } from '../foundation/Typography';

/**
 * ──── ModalStatusLoading ────
 * Centralized loading view for modals with the signature double-animated spinner.
 */
export const ModalStatusLoading = ({ title = 'Syncing Changes', subtitle = 'Updating registry on host runtime...' }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-7 text-center animate-in fade-in duration-200">
    {/* High-fidelity Spinner UI */}
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-2 border-slate-100 dark:border-white/5" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-500 animate-spin" style={{ animationDuration: '0.9s' }} />
      <div className="absolute inset-[10px] rounded-full border-[1.5px] border-transparent border-b-amber-500/30 animate-spin" style={{ animationDuration: '1.7s', animationDirection: 'reverse' }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon name="schedule" size="md" weight={400} className="text-amber-500 animate-pulse" />
      </div>
    </div>

    <div className="space-y-1.5 px-8">
      <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight uppercase tracking-widest">{title}</Typography>
      <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium max-w-[320px] mx-auto leading-relaxed italic">
        {subtitle}
      </Typography>
    </div>

    {/* Shared Progress Indicator Bar */}
    <div className="w-32 h-[2px] bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
      <div className="h-full bg-amber-500 rounded-full" style={{ animation: 'modalSlide 1.5s ease-in-out infinite' }} />
    </div>
  </div>
);

/**
 * ──── ModalStatusSuccess ────
 * Centralized success view for modals with a large verified checkmark.
 */
export const ModalStatusSuccess = ({ 
  title = 'Changes Synchronized', 
  message = 'The configuration update has been successfully committed to the database controller.',
  onConfirm,
  confirmText = 'Great, Done'
}) => (
  <div className="flex flex-col items-center justify-center py-12 gap-7 text-center animate-in fade-in zoom-in-95 duration-500">
    <div className="relative">
      <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
      <div className="relative w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.3)]">
        <Icon name="verified" size="lg" weight={700} className="text-white" />
      </div>
    </div>

    <div className="space-y-2 px-8">
      <Typography variant="h4" className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight uppercase tracking-widest">{title}</Typography>
      <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[360px] mx-auto">
        {message}
      </Typography>
    </div>

    {onConfirm && (
      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={onConfirm} icon="check_circle" className="px-10">{confirmText}</Button>
      </div>
    )}
  </div>
);

/**
 * ──── ModalStatusError ────
 * Centralized error view for modals with a detailed signal/trace breakdown.
 */
export const ModalStatusError = ({ 
  title = 'Transaction Interrupted', 
  error, 
  onRetry,
  onCancel,
  retryText = 'Retry Submission',
  cancelText = 'Discard and Exit'
}) => (
  <div className="flex flex-col items-center justify-center py-10 gap-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="relative">
       <div className="absolute inset-0 bg-rose-500/10 rounded-full animate-ping" style={{ animationDuration: '2.5s' }} />
       <div className="relative w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(244,63,94,0.3)]">
         <Icon name="report_problem" size="sm" weight={300} className="text-white" />
       </div>
    </div>

    <div className="space-y-2 px-6">
      <Typography variant="h4" className="text-[15px] font-black text-rose-600 dark:text-rose-400 tracking-tight uppercase tracking-widest">{title}</Typography>
      <Typography variant="p" className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">System controller could not finalize the requested synchronization registry.</Typography>
    </div>

    {error && (
      <div className="w-full max-w-[440px] bg-rose-500/5 border border-rose-500/15 rounded-2xl px-5 py-4 text-left">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="terminal" size="xs" weight={300} className="text-rose-400" />
          <span className="text-[9px] font-black uppercase tracking-widest text-rose-400">Error Trace</span>
        </div>
        <Typography variant="caption" className="text-rose-400/90 font-mono leading-relaxed block break-words text-[11px] font-medium italic">
          {typeof error === 'string' ? error : (error?.message || 'Transaction rejected by host controller.')}
        </Typography>
      </div>
    )}

    <div className="flex items-center gap-3">
      {onCancel && <Button variant="secondary" onClick={onCancel}>{cancelText}</Button>}
      {onRetry && <Button variant="primary" icon="refresh" onClick={onRetry}>{retryText}</Button>}
    </div>
  </div>
);
