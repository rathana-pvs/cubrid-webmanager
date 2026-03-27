import React from 'react';
import { Button } from '../../../../components/ds/foundation/Button';
import { Typography } from '../../../../components/ds/foundation/Typography';
import { Icon } from '../../../../components/ds/foundation/Icon';
import { Spinner } from '../../../../components/ds/foundation/Spinner';

export default function ConfigEditorToolbar({ 
  hostDisplayName, 
  viewMode, 
  setViewMode, 
  hasChanges, 
  loading, 
  saving, 
  handleUndo, 
  fetchConfig, 
  handleSave, 
  handleAddProperty 
}) {
  return (
    <div className="flex items-center justify-between px-6 py-2 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-bk-side shadow-xs z-10 transition-colors">
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-lg bg-bk-yellow/10 flex items-center justify-center text-bk-yellow border border-bk-yellow/20">
          <Icon name="hub" size="20px"  weight={300} />
        </div>
        <div className="flex flex-col">
          <Typography variant="span" className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight">Broker Configuration</Typography>
          <Typography variant="caption" className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{hostDisplayName} / cubrid_broker.conf</Typography>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-lg border border-slate-200 dark:border-white/5">
        <button 
          onClick={() => setViewMode('table')}
          className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-md transition-all duration-200 ${
            viewMode === 'table' 
              ? 'bg-white dark:bg-white/10 text-bk-yellow shadow-xs border border-slate-200 dark:border-white/10' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border border-transparent'
          }`}
        >
          <Icon name="table_chart" size="14px"  weight={300} />
          Table Editor
        </button>
        <button 
          onClick={() => setViewMode('source')}
          className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-md transition-all duration-200 ${
            viewMode === 'source' 
              ? 'bg-white dark:bg-white/10 text-bk-yellow shadow-xs border border-slate-200 dark:border-white/10' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border border-transparent'
          }`}
        >
          <Icon name="code" size="14px"  weight={300} />
          Source View
        </button>
      </div>

      <div className="flex items-center gap-2">
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
          {viewMode === 'table' && (
            <Button
              variant="secondary"
              size="xs"
              icon="add_box"
              onClick={handleAddProperty}
              className="text-[11px]"
            >
              Add Property
            </Button>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-white/5 mx-1"></div>

        {hasChanges && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-amber-500/10 border border-amber-500/20 mr-1 animate-pulse">
            <span className="size-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
            <Typography variant="span" className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-tighter">Modified</Typography>
          </div>
        )}
        
        <Button 
          variant="primary"
          size="xs"
          icon={saving ? null : "check_circle"}
          onClick={handleSave}
          disabled={!hasChanges || saving || loading}
          className="text-[11px] font-bold min-w-[140px]"
        >
          {saving && <Spinner size="xs" color="bk-side" className="mr-1.5" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
