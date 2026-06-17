import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeCompactDatabaseModal } from '../databaseSlice';
import { databaseJobApi } from '../databaseJobApi';
import { useCmsJob } from '../../../infrastructure/hooks/useCmsJob';
import { getCmsJobLoadingSubtitle } from '../../../infrastructure/cmsJob/cmsJobUi';

import { Modal } from '../../../components/ds/layout/Modal';
import {
  CaDialogField,
  CaDialogFieldGrid,
  CaDialogGroup,
} from '../../../components/ds/layout/CaDialogLayout';
import { Button } from '../../../components/ds/foundation/Button';
import { Toggle } from '../../../components/ds/forms/Toggle';
import { Input } from '../../../components/ds/forms/Input';
import { Typography } from '../../../components/ds/foundation/Typography';
import { useActionState } from '../../../infrastructure/hooks/useActionState';
import { 
  ModalStatusLoading, 
  ModalStatusSuccess, 
  ModalStatusError 
} from '../../../components/ds/feedback/ActionStatus';
import { useCM } from '../../../constants/useCM';

export default function CompactDatabaseModal() {
  const CM = useCM();
  const dispatch = useDispatch();
  const { isCompactDatabaseModalOpen } = useSelector((state) => state.databaseUI, shallowEqual);
  const { selectedDatabase } = useSelector((state) => state.database, shallowEqual);
  const { selectedHostUid } = useSelector((state) => state.host, shallowEqual);
  const { 
    error, 
    startAction, 
    endSuccess, 
    endError, 
    resetAction,
    isLoading,
    isSuccess,
    isError
  } = useActionState();
  const { runJob } = useCmsJob();
  const [jobStatus, setJobStatus] = useState(null);

  const [verbose, setVerbose] = useState(false);

  useEffect(() => {
    if (isCompactDatabaseModalOpen) {
      setVerbose(false);
      resetAction();
    }
  }, [isCompactDatabaseModalOpen, resetAction]);

  if (!isCompactDatabaseModalOpen) return null;

  const handleCompact = async () => {
    if (!selectedHostUid || !selectedDatabase) return;
    
    startAction();
    try {
      const payload = {
        verbose: verbose ? 'y' : 'n'
      };
      const job = await runJob(
        () => databaseJobApi.submitCompact(selectedHostUid, selectedDatabase, payload),
        { onProgress: (j) => setJobStatus(j.jobStatus ?? j.status) }
      );
      const log = job?.result?.log;
      endSuccess(log || CM.optimizationComplete);
    } catch (err) {
      endError(typeof err === 'string' ? err : err.message || CM.compactionFailed);
    }
  };

  const handleClose = () => {
    dispatch(closeCompactDatabaseModal());
    resetAction();
  };

  if (isLoading) {
    return (
      <Modal isOpen title={CM.dynamicCompaction} icon="compress" onClose={handleClose} maxWidth="480px">
        <ModalStatusLoading
          title={CM.consolidatingBlocks}
          subtitle={getCmsJobLoadingSubtitle(selectedDatabase, jobStatus, CM)}
        />
      </Modal>
    );
  }

  if (isSuccess) {
    return (
      <Modal isOpen title={CM.dynamicCompaction} icon="compress" iconVariant="success" onClose={handleClose} maxWidth="480px">
        <ModalStatusSuccess 
          title={CM.optimizationComplete}
          message={selectedDatabase}
          onConfirm={handleClose}
          confirmText={CM.ok}
        />
      </Modal>
    );
  }

  if (isError) {
    return (
      <Modal isOpen title={CM.dynamicCompaction} icon="compress" iconVariant="danger" onClose={resetAction} maxWidth="480px">
        <ModalStatusError 
          title={CM.compactionFailed}
          error={error}
          onRetry={handleCompact}
          onCancel={resetAction}
          retryText={CM.retryOptimization}
          cancelText={CM.dismiss}
        />
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isCompactDatabaseModalOpen}
      onClose={handleClose}
      title={CM.dynamicCompaction}
      subtitle={CM.compactDatabaseMessage}
      icon="compress"
      maxWidth="480px"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={handleClose}>
            {CM.discard}
          </Button>
          <Button variant="primary" onClick={handleCompact} icon="play_circle" className="min-w-[140px]">
            {CM.executeCompaction}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <CaDialogGroup title={CM.database}>
          <CaDialogFieldGrid labelWidth="130px">
            <CaDialogField label={CM.compactDatabaseName}>
              <Input
                value={selectedDatabase || ''}
                disabled
                icon="database"
              />
            </CaDialogField>
            <CaDialogField fullWidth>
              <Toggle
                checked={verbose}
                onChange={setVerbose}
                label={CM.verboseMonitoring}
              />
            </CaDialogField>
          </CaDialogFieldGrid>
        </CaDialogGroup>

        <CaDialogGroup title={CM.compactDescriptionInformation}>
          <Typography variant="p" className="text-[12px] leading-relaxed text-slate-600 dark:text-slate-400">
            {CM.compactDatabaseDescription}
          </Typography>
        </CaDialogGroup>
      </div>
    </Modal>
  );
}
