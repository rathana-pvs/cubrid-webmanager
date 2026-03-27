import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hostApi } from '../../host/hostApi';
import { showStatusModal, setTabDirty } from '../../layout/layoutSlice';
import { Button } from '../../../components/ds/foundation/Button';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Icon } from '../../../components/ds/foundation/Icon';
import { Spinner } from '../../../components/ds/foundation/Spinner';

export default function CubridConfigEditor({ hostUid, confname }) {
  const tabId = `edit_config:${hostUid}:${confname}`;
  const dispatch = useDispatch();
  const { hosts } = useSelector((state) => state.host);
  const currentHost = hosts.find(h => h.uid === hostUid);
  const hostDisplayName = currentHost ? (currentHost.alias || currentHost.id) : 'unknown host';
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const textareaRef = useRef(null);
  const preRef = useRef(null);

  const fetchConfig = useCallback(async () => {
    if (!hostUid || !confname) return;
    setLoading(true);
    try {
      const response = await hostApi.getHostConfig(hostUid, confname);
      const lines = response?.conflist?.[0]?.confdata || [];
      setContent(lines.join('\n'));
      setOriginalContent(lines.join('\n'));
      setHasChanges(false);
      dispatch(setTabDirty({ tabId, isDirty: false }));
    } catch (err) {
      console.error('Failed to fetch config:', err);
      dispatch(showStatusModal({ 
        type: 'error', 
        title: 'Fetch failed', 
        message: 'Could not retrieve configuration file contents.' 
      }));
    } finally {
      setLoading(false);
    }
  }, [hostUid, confname, dispatch, tabId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleContentChange = (e) => {
    setContent(e.target.value);
    setHasChanges(true);
    dispatch(setTabDirty({ tabId, isDirty: true }));
  };

  const syncScroll = (e) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.target.scrollTop;
      preRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  const handleUndo = () => {
    setContent(originalContent);
    setHasChanges(false);
    dispatch(setTabDirty({ tabId, isDirty: false }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        confname: confname,
        confdata: content.split('\n')
      };
      await hostApi.setHostConfig(hostUid, payload);
      setOriginalContent(content);
      setHasChanges(false);
      dispatch(setTabDirty({ tabId, isDirty: false }));
      dispatch(showStatusModal({ 
        type: 'success', 
        title: 'Config saved', 
        message: 'The configuration file has been updated successfully.' 
      }));
    } catch (err) {
      console.error('Failed to save config:', err);
      dispatch(showStatusModal({ 
        type: 'error', 
        title: 'Save failed', 
        message: err.response?.data?.message || err.response?.data?.error || 'An error occurred while saving the configuration.' 
      }));
    } finally {
      setSaving(false);
    }
  };

  const renderHighlightedContent = () => {
    return content.split('\n').map((line, i) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('#')) {
        return <span key={i} className="text-slate-400 dark:text-slate-500 italic opacity-80">{line}{'\n'}</span>;
      }
      if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
        return <span key={i} className="text-bk-yellow font-bold">{line}{'\n'}</span>;
      }
      return <span key={i}>{line}{'\n'}</span>;
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-bk-main overflow-hidden font-sans transition-colors">
      {/* ToolBar */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-bk-side shadow-xs">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-bk-yellow/10 flex items-center justify-center border border-bk-yellow/20">
            <Icon name="settings_applications" size="20px" className="text-bk-yellow"  weight={300} />
          </div>
          <div className="flex flex-col">
            <Typography variant="span" className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight">Editing {confname}</Typography>
            <Typography variant="caption" className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{hostDisplayName}</Typography>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {hasChanges && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-amber-500/10 border border-amber-500/20 animate-pulse">
              <span className="size-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
              <Typography variant="span" className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-tighter">Modified</Typography>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="xs"
              icon="undo"
              onClick={handleUndo}
              disabled={!hasChanges || loading || saving}
              className="text-[11px]"
            >
              Undo
            </Button>
            <Button
              variant="secondary"
              size="xs"
              icon={loading ? null : "refresh"}
              onClick={fetchConfig}
              disabled={loading || saving}
              className="text-[11px]"
            >
              {loading && <Spinner size="xs" className="mr-1.5" />}
              Refresh
            </Button>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-white/5 mx-1"></div>

          <Button 
            variant="primary"
            size="xs"
            icon={saving ? null : "save"}
            onClick={handleSave}
            disabled={!hasChanges || saving || loading}
            className="text-[11px] font-bold min-w-[140px]"
          >
            {saving && <Spinner size="xs" color="bk-side" className="mr-1.5" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 relative overflow-hidden bg-slate-100 dark:bg-black/20 p-4">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-20">
             <Spinner size="lg" />
             <Typography variant="overline" className="text-slate-600 dark:text-bk-yellow tracking-widest animate-pulse">Loading configuration...</Typography>
          </div>
        ) : (
          <div className="h-full w-full bg-white dark:bg-[#1a1c1e] rounded-xl border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden flex flex-col ring-1 ring-black/5">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
               <div className="flex items-center gap-2">
                 <Icon name="description" size="14px" className="text-slate-400"  weight={300} />
                 <Typography variant="overline" className="text-slate-500 dark:text-slate-400">{confname}.conf</Typography>
               </div>
            </div>
            
            <div className="flex-1 relative overflow-hidden">
              {/* Syntax Highlighting Layer */}
              <pre 
                ref={preRef}
                className="absolute inset-0 p-6 font-mono text-[13px] leading-relaxed text-slate-800 dark:text-slate-300 pointer-events-none whitespace-pre-wrap break-all overflow-hidden"
                aria-hidden="true"
              >
                {renderHighlightedContent()}
              </pre>

              {/* Editing Layer */}
              <textarea 
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onScroll={syncScroll}
                spellCheck="false"
                className="absolute inset-0 w-full h-full bg-transparent p-6 font-mono text-[13px] leading-relaxed text-transparent caret-slate-800 dark:caret-bk-yellow outline-hidden resize-none custom-scrollbar whitespace-pre-wrap break-all overflow-auto"
                placeholder="# Enter configuration variables here..."
              />
            </div>

            <div className="px-4 py-2 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 flex items-center justify-between">
               <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-mono">UTF-8 | LF</Typography>
               <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-mono">Lines: {content.split('\n').length}</Typography>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
