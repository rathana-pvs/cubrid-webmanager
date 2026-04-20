import React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { setAboutCubrid } from '../appBarSlice';
import { Modal } from '../../../components/ds/layout/Modal';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Button } from '../../../components/ds/foundation/Button';
import { Icon } from '../../../components/ds/foundation/Icon';
import { Divider } from '../../../components/ds/foundation/Divider';

const INFO_ROWS = [
  { icon: 'terminal',  label: 'Core Version', value: '12.4.0' },
  { icon: 'web',       label: 'Web Manager',  value: '1.1.2' },
  { icon: 'code',      label: 'Stack',        value: 'React · NestJS · Nx' },
];

export default function AboutModal() {
  const dispatch = useDispatch();
  const { isAboutCubridOpen } = useSelector((state) => state.appBar, shallowEqual);

  if (!isAboutCubridOpen) return null;

  return (
    <Modal
      isOpen={isAboutCubridOpen}
      onClose={() => dispatch(setAboutCubrid(false))}
      maxWidth="max-w-[380px]"
      hideFooter
    >
      {/* Logo + Title */}
      <div className="flex flex-col items-center gap-3 pt-2 pb-6 text-center">
        <div className="w-14 h-14 bg-slate-100 dark:bg-white/6 rounded-2xl flex items-center justify-center">
          <img src="/cubrid-logo.png" alt="CUBRID Logo" className="w-9 h-9 object-contain" />
        </div>
        <div>
          <Typography variant="h1" className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
            CUBRID Web Manager
          </Typography>
          <Typography variant="caption" className="text-slate-400 dark:text-slate-500 text-[11px]">
            Modern database management interface
          </Typography>
        </div>
      </div>

      <Divider className="my-0 opacity-40" />

      {/* Info rows */}
      <div className="py-2">
        {INFO_ROWS.map(({ icon, label, value }) => (
          <div key={label} className="flex items-center justify-between py-3 px-1">
            <div className="flex items-center gap-2.5">
              <Icon name={icon} size="xs" weight={300} className="text-slate-400" />
              <Typography variant="caption" className="text-slate-500 dark:text-slate-400 text-[12px]">
                {label}
              </Typography>
            </div>
            <Typography variant="caption" className="text-slate-700 dark:text-slate-300 font-semibold text-[12px]">
              {value}
            </Typography>
          </div>
        ))}
      </div>

      <Divider className="my-0 opacity-40" />

        <div className="space-y-0 text-left pt-2">
           <div className="flex justify-between items-center py-4 group/item">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover/item:bg-bk-yellow/10 group-hover/item:text-bk-yellow transition-colors">
                <Icon name="terminal" size="xs"  weight={300} />
              </div>
              <Typography variant="caption" className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px]">Core Version</Typography>
            </div>
            <Typography variant="p" className="text-xs text-slate-800 dark:text-slate-200 font-black tracking-widest">12.4.0-STABLE</Typography>
          </div>
          <Divider className="my-0 opacity-50" />
          
          <div className="flex justify-between items-center py-4 group/item">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover/item:bg-bk-yellow/10 group-hover/item:text-bk-yellow transition-colors">
                <Icon name="web" size="xs"  weight={300} />
              </div>
              <Typography variant="caption" className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px]">Web Bridge</Typography>
            </div>
            <Typography variant="p" className="text-xs text-slate-800 dark:text-slate-200 font-black tracking-widest">v1.1.2-ALPHA</Typography>
          </div>
          <Divider className="my-0 opacity-50" />

          <div className="flex justify-between items-center py-4 group/item">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Icon name="verified" size="xs"  weight={300} />
              </div>
              <Typography variant="caption" className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px]">Status</Typography>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse"></span>
              <Typography variant="caption" className="text-emerald-500 font-black uppercase tracking-tighter">Certified Stable</Typography>
            </div>
          </div>
        </div>

        <div className="space-y-5 pt-4">
          <Button 
            variant="primary"
            icon="check_circle"
            className="w-full h-12 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-bk-yellow/20"
            onClick={() => dispatch(setAboutCubrid(false))}
          >
            Acknowledge System
          </Button>
          <div className="flex flex-col gap-1">
            <Typography variant="caption" className="font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase text-[9px] opacity-60">
              © 2026 CUBRID Corporation
            </Typography>
            <Typography variant="caption" className="font-bold text-slate-300 dark:text-slate-700 tracking-tighter text-[8px]">
              Engineered with precision for the modern web stack.
            </Typography>
          </div>
        </div>
      </div>
    </Modal>
  );
}
