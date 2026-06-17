import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeBackupDatabaseModal, backupDatabase, fetchBackupDbInfo } from '../databaseSlice';

import { Modal } from '../../../components/ds/layout/Modal';
import {
  CaDialogField,
  CaDialogFieldGrid,
  CaDialogTable,
  CaDialogTabs,
} from '../../../components/ds/layout/CaDialogLayout';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Select } from '../../../components/ds/forms/Select';
import { Checkbox } from '../../../components/ds/forms/Checkbox';
import { Typography } from '../../../components/ds/foundation/Typography';
import { useActionState } from '../../../infrastructure/hooks/useActionState';
import { 
  ModalStatusLoading, 
  ModalStatusSuccess, 
  ModalStatusError 
} from '../../../components/ds/feedback/ActionStatus';
import { useCM } from '../../../constants/useCM';

const TAB_INFO = 'info';
const TAB_HISTORY = 'history';

const formatBackupDate = (value) => {
  if (!value) return '-';
  const parts = String(value).split('.');
  if (parts.length === 5) {
    return `${parts[0]}.${parts[1]}.${parts[2]} ${parts[3]}:${parts[4]}`;
  }
  return value;
};

const formatBackupSize = (value) => {
  const size = Number(value);
  if (!Number.isFinite(size)) return '-';
  return (size / 1024 / 1024).toLocaleString(undefined, { maximumFractionDigits: 2 });
};

export default function BackupDatabaseModal() {
  const CM = useCM();
  const dispatch = useDispatch();
  const { isBackupDatabaseModalOpen } = useSelector((state) => state.databaseUI, shallowEqual);
  const { selectedDatabase } = useSelector((state) => state.database, shallowEqual);
  const { backupDbInfo: databaseBackupInfo } = useSelector((state) => state.databaseOperation, shallowEqual);
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

  const [formData, setFormData] = useState({
    volPath: `${selectedDatabase}_backup_lv0`,
    backupLevel: '0',
    backupDir: '',
    parallelBackup: '0',
    checkConsistency: true,
    deleteUnnecessary: false,
    compress: true
  });
  const [activeTab, setActiveTab] = useState(TAB_INFO);

  const backupInfo = selectedDatabase ? databaseBackupInfo[selectedDatabase] : null;
  const backupHistory = useMemo(() => {
    if (!backupInfo) return [];
    return [0, 1, 2].flatMap((level) => {
      const entries = backupInfo[`level${level}`];
      return Array.isArray(entries)
        ? entries.map((entry, index) => ({
          ...entry,
          rowKey: `${level}-${entry.path || index}`,
          level: `Level${level}`,
          date: formatBackupDate(entry.date || entry.data),
          size: formatBackupSize(entry.size),
          path: entry.path || '-',
        }))
        : [];
    });
  }, [backupInfo]);

  const availableLevels = useMemo(() => {
    const levels = ['0'];
    if (backupHistory.some((entry) => entry.level === 'Level0')) levels.push('1');
    if (backupHistory.some((entry) => entry.level === 'Level1')) levels.push('2');
    return levels;
  }, [backupHistory]);

  const backupLevelOptions = useMemo(() => (
    availableLevels.map((level) => ({ value: level, label: `Level${level}` }))
  ), [availableLevels]);

  const backupHistoryColumns = useMemo(() => [
    { header: CM.backupLevel, accessor: 'level', width: '100px' },
    { header: CM.backupDate, accessor: 'date', width: '150px' },
    { header: CM.backupSizeColumn, accessor: 'size', width: '110px' },
    { header: CM.backupPath, accessor: 'path', cellClassName: 'font-mono break-all' },
  ], [CM]);

  useEffect(() => {
    if (selectedDatabase) {
      setFormData(prev => ({ ...prev, volPath: `${selectedDatabase}_backup_lv${prev.backupLevel}` }));
      if (isBackupDatabaseModalOpen && selectedHostUid) {
        dispatch(fetchBackupDbInfo({ hostUid: selectedHostUid, dbname: selectedDatabase }));
      }
    }
  }, [selectedDatabase, isBackupDatabaseModalOpen, selectedHostUid, dispatch]);

  useEffect(() => {
    if (backupInfo) {
      const { dbdir } = backupInfo;
      if (dbdir && !formData.backupDir) {
        setFormData(prev => ({ ...prev, backupDir: dbdir }));
      }
    }
  }, [backupInfo, formData.backupDir]);

  useEffect(() => {
    if (!availableLevels.includes(formData.backupLevel)) {
      const nextLevel = availableLevels[availableLevels.length - 1] || '0';
      setFormData(prev => ({
        ...prev,
        backupLevel: nextLevel,
        volPath: selectedDatabase ? `${selectedDatabase}_backup_lv${nextLevel}` : prev.volPath
      }));
    }
  }, [availableLevels, formData.backupLevel, selectedDatabase]);

  useEffect(() => {
    if (isBackupDatabaseModalOpen) {
      resetAction();
      setActiveTab(TAB_INFO);
    }
  }, [isBackupDatabaseModalOpen, resetAction]);

  if (!isBackupDatabaseModalOpen) return null;

  const handleInputChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleLevelChange = (level) => {
    setFormData(prev => ({
      ...prev,
      backupLevel: level,
      volPath: selectedDatabase ? `${selectedDatabase}_backup_lv${level}` : prev.volPath
    }));
  };

  const handleBackup = async () => {
    if (!formData.volPath || !formData.backupDir) {
      endError("Volume path and Backup directory are required.");
      return;
    }

    startAction();
    try {
      const payload = {
        level: formData.backupLevel,
        volname: formData.volPath,
        backupdir: formData.backupDir,
        removelog: formData.deleteUnnecessary ? 'y' : 'n',
        check: formData.checkConsistency ? 'y' : 'n',
        mt: formData.parallelBackup,
        zip: formData.compress ? 'y' : 'n',
        safereplication: 'n'
      };
      await dispatch(backupDatabase({ hostUid: selectedHostUid, dbname: selectedDatabase, payload })).unwrap();
      endSuccess(`Database "${selectedDatabase}" has been successfully backed up to "${formData.backupDir}".`);
    } catch (err) {
      endError(err);
    }
  };

  const handleClose = () => dispatch(closeBackupDatabaseModal());

  const flags = [
    { field: 'checkConsistency', label: CM.checkDatabaseConsistency },
    { field: 'deleteUnnecessary', label: CM.deleteArchivedLogs },
    { field: 'compress', label: CM.compressBackupVolume },
  ];

  const backupInfoContent = (
    <CaDialogFieldGrid>
      <CaDialogField label={CM.backupDatabaseNameLabel}>
        <Input
          value={selectedDatabase || ''}
          disabled
          icon="database"
        />
      </CaDialogField>

      <CaDialogField label={CM.volumeNameCol}>
        <Input
          value={formData.volPath}
          onChange={(e) => handleInputChange('volPath', e.target.value)}
        />
      </CaDialogField>

      <CaDialogField label={CM.backupLevel}>
        <Select
          value={formData.backupLevel}
          onChange={(e) => handleLevelChange(e.target.value)}
          options={backupLevelOptions}
        />
      </CaDialogField>

      <CaDialogField label={CM.backupDirectory}>
        <Input
          value={formData.backupDir}
          onChange={(e) => handleInputChange('backupDir', e.target.value)}
        />
      </CaDialogField>

      <CaDialogField label={CM.parallelThreads}>
        <Input
          type="number"
          value={formData.parallelBackup}
          onChange={(e) => handleInputChange('parallelBackup', e.target.value)}
        />
      </CaDialogField>

      <CaDialogField fullWidth>
        <div className="space-y-2 pt-1">
          {flags.map((opt) => (
            <Checkbox
              key={opt.field}
              checked={formData[opt.field]}
              onChange={(e) => handleInputChange(opt.field, e.target.checked)}
              label={opt.label}
            />
          ))}
        </div>
      </CaDialogField>
    </CaDialogFieldGrid>
  );

  const backupHistoryContent = (
    <div className="space-y-3">
      <Typography variant="p" className="text-[12px] text-slate-600 dark:text-slate-400">
        {CM.backupHistoryListHint}
      </Typography>
      <CaDialogTable
        columns={backupHistoryColumns}
        data={backupHistory}
        emptyMessage={CM.noBackupRecords}
      />
    </div>
  );

  const tabs = [
    { id: TAB_INFO, label: CM.backupInformation, content: backupInfoContent },
    { id: TAB_HISTORY, label: CM.backupHistoryInformation, content: backupHistoryContent },
  ];

  if (isLoading) {
    return (
      <Modal isOpen title={CM.backupDatabase} icon="backup" onClose={handleClose} maxWidth="720px" showCloseButton={false}>
        <ModalStatusLoading 
          title={CM.snapshotInProgress} 
          subtitle={selectedDatabase} 
        />
      </Modal>
    );
  }

  if (isSuccess) {
    return (
      <Modal isOpen title={CM.backupCompleted} icon="backup" iconVariant="success" onClose={handleClose} maxWidth="720px">
        <ModalStatusSuccess 
          title={CM.snapshotSecured}
          message={`A complete backup of ${selectedDatabase} has been written to: ${formData.backupDir}.`}
          onConfirm={handleClose}
          confirmText={CM.ok}
        />
      </Modal>
    );
  }

  if (isError) {
    return (
      <Modal isOpen title={CM.backupFailed} icon="backup" iconVariant="danger" onClose={resetAction} maxWidth="720px">
        <ModalStatusError 
          title={CM.operationInterrupted}
          error={error}
          onRetry={handleBackup}
          onCancel={resetAction}
          retryText={CM.retryBackup}
          cancelText={CM.dismiss}
        />
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isBackupDatabaseModalOpen}
      onClose={handleClose}
      title={CM.backupDatabase}
      icon="backup"
      maxWidth="720px"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={handleClose}>{CM.cancel}</Button>
          <Button variant="primary" onClick={handleBackup} icon="play_circle" className="min-w-[140px]">
            {CM.ok}
          </Button>
        </div>
      }
    >
      <CaDialogTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
    </Modal>
  );
}
