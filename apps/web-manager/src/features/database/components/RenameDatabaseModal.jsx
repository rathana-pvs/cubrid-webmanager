import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeRenameDatabaseModal, renameDatabase, fetchDatabaseStartInfo } from '../databaseSlice';
import { showStatusModal } from '../../layout/layoutSlice';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import ErrorOverlay from '../../../components/common/ErrorOverlay';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Checkbox } from '../../../components/ds/forms/Checkbox';
import { Divider } from '../../../components/ds/layout/Divider';
import { Typography } from '../../../components/ds/foundation/Typography';

export default function RenameDatabaseModal() {
  const dispatch = useDispatch();
  const { isRenameDatabaseModalOpen, selectedDatabase } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);
  
  const [newDbName, setNewDbName] = useState('');
  const [forcedel, setForcedel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isRenameDatabaseModalOpen) {
      setNewDbName('');
      setForcedel(false);
      setError(null);
    }
  }, [isRenameDatabaseModalOpen]);

  if (!isRenameDatabaseModalOpen) return null;

  const handleRename = async () => {
    if (!selectedHostUid || !selectedDatabase || !newDbName.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const payload = {
        rename: newDbName.trim(),
        exvolpath: 'none',
        advanced: 'off',
        forcedel: forcedel ? 'y' : 'n'
      };
      
      await dispatch(renameDatabase({ 
        hostUid: selectedHostUid, 
        dbname: selectedDatabase, 
        payload 
      })).unwrap();
      
      // Refresh the database list to show the new name in the tree
      dispatch(fetchDatabaseStartInfo(selectedHostUid));
      
      dispatch(showStatusModal({
        type: 'success',
        title: 'Rename successful',
        message: `Database "${selectedDatabase}" has been renamed to "${newDbName.trim()}".`
      }));
    } catch (err) {
      setError(err || 'Failed to rename database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isRenameDatabaseModalOpen}
      onClose={() => dispatch(closeRenameDatabaseModal())}
      title="Rename Database Registry"
      icon="drive_file_rename_outline"
      maxWidth="460px"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={() => dispatch(closeRenameDatabaseModal())} disabled={loading}>
            Discard
          </Button>
          <Button 
            variant="primary" 
            onClick={handleRename} 
            loading={loading}
            icon="drive_file_rename_outline"
            disabled={!newDbName.trim()}
          >
            Execute Rename
          </Button>
        </div>
      }
    >
      <div className="relative">
        <LoadingOverlay 
          isVisible={loading} 
          title="Renaming database" 
          subtitle="Migrating files and updating configuration..." 
        />
        <ErrorOverlay 
          isVisible={!!error} 
          error={error} 
          onRetry={handleRename}
          onClose={() => setError(null)}
        />

        <div className="space-y-8">
          {/* Section: current Name */}
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <Divider label="SOURCE IDENTITY" />
            <div className="px-1">
              <Input 
                label="Current Database Identifier"
                value={selectedDatabase}
                disabled
                icon="database"
              />
            </div>
          </div>

          {/* Section: New Identity */}
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <Divider label="TARGET IDENTITY" />
            
            <div className="px-1 space-y-5">
              <Input 
                label="New Database Identifier"
                value={newDbName}
                onChange={(e) => setNewDbName(e.target.value)}
                placeholder="PROD_CM_V2"
                icon="edit"
                autoFocus
                className="font-bold"
              />

              <div className="p-4 bg-bk-yellow/5 border border-bk-yellow/10 rounded-2xl flex gap-4 transition-all hover:bg-bk-yellow/10">
                <div className="w-10 h-10 rounded-xl bg-bk-yellow/10 flex items-center justify-center text-bk-yellow border border-bk-yellow/20 shrink-0">
                  <Icon name="warning" size="md" weight={300} />
                </div>
                <Typography variant="p" className="text-[11px] text-slate-500 dark:text-slate-400 italic font-medium leading-relaxed">
                  The rename operation migrates physical volumes, log files, and environmental variables. Ensure the database service is completely stopped to prevent binary corruption.
                </Typography>
              </div>

              <div 
                className={`flex items-start gap-4 p-4 border rounded-2xl transition-all group cursor-pointer ${forcedel ? 'bg-rose-500/4 border-rose-500/20 shadow-[0_4px_20px_rgba(244,63,94,0.05)]' : 'bg-slate-50/50 dark:bg-white/2 border-slate-100 dark:border-white/5 hover:bg-white/5'}`}
                onClick={() => setForcedel(!forcedel)}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all shrink-0 mt-0.5 ${forcedel ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-slate-100 dark:bg-white/5 border-transparent text-slate-400'}`}>
                  <Icon name="delete_forever" size="sm" weight={300} />
                </div>
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <Typography variant="p" className={`font-bold text-[12px] tracking-tight transition-colors ${forcedel ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                    Overwrite Existing Registry
                  </Typography>
                  <Typography variant="p" className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium leading-[1.6]">
                    Force deletion of target path directories if they currently exist to prevent initialization conflicts.
                  </Typography>
                </div>
                <div className="pt-1.5 shrink-0">
                  <Checkbox 
                    className="w-fit!"
                    checked={forcedel}
                    onChange={(e) => setForcedel(e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
