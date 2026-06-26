import React from 'react';
import { Modal } from '../../components/ds/layout/Modal';
import { ModalStatusSuccess, ModalStatusError } from '../../components/ds/feedback/ActionStatus';
import { useCM } from '../../constants/useCM';
import { getCmsJobTypeLabel } from './cmsJobLabels';

export function JobResultModal({ result, onClose }) {
  const CM = useCM();
  const op = getCmsJobTypeLabel(result.type, CM);
  const db = result.dbname || '—';

  if (result.status === 'succeeded') {
    return (
      <Modal
        isOpen
        title={op}
        icon="check_circle"
        iconVariant="success"
        onClose={onClose}
        maxWidth="480px"
        zIndexClass="z-[2100]"
      >
        <ModalStatusSuccess
          title={result.successMessage || CM.jobNotifySucceeded(op, db)}
          message={db !== '—' ? `"${db}"` : undefined}
          onConfirm={onClose}
          confirmText={CM.ok}
        />
      </Modal>
    );
  }

  const errMsg = result.errorMessage || result.error?.message;
  return (
    <Modal
      isOpen
      title={op}
      icon="error"
      iconVariant="danger"
      onClose={onClose}
      maxWidth="480px"
      zIndexClass="z-[2100]"
    >
      <ModalStatusError
        title={CM.jobNotifyFailed(op, db)}
        error={errMsg}
        onCancel={onClose}
        cancelText={CM.dismiss}
      />
    </Modal>
  );
}
