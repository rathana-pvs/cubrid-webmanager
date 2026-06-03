import React from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { Icon } from '../../../../components/ds/foundation/Icon';
import { useCM } from '../../../../constants/useCM';

export default function HaClusterStatusSection({ hostUid }) {
  const CM = useCM();
  const hostData = useSelector((state) => state.monitoring.hostsData[hostUid] || {});
  const { haInfo } = useSelector((state) => state.host, shallowEqual);
  const hostHaInfo = haInfo[hostUid] || {};
  const isHA = hostHaInfo.isHA;

  if (!isHA || !hostData.haHeartbeat) {
    return null;
  }

  return (
    <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
          <Icon name="hub" className="text-amber-500" size="sm" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider leading-none">
            {CM.haClusterStatus}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-none">
            {CM.nodesActiveInCluster(hostData.haHeartbeat.hanodelist?.[0]?.node?.length || 0)}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {(hostData.haHeartbeat.hanodelist?.[0]?.node || []).map((node, i) => (
          <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-white dark:bg-bk-main rounded-lg border border-slate-200/60 dark:border-white/5 shadow-xs">
            <div className={`w-1.5 h-1.5 rounded-full ${
              node.state === 'master' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 
              node.state === 'replica' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 
              'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
            }`} />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 leading-tight">{node.hostname}</span>
              <span className={`text-[7px] font-black uppercase tracking-tighter mt-0.5 leading-none ${
                node.state === 'master' ? 'text-amber-500' : 'text-slate-400'
              }`}>
                {node.state}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
