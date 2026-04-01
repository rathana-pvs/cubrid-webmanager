import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { hostApi } from '../../host/hostApi';
import { showStatusModal, setTabDirty } from '../../layout/layoutSlice';
import { Icon } from '../../../components/ds/foundation/Icon';
import { Spinner } from '../../../components/ds/foundation/Spinner';

export default function CubridConfigEditor({ hostUid, confname }) {
  const tabId = `edit_config:${hostUid}:${confname}`;
  const dispatch = useDispatch();
  const { hosts } = useSelector((state) => state.host, shallowEqual);
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
      const joined = lines.join('\n');
      setContent(joined);
      setOriginalContent(joined);
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
        message: `${confname} has been updated successfully.`
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

  const renderHighlighted = () =>
    content.split('\n').map((line, i) => {
      const t = line.trim();
      if (t.startsWith('#'))
        return <span key={i} className="text-slate-400 dark:text-slate-500 italic">{line}{'\n'}</span>;
      if (t.startsWith('[') && t.endsWith(']'))
        return <span key={i} className="text-amber-600 dark:text-bk-yellow font-bold">{line}{'\n'}</span>;

      const eq = line.indexOf('=');
      if (eq > 0) {
        const k = line.substring(0, eq);
        const v = line.substring(eq);
        return (
          <span key={i}>
            <span className="text-sky-600 dark:text-sky-400">{k}</span>
            <span className="text-slate-500 dark:text-slate-400">{v}</span>
            {'\n'}
          </span>
        );
      }
      return <span key={i}>{line}{'\n'}</span>;
    });

  const lines = content.split('\n');

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-bk-main overflow-hidden font-sans transition-colors">

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-2.5 bg-white dark:bg-bk-side border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 z-10">

        {/* Left: identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
            <Icon name="settings_applications" size="sm" weight={300} className="text-amber-600 dark:text-bk-yellow" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 leading-tight truncate">Config Editor: {confname}</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">{hostDisplayName}</p>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Undo */}
          <button
            onClick={handleUndo}
            disabled={!hasChanges || loading || saving}
            title="Undo changes"
            className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
          >
            <Icon name="undo" size="sm" weight={300} />
          </button>

          {/* Refresh */}
          <button
            onClick={fetchConfig}
            disabled={loading || saving}
            title="Refresh config"
            className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-amber-600 dark:hover:text-bk-yellow disabled:opacity-30 transition-colors"
          >
            <Icon name="refresh" size="sm" weight={300} className={loading ? 'animate-spin' : ''} />
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          {/* Modified badge */}
          {hasChanges && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 mr-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Modified</span>
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving || loading}
            title="Save changes"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-bold text-white dark:text-slate-900 bg-slate-800 dark:bg-bk-yellow hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {saving ? <Spinner size="xs" className="text-white dark:text-slate-900" /> : <Icon name="save" size="sm" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-100 dark:bg-black/20">

        {loading ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-20">
                <Spinner size="lg" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 animate-pulse">Loading Configuration...</span>
             </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Inner Header */}
            <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-white dark:bg-bk-side border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-400">
                <Icon name="description" size="sm" weight={300} />
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-mono">{confname}</span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 font-mono uppercase tracking-widest">
                {lines.length} lines
              </span>
            </div>

            {/* Editor Container */}
            <div className="flex-1 relative overflow-hidden bg-white dark:bg-[#0D1117]">
              {/* Line Numbers */}
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-slate-50 dark:bg-white/3 border-r border-slate-100 dark:border-white/5 overflow-hidden pointer-events-none z-10">
                <div className="p-0 pt-6 flex flex-col items-end pr-3">
                  {lines.map((_, i) => (
                    <span key={i} className="text-[12px] font-mono text-slate-300 dark:text-slate-700 leading-relaxed select-none h-[25.2px]">
                      {i + 1}
                    </span>
                  ))}
                </div>
              </div>

              {/* Highlight layer */}
              <pre
                ref={preRef}
                className="absolute inset-0 left-12 p-6 font-mono text-[12.5px] leading-relaxed text-slate-800 dark:text-slate-300 pointer-events-none whitespace-pre-wrap break-all overflow-hidden"
                aria-hidden="true"
              >
                {renderHighlighted()}
              </pre>

              {/* Edit layer */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onScroll={syncScroll}
                spellCheck="false"
                className="absolute inset-0 left-12 w-[calc(100%-3rem)] h-full bg-transparent p-6 font-mono text-[12.5px] leading-relaxed text-transparent caret-slate-800 dark:caret-bk-yellow outline-none resize-none whitespace-pre-wrap break-all overflow-auto"
                placeholder="# Enter configuration variables here..."
              />
            </div>

            {/* Footer */}
            <div className="shrink-0 px-4 py-2 bg-white dark:bg-bk-side border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">
              <span>UTF-8 | LF</span>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Source Editor
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
