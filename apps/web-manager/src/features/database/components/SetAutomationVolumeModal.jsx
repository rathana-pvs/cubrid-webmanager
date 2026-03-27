import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeSetAutomationVolumeModal, fetchAutoVolumeConfig, updateAutoVolumeConfig } from '../databaseSlice';
import { showStatusModal } from '../../layout/layoutSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Checkbox } from '../../../components/ds/forms/Checkbox';
import { Input } from '../../../components/ds/forms/Input';
import { Typography } from '../../../components/ds/foundation/Typography';

export default function SetAutomationVolumeModal() {
  const dispatch = useDispatch();
  const { isSetAutomationVolumeModalOpen, selectedDatabase, autoVolumeConfig, autoVolumeLoading } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);
  
  // Data Settings
  const [dataEnabled, setDataEnabled] = useState(false);
  const [dataThreshold, setDataThreshold] = useState(15);
  const [dataAddSize, setDataAddSize] = useState(2048);
  
  // Index Settings
  const [indexEnabled, setIndexEnabled] = useState(false);
  const [indexThreshold, setIndexThreshold] = useState(15);
  const [indexAddSize, setIndexAddSize] = useState(2048);

  useEffect(() => {
    if (isSetAutomationVolumeModalOpen && selectedHostUid && selectedDatabase) {
      dispatch(fetchAutoVolumeConfig({ hostUid: selectedHostUid, dbname: selectedDatabase }));
    }
  }, [isSetAutomationVolumeModalOpen, selectedHostUid, selectedDatabase, dispatch]);

  useEffect(() => {
    const config = autoVolumeConfig[selectedDatabase];
    if (config) {
      setDataEnabled(config.data === 'ON');
      setDataThreshold(config.data_warn_outofspace ? Math.round(parseFloat(config.data_warn_outofspace) * 100) : 15);
      setDataAddSize(config.data_ext_page ? (parseInt(config.data_ext_page) * 16384 / 1024 / 1024) : 2048);
      
      setIndexEnabled(config.index === 'ON');
      setIndexThreshold(config.index_warn_outofspace ? Math.round(parseFloat(config.index_warn_outofspace) * 100) : 15);
      setIndexAddSize(config.index_ext_page ? (parseInt(config.index_ext_page) * 16384 / 1024 / 1024) : 2048);
    }
  }, [autoVolumeConfig, selectedDatabase]);


  if (!isSetAutomationVolumeModalOpen) return null;

  const handleSave = async () => {
    const payload = {
      data: dataEnabled ? 'ON' : 'OFF',
      data_warn_outofspace: (dataThreshold / 100).toFixed(2),
      data_ext_page: Math.floor(dataAddSize * 1024 * 1024 / 16384).toString(),
      index: indexEnabled ? 'ON' : 'OFF',
      index_warn_outofspace: (indexThreshold / 100).toFixed(2),
      index_ext_page: Math.floor(indexAddSize * 1024 * 1024 / 16384).toString()
    };

    const result = await dispatch(updateAutoVolumeConfig({ 
      hostUid: selectedHostUid, 
      dbname: selectedDatabase, 
      payload 
    }));


    if (!result.error) {
      dispatch(closeSetAutomationVolumeModal());
      dispatch(showStatusModal({
        type: 'success',
        title: 'Policy Applied',
        message: `Automation policies for ${selectedDatabase} have been successfully updated.`
      }));
    }
  };

  const ConfigGroup = ({ title, icon, enabled, setEnabled, threshold, setThreshold, addSize, setAddSize }) => (
    <div className="space-y-4 p-4 bg-slate-50/50 dark:bg-bk-main/20 border border-slate-100 dark:border-white/5 rounded-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-bk-yellow/10 flex items-center justify-center border border-bk-yellow/20">
            <Icon name={icon} size="sm" weight={300} className="text-bk-yellow" />
          </div>
          <Typography variant="p" className="text-[12px] font-bold text-slate-700 dark:text-slate-200">{title}</Typography>
        </div>
        <Checkbox 
          checked={enabled} 
          onChange={(e) => setEnabled(e.target.checked)} 
          className="scale-90"
        />
      </div>

      <div className={`space-y-4 transition-all duration-300 ${enabled ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
        <div className="space-y-2">
          <div className="flex justify-between items-center px-0.5">
            <Typography variant="caption" className="font-medium text-slate-500">Trigger threshold</Typography>
            <Typography variant="caption" className="font-bold text-bk-yellow">{threshold}%</Typography>
          </div>
          <input 
            type="range" min="5" max="30" step="1"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-full accent-bk-yellow h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Expansion size (MB)"
            type="number" 
            value={addSize}
            onChange={(e) => setAddSize(e.target.value)}
            placeholder="Size in MB"
          />
          <div className="space-y-1.5">
            <Typography variant="caption" className="text-slate-500 font-medium ml-1">Extension pages</Typography>
            <div className="h-9 px-3 flex items-center bg-slate-100 dark:bg-bk-main/40 border border-slate-200 dark:border-slate-800/50 rounded-xl text-[11px] font-bold text-slate-500 dark:text-slate-400 italic">
              {Math.floor(addSize * 1024 * 1024 / 16384)} pts
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const footer = (
    <>
      <Button 
        variant="ghost" 
        onClick={() => dispatch(closeSetAutomationVolumeModal())}
      >
        Discard
      </Button>
      <Button 
        onClick={handleSave}
        loading={autoVolumeLoading}
        icon="save"
        className="px-8"
      >
        Apply policy
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isSetAutomationVolumeModalOpen}
      onClose={() => dispatch(closeSetAutomationVolumeModal())}
      title="Set automation volume"
      subtitle={selectedDatabase?.toUpperCase()}
      icon="settings_suggest"
      maxWidth="max-w-[480px]"
      footer={footer}
    >
      <div className="space-y-4">
        <div className="p-3 bg-bk-yellow/5 border border-bk-yellow/10 rounded-xl flex gap-3">
          <Icon name="info" size="sm" weight={300} className="text-bk-yellow" />
          <Typography variant="p" className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
            Configure automatic volume expansion for Data and Index storage. Thresholds define when new volumes should be created.
          </Typography>
        </div>

        <div className="space-y-4 relative">
          {autoVolumeLoading && (
            <div className="absolute inset-0 z-10 bg-white/60 dark:bg-bk-side/60 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
               <div className="flex flex-col items-center gap-2">
                 <Icon name="refresh" size="sm" weight={300} className="animate-spin text-bk-yellow text-2xl" />
                 <Typography variant="caption" className="font-bold text-slate-500 uppercase tracking-widest">Fetching policy...</Typography>
               </div>
            </div>
          )}

          <ConfigGroup 
            title="Data parameters" 
            icon="database" 
            enabled={dataEnabled} setEnabled={setDataEnabled}
            threshold={dataThreshold} setThreshold={setDataThreshold}
            addSize={dataAddSize} setAddSize={setDataAddSize}
          />

          <ConfigGroup 
            title="Index parameters" 
            icon="list_alt" 
            enabled={indexEnabled} setEnabled={setIndexEnabled}
            threshold={indexThreshold} setThreshold={setIndexThreshold}
            addSize={indexAddSize} setAddSize={setIndexAddSize}
          />
        </div>
      </div>
    </Modal>
  );
}
