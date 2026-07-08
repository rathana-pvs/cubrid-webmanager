import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { hostApi } from '../../host/hostApi';
import { showStatusModal, setTabDirty } from '../../layout/layoutSlice';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Icon } from '../../../components/ds/foundation/Icon';
import { Spinner } from '../../../components/ds/foundation/Spinner';
import { useCM } from '../../../constants/useCM';

import ConfigEditorToolbar from './broker/ConfigEditorToolbar';
import ConfigSourceEditor from './broker/ConfigSourceEditor';

export default function BrokerConfigEditor({ hostUid }) {
  const CM = useCM();
  const tabId = `broker_config:${hostUid}`;
  const dispatch = useDispatch();
  const { hosts } = useSelector((state) => state.host, shallowEqual);
  const currentHost = hosts.find(h => h.uid === hostUid);
  const hostDisplayName = currentHost ? (currentHost.alias || currentHost.id) : CM.unknownHost;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Source View State
  const [rawContent, setRawContent] = useState('');
  const [originalRawContent, setOriginalRawContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const response = await hostApi.getHostConfig(hostUid, 'cubrid_broker.conf');
      const lines = response?.conflist?.[0]?.confdata || [];
      
      const content = lines.join('\n');
      setRawContent(content);
      setOriginalRawContent(content);
      setHasChanges(false);
      dispatch(setTabDirty({ tabId, isDirty: false }));
    } catch (err) {
      console.error('Failed to fetch broker config:', err);
      dispatch(showStatusModal({
        type: 'error',
        title: CM.fetchFailed,
        message: CM.brokerConfigRetrieveError
      }));
    } finally {
      setLoading(false);
    }
  }, [hostUid, dispatch, tabId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSourceChange = (e) => {
    setRawContent(e.target.value);
    setHasChanges(e.target.value !== originalRawContent);
    dispatch(setTabDirty({ tabId, isDirty: e.target.value !== originalRawContent }));
  };

  const handleUndo = () => {
    setRawContent(originalRawContent);
    setHasChanges(false);
    dispatch(setTabDirty({ tabId, isDirty: false }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const confdata = rawContent.split('\n');
      const payload = {
        confname: 'cubrid_broker.conf',
        confdata: confdata
      };

      await hostApi.setHostConfig(hostUid, payload);
      
      setOriginalRawContent(rawContent);
      setHasChanges(false);
      dispatch(setTabDirty({ tabId, isDirty: false }));
      dispatch(showStatusModal({
        type: 'success',
        title: CM.configSaved,
        message: CM.brokerConfigSaveSuccess
      }));
    } catch (err) {
      dispatch(showStatusModal({
        type: 'error',
        title: CM.saveFailed,
        message: CM.brokerConfigSaveError
      }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-bk-main overflow-hidden font-sans transition-colors">
      <ConfigEditorToolbar 
        hostDisplayName={hostDisplayName}
        hasChanges={hasChanges}
        loading={loading}
        saving={saving}
        handleUndo={handleUndo}
        fetchConfig={fetchConfig}
        handleSave={handleSave}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col relative bg-slate-100 dark:bg-black/20">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <Spinner size="lg" />
            <Typography variant="overline" className="text-slate-600 dark:text-bk-yellow tracking-widest animate-pulse">{CM.initializingEditor}</Typography>
          </div>
        ) : (
          <ConfigSourceEditor 
            rawContent={rawContent}
            handleSourceChange={handleSourceChange}
          />
        )}
      </div>
      
      {/* Bottom hint bar */}
      <div className="px-6 py-2 bg-white dark:bg-bk-side border-t border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]"></span>
              <Typography variant="caption" className="text-slate-500 dark:text-slate-400 font-medium leading-none">{CM.brokerConfig}</Typography>
            </div>
         </div>
         <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium tracking-tight">
           {CM.brokerConfigFile}
         </Typography>
      </div>
    </div>
  );
}
