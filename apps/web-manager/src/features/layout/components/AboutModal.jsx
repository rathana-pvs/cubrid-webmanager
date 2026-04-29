import React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { setAboutCubrid } from '../appBarSlice';
import { Modal } from '../../../components/ds/layout/Modal';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Button } from '../../../components/ds/foundation/Button';
import { SectionHeader } from '../../../components/ds/foundation/SectionHeader';

export default function AboutModal() {
  const dispatch = useDispatch();
  const { isAboutCubridOpen } = useSelector((state) => state.appBar, shallowEqual);

  if (!isAboutCubridOpen) return null;

  return (
    <Modal
      isOpen={isAboutCubridOpen}
      onClose={() => dispatch(setAboutCubrid(false))}
      title="About CUBRID"
      icon="info"
      maxWidth="420px"
      subtitle="Modern database management interface"
      footer={
        <Button 
          variant="primary" 
          onClick={() => dispatch(setAboutCubrid(false))}
          className="min-w-[140px]"
        >
          Acknowledge
        </Button>
      }
    >
      <div className="flex flex-col items-center space-y-6 pt-2">
        {/* Logo Section */}
        <div className="w-24 h-24 p-3 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 shadow-xs flex items-center justify-center animate-in zoom-in duration-300">
          <img src="/cubrid-logo.png" alt="CUBRID logo" className="w-full h-auto object-contain" />
        </div>

        <div className="w-full space-y-5">
          {/* Main Info */}
          <div className="flex flex-col items-center text-center w-full">
            <SectionHeader title="CUBRID Web Manager" icon="verified" className="justify-center" />
            <Typography variant="p" className="text-slate-500 dark:text-slate-400 text-[13px] mt-1">
              Engineered with precision for the modern web stack.
            </Typography>
          </div>

          {/* Details Section */}
          <div className="w-full">
            <SectionHeader title="System Details" icon="settings_suggest" />
            <div className="space-y-0.5 pt-2">
              {[
                { label: 'Core Version', value: '12.4.0-STABLE' },
                { label: 'Web Bridge', value: 'v1.1.2-ALPHA' },
                { label: 'Stack', value: 'React · NestJS · Nx' },
                { label: 'Status', value: 'Certified Stable', isStatus: true }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-white/5 last:border-0">
                  <Typography variant="caption" className="text-slate-400 font-medium">{item.label}</Typography>
                  <div className="flex items-center gap-1.5">
                    {item.isStatus && (
                      <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse"></span>
                    )}
                    <Typography 
                      variant="caption" 
                      className={`font-mono text-[12px] font-bold ${item.isStatus ? 'text-emerald-500' : 'text-slate-700 dark:text-slate-200'}`}
                    >
                      {item.value}
                    </Typography>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Copyright Section */}
          <div className="pt-4 border-t border-slate-50 dark:border-white/5 text-center">
            <Typography variant="caption" className="text-slate-400 dark:text-slate-500 text-[10px] tracking-widest uppercase">
              © 2026 CUBRID Corporation
            </Typography>
          </div>
        </div>
      </div>
    </Modal>
  );
}
