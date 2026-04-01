import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { hostApi } from '../../host/hostApi';
import { showStatusModal, setTabDirty } from '../../layout/layoutSlice';
import { Icon } from '../../../components/ds/foundation/Icon';
import { Spinner } from '../../../components/ds/foundation/Spinner';
import { Input } from '../../../components/ds/forms/Input';
import { SearchInput } from '../../../components/ds/forms/SearchInput';
import { Toggle } from '../../../components/ds/forms/Toggle';

// ── Parse config text into structured rows ─────────────────────────────────
function parseConfig(text) {
  const rows = [];
  let currentSection = '';
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const t = raw.trim();
    if (t === '') {
      rows.push({ lineIdx: i, type: 'blank', raw });
    } else if (t.startsWith('#')) {
      rows.push({ lineIdx: i, type: 'comment', raw, text: t });
    } else if (t.startsWith('[') && t.endsWith(']')) {
      currentSection = t.slice(1, -1);
      rows.push({ lineIdx: i, type: 'section', raw, section: currentSection });
    } else {
      const eq = t.indexOf('=');
      if (eq > 0) {
        const key = t.substring(0, eq).trim();
        const val = t.substring(eq + 1).trim();
        rows.push({ lineIdx: i, type: 'entry', raw, key, val, section: currentSection, originalVal: val });
      } else {
        rows.push({ lineIdx: i, type: 'unknown', raw });
      }
    }
  }
  return rows;
}

// ── Serialize structured rows back to text ─────────────────────────────────
function serializeConfig(rows) {
  return rows.map(r => {
    if (r.type === 'entry') {
      const indent = r.raw.match(/^(\s*)/)[1];
      return `${indent}${r.key}=${r.val}`;
    }
    return r.raw;
  }).join('\n');
}

// ── Type-sniff a value for smart rendering ─────────────────────────────────
function sniffType(val) {
  if (val === 'yes' || val === 'no' || val === 'ON' || val === 'OFF') return 'bool';
  if (/^\d+$/.test(val)) return 'int';
  return 'string';
}

// ── Inline Cell Editor ─────────────────────────────────────────────────────
const CellEditor = React.memo(function CellEditor({ row, onSave }) {
  const t = sniffType(row.val);
  const [val, setVal] = useState(row.val);

  useEffect(() => setVal(row.val), [row.val]);

  const isYesNo = row.val === 'yes' || row.val === 'no';

  if (t === 'bool') {
    const isActive = val === 'yes' || val === 'ON';
    return (
      <Toggle
        checked={isActive}
        onChange={(checked) => {
          const next = isYesNo ? (checked ? 'yes' : 'no') : (checked ? 'ON' : 'OFF');
          setVal(next);
          onSave(row.lineIdx, next);
        }}
      />
    );
  }

  if (t === 'int') {
    return (
      <Input
        type="number"
        size="sm"
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={() => onSave(row.lineIdx, val)}
        onKeyDown={e => e.key === 'Enter' && onSave(row.lineIdx, val)}
        inputClassName="font-mono w-32"
      />
    );
  }

  return (
    <Input
      type="text"
      size="sm"
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={() => onSave(row.lineIdx, val)}
      onKeyDown={e => e.key === 'Enter' && onSave(row.lineIdx, val)}
      inputClassName="font-mono min-w-[180px]"
    />
  );
});

// ── Highlighted Source View ────────────────────────────────────────────────
function renderHighlighted(content) {
  return content.split('\n').map((line, i) => {
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
}

// ── Main Component ─────────────────────────────────────────────────────────
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
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'source'
  const [search, setSearch] = useState('');

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
      dispatch(showStatusModal({ type: 'error', title: 'Fetch failed', message: 'Could not retrieve configuration file contents.' }));
    } finally {
      setLoading(false);
    }
  }, [hostUid, confname, dispatch, tabId]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const markDirty = useCallback((newContent) => {
    setContent(newContent);
    setHasChanges(newContent !== originalContent);
    dispatch(setTabDirty({ tabId, isDirty: newContent !== originalContent }));
  }, [originalContent, dispatch, tabId]);

  const handleSourceChange = (e) => markDirty(e.target.value);

  const handleUndo = () => {
    setContent(originalContent);
    setHasChanges(false);
    dispatch(setTabDirty({ tabId, isDirty: false }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { confname, confdata: content.split('\n') };
      await hostApi.setHostConfig(hostUid, payload);
      setOriginalContent(content);
      setHasChanges(false);
      dispatch(setTabDirty({ tabId, isDirty: false }));
      dispatch(showStatusModal({ type: 'success', title: 'Config saved', message: `${confname} has been updated successfully.` }));
    } catch (err) {
      dispatch(showStatusModal({ type: 'error', title: 'Save failed', message: err.response?.data?.message || 'An error occurred while saving.' }));
    } finally {
      setSaving(false);
    }
  };

  const syncScroll = (e) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.target.scrollTop;
      preRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  // Parse structured rows from content
  const parsedRows = useMemo(() => parseConfig(content), [content]);

  // Stats
  const entryCount = useMemo(() => parsedRows.filter(r => r.type === 'entry').length, [parsedRows]);
  const sectionCount = useMemo(() => parsedRows.filter(r => r.type === 'section').length, [parsedRows]);
  const modifiedCount = useMemo(() => 
    parsedRows.filter(r => r.type === 'entry' && r.val !== r.originalVal).length, 
    [parsedRows]
  );

  // Handle inline cell edits
  const handleCellSave = useCallback((lineIdx, newVal) => {
    const newRows = parsedRows.map(r =>
      r.lineIdx === lineIdx && r.type === 'entry' ? { ...r, val: newVal } : r
    );
    markDirty(serializeConfig(newRows));
  }, [parsedRows, markDirty]);

  // Filtered rows for table view
  const filteredEntries = useMemo(() => {
    const q = search.toLowerCase();
    return parsedRows.filter(r =>
      r.type === 'entry' && (
        !q || r.key.toLowerCase().includes(q) || r.val.toLowerCase().includes(q) || (r.section || '').toLowerCase().includes(q)
      )
    );
  }, [parsedRows, search]);

  const lineCount = content.split('\n').length;

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
        <div className="flex items-center gap-1.5 shrink-0">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded-lg p-0.5 mr-1">
            {[
              { mode: 'table', icon: 'table_rows', label: 'Table' },
              { mode: 'source', icon: 'code', label: 'Source' },
            ].map(({ mode, icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                title={`${label} view`}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all
                  ${viewMode === mode
                    ? 'bg-white dark:bg-white/10 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200 dark:border-white/10'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
              >
                <Icon name={icon} size="12px" />
                {label}
              </button>
            ))}
          </div>

          {/* Undo */}
          <button
            onClick={handleUndo}
            disabled={!hasChanges || loading || saving}
            title="Undo all changes"
            className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
          >
            <Icon name="undo" size="sm" weight={300} />
          </button>

          {/* Refresh */}
          <button
            onClick={fetchConfig}
            disabled={loading || saving}
            title="Reload config"
            className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-amber-600 dark:hover:text-bk-yellow disabled:opacity-30 transition-colors"
          >
            <Icon name="refresh" size="sm" weight={300} className={loading ? 'animate-spin' : ''} />
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

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
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <Spinner size="lg" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 animate-pulse">Loading Configuration...</span>
          </div>
        ) : viewMode === 'table' ? (

          /* ══ TABLE VIEW ══════════════════════════════════════════════════════ */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Sub-header: stats + search */}
            <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-white dark:bg-bk-side border-b border-slate-200 dark:border-slate-800 gap-3">
              {/* Stats chips */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/8 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  <Icon name="tune" size="11px" />
                  {entryCount} params
                </div>
                {sectionCount > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/8 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    <Icon name="folder_open" size="11px" />
                    {sectionCount} sections
                  </div>
                )}
                {modifiedCount > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                    {modifiedCount} modified
                  </div>
                )}
              </div>

              {/* Search */}
              <SearchInput
                value={search}
                onChange={setSearch}
                onClear={() => setSearch('')}
                placeholder="Filter parameters..."
                className="w-52"
              />
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              {filteredEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-400 dark:text-slate-600">
                  <Icon name="search_off" size="28px" weight={200} />
                  <span className="text-[11px] font-medium">No matching parameters</span>
                </div>
              ) : (
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="sticky top-0 z-10 bg-slate-50 dark:bg-[#0D1117] border-b border-slate-200 dark:border-white/5">
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 w-8">#</th>
                      {sectionCount > 0 && (
                        <th className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 w-36">Section</th>
                      )}
                      <th className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Parameter</th>
                      <th className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 w-16">Type</th>
                      <th className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((row, idx) => {
                      const type = sniffType(row.val);
                      const isModified = row.val !== row.originalVal;
                      return (
                        <tr
                          key={row.lineIdx}
                          className={`group border-b border-slate-100 dark:border-white/4 transition-colors
                            ${row.lineIdx % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50/60 dark:bg-white/[0.015]'}
                            ${isModified ? 'outline outline-1 outline-amber-400/30' : ''}
                            hover:bg-amber-50/40 dark:hover:bg-amber-500/5`}
                        >
                          {/* Row number */}
                          <td className="px-4 py-2 text-[10px] text-slate-300 dark:text-slate-700 font-mono select-none">
                            {row.lineIdx + 1}
                          </td>

                          {/* Section */}
                          {sectionCount > 0 && (
                            <td className="px-3 py-2">
                              {row.section ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 text-[9px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wide">
                                  {row.section}
                                </span>
                              ) : null}
                            </td>
                          )}

                          {/* Key */}
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              {isModified && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Modified" />
                              )}
                              <span className="font-mono font-semibold text-sky-700 dark:text-sky-400 text-[12px] leading-none">
                                {row.key}
                              </span>
                            </div>
                          </td>

                          {/* Type badge */}
                          <td className="px-3 py-2">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide
                              ${type === 'bool' ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-500 border border-violet-200 dark:border-violet-500/20'
                                : type === 'int' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                                : 'bg-slate-100 dark:bg-white/5 text-slate-400 border border-slate-200 dark:border-white/8'}`}>
                              {type}
                            </span>
                          </td>

                          {/* Value – inline editable */}
                          <td className="px-3 py-1.5">
                            <CellEditor row={row} onSave={handleCellSave} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Table Footer */}
            <div className="shrink-0 px-4 py-1.5 bg-white dark:bg-bk-side border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              <span>
                {search ? `${filteredEntries.length} of ${entryCount} params` : `${entryCount} params · ${lineCount} lines total`}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Table View
              </div>
            </div>
          </div>

        ) : (

          /* ══ SOURCE VIEW ═════════════════════════════════════════════════════ */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Inner Header */}
            <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-white dark:bg-bk-side border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-400">
                <Icon name="description" size="sm" weight={300} />
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-mono">{confname}</span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 font-mono uppercase tracking-widest">
                {lineCount} lines
              </span>
            </div>

            {/* Editor Container */}
            <div className="flex-1 relative overflow-hidden bg-white dark:bg-[#0D1117]">
              {/* Line Numbers */}
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-slate-50 dark:bg-white/3 border-r border-slate-100 dark:border-white/5 overflow-hidden pointer-events-none z-10">
                <div className="p-0 pt-6 flex flex-col items-end pr-3">
                  {content.split('\n').map((_, i) => (
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
                {renderHighlighted(content)}
              </pre>

              {/* Edit layer */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleSourceChange}
                onScroll={syncScroll}
                spellCheck="false"
                className="absolute inset-0 left-12 w-[calc(100%-3rem)] h-full bg-transparent p-6 font-mono text-[12.5px] leading-relaxed text-transparent caret-slate-800 dark:caret-bk-yellow outline-none resize-none whitespace-pre-wrap break-all overflow-auto"
                placeholder="# Configuration content..."
              />
            </div>

            {/* Source Footer */}
            <div className="shrink-0 px-4 py-2 bg-white dark:bg-bk-side border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">
              <span>UTF-8 | LF</span>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                Source Editor
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
