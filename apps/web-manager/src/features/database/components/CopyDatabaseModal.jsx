import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeCopyDatabaseModal, copyDatabase } from '../databaseSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Checkbox } from '../../../components/ds/forms/Checkbox';
import { Divider } from '../../../components/ds/layout/Divider';
import { Typography } from '../../../components/ds/foundation/Typography';

export default function CopyDatabaseModal() {
  const dispatch = useDispatch();
  const { isCopyDatabaseModalOpen, selectedDatabase, actionLoading, error: sliceError } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);
  
  const [formData, setFormData] = useState({
    destName: '',
    destPath: '/home/cubrid/CUBRID/databases/',
    extPath: '/home/cubrid/CUBRID/databases/',
    logPath: '/home/cubrid/CUBRID/databases/',
    replaceExisting: false,
    deleteSource: false
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (sliceError) {
      setError(sliceError);
    }
  }, [sliceError]);

  if (!isCopyDatabaseModalOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCopy = () => {
    if (!formData.destName) {
      setError("Please provide a destination database name.");
      return;
    }
    
    setError(null);
    const payload = {
      srcdbname: selectedDatabase,
      destname: formData.destName,
      destpath: formData.destPath,
      expath: formData.extPath,
      logpath: formData.logPath,
      replace: formData.replaceExisting ? 'y' : 'n',
      unlink: formData.deleteSource ? 'y' : 'n'
    };

    dispatch(copyDatabase({ hostUid: selectedHostUid, payload }));
  };

  const footer = (
    <>
      <Button 
        variant="ghost" 
        onClick={() => dispatch(closeCopyDatabaseModal())}
        disabled={actionLoading}
      >
        Discard changes
      </Button>
      <Button 
        onClick={handleCopy}
        loading={actionLoading}
        icon="content_copy"
        className="min-w-[140px]"
      >
        Run clone
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isCopyDatabaseModalOpen}
      onClose={() => dispatch(closeCopyDatabaseModal())}
      title="Duplicate database"
      subtitle="Clone volumes and migrating metadata..."
      icon="content_copy"
      maxWidth="max-w-[620px]"
      footer={footer}
    >
      <div className="space-y-6">
        {/* Section: Source Selection */}
        <section className="space-y-4">
          <Divider label="Input mapping" />
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50/50 dark:bg-bk-main/20 border border-slate-100 dark:border-white/5 rounded-2xl">
            <div className="space-y-1.5">
              <Typography variant="caption" className="text-slate-500 font-medium ml-1">Source database</Typography>
              <div className="h-9 px-3 flex items-center bg-slate-100 dark:bg-bk-main/40 border border-slate-200 dark:border-white/5 rounded-xl text-[11px] font-bold text-slate-400 dark:text-slate-600 truncate cursor-not-allowed">
                {selectedDatabase}
              </div>
            </div>
            <div className="space-y-1.5">
              <Typography variant="caption" className="text-slate-500 font-medium ml-1">Source volume root</Typography>
              <div className="h-9 px-3 flex items-center bg-slate-100 dark:bg-bk-main/40 border border-slate-200 dark:border-white/5 rounded-xl text-[11px] font-bold text-slate-400 dark:text-slate-600 truncate cursor-not-allowed">
                {`/home/cubrid/databases/${selectedDatabase}`}
              </div>
            </div>
          </div>
        </section>

        {/* Section: Destination Configuration */}
        <section className="space-y-4">
          <Divider label="Destination profile" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <Input 
              label="New database name"
              placeholder="e.g. clone_db"
              value={formData.destName}
              onChange={(e) => handleInputChange('destName', e.target.value)}
            />
            <Input 
              label="New volume root"
              value={formData.destPath}
              onChange={(e) => handleInputChange('destPath', e.target.value)}
            />
            <Input 
              label="Extent volume root"
              value={formData.extPath}
              onChange={(e) => handleInputChange('extPath', e.target.value)}
            />
            <Input 
              label="New log root"
              value={formData.logPath}
              onChange={(e) => handleInputChange('logPath', e.target.value)}
            />
          </div>
        </section>

        {/* Section: Diagnostics & Migration Flags */}
        <section className="space-y-4">
          <Divider label="Capacity & Flags" />
          
          <div className="flex items-center justify-between p-5 bg-bk-yellow/5 border border-bk-yellow/10 rounded-2xl">
            <div className="space-y-1">
              <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium">Available capacity</Typography>
              <div className="flex items-baseline gap-1.5">
                <Typography variant="h2" className="text-xl font-mono text-slate-700 dark:text-slate-200">232,420</Typography>
                <Typography variant="caption" className="text-slate-400">MB (Free)</Typography>
              </div>
            </div>
            <div className="w-px h-10 bg-bk-yellow/20"></div>
            <div className="space-y-1 text-right">
              <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium">Database footprint</Typography>
              <div className="flex items-baseline gap-1.5 justify-end">
                <Typography variant="h2" className="text-xl font-mono text-rose-500">128</Typography>
                <Typography variant="caption" className="text-rose-500/60 font-medium">MB (Required)</Typography>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 p-5 bg-slate-50/50 dark:bg-bk-main/20 border border-slate-100 dark:border-white/5 rounded-2xl">
            <Checkbox 
              label="Replace existing database" 
              checked={formData.replaceExisting}
              onChange={(e) => handleInputChange('replaceExisting', e.target.checked)}
            />
            <Checkbox 
              label="Unlink source database" 
              checked={formData.deleteSource}
              onChange={(e) => handleInputChange('deleteSource', e.target.checked)}
            />
          </div>
        </section>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-rose-500 animate-in slide-in-from-top-1 duration-200">
          <Icon name="error" size="sm" />
          <Typography variant="p" className="text-[11px] font-medium">{error}</Typography>
        </div>
      )}
    </Modal>
  );
}
