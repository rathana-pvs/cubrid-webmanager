import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeDeleteDBModal, deleteDatabase, fetchDatabaseStartInfo } from '../databaseSlice';
import { showStatusModal } from '../../layout/layoutSlice';
import { databaseApi } from '../databaseApi';
import ModalErrorView from '../../../components/common/ModalErrorView';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Checkbox } from '../../../components/ds/forms/Checkbox';
import { Table } from '../../../components/ds/layout/Table';
import { Divider } from '../../../components/ds/layout/Divider';
import { Typography } from '../../../components/ds/foundation/Typography';

export default function DeleteDatabaseModal() {
  const dispatch = useDispatch();
  const { isDeleteDBModalOpen, selectedDatabase } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);

  const [step, setStep] = useState(1); // 1: Info, 2: Password
  const [deleteBackup, setDeleteBackup] = useState(false);
  const [volumeInfo, setVolumeInfo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dbId, setDbId] = useState('dba');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isDeleteDBModalOpen && selectedDatabase && selectedHostUid) {
      setStep(1);
      setDbId('dba');
      setPassword('');
      setError(null);
      setLoading(true);
      databaseApi.getVolumeInfo(selectedHostUid, selectedDatabase)
        .then(res => {
          if (res && res.spaceinfo) {
            const pageSize = parseInt(res.pagesize || 0);
            let activeLog = res.spaceinfo.find(s => s.type === 'Active_log');

            const mapRow = (item) => ({
              spacename: item?.name || item?.spacename || '-',
              location: item?.path || item?.location || '-',
              date: item?.date || '-',
              type: item?.type || '-',
              totalpage: item?.totalpage || '-',
              freepage: item?.freepage || '-',
              volumeSizeMB: item?.totalpage ? (((parseInt(item.totalpage) * pageSize) / (1024 * 1024)).toFixed(1)) : '-'
            });

            const newRow = {
              spacename: '\u00A0',
              location: '\u00A0',
              date: '\u00A0',
              type: '\u00A0',
              totalpage: '\u00A0',
              freepage: '\u00A0',
              volumeSizeMB: '\u00A0'
            };

            if (activeLog) {
              setVolumeInfo([mapRow(activeLog), newRow]);
            } else {
              setVolumeInfo([newRow, newRow]);
            }
          }
        })
        .catch(err => {
          console.error('Failed to fetch volume info:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isDeleteDBModalOpen, selectedDatabase, selectedHostUid]);

  const handleConfirmAction = async () => {
    if (error) {
      setError(null);
      setPassword('');
      return;
    }

    if (step === 1) {
      setStep(2);
      return;
    }

    setProcessing(true);
    try {
      const loginRes = await databaseApi.loginDatabase(selectedHostUid, selectedDatabase, {
        id: dbId,
        password: password,
      });

      if (loginRes.success || loginRes.status === 'success' || (!loginRes.error && !loginRes.code)) {
        await dispatch(deleteDatabase({
          hostUid: selectedHostUid,
          dbname: selectedDatabase,
          payload: { delbackup: deleteBackup ? 'y' : 'n' }
        })).unwrap();

        dispatch(showStatusModal({
          type: 'success',
          title: 'Success',
          message: `Delete Database - ${selectedDatabase}@${selectedDatabase} has been completed successfully`
        }));

        dispatch(fetchDatabaseStartInfo(selectedHostUid));
        handleClose();
      } else {
        throw loginRes;
      }
    } catch (err) {
      setError(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    dispatch(closeDeleteDBModal());
  };

  if (!isDeleteDBModalOpen) return null;

  const volumeColumns = [
    { header: 'Volume Name', accessor: 'spacename' },
    { header: 'Volume Path', accessor: 'location', width: '200px' },
    { header: 'Change Date', accessor: 'date' },
    { header: 'Volume Type', accessor: 'type' },
    { header: 'Total Pages', accessor: 'totalpage', className: 'text-right' },
    { header: 'Free Pages', accessor: 'freepage', className: 'text-right' },
    { header: 'Size (MB)', accessor: 'volumeSizeMB', className: 'text-right' }
  ];

  return (
    <Modal
      isOpen={isDeleteDBModalOpen}
      onClose={handleClose}
      title={step === 1 ? 'Delete database' : (error ? 'Operation failed' : 'Security verification')}
      icon="delete_forever"
      maxWidth={step === 1 ? '1024px' : '480px'}
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="flex-1">
            {step === 2 && !error && !processing && (
              <Button variant="secondary" onClick={() => setStep(1)} icon="arrow_back">
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {(step === 1 || error) && (
              <Button variant="secondary" onClick={handleClose}>
                Discard
              </Button>
            )}
            <Button 
              variant={error ? 'secondary' : (step === 1 ? 'primary' : 'primary')}
              className={!error && step === 2 ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : (step === 1 ? 'bg-rose-500 hover:bg-rose-600 text-white' : '')}
              onClick={handleConfirmAction}
              disabled={processing || loading}
              loading={processing}
              icon={error ? 'refresh' : (step === 1 ? 'arrow_forward' : 'check_circle')}
            >
              {error ? 'Try again' : (step === 1 ? 'Proceed' : 'Delete database')}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-4">
              <Divider label="Target Information" />
              <Input 
                label="Database identifier" 
                value={selectedDatabase} 
                disabled 
                icon="database"
              />
            </div>

            <div className="space-y-4">
              <Divider label="Volume Information" />
              <div className="border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden shadow-xs bg-slate-50/20 dark:bg-bk-main/10">
                <Table 
                  columns={volumeColumns}
                  data={volumeInfo.filter(v => v.spacename && v.spacename !== '\u00A0')}
                  loading={loading}
                />
              </div>
            </div>

            <div 
              className={`p-4 border rounded-2xl flex items-start gap-4 transition-all group cursor-pointer ${deleteBackup ? 'bg-rose-500/4 border-rose-500/20 shadow-[0_4px_20px_rgba(244,63,94,0.05)]' : 'bg-slate-50/50 dark:bg-white/2 border-slate-100 dark:border-white/5 hover:bg-white/5'}`}
              onClick={() => setDeleteBackup(!deleteBackup)}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all shrink-0 mt-0.5 ${deleteBackup ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-slate-100 dark:bg-white/5 border-transparent text-slate-400'}`}>
                <Icon name="folder_delete" size="sm" weight={300} />
              </div>
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <Typography variant="p" className={`font-bold text-[12px] tracking-tight transition-colors ${deleteBackup ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                  Delete backup volumes
                </Typography>
                <Typography variant="p" className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium leading-[1.6]">
                  Remove all secondary backup data and snapshot volumes associated with this database instance.
                </Typography>
              </div>
              <div className="pt-1.5 shrink-0">
                <Checkbox 
                  className="w-fit!"
                  checked={deleteBackup}
                  onChange={(e) => setDeleteBackup(e.target.checked)}
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && !error && !processing && (
          <div className="space-y-6 animate-in fade-in duration-300 py-4">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20 shadow-lg shadow-rose-500/5 mx-auto">
                <Icon name="lock" size="lg" weight={300} className="text-rose-500" />
              </div>
              <div>
                <Typography variant="h3" className="text-slate-900 dark:text-white">Authorization Required</Typography>
                <Typography variant="p" className="text-slate-500 dark:text-slate-400 mt-1">Please enter database credentials to confirm removal of <span className="text-rose-500 font-bold">{selectedDatabase}</span>.</Typography>
              </div>
            </div>

            <div className="space-y-4">
              <Input 
                label="Administrator Username"
                value={dbId}
                onChange={(e) => setDbId(e.target.value)}
                placeholder="dba"
                icon="person"
              />
              <Input 
                type="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmAction()}
                placeholder="••••••••"
                icon="key"
              />
            </div>
          </div>
        )}

        {step === 2 && processing && !error && (
          <div className="flex flex-col items-center justify-center py-12 space-y-6 min-h-[300px] animate-in fade-in duration-300">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-rose-500/10 border-t-rose-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon name="delete_sweep" size="lg" weight={200} className="text-rose-500 animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <Typography variant="h3" className="text-slate-900 dark:text-white">Deleting Database...</Typography>
              <Typography variant="p" className="text-slate-500 dark:text-slate-400">Removing volumes and erasing data assets</Typography>
            </div>
          </div>
        )}

        {error && (
          <div className="animate-in fade-in duration-300">
            <ModalErrorView error={error} />
          </div>
        )}
      </div>
    </Modal>
  );
}
