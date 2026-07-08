import React from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { setAboutCubrid } from '../appBarSlice';
import { Modal } from '../../../components/ds/layout/Modal';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Button } from '../../../components/ds/foundation/Button';
import { SectionHeader } from '../../../components/ds/foundation/SectionHeader';
import { useCM } from '../../../constants/useCM';

export default function AboutModal() {
  const CM = useCM();
  const dispatch = useDispatch();
  const { isAboutCubridOpen } = useSelector((state) => state.appBar, shallowEqual);

  if (!isAboutCubridOpen) return null;

  return (
    <Modal
      isOpen={isAboutCubridOpen}
      onClose={() => dispatch(setAboutCubrid(false))}
      title={CM.aboutCubrid}
      icon="info"
      maxWidth="420px"
      subtitle={CM.cubridWebManager}
      footer={
        <Button 
          variant="primary" 
          onClick={() => dispatch(setAboutCubrid(false))}
          className="min-w-[140px]"
        >
          {CM.close}
        </Button>
      }
    >
      <div className="flex flex-col items-center space-y-6 pt-2">
        {/* Logo Section */}
        <div className="w-24 h-24 p-3 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 shadow-xs flex items-center justify-center animate-in zoom-in duration-300">
          <img src="/cubrid-logo.png" alt={CM.cubridLogoAlt} className="w-full h-auto object-contain" />
        </div>

        <div className="w-full space-y-5">
          {/* Main Info */}
          <div className="flex flex-col items-center text-center w-full">
            <SectionHeader title={CM.cubridWebManager} icon="verified" className="justify-center" />
            <Typography variant="p" className="text-slate-500 dark:text-slate-400 text-[13px] mt-1">
              {CM.aboutTagline}
            </Typography>
          </div>

          {/* Details Section */}
          <div className="w-full">
            <SectionHeader title={CM.systemDetails} icon="settings_suggest" />
            <div className="space-y-0.5 pt-2">
              {[
                { label: CM.coreVersion, value: '12.4.0-STABLE' },
                { label: CM.webBridgeLabel, value: 'v1.1.2-ALPHA' },
                { label: CM.stackLabel, value: 'React · NestJS · Nx' },
                { label: CM.status, value: CM.certifiedStable, isStatus: true }
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
              {CM.copyrightNotice}
            </Typography>
          </div>
        </div>
      </div>
    </Modal>
  );
}
