import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeCompactDatabaseModal } from '../databaseSlice';
import { databaseApi } from '../databaseApi';
import { showStatusModal } from '../../layout/layoutSlice';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Input } from '../../../components/ds/forms/Input';
import { Checkbox } from '../../../components/ds/forms/Checkbox';
import { Typography } from '../../../components/ds/foundation/Typography';

export default function CompactDatabaseModal() {
  const dispatch = useDispatch();
  const { isCompactDatabaseModalOpen, selectedDatabase } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);
  const [verbose, setVerbose] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isCompactDatabaseModalOpen) return null;

  const handleCompact = async () => {
    if (!selectedHostUid || !selectedDatabase) return;
    
    setLoading(true);
    setError(null);
    try {
      const payload = {
        verbose: verbose ? 'y' : 'n'
      };
      const response = await databaseApi.compactDatabase(selectedHostUid, selectedDatabase, payload);
      
      dispatch(closeCompactDatabaseModal());
      dispatch(showStatusModal({
        type: 'success',
        title: 'Compaction success',
        message: response.note || 'Database compaction completed successfully.'
      }));
    } catch (err) {
      setError(err.response?.data?.note || err.response?.data?.message || 'Database compaction failed. Ensure no other maintenance tasks are running.');
    } finally {
      setLoading(false);
    }
  };

  const pipelineSteps = [
    { label: 'OID Truncation', desc: 'Remove unused object references', icon: 'auto_fix_normal' },
    { label: 'Metadata Pruning', desc: 'Clean stale internal metadata', icon: 'dataset' },
    { label: 'Block Consolidation', desc: 'Merge fragmented disk pages', icon: 'grid_view' },
  ];

  return (
    <Modal
      isOpen={isCompactDatabaseModalOpen}
      onClose={() => dispatch(closeCompactDatabaseModal())}
      title="Dynamic Storage Compaction"
      icon="compress"
      maxWidth="480px"
      loading={loading}
      error={error}
      onErrorRetry={handleCompact}
      onErrorClose={() => setError(null)}
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={() => dispatch(closeCompactDatabaseModal())} disabled={loading}>
            Discard
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCompact} 
            loading={loading}
            icon="play_circle"
          >
            Execute Compaction
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Target */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-bk-yellow"></div>
            <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-[0.2em]">Maintenance Target</Typography>
          </div>
          <Input 
            label="Database Identifier"
            value={selectedDatabase}
            disabled
            icon="database"
          />
        </div>

        {/* Pipeline Steps */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-bk-yellow"></div>
            <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-[0.2em]">Optimization Pipeline</Typography>
          </div>

          <div className="bg-slate-50/50 dark:bg-bk-main/30 border border-slate-100 dark:border-white/5 rounded-2xl p-4 space-y-0">
            {pipelineSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-4 group">
                {/* Step indicator column */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-8 h-8 rounded-xl bg-bk-yellow/10 border border-bk-yellow/20 flex items-center justify-center text-bk-yellow shadow-xs group-hover:shadow-[0_0_12px_rgba(255,215,0,0.15)] transition-shadow">
                    <Icon name={step.icon} size="xs" weight={300} />
                  </div>
                  {i < pipelineSteps.length - 1 && (
                    <div className="w-px h-6 bg-linear-to-b from-bk-yellow/30 to-transparent my-1"></div>
                  )}
                </div>
                {/* Content */}
                <div className={`flex-1 ${i < pipelineSteps.length - 1 ? 'pb-4' : 'pb-0'}`}>
                  <div className="flex items-center gap-2.5">
                    <Typography variant="caption" className="font-black text-bk-yellow/40 tabular-nums">0{i + 1}</Typography>
                    <Typography variant="p" className="font-bold text-slate-900 dark:text-white text-[11.5px] tracking-tight">{step.label}</Typography>
                  </div>
                  <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium mt-0.5">{step.desc}</Typography>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verbose Toggle */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-bk-yellow"></div>
            <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-[0.2em]">Execution Options</Typography>
          </div>

          <div 
            className={`flex items-center gap-4 p-4 border rounded-2xl transition-all cursor-pointer select-none ${verbose ? 'bg-bk-yellow/4 border-bk-yellow/20 shadow-[0_2px_16px_rgba(255,188,4,0.06)]' : 'bg-white dark:bg-white/2 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10'}`}
            onClick={() => setVerbose(!verbose)}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all shrink-0 ${verbose ? 'bg-bk-yellow/10 border-bk-yellow/20 text-bk-yellow' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400'}`}>
              <Icon name="terminal" size="xs" weight={300} />
            </div>
            <div className="flex-1 min-w-0">
              <Typography variant="p" className={`font-bold text-[11.5px] tracking-tight transition-colors ${verbose ? 'text-bk-yellow' : 'text-slate-900 dark:text-white'}`}>
                Verbose Monitoring
              </Typography>
              <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium mt-0.5 leading-snug">
                Stream real-time OID transformation logs for post-mortem auditing
              </Typography>
            </div>
            <div className="shrink-0">
              <Checkbox 
                className="w-fit!"
                checked={verbose}
                onChange={(e) => setVerbose(e.target.checked)}
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
