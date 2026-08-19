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
import { Checkbox } from '../../../components/ds/forms/Checkbox';
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
  const { selectedDatabase, activeDatabases } = useSelector((state) => state.database, shallowEqual);
  const { selectedHostUid } = useSelector((state) => state.host, shallowEqual);
  const isActive = selectedDatabase && activeDatabases.includes(selectedDatabase);
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
  const [dbuser, setDbuser] = useState('dba');
  const [dbpasswd, setDbpasswd] = useState('');

  useEffect(() => {
    if (isCompactDatabaseModalOpen) {
      setVerbose(false);
      setDbuser('dba');
      setDbpasswd('');
      resetAction();
    }
  }, [isCompactDatabaseModalOpen, resetAction]);

  if (!isCompactDatabaseModalOpen) return null;

  const handleCompact = async () => {
    if (!selectedHostUid || !selectedDatabase) return;

    // CMS authorizes compactdb against a per-connection credential cache
    // populated by dbmtuserlogin — required whenever the database is
    // online (see database-management.service.ts's loginIfCredentialsProvided).
    if (isActive && !dbuser.trim()) {
      endError(CM.dbUserRequiredWhileOnlineMsg);
      return;
    }

    startAction();
    try {
      const payload = {
        verbose: verbose ? 'y' : 'n',
        ...(isActive && { dbuser: dbuser.trim(), dbpasswd }),
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
          onBackground={handleClose}
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
      testId="compact-database"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button data-testid="compact-database-cancel-btn" variant="secondary" onClick={handleClose}>
            {CM.cancel}
          </Button>
          <Button data-testid="compact-database-run-btn" variant="primary" onClick={handleCompact} icon="play_circle" className="min-w-[140px]">
            {CM.ok}
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
                size="sm"
              />
            </CaDialogField>
            <CaDialogField fullWidth>
              <Checkbox
                checked={verbose}
                onChange={(e) => setVerbose(e.target.checked)}
                label={CM.verboseMonitoring}
              />
            </CaDialogField>
            {isActive && (
              <>
                <CaDialogField label={CM.userName}>
                  <Input data-testid="compact-database-dbuser-input" value={dbuser} onChange={(e) => setDbuser(e.target.value)} icon="account_circle" size="sm" />
                </CaDialogField>
                <CaDialogField label={CM.password}>
                  <Input data-testid="compact-database-dbpasswd-input" type="password" value={dbpasswd} onChange={(e) => setDbpasswd(e.target.value)} icon="password" size="sm" placeholder={CM.emptyAllowedPlaceholder} />
                </CaDialogField>
              </>
            )}
          </CaDialogFieldGrid>
        </CaDialogGroup>

        <CaDialogGroup title={CM.compactDescriptionInformation}>
          <Typography variant="p" className="text-[12px] leading-relaxed whitespace-pre-line text-slate-600 dark:text-slate-400">
            {CM.compactDatabaseDescription}
          </Typography>
        </CaDialogGroup>
      </div>
    </Modal>
  );
}
