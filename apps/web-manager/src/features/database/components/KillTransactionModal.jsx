import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeKillTransactionModal } from '../databaseSlice';
import { databaseApi } from '../databaseApi';
import LoadingOverlay from '../../../components/common/LoadingOverlay';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Select } from '../../../components/ds/forms/Select';
import { Divider } from '../../../components/ds/layout/Divider';
import { Typography } from '../../../components/ds/foundation/Typography';

export default function KillTransactionModal({ onTransactionKilled }) {
  const dispatch = useDispatch();
  const { isKillTransactionModalOpen, killTransactionData, selectedDatabase } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);

  const [loading, setLoading] = useState(false);
  const [killType, setKillType] = useState('i'); // Default: Kill selected only

  useEffect(() => {
    if (isKillTransactionModalOpen) {
      setKillType('i');
    }
  }, [isKillTransactionModalOpen]);

  if (!isKillTransactionModalOpen || !killTransactionData) return null;

  const handleKill = async () => {
    if (!selectedHostUid) return;

    setLoading(true);
    try {
      const idx = killTransactionData.tranindex?.match(/\d+/)?.[0] || '';
      const payload = {
        dbname: selectedDatabase,
        type: killType,
        parameter: idx
      };

      const response = await databaseApi.killTransaction(selectedHostUid, selectedDatabase, payload);

      if (response.status === 201 || response.status === 200 || response.success) {
        dispatch(closeKillTransactionModal());
        if (onTransactionKilled) onTransactionKilled();
      }
    } catch (err) {
      console.error('Failed to kill transaction:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isKillTransactionModalOpen}
      onClose={() => dispatch(closeKillTransactionModal())}
      title="Dangerous: Terminate Transaction Handle"
      headerClassName="bg-rose-500/5!"
      icon="cancel"
      iconClassName="text-rose-500"
      maxWidth="540px"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={() => dispatch(closeKillTransactionModal())} disabled={loading}>
            Discard
          </Button>
          <Button 
            variant="danger" 
            onClick={handleKill} 
            loading={loading}
            icon="bolt"
            className="bg-rose-500 hover:bg-rose-600 border-rose-600/20 text-white shadow-lg shadow-rose-500/20"
          >
            Force Termination
          </Button>
        </div>
      }
    >
      <div className="relative">
        <LoadingOverlay
          isVisible={loading}
          title="Force terminating"
          subtitle="Aborting transaction handle and releasing locks..."
        />

        <div className="space-y-8">
          {/* Section: Transaction context */}
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <Divider label="TRANSACTION CONTEXT" />
            <div className="grid grid-cols-2 gap-6 px-1">
              <Input 
                label="Authenticated User"
                value={killTransactionData['@user'] || '-'}
                disabled
                icon="account_circle"
                className="font-medium"
              />
              <Input 
                label="Remote Host Source"
                value={killTransactionData.host || '-'}
                disabled
                icon="lan"
                className="font-mono"
              />
              <Input 
                label="Process Identifier (PID)"
                value={killTransactionData.pid || '-'}
                disabled
                icon="fingerprint"
                className="font-mono font-bold text-rose-500/80"
              />
              <Input 
                label="Application Identity"
                value={killTransactionData.program || '-'}
                disabled
                icon="terminal"
                className="truncate"
              />
            </div>
          </div>

          {/* Section: Termination scope */}
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <Divider label="TERMINATION PARAMETERS" />
            
            <div className="px-1 space-y-4">
              <Select 
                label="Kill Instruction Scope"
                value={killType}
                onChange={(val) => setKillType(val)}
                options={[
                  { value: 'i', label: 'Isolated: Kill selected transaction handle', icon: 'gps_fixed' },
                  { value: 'h', label: 'Broadcast: Kill all handles from this client host', icon: 'hub' },
                  { value: 'p', label: 'Strategic: Kill all handles from this program name', icon: 'apps' }
                ]}
                icon="settings_input_component"
              />

              <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex gap-4 transition-all hover:bg-rose-500/10">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20 shrink-0">
                  <Icon name="warning" size="md" weight={300} />
                </div>
                <div className="space-y-1">
                  <Typography variant="p" className="text-[11px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-tight">Critical Warning</Typography>
                  <Typography variant="p" className="text-[11px] text-slate-500 dark:text-slate-400 italic font-medium leading-relaxed">
                    Force termination results in an immediate <b>rollback</b> of any uncommitted atomic operations associated with the handle. Disk locks will be released asynchronously.
                  </Typography>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
