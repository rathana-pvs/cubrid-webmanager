import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeRenameDatabaseModal, fetchDatabaseStartInfo } from '../databaseSlice';
import { databaseJobApi } from '../databaseJobApi';
import { databaseApi } from '../databaseApi';
import { useCmsJob } from '../../../infrastructure/hooks/useCmsJob';
import { getCmsJobLoadingSubtitle } from '../../../infrastructure/cmsJob/cmsJobUi';

import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Radio } from '../../../components/ds/forms/Radio';
import { Checkbox } from '../../../components/ds/forms/Checkbox';
import { useActionState } from '../../../infrastructure/hooks/useActionState';
import { 
  ModalStatusLoading, 
  ModalStatusSuccess, 
  ModalStatusError 
} from '../../../components/ds/feedback/ActionStatus';
import { useCM } from '../../../constants/useCM';

const getPathSeparator = (path) => {
  if (path && path.includes('\\')) return '\\';
  return '/';
};

const getParentDirectory = (path) => {
  if (!path) return '';
  const separator = getPathSeparator(path);
  const parts = path.split(separator);
  if (parts.length <= 1) return '';
  return parts.slice(0, -1).join(separator);
};

  return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name);

const validatePath = (path) => {
  if (!path) return false;
  if (!/^[\x20-\x7E]+$/.test(path)) return false;
  if (path.includes(' ')) return false;
  if (path.startsWith('#') || path.startsWith('-')) return false;
  if (/[*&%$|^]/.test(path)) return false;
  if (path === '.' || path === '..') return false;
  return true;
};

export default function RenameDatabaseModal() {
  const CM = useCM();
  const dispatch = useDispatch();
  const { isRenameDatabaseModalOpen } = useSelector((state) => state.databaseUI, shallowEqual);
  const { selectedDatabase, databases } = useSelector((state) => state.database, shallowEqual);
  const { selectedHostUid } = useSelector((state) => state.host, shallowEqual);
  const currentDb = databases?.find((db) => db.dbname === selectedDatabase);

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

  const [newDbName, setNewDbName] = useState('');
  const [forcedel, setForcedel] = useState(false);
  const [mode, setMode] = useState('exvolpath'); // 'exvolpath' | 'advanced'
  const [exvolpath, setExvolpath] = useState('');
  const [volumes, setVolumes] = useState([]);
  const [volInfoLoading, setVolInfoLoading] = useState(false);

  const editedVolumesRef = useRef({});

  useEffect(() => {
    let cancelled = false;
    if (isRenameDatabaseModalOpen) {
      setNewDbName('');
      setForcedel(false);
      setMode('exvolpath');
      setExvolpath('');
      setVolumes([]);
      resetAction();
      editedVolumesRef.current = {};

      if (selectedHostUid && selectedDatabase) {
        setVolInfoLoading(true);
        databaseApi.getVolumeInfo(selectedHostUid, selectedDatabase)
          .then((res) => {
            if (cancelled) return;
            const validTypes = ['generic', 'data', 'index', 'temp'];
            const filteredSpaces = (res?.spaceinfo || []).filter(space =>
              space.type && validTypes.includes(space.type.toLowerCase())
            ).map(space => ({
              spacename: space.spacename,
              type: space.type,
              location: space.location,
              newVolumeName: space.spacename,
              newLocation: space.location
            }));
            setVolumes(filteredSpaces);
          })
          .catch((err) => {
            if (cancelled) return;
            console.error('Failed to fetch volume info:', err);
          })
          .finally(() => {
            if (!cancelled) {
              setVolInfoLoading(false);
            }
          });
      }
    }
    return () => {
      cancelled = true;
    };
  }, [isRenameDatabaseModalOpen, selectedHostUid, selectedDatabase, currentDb?.dbdir, resetAction]);

  useEffect(() => {
    const parentDir = getParentDirectory(currentDb?.dbdir || '');
    const separator = getPathSeparator(currentDb?.dbdir || '');
    
    if (newDbName) {
      const computedPath = parentDir ? `${parentDir}${separator}${newDbName}` : '';
      setExvolpath(computedPath);

      setVolumes(prevVolumes => {
        let count = 1;
        let changed = false;
        const nextVolumes = prevVolumes.map((vol, idx) => {
          const isMainVolume = vol.spacename === selectedDatabase;
          const isNameEdited = editedVolumesRef.current[idx]?.name;
          const isLocationEdited = editedVolumesRef.current[idx]?.location;

          let newName = vol.newVolumeName;
          if (isMainVolume) {
            newName = newDbName;
          } else if (mode === 'exvolpath' || !isNameEdited) {
            const countStr = String(count).padStart(3, '0');
            newName = `${newDbName}_x${countStr}`;
          }

          if (!isMainVolume) {
            count++;
          }

          let newLoc = vol.newLocation;
          if (mode === 'exvolpath' || !isLocationEdited) {
            newLoc = computedPath;
          }

          if (newName !== vol.newVolumeName || newLoc !== vol.newLocation) {
            changed = true;
          }

          return {
            ...vol,
            newVolumeName: newName,
            newLocation: newLoc
          };
        });
        return changed ? nextVolumes : prevVolumes;
      });
    } else {
      setExvolpath(parentDir);
      setVolumes(prevVolumes => {
        let changed = false;
        const nextVolumes = prevVolumes.map((vol, idx) => {
          const isNameEdited = editedVolumesRef.current[idx]?.name;
          const isLocationEdited = editedVolumesRef.current[idx]?.location;
          
          const newName = (mode === 'exvolpath' || !isNameEdited) ? vol.spacename : vol.newVolumeName;
          const newLoc = (mode === 'exvolpath' || !isLocationEdited) ? vol.location : vol.newLocation;

          if (newName !== vol.newVolumeName || newLoc !== vol.newLocation) {
            changed = true;
          }

          return {
            ...vol,
            newVolumeName: newName,
            newLocation: newLoc
          };
        });
        return changed ? nextVolumes : prevVolumes;
      });
    }
  }, [newDbName, selectedDatabase, currentDb?.dbdir, mode, volumes]);

  if (!isRenameDatabaseModalOpen) return null;

  const handleVolumeNameChange = (index, value) => {
    editedVolumesRef.current[index] = {
      ...editedVolumesRef.current[index],
      name: true
    };
    setVolumes(prev => prev.map((vol, idx) => {
      if (idx === index) {
        return { ...vol, newVolumeName: value };
      }
      return vol;
    }));
  };

  const handleVolumeLocationChange = (index, value) => {
    editedVolumesRef.current[index] = {
      ...editedVolumesRef.current[index],
      location: true
    };
    setVolumes(prev => prev.map((vol, idx) => {
      if (idx === index) {
        return { ...vol, newLocation: value };
      }
      return vol;
    }));
  };

  const handleRename = async () => {
    if (!selectedHostUid || !selectedDatabase || !isFormValid) return;
    startAction();
    try {
      const separator = getPathSeparator(currentDb?.dbdir || '/');
      const payload = {
        rename: newDbName.trim(),
        exvolpath: mode === 'exvolpath' ? exvolpath.trim() : 'none',
        advanced: mode === 'advanced' ? 'on' : 'off',
        forcedel: forcedel ? 'y' : 'n',
      };
      if (mode === 'advanced') {
        payload.volume = volumes.map(vol => ({
          oldPath: `${vol.location}${separator}${vol.spacename}`,
          newPath: `${vol.newLocation}${separator}${vol.newVolumeName}`
        }));
      }
      await runJob(
        () => databaseJobApi.submitRename(selectedHostUid, selectedDatabase, payload),
        { onProgress: (j) => setJobStatus(j.jobStatus ?? j.status) }
      );
      dispatch(fetchDatabaseStartInfo(selectedHostUid));
      endSuccess(CM.databaseRenamedMsg(selectedDatabase, newDbName.trim()));
    } catch (err) {
      endError(
        typeof err === 'string' ? err
          : err?.message || err?.note || CM.renameFailedMsg
      );
    }
  };

  const handleClose = () => {
    dispatch(closeRenameDatabaseModal());
    resetAction();
  };

  const isNameValid = validateDbName(newDbName);
  const isNameChanged = newDbName.trim() !== selectedDatabase;
  const isExvolpathValid = mode === 'exvolpath' ? validatePath(exvolpath) : true;
  const areVolumesValid = mode === 'advanced'
    ? volumes.length > 0 && volumes.every(vol => validateDbName(vol.newVolumeName) && validatePath(vol.newLocation))
    : true;

  const isFormValid = isNameValid && isNameChanged && isExvolpathValid && areVolumesValid;

  /* ─── LOADING view ─── */
  if (isLoading) {
    return (
      <Modal isOpen title={CM.renamingDatabase} icon="drive_file_rename_outline" onClose={handleClose} maxWidth="640px">
        <ModalStatusLoading
          title={CM.updatingIdentity}
          subtitle={getCmsJobLoadingSubtitle(selectedDatabase, jobStatus, CM)}
        />
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  if (isSuccess) {
    return (
      <Modal isOpen title={CM.renameComplete} icon="drive_file_rename_outline" iconVariant="success" onClose={handleClose} maxWidth="640px">
        <ModalStatusSuccess
          title={CM.renameSuccessful}
          message={CM.databaseRenamedMsg(selectedDatabase, newDbName.trim())}
          onConfirm={handleClose}
          confirmText={CM.ok}
        />
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (isError) {
    return (
      <Modal isOpen title={CM.renameFailed} icon="drive_file_rename_outline" iconVariant="danger" onClose={handleClose} maxWidth="640px">
        <ModalStatusError 
          title={CM.operationFailed}
          error={error}
          onRetry={handleRename}
          onCancel={handleClose}
          retryText={CM.retryRename}
          cancelText={CM.dismiss}
        />
      </Modal>
    );
  }

  /* ─── FORM view ─── */
  return (
    <Modal
      isOpen={isRenameDatabaseModalOpen}
      onClose={handleClose}
      title={CM.renameDatabase}
      icon="drive_file_rename_outline"
      maxWidth="640px"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={handleClose}>{CM.discard}</Button>
          <Button
            variant="primary"
            onClick={handleRename}
            icon="drive_file_rename_outline"
            disabled={!isFormValid || volInfoLoading}
            className="min-w-[140px]"
          >
            {CM.executeRename}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-[13px] py-2">

        {/* Downtime Warning */}
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-[12px] text-amber-700 dark:text-amber-400">
          <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">warning</span>
          <span>{CM.renameDowntimeHint}</span>
        </div>

        {/* New Database Name Row */}
        <div className="grid grid-cols-[170px_1fr] items-center gap-4">
          <label className="font-medium text-slate-700 dark:text-slate-200">
            {CM.newDatabaseName || 'New database name:'}
          </label>
          <Input
            value={newDbName}
            onChange={(e) => setNewDbName(e.target.value)}
            placeholder={`${selectedDatabase}_v2`}
            className="w-full"
            autoFocus
            error={newDbName && !validateDbName(newDbName) ? "Name must be 1-17 alphanumeric, underscore or hyphen characters" : undefined}
          />
        </div>

        {/* Extended Volume Path Row */}
        <div className="grid grid-cols-[170px_1fr] items-center gap-4">
          <div className="flex items-center">
            <Radio
              name="rename-mode"
              label={CM.extendedVolumePath}
              value="exvolpath"
              checked={mode === 'exvolpath'}
              onChange={() => setMode('exvolpath')}
            />
          </div>
          <Input
            value={exvolpath}
            onChange={(e) => setExvolpath(e.target.value)}
            placeholder="/home/cubrid/databases/demodb"
            disabled={mode !== 'exvolpath'}
            className="w-full"
            error={mode === 'exvolpath' && exvolpath && !validatePath(exvolpath) ? "Invalid path format" : undefined}
          />
        </div>

        {/* Rename Individual Volumes Radio */}
        <div className="pt-2">
          <Radio
            name="rename-mode"
            label={CM.renameIndividualVolumes}
            value="advanced"
            checked={mode === 'advanced'}
            onChange={() => setMode('advanced')}
          />
        </div>

        {/* Volume mapping table */}
        <div className={`transition-all duration-200 ${mode !== 'advanced' ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-slate-900/50">
            <div className="max-h-[220px] overflow-y-auto">
              <table className="w-full text-left text-[12px] border-collapse">
                <thead className="bg-slate-50 dark:bg-white/5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-white/10 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2">{CM.currentVolumeName}</th>
                    <th className="px-3 py-2">{CM.newVolumeName}</th>
                    <th className="px-3 py-2">{CM.currentDirectoryPath}</th>
                    <th className="px-3 py-2">{CM.newDirectoryPath}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {volInfoLoading ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-slate-400 dark:text-slate-500">
                        <div className="flex items-center justify-center gap-2">
                          <span className="animate-spin w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full" />
                          Loading...
                        </div>
                      </td>
                    </tr>
                  ) : volumes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-slate-400 dark:text-slate-500">
                        No volumes found.
                      </td>
                    </tr>
                  ) : (
                    volumes.map((vol, idx) => {
                      const isMainVolume = vol.spacename === selectedDatabase;
                      const isVolNameValid = validateDbName(vol.newVolumeName);
                      const isVolPathValid = validatePath(vol.newLocation);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/2 transition-colors">
                          <td className="px-3 py-1.5 font-medium text-slate-600 dark:text-slate-400">{vol.spacename}</td>
                          <td className="px-2 py-1">
                            <input
                              type="text"
                              value={vol.newVolumeName}
                              disabled={isMainVolume || mode !== 'advanced'}
                              onChange={(e) => handleVolumeNameChange(idx, e.target.value)}
                              className={`w-full px-2.5 py-1 bg-slate-50 dark:bg-white/3 border ${!isVolNameValid ? 'border-rose-500 focus:border-rose-500 bg-rose-500/5' : 'border-slate-200 dark:border-white/5 focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900'} rounded-lg outline-none text-[12px] font-mono transition-all text-slate-700 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                            />
                          </td>
                          <td className="px-3 py-1.5 text-slate-500 dark:text-slate-500 truncate max-w-[120px]" title={vol.location}>{vol.location}</td>
                          <td className="px-2 py-1">
                            <input
                              type="text"
                              value={vol.newLocation}
                              disabled={mode !== 'advanced'}
                              onChange={(e) => handleVolumeLocationChange(idx, e.target.value)}
                              className={`w-full px-2.5 py-1 bg-slate-50 dark:bg-white/3 border ${!isVolPathValid ? 'border-rose-500 focus:border-rose-500 bg-rose-500/5' : 'border-slate-200 dark:border-white/5 focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900'} rounded-lg outline-none text-[12px] font-mono transition-all text-slate-700 dark:text-slate-200 disabled:opacity-50`}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Force Delete Checkbox */}
        <div className="pt-2 flex flex-col gap-2">
          <Checkbox
            label={CM.forceDeleteBackupVolume}
            description={CM.forceDeleteBackupVolumeDesc}
            checked={forcedel}
            onChange={(e) => setForcedel(e.target.checked)}
          />
          {forcedel && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-[12px] text-rose-700 dark:text-rose-400">
              <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">delete_forever</span>
              <span>{CM.forceDeleteBackupVolumeWarning}</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
