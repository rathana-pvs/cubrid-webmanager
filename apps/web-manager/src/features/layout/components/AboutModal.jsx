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

      {/* Footer */}
      <div className="pt-5 pb-1 flex flex-col items-center gap-4">
        <Button
          variant="primary"
          size="md"
          className="w-full"
          onClick={() => dispatch(setAboutCubrid(false))}
        >
          Close
        </Button>
        <Typography variant="caption" className="text-slate-400 dark:text-slate-600 text-[10px]">
          © 2026 CUBRID Corporation. All rights reserved.
        </Typography>
      </div>
    </Modal>
  );
}
