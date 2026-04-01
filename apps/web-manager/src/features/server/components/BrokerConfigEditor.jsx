import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { hostApi } from '../../host/hostApi';
import { showStatusModal, setTabDirty } from '../../layout/layoutSlice';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Icon } from '../../../components/ds/foundation/Icon';
import { Spinner } from '../../../components/ds/foundation/Spinner';

import ConfigEditorToolbar from './broker/ConfigEditorToolbar';
import ConfigTableEditor from './broker/ConfigTableEditor';
import ConfigSourceEditor from './broker/ConfigSourceEditor';

export default function BrokerConfigEditor({ hostUid }) {
  const tabId = `broker_config:${hostUid}`;
  const dispatch = useDispatch();
  const { hosts } = useSelector((state) => state.host, shallowEqual);
  const currentHost = hosts.find(h => h.uid === hostUid);
  const hostDisplayName = currentHost ? (currentHost.alias || currentHost.id) : 'unknown host';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'source'
  
  // Table View State
  const [sections, setSections] = useState([]); 
  const [allPropertyKeys, setAllPropertyKeys] = useState([]); 
  const [originalSections, setOriginalSections] = useState([]);
  const [originalPropertyKeys, setOriginalPropertyKeys] = useState([]);
  const [selectedCell, setSelectedCell] = useState({ row: null, col: null });

  // Source View State
  const [rawContent, setRawContent] = useState('');
  const [originalRawContent, setOriginalRawContent] = useState('');

  const [hasChanges, setHasChanges] = useState(false);

  const parseConfig = (lines) => {
    const parsedSections = [];
    let currentSection = null;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        currentSection = { name: trimmed, properties: {} };
        parsedSections.push(currentSection);
      } else if (currentSection && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim();
        currentSection.properties[key.trim()] = value;
      }
    });

    // Extract section name as BROKER_NAME
    parsedSections.forEach(sec => {
      sec.properties['BROKER_NAME'] = sec.name;
    });

    const keys = new Set();
    keys.add('BROKER_NAME');
    parsedSections.forEach(sec => {
      Object.keys(sec.properties).forEach(k => {
        if (k !== 'BROKER_NAME') keys.add(k);
      });
    });

    setSections(parsedSections);
    setAllPropertyKeys(Array.from(keys));
    setOriginalSections(JSON.parse(JSON.stringify(parsedSections)));
    setOriginalPropertyKeys(Array.from(keys));
  };

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const response = await hostApi.getHostConfig(hostUid, 'cubrid_broker.conf');
      const lines = response?.conflist?.[0]?.confdata || [];
      
      const content = lines.join('\n');
      setRawContent(content);
      setOriginalRawContent(content);
      
      parseConfig(lines);
      setHasChanges(false);
      dispatch(setTabDirty({ tabId, isDirty: false }));
    } catch (err) {
      console.error('Failed to fetch broker config:', err);
      dispatch(showStatusModal({ 
        type: 'error', 
        title: 'Fetch failed', 
        message: 'Could not retrieve broker configuration.' 
      }));
    } finally {
      setLoading(false);
    }
  }, [hostUid, dispatch, tabId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleValueChange = (sectionIndex, key, newValue) => {
    const newSections = JSON.parse(JSON.stringify(sections));
    newSections[sectionIndex].properties[key] = newValue;
    
    if (key === 'BROKER_NAME') {
      newSections[sectionIndex].name = newValue;
    }
    
    setSections(newSections);
    setHasChanges(true);
    dispatch(setTabDirty({ tabId, isDirty: true }));
  };

  const handleKeyChange = (oldKey, newKey) => {
    if (oldKey === newKey) return;
    
    // Update allPropertyKeys
    const newKeys = allPropertyKeys.map(k => k === oldKey ? newKey : k);
    setAllPropertyKeys(newKeys);

    // Update keys in sections
    const newSections = sections.map(sec => {
      const val = sec.properties[oldKey];
      const newProps = { ...sec.properties };
      delete newProps[oldKey];
      if (newKey !== "") newProps[newKey] = val;
      return { ...sec, properties: newProps };
    });
    setSections(newSections);
    setHasChanges(true);
    dispatch(setTabDirty({ tabId, isDirty: true }));
  };

  const handleAddProperty = () => {
    const newKey = `new_property_${allPropertyKeys.length}`;
    setAllPropertyKeys([...allPropertyKeys, newKey]);
    setHasChanges(true);
    dispatch(setTabDirty({ tabId, isDirty: true }));
    
    // Focus the new property name input
    setTimeout(() => {
      const input = document.getElementById(`property-name-${newKey}`);
      if (input) {
        input.focus();
        input.select();
      }
    }, 50);
  };

  const handleSourceChange = (e) => {
    setRawContent(e.target.value);
    setHasChanges(true);
    dispatch(setTabDirty({ tabId, isDirty: true }));
  };

  const handleUndo = () => {
    if (viewMode === 'table') {
      setSections(JSON.parse(JSON.stringify(originalSections)));
      setAllPropertyKeys([...originalPropertyKeys]);
    } else {
      setRawContent(originalRawContent);
    }
    setHasChanges(false);
    dispatch(setTabDirty({ tabId, isDirty: false }));
    setSelectedCell({ row: null, col: null });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let confdata = [];
      if (viewMode === 'table') {
        sections.forEach((sec, idx) => {
          if (idx > 0) confdata.push("");
          confdata.push(sec.name);
          Object.entries(sec.properties).forEach(([key, value]) => {
            if (key === 'BROKER_NAME') return; 
            confdata.push(`${key}=${value}`);
          });
        });
      } else {
        confdata = rawContent.split('\n');
      }

      const payload = {
        confname: 'cubrid_broker.conf',
        confdata: confdata
      };

      await hostApi.setHostConfig(hostUid, payload);
      
      // Update originals after successful save
      if (viewMode === 'table') {
        setOriginalSections(JSON.parse(JSON.stringify(sections)));
        setOriginalPropertyKeys([...allPropertyKeys]);
        setOriginalRawContent(confdata.join('\n'));
        setRawContent(confdata.join('\n'));
      } else {
        setOriginalRawContent(rawContent);
        setOriginalSections(JSON.parse(JSON.stringify(sections))); 
        setOriginalPropertyKeys([...allPropertyKeys]);
        parseConfig(confdata);
      }

      setHasChanges(false);
      dispatch(setTabDirty({ tabId, isDirty: false }));
      dispatch(showStatusModal({ 
        type: 'success', 
        title: 'Config saved', 
        message: 'Broker configuration updated successfully.' 
      }));
    } catch (err) {
      dispatch(showStatusModal({ 
        type: 'error', 
        title: 'Save failed', 
        message: 'An error occurred while saving broker configuration.' 
      }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-bk-main overflow-hidden font-sans transition-colors">
      <ConfigEditorToolbar 
        hostDisplayName={hostDisplayName}
        viewMode={viewMode}
        setViewMode={setViewMode}
        hasChanges={hasChanges}
        loading={loading}
        saving={saving}
        handleUndo={handleUndo}
        fetchConfig={fetchConfig}
        handleSave={handleSave}
        handleAddProperty={handleAddProperty}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col relative bg-slate-100 dark:bg-black/20">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <Spinner size="lg" />
            <Typography variant="overline" className="text-slate-600 dark:text-bk-yellow tracking-widest animate-pulse">Initializing Editor...</Typography>
          </div>
        ) : (
          viewMode === 'table' ? (
            <ConfigTableEditor 
              sections={sections}
              allPropertyKeys={allPropertyKeys}
              selectedCell={selectedCell}
              setSelectedCell={setSelectedCell}
              handleKeyChange={handleKeyChange}
              handleValueChange={handleValueChange}
            />
          ) : (
            <ConfigSourceEditor 
              rawContent={rawContent}
              handleSourceChange={handleSourceChange}
            />
          )
        )}
      </div>
      
      {/* Bottom hint bar */}
      <div className="px-6 py-2 bg-white dark:bg-bk-side border-t border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]"></span>
              <Typography variant="caption" className="text-slate-500 dark:text-slate-400 font-medium leading-none">Broker Alias</Typography>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]"></span>
              <Typography variant="caption" className="text-slate-500 dark:text-slate-400 font-medium leading-none">Active Cell</Typography>
            </div>
         </div>
         <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium tracking-tight">
           Configuration: {sections.length} Brokers • {allPropertyKeys.length} Properties
         </Typography>
      </div>
    </div>
  );
}
