import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeAddVolumeModal, addVolume } from '../databaseSlice';
import { databaseApi } from '../databaseApi';
import { showStatusModal } from '../../layout/layoutSlice';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import ErrorOverlay from '../../../components/common/ErrorOverlay';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Select } from '../../../components/ds/forms/Select';
import { Divider } from '../../../components/ds/layout/Divider';
import { Typography } from '../../../components/ds/foundation/Typography';

const PurposeSelect = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const options = [
    { value: 'data', label: 'Data', icon: 'database', desc: 'Storage for user tables' },
    { value: 'index', label: 'Index', icon: 'list_alt', desc: 'B-tree index storage' },
    { value: 'generic', label: 'Generic', icon: 'full_stacked_bar_chart', desc: 'Balanced storage type' },
    { value: 'temp', label: 'Temporary', icon: 'timer', desc: 'Sort/query workspace' },
  ];

  const selected = options.find(opt => opt.value === value) || options[2];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-9 px-3 flex items-center justify-between bg-white dark:bg-bk-main/40 border border-slate-200 dark:border-slate-800/50 rounded-sm text-[11px] font-medium text-slate-700 dark:text-slate-200 focus:outline-hidden hover:border-bk-yellow/50 transition-all group"
      >
        <div className="flex items-center gap-2">
          <Icon name={selected.icon} size="sm" weight={300} className="text-bk-yellow/80" />
          <span>{selected.label}</span>
        </div>
        <span className={`material-symbols-outlined text-[16px] text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-bk-side border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group ${value === opt.value ? 'bg-bk-yellow/5' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-sm flex items-center justify-center border ${value === opt.value ? 'bg-bk-yellow/10 border-bk-yellow/20' : 'bg-slate-50 dark:bg-bk-main/50 border-slate-100 dark:border-slate-800'}`}>
                    <span className={`material-symbols-outlined text-[16px] ${value === opt.value ? 'text-bk-yellow' : 'text-slate-400'}`}>{opt.icon}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[11px] font-medium ${value === opt.value ? 'text-bk-yellow' : 'text-slate-700 dark:text-slate-300'}`}>{opt.label}</span>
                    <span className="text-[9px] text-slate-400 leading-tight">{opt.desc}</span>
                  </div>
                </div>
                {value === opt.value && (
                  <Icon name="check" size="sm" weight={300} className="text-bk-yellow" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function AddVolumeModal() {
  const dispatch = useDispatch();
  const { isAddVolumeModalOpen, selectedDatabase } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);

  const [volStatus, setVolStatus] = useState({ freespace: '', volpath: '' });
  const [volName, setVolName] = useState('');
  const [purpose, setPurpose] = useState('generic');
  const [path, setPath] = useState('');
  const [numberOfPages, setNumberOfPages] = useState('32768'); // Default 512MB
  const [sizeMB, setSizeMB] = useState('512.000');
  
  const [loading, setLoading] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAddVolumeModalOpen && selectedHostUid && selectedDatabase) {
      const fetchStatus = async () => {
        setFetchingStatus(true);
        setError(null);
        try {
          const response = await databaseApi.getAddVolStatus(selectedHostUid, selectedDatabase);
          setVolStatus(response);
          setPath(response.volpath || '');
        } catch (err) {
          console.error('Failed to fetch add volume status:', err);
        } finally {
          setFetchingStatus(false);
        }
      };
      fetchStatus();
      
      // Reset form
      setVolName('');
      setPurpose('generic');
      setNumberOfPages('32768');
      setSizeMB('512.000');
    }
  }, [isAddVolumeModalOpen, selectedHostUid, selectedDatabase]);


  if (!isAddVolumeModalOpen) return null;

  const handleAdd = async () => {
    if (!selectedHostUid || !selectedDatabase) return;
    
    setLoading(true);
    setError(null);
    try {
      const payload = {
        volname: volName,
        purpose,
        path,
        numberofpages: numberOfPages,
        size_need_mb: `${sizeMB}(MB)`
      };
      
      await dispatch(addVolume({ 
        hostUid: selectedHostUid, 
        dbname: selectedDatabase, 
        payload 
      })).unwrap();
      
      dispatch(showStatusModal({
        type: 'success',
        title: 'Volume added',
        message: `Successfully added "${purpose}" volume to ${selectedDatabase}.`
      }));
    } catch (err) {
      setError(err || 'Failed to add volume.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isAddVolumeModalOpen}
      onClose={() => dispatch(closeAddVolumeModal())}
      title="Add Database Volume"
      icon="add_to_drive"
      maxWidth="500px"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={() => dispatch(closeAddVolumeModal())}>
            Discard
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAdd} 
            loading={loading}
            icon="add"
            disabled={!path || !numberOfPages}
          >
            Provision Volume
          </Button>
        </div>
      }
    >
      <div className="relative">
        <LoadingOverlay 
          isVisible={loading} 
          title="Adding volume" 
          subtitle="Allocating disk space and attaching to database..." 
        />
        <ErrorOverlay 
          isVisible={!!error} 
          error={error} 
          onRetry={handleAdd}
          onClose={() => setError(null)}
        />

        <div className="space-y-8">
          {/* Section: Status */}
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <Divider label="STORAGE CAPACITY" />
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5 px-1">
                <Typography variant="label" className="text-slate-500 dark:text-slate-400 font-medium ml-1">Instance Free Space</Typography>
                <div className="h-10 px-4 flex items-center bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 rounded-2xl text-[12px] font-bold text-emerald-600 dark:text-emerald-400 shadow-xs">
                  {fetchingStatus ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                      <span className="opacity-50">Calculating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Icon name="sd_card" size="sm" weight={300} />
                      {volStatus.freespace || 'Unknown (IO Err)'}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1.5 px-1">
                <Typography variant="label" className="text-slate-500 dark:text-slate-400 font-medium ml-1">Active Database</Typography>
                <div className="h-10 px-4 flex items-center bg-bk-yellow/5 border border-bk-yellow/10 rounded-2xl text-[12px] font-bold text-bk-yellow shadow-xs">
                  <Icon name="database" size="sm" weight={300} className="mr-2" />
                  {selectedDatabase}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Configuration */}
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <Divider label="VOLUME PROVISIONING" />
            
            <div className="space-y-4 px-1">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Typography variant="label" className="text-slate-500 dark:text-slate-400 font-medium ml-1">Volume Purpose</Typography>
                  <PurposeSelect value={purpose} onChange={setPurpose} />
                </div>
                <Input 
                  label="Display Label"
                  value={volName}
                  onChange={(e) => setVolName(e.target.value)}
                  placeholder="e.g. DATA_VOL_PROD_1"
                  icon="label"
                />
              </div>

              <Input 
                label="System Storage Path"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/var/lib/cubrid/volumes"
                icon="folder_zip"
              />

              <div className="grid grid-cols-2 gap-6 items-end">
                <Input 
                  type="number"
                  label="Allocation Size (MB)"
                  value={sizeMB}
                  onChange={(e) => {
                    const mb = e.target.value;
                    setSizeMB(mb);
                    const pages = Math.floor((parseFloat(mb) || 0) * 1024 / 16);
                    setNumberOfPages(pages.toString());
                  }}
                  icon="straighten"
                />
                <div className="space-y-1.5 group">
                  <Typography variant="label" className="text-slate-500 dark:text-slate-400 font-medium ml-1">Computed Index Pages</Typography>
                  <div className="h-10 px-4 flex items-center justify-between bg-slate-50/50 dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-2xl text-[12px] font-mono font-bold text-bk-yellow shadow-inner group-hover:border-bk-yellow/20 transition-all">
                    <span>{parseInt(numberOfPages).toLocaleString()}</span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-sans">Units</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-bk-yellow/5 border border-bk-yellow/10 rounded-2xl flex gap-4 transition-all hover:bg-bk-yellow/10">
              <div className="w-10 h-10 rounded-xl bg-bk-yellow/10 flex items-center justify-center text-bk-yellow border border-bk-yellow/20 shrink-0">
                <Icon name="info" size="md" weight={300} />
              </div>
              <Typography variant="p" className="text-[11px] text-slate-500 dark:text-slate-400 italic font-medium leading-relaxed">
                Scaled volumes allow dynamic expansion without downtime. Ensure the target directory has sufficient write permissions for the CUBRID instance owner.
              </Typography>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
