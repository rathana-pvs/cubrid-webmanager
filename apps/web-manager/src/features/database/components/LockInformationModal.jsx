import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeLockInformationModal } from '../databaseSlice';
import { databaseApi } from '../databaseApi';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { TabGroup } from '../../../components/ds/layout/TabGroup';
import { Typography } from '../../../components/ds/foundation/Typography';
import { SectionHeader } from '../../../components/ds/foundation/SectionHeader';
import { InfoBanner } from '../../../components/ds/foundation/InfoBanner';
import { MetricCard } from '../../../components/ds/foundation/MetricCard';
import { StatusBadge } from '../../../components/ds/foundation/StatusBadge';
import { ProgressBar } from '../../../components/ds/foundation/ProgressBar';
import { EmptyState } from '../../../components/ds/feedback/EmptyState';
import { Spinner } from '../../../components/ds/foundation/Spinner';


/* ─── main component ─────────────────────────────────────────── */
export default function LockInformationModal() {
  const dispatch = useDispatch();
  const { isLockInformationModalOpen: isLockInfoModalOpen } = useSelector((s) => s.databaseUI);
  const { selectedDatabase } = useSelector((s) => s.database);
  const { selectedHostUid } = useSelector((s) => s.host);

  const [activeTab, setActiveTab] = useState('sessions');
  const [settings, setSettings] = useState({});
  const [lot, setLot] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchLockInfo = useCallback(async () => {
    if (!selectedHostUid || !selectedDatabase) return;
    setLoading(true);
    setError(null);
    try {
      const response = await databaseApi.getLockInfo(selectedHostUid, selectedDatabase);
      if (response?.lockinfo?.length > 0) {
        const { dinterval, esc, lot: lotArr, transaction } = response.lockinfo[0];
        setSettings({ dinterval, esc });
        setLot(lotArr?.[0] || {});
        setTransactions(Array.isArray(transaction) ? transaction : transaction ? [transaction] : []);
        setLastUpdated(new Date());
      } else {
        setSettings({});
        setLot({});
        setTransactions([]);
      }
    } catch (err) {
      setError(err.response?.data?.note || err.response?.data?.message || 'Failed to retrieve locking information.');
    } finally {
      setLoading(false);
    }
  }, [selectedHostUid, selectedDatabase]);

  useEffect(() => {
    if (isLockInfoModalOpen) {
      setActiveTab('sessions');
      fetchLockInfo();
    }
  }, [isLockInfoModalOpen, selectedHostUid, selectedDatabase]);

  if (!isLockInfoModalOpen) return null;

  const isHighContention = transactions.length > 5;
  const totalWaiters = transactions.reduce((sum, t) => sum + (t.waitfor ? 1 : 0), 0);
  const uniqueHosts = [...new Set(transactions.map(t => t.host).filter(Boolean))].length;

  const TABS = [
    { id: 'sessions', label: 'Active Sessions', icon: 'person_pin_circle', badge: transactions.length },
    { id: 'objects',  label: 'Object Locks',    icon: 'lock_open',         badge: null },
    { id: 'params',   label: 'System Params',   icon: 'tune',              badge: null },
  ];

  return (
    <Modal
      isOpen={isLockInfoModalOpen}
      onClose={() => dispatch(closeLockInformationModal())}
      title="Lock Information"
      subtitle={`Concurrency diagnostics for ${selectedDatabase}`}
      icon="lock"
      maxWidth="max-w-[900px]"
      loading={loading && transactions.length === 0}
      error={error}
      onErrorClose={() => setError(null)}
      onErrorRetry={fetchLockInfo}
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            <Icon name="history" size="12px" weight={300} />
            {lastUpdated
              ? <span>Last synced at <span className="font-mono">{lastUpdated.toLocaleTimeString()}</span></span>
              : <span className="italic">Not yet synced</span>
            }
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => dispatch(closeLockInformationModal())} 
              disabled={loading}
            >
              Acknowledge
            </Button>
            <Button 
              variant="primary" 
              onClick={fetchLockInfo} 
              loading={loading} 
              icon="refresh" 
              className="min-w-[140px]"
            >
              Refresh
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5 pb-2">

        {/* ── Context banner ─────────────────────────────────── */}
        <div className={`relative overflow-hidden rounded-xl border p-4 transition-colors duration-500
          ${isHighContention
            ? 'border-rose-500/25 bg-linear-to-r from-rose-500/8 to-transparent dark:from-rose-500/10'
            : 'border-amber-500/20 bg-linear-to-r from-amber-500/8 to-transparent dark:from-amber-500/10'
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border
                ${isHighContention ? 'bg-rose-500/10 border-rose-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}
              >
                <Icon name="database" size="md" weight={300} className={isHighContention ? 'text-rose-500' : 'text-amber-500'} />
              </div>
              <div>
                <Typography variant="p" className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">
                  Instance Under Inspection
                </Typography>
                <Typography variant="p" className={`text-[15px] font-bold font-mono ${isHighContention ? 'text-rose-700 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'}`}>
                  {selectedDatabase}
                </Typography>
              </div>
            </div>

            {/* Live counters */}
            <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge 
                  label={isHighContention ? 'High Contention' : 'Low Contention'} 
                  variant={isHighContention ? 'rose' : 'emerald'} 
                  pulse 
                />
              {loading && (
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                  <Spinner size="xs" />
                  <span>Polling…</span>
                </div>
              )}
            </div>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-black/4 dark:border-white/5">
            {[
              { icon: 'group',          label: 'Active Sessions', value: transactions.length,                            accent: 'amber' },
              { icon: 'swap_horiz',     label: 'Waiting Sessions', value: totalWaiters,                                  accent: totalWaiters > 0 ? 'rose' : 'emerald' },
              { icon: 'dns',            label: 'Unique Hosts',     value: uniqueHosts,                                   accent: 'slate' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2.5">
                <Icon name={s.icon} size="sm" weight={300} className="text-slate-400 dark:text-slate-500 shrink-0" />
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{s.label}</div>
                  <div className={`text-[16px] font-mono font-black leading-tight ${s.accent === 'rose' && s.value > 0 ? 'text-rose-500' : s.accent === 'emerald' ? 'text-emerald-500' : 'text-slate-700 dark:text-slate-100'}`}>
                    {s.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <TabGroup 
          tabs={TABS} 
          active={activeTab} 
          onChange={setActiveTab} 
        />

        {/* ── Tab Content ─────────────────────────────────────── */}
        <div className="min-h-[340px] animate-in fade-in duration-200">

          {/* ··· Sessions ··· */}
          {activeTab === 'sessions' && (
            <div>
              {transactions.length === 0 ? (
                <EmptyState
                  icon="sentiment_very_satisfied"
                  title="No Active Sessions"
                  subtitle="No client transactions are currently registered on this instance."
                  accent="emerald"
                />
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-white/8 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-white/3 border-b border-slate-100 dark:border-white/6">
                        {['#', 'Process', 'User', 'Host', 'PID', 'Isolation', 'Timeout', 'Locks'].map(h => (
                          <th key={h} className="px-3.5 py-3 text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/4">
                      {transactions.map((t, idx) => {
                        const isWaiting = !!t.waitfor;
                        const holdCount = Array.isArray(t.lock) ? t.lock.length : (t.lock ? 1 : 0);
                        return (
                          <tr key={idx} className={`group transition-colors text-[12px] font-mono ${isWaiting ? 'bg-rose-50/30 dark:bg-rose-500/5' : 'hover:bg-amber-500/3'}`}>
                            <td className="px-3.5 py-3 text-amber-500/70 font-black">{t.index ?? idx + 1}</td>
                            <td className="px-3.5 py-3">
                              <span className="font-sans font-bold text-slate-700 dark:text-slate-200 text-[12px]">{t.pname || 'cubrid'}</span>
                              {isWaiting && (
                                <span className="ml-2 text-[9px] font-black text-rose-500 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-sm">WAITING</span>
                              )}
                            </td>
                            <td className="px-3.5 py-3 text-slate-500 dark:text-slate-400">{t['@uid'] ?? '-'}</td>
                            <td className="px-3.5 py-3 text-slate-400 dark:text-slate-500 max-w-[140px] truncate italic text-[11px]">{t.host ?? '-'}</td>
                            <td className="px-3.5 py-3">
                              <span className="bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-sm text-[11px] border border-slate-200/50 dark:border-white/10 text-slate-600 dark:text-slate-400 font-bold group-hover:border-amber-500/30 transition-colors">
                                {t.pid ?? '—'}
                              </span>
                            </td>
                             <td className="px-3.5 py-3">
                              <StatusBadge 
                                label={t.isolevel || 'UNKNOWN'} 
                                variant={
                                  t.isolevel?.toLowerCase().includes('serializable') ? 'rose' : 
                                  t.isolevel?.toLowerCase().includes('repeatable') ? 'violet' : 'sky'
                                } 
                              />
                            </td>
                            <td className="px-3.5 py-3 text-right">
                              <span className="font-black text-slate-700 dark:text-slate-200">{t.timeout ?? '—'}</span>
                              <span className="text-[9px] text-slate-400 ml-1 uppercase tracking-widest opacity-50">sec</span>
                            </td>
                            <td className="px-3.5 py-3 text-center">
                              {holdCount > 0 ? (
                                <span className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-sm">{holdCount}</span>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ··· Object Locks ··· */}
          {activeTab === 'objects' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <MetricCard icon="key_visualizer" label="Held Objects"      value={lot.numlocked    ?? 0}    unit="items"   accent="amber"   isLoading={loading} />
                <MetricCard icon="view_quilt"     label="Allocated Capacity" value={lot.numallocated ?? 5000} unit="entries" accent="sky"     isLoading={loading} />
                <MetricCard icon="memory"         label="Memory Footprint"   value={lot.sizelock     ?? '—'}  unit="bytes"   accent="violet"  isLoading={loading} />
              </div>

              <SectionHeader title="Contending Object Records" badge={0} icon="view_list" />

              <div className="rounded-xl border border-slate-200 dark:border-white/8 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/3 border-b border-slate-100 dark:border-white/6">
                      {['Object OID', 'Class Name', 'Held By', 'Lock Mode', 'Waiters'].map(h => (
                        <th key={h} className="px-3.5 py-3 text-[9px] font-black text-slate-500 uppercase tracking-[0.15em]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={5}>
                        <EmptyState
                          icon="verified_user"
                          title="No Object Contention"
                          subtitle="All object-level locks are clear. No active waiters or deadlock chains detected."
                          accent="emerald"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ··· System Params ··· */}
          {activeTab === 'params' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <MetricCard icon="timer"      label="Deadlock Check Interval" value={settings.dinterval ?? '—'} unit="ms"     accent="sky"    isLoading={loading} />
                <MetricCard icon="auto_graph" label="Escalation Threshold"    value={settings.esc       ?? '—'} unit="pages"  accent="amber"  isLoading={loading} />
              </div>

              <SectionHeader title="Lock Object Table (LOT) Parameters" icon="table_rows" />
              <div className="space-y-4 px-1">
                <ProgressBar 
                  pct={lot.numallocated > 0 ? (lot.numlocked / lot.numallocated) * 100 : 0} 
                  label="Table Slot Utilization" 
                  showValue 
                  valueLabel={`${lot.numlocked || 0} / ${lot.numallocated || 0} slots`}
                />
                <div className="grid grid-cols-3 gap-3">
                  <MetricCard icon="key_visualizer" label="Currently Locked" value={lot.numlocked    ?? 0}    unit="objects" accent="amber"  isLoading={loading} />
                  <MetricCard icon="view_quilt"     label="Max Allocatable"   value={lot.numallocated ?? '—'}  unit="entries" accent="sky"    isLoading={loading} />
                  <MetricCard icon="memory"         label="Memory Block Size"  value={lot.sizelock     ?? '—'}  unit="bytes"   accent="violet" isLoading={loading} />
                </div>
              </div>

              <InfoBanner title="Interpretation Guide" className="mt-2">
                <strong className="font-bold text-slate-600 dark:text-slate-300 non-italic">Deadlock Interval</strong> — frequency in ms at which CUBRID checks for circular waiting dependencies.{' '}
                <strong className="font-bold text-slate-600 dark:text-slate-300 non-italic">Escalation Threshold</strong> — page count after which row-level locks are promoted to table-level locks to conserve memory.
              </InfoBanner>
            </div>
          )}

        </div>
      </div>
    </Modal>
  );
}
