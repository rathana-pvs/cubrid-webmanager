import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeKillTransactionModal } from '../databaseSlice';
import { databaseApi } from '../databaseApi';
import { buildKillParameter } from '../transactionUtils';
import { useCM } from '../../../constants/useCM';

import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Select } from '../../../components/ds/forms/Select';
import { Typography } from '../../../components/ds/foundation/Typography';
import { useActionState } from '../../../infrastructure/hooks/useActionState';
import { ModalStatusLoading, ModalStatusSuccess, ModalStatusError } from '../../../components/ds/feedback/ActionStatus';

export default function KillTransactionModal({ onTransactionKilled }) {
  const CM = useCM();
  const dispatch = useDispatch();
  const { isKillTransactionModalOpen, killTransactionData } = useSelector((state) => state.databaseUI, shallowEqual);
  const { selectedDatabase } = useSelector((state) => state.database, shallowEqual);
  const { selectedHostUid } = useSelector((state) => state.host, shallowEqual);

  const {
    error: actionError,
    startAction,
    endSuccess,
    endError,
    resetAction,
    isLoading,
    isSuccess,
    isError,
  } = useActionState();

  const [killType, setKillType] = useState('i');

  useEffect(() => {
    if (isKillTransactionModalOpen) {
      resetAction();
      setKillType('i');
    }
  }, [isKillTransactionModalOpen, resetAction]);

  if (!isKillTransactionModalOpen || !killTransactionData) return null;

  const handleKill = async () => {
    if (!selectedHostUid || !selectedDatabase) return;

    startAction();

    try {
      const parameter = buildKillParameter(killType, killTransactionData);
      if (killType !== 'd' && !parameter) {
        endError(CM.killParamResolveErrorMsg);
        return;
      }

      await databaseApi.killTransaction(selectedHostUid, selectedDatabase, { type: killType, parameter });
      endSuccess();
      onTransactionKilled?.();

      setTimeout(() => dispatch(closeKillTransactionModal()), 800);
    } catch (err) {
      endError(err?.response?.data?.note || err?.message || CM.error);
    }
  };

  const handleClose = () => dispatch(closeKillTransactionModal());

  if (isLoading) {
    return (
      <Modal isOpen title={CM.killTransactionTitle} icon="cancel" onClose={handleClose} maxWidth="520px" showCloseButton={false}>
        <ModalStatusLoading title={CM.killTransactionTitle} subtitle={CM.killTransactionTitle} />
      </Modal>
    );
  }

  if (isSuccess) {
    return (
      <Modal isOpen title={CM.killTransactionTitle} icon="verified" iconVariant="success" onClose={handleClose} maxWidth="520px">
        <ModalStatusSuccess
          title={CM.success}
          message={CM.killSuccess}
          onConfirm={handleClose}
          confirmText={CM.ok}
        />
      </Modal>
    );
  }

  if (isError) {
    return (
      <Modal isOpen title={CM.killTransactionTitle} icon="error" iconVariant="danger" onClose={resetAction} maxWidth="520px">
        <ModalStatusError
          title={CM.failure}
          error={actionError}
          onRetry={handleKill}
          onCancel={resetAction}
          cancelText={CM.close}
        />
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isKillTransactionModalOpen}
      onClose={handleClose}
      title={CM.killTransactionTitle}
      subtitle={selectedDatabase ? `${CM.databaseName}: ${selectedDatabase}` : undefined}
      icon="cancel"
      maxWidth="520px"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="ghost" onClick={handleClose}>{CM.cancel}</Button>
          <Button variant="danger" onClick={handleKill} icon="cancel">
            {CM.killTransaction}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Typography variant="caption" className="text-slate-500 ml-1">{CM.userNameCol}</Typography>
            <Input value={killTransactionData['@user'] || killTransactionData['@uid'] || '-'} disabled size="sm" />
          </div>
          <div className="space-y-1">
            <Typography variant="caption" className="text-slate-500 ml-1">{CM.processId}</Typography>
            <Input value={killTransactionData.pid || '-'} disabled size="sm" />
          </div>
          <div className="space-y-1">
            <Typography variant="caption" className="text-slate-500 ml-1">{CM.host}</Typography>
            <Input value={killTransactionData.host || '-'} disabled size="sm" />
          </div>
          <div className="space-y-1">
            <Typography variant="caption" className="text-slate-500 ml-1">{CM.programName}</Typography>
            <Input value={killTransactionData.program || killTransactionData.pname || '-'} disabled size="sm" />
          </div>
        </div>

        <div className="space-y-2">
          <Typography variant="caption" className="text-slate-500 ml-1">{CM.killType}</Typography>
          <Select
            value={killType}
            onChange={(e) => setKillType(e.target.value)}
            options={[
              { value: 'i', label: CM.killSelectedOnly },
              { value: 'h', label: CM.killSameHost },
              { value: 'p', label: CM.killSameProgram },
            ]}
          />
        </div>
      </div>
    </Modal>
  );
}
