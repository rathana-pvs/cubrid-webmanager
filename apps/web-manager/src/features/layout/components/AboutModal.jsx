import React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { setAboutCubrid } from '../appBarSlice';
import { Modal } from '../../../components/ds/layout/Modal';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Button } from '../../../components/ds/foundation/Button';
import { Icon } from '../../../components/ds/foundation/Icon';
import { Divider } from '../../../components/ds/foundation/Divider';

export default function AboutModal() {
  const dispatch = useDispatch();
  const { isAboutCubridOpen } = useSelector((state) => state.appBar, shallowEqual);

  if (!isAboutCubridOpen) return null;

  return (
    <Modal
      isOpen={isAboutCubridOpen}
      onClose={() => dispatch(setAboutCubrid(false))}
      maxWidth="max-w-[440px]"
      hideFooter
      className="p-0 overflow-hidden border-none shadow-2xl"
    >
      {/* Dynamic Header with Premium Gradients */}
      <div className="h-28 bg-linear-to-br from-bk-main via-slate-900 to-black relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 mix-blend-overlay"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-linear-to-b from-transparent to-bk-side/50"></div>
        
        {/* Animated Background Orbs */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-bk-yellow/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-bk-yellow/5 rounded-full blur-3xl animate-pulse delay-700"></div>

        <div className="relative z-10 translate-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="w-20 h-20 bg-white dark:bg-bk-side rounded-4xl flex items-center justify-center shadow-2xl border-4 border-white dark:border-bk-side ring-1 ring-slate-100 dark:ring-white/5 overflow-hidden">
             <img src="/cubrid-logo.png" alt="CUBRID Logo" className="w-12 h-12 object-contain" />
          </div>
        </div>
      </div>

      <div className="px-10 pt-12 pb-10 text-center space-y-8 animate-in fade-in duration-700">
        <div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Typography variant="h1" className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">
              CUBRID
            </Typography>
            <Typography variant="h1" className="text-3xl font-black text-bk-yellow italic tracking-tighter lowercase">
              manager
            </Typography>
          </div>
          <Typography variant="caption" className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] text-[9px] opacity-70">
            Next-Gen Enterprise DB Platform
          </Typography>
        </div>

        <div className="relative group grayscale hover:grayscale-0 transition-all duration-500">
          <div className="absolute inset-0 bg-bk-yellow/5 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative text-xs text-slate-500 dark:text-slate-400 font-bold leading-loose px-6 py-5 bg-slate-50 dark:bg-white/3 rounded-3xl border border-slate-200/50 dark:border-white/5 italic shadow-inner">
            "CUBRID represents the bridge between raw data silos and actionable insights. Our engine is engineered for mission-critical performance, driving the world's most demanding database environments with absolute reliability."
          </div>
        </div>

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
            size="lg"
            className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-bk-yellow/20"
            onClick={() => dispatch(setAboutCubrid(false))}
          >
            Acknowledge System
          </Button>
          <div className="flex flex-col gap-1">
            <Typography variant="caption" className="font-black text-slate-400 dark:text-slate-600 tracking-[0.2em] uppercase text-[9px] opacity-60">
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
