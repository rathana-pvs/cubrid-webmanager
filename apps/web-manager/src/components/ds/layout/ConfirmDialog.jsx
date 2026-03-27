import React from 'react';
import { Modal } from './Modal';
import { Button } from '../foundation/Button';
import { Typography } from '../foundation/Typography';

export const ConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel,
}) => {
  const isDanger = variant === 'danger';

  const footer = (
    <>
      <Button variant="outline" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button variant={isDanger ? 'danger' : 'primary'} onClick={onConfirm}>
        {confirmLabel}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      icon={isDanger ? 'warning' : 'info'}
      iconVariant={isDanger ? 'danger' : 'primary'}
      footer={footer}
      maxWidth="max-w-md"
    >
      <Typography variant="p" className="text-sm text-slate-600 dark:text-slate-400">
        {description}
      </Typography>
    </Modal>
  );
};
