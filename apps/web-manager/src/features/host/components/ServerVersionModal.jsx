import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeServerVersionModal } from '../hostSlice';
import { hostApi } from '../hostApi';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Divider } from '../../../components/ds/layout/Divider';

export default function ServerVersionModal() {
  const dispatch = useDispatch();
  const { isServerVersionModalOpen, serverVersionHostUid, hosts } = useSelector((state) => state.host, shallowEqual);
  const [envData, setEnvData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isServerVersionModalOpen && serverVersionHostUid) {
      setLoading(true);
      hostApi.getHostEnv(serverVersionHostUid)
        .then(res => {
          setEnvData(res);
        })
        .catch(err => {
          console.error("Failed to fetch server version:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isServerVersionModalOpen, serverVersionHostUid]);

  if (!isServerVersionModalOpen) return null;

  const currentHost = hosts.find(h => h.uid === serverVersionHostUid);

  return (
    <Modal
      isOpen={isServerVersionModalOpen}
      onClose={() => dispatch(closeServerVersionModal())}
      title="Server Version"
      icon="info"
      loading={loading}
      maxWidth="420px"
      subtitle={`Host: ${currentHost?.alias || currentHost?.id}`}
      footer={
        <Button 
          variant="primary" 
          onClick={() => dispatch(closeServerVersionModal())}
          className="min-w-[140px]"
        >
          Acknowledge
        </Button>
      }
    >
      <div className="flex flex-col items-center space-y-6 pt-2">
        <div className="w-24 h-24 p-3 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 shadow-xs flex items-center justify-center animate-in zoom-in duration-300">
          <img src="/cubrid-logo.png" alt="CUBRID logo" className="w-full h-auto object-contain" />
        </div>

        <div className="w-full space-y-5">
          <div className="flex flex-col items-center text-center space-y-1">
            <Typography variant="caption" className="font-bold text-bk-yellow uppercase tracking-widest text-[10px]">
              Cubrid Version
            </Typography>
            <Typography variant="p" className="font-mono text-slate-700 dark:text-slate-200 leading-relaxed text-[13px]">
              {envData?.CUBRIDVER || 'Loading...'}
            </Typography>
          </div>

          <div className="space-y-1 pt-2">
            <Divider label="Environment Details" />
            <div className="space-y-0.5 pt-2">
              {[
                { label: 'OS Platform', value: envData?.osinfo },
                { label: 'Broker Version', value: envData?.BROKERVER },
                { label: 'Install Path', value: envData?.CUBRID, isPath: true },
                { label: 'Databases Path', value: envData?.CUBRID_DATABASES, isPath: true }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-white/5 last:border-0">
                  <Typography variant="caption" className="text-slate-400 font-medium">{item.label}</Typography>
                  <Typography 
                    variant="caption" 
                    className={`font-mono text-slate-700 dark:text-slate-200 ${item.isPath ? 'truncate ml-4 max-w-[200px]' : ''}`}
                    title={item.isPath ? item.value : undefined}
                  >
                    {item.value || '-'}
                  </Typography>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
