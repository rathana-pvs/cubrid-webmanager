import { usePollingRefresh } from '../../../infrastructure/hooks/usePollingRefresh';
import React, { useState } from 'react';
import { useSelector, useDispatch , shallowEqual } from 'react-redux';
import { formatSize } from '../../../infrastructure/utils/format';
import { fetchHostSummary } from '../globalMonitoringSlice';
import { setActiveMainTab } from '../../layout/layoutSlice';
import { setSelectedHost, startService, stopService } from '../../host/hostSlice';
import MonitoringSettingsPopover from '../../user/components/MonitoringSettingsPopover';
import { Table } from '../../../components/ds/layout/Table';
import { Card } from '../../../components/ds/layout/Card';
import { Icon } from '../../../components/ds/foundation/Icon';
import { Typography } from '../../../components/ds/foundation/Typography';
import LoadingOverlay from '../../../components/common/LoadingOverlay';
import { Badge } from '../../../components/ds/foundation/Badge';
import { Spinner } from '../../../components/ds/foundation/Spinner';
import { InfoBanner } from '../../../components/ds/foundation/InfoBanner';
import { useActionState } from '../../../infrastructure/hooks/useActionState';
import { Modal } from '../../../components/ds/layout/Modal';
import { ModalStatusError } from '../../../components/ds/feedback/ActionStatus';

const MetricBar = ({ pct }) => (
  <div className="w-full h-1 bg-slate-100 dark:bg-white/6 overflow-hidden mt-1 rounded-full">
    <div className={`h-full transition-all duration-700 ease-out ${pct > 85 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
  </div>
);

import { ConfirmDialog } from '../../../components/ds/layout/ConfirmDialog';

const Component = function ServiceDashboard() {
  const dispatch = useDispatch();
  const { hosts, authorizedHosts, haInfo } = useSelector((state) => state.host, shallowEqual);
  const { summaries } = useSelector((state) => state.globalMonitoring, shallowEqual);
  const { preferences } = useSelector((state) => state.user, shallowEqual);
  const { refreshCounter, activeMainTab } = useSelector((state) => state.layout, shallowEqual);
  const { isManualRefreshing, lastRefreshed, handleRefresh: refreshAll } = usePollingRefresh({
    hostUid: 'global',
    tabId: 'service_dashboard',
    pollingIntervalSeconds: preferences.dashboardInterval,
    onFetch: (silent) => async (dispatch) => {
      if (authorizedHosts.length === 0) return;
      await Promise.all(authorizedHosts.map(hostUid => 
        dispatch(fetchHostSummary(silent ? { hostUid, isBackground: true } : hostUid)).unwrap().catch(() => {})
      ));
    }
  });

  const handleRowDoubleClick = (row) => {
    const hostUid = row.uid;
    dispatch(setSelectedHost(hostUid));
    dispatch(setActiveMainTab(`host:${hostUid}`));
  };

  const { 
    startAction, 
    endError, 
    resetAction,
    isLoading,
    isError,
    error: actionError
  } = useActionState();

  const [loadingTitle, setLoadingTitle] = useState('Synchronizing Services');
  const [confirmConfig, setConfirmConfig] = useState({ 
    isOpen: false, 
    title: '', 
    description: '', 
    confirmLabel: '',
    variant: 'primary',
    onConfirm: () => {} 
  });

  const HA_ROLE_CONFIG = {
    master: {
      label: 'MASTER',
      className: 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400',
    },
    slave: {
      label: 'SLAVE',
      className: 'bg-slate-500/10 border-slate-400/20 text-slate-500 dark:text-slate-400',
    },
    replica: {
      label: 'REPLICA',
      className: 'bg-blue-500/10 border-blue-400/20 text-blue-600 dark:text-blue-400',
    },
  };

  const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, isOpen: false }));

  const handleStartService = (e, row) => {
    e.stopPropagation();
    const hostUid = row.uid;
    const serverName = row.alias || row.id;

    setConfirmConfig({
      isOpen: true,
      title: 'Start Services',
      description: `Are you sure you want to start all CUBRID services on host "${serverName}"?`,
      confirmLabel: 'Start Services',
      variant: 'primary',
      onConfirm: async () => {
        closeConfirm();
        setLoadingTitle(`Starting services on ${serverName}`);
        startAction();
        try {
          await dispatch(startService(hostUid)).unwrap();
          resetAction();
        } catch (err) {
          endError(typeof err === 'string' ? err : (err.message || 'Service start command rejected by host agent.'));
        }
      }
    });
  };

  const handleStopService = (e, row) => {
    e.stopPropagation();
    const hostUid = row.uid;
    const serverName = row.alias || row.id;

    setConfirmConfig({
      isOpen: true,
      title: 'Stop Services',
      description: `Are you sure you want to stop all CUBRID services on host "${serverName}"? This will terminate all active brokers and databases.`,
      confirmLabel: 'Stop All Services',
      variant: 'danger',
      onConfirm: async () => {
        closeConfirm();
        setLoadingTitle(`Stopping services on ${serverName}`);
        startAction();
        try {
          await dispatch(stopService(hostUid)).unwrap();
          resetAction();
        } catch (err) {
          endError(typeof err === 'string' ? err : (err.message || 'Service termination failed. Check agent logs.'));
        }
      }
    });
  };


  const columns = React.useMemo(() => [
    {
      header: 'GROUP/HOST',
      accessor: 'alias',
      render: (val, row) => {
        const isConnected = authorizedHosts.includes(row.uid);
        
        const getInferredHaInfo = () => {
          const info = haInfo[row.uid];
          if (info?.isHA) return info;
          const alias = (row.alias || '').toLowerCase();
          if (alias.includes('(master)')) return { isHA: true, currentNodeType: 'master' };
          if (alias.includes('(slave)')) return { isHA: true, currentNodeType: 'slave' };
          if (alias.includes('(replica)')) return { isHA: true, currentNodeType: 'replica' };
          return null;
        };

        const activeHaInfo = getInferredHaInfo();
        const roleConfig = activeHaInfo?.currentNodeType ? HA_ROLE_CONFIG[activeHaInfo.currentNodeType] : null;

        const displayName = (val || row.id)
          .replace(/\s*\(master\)/i, '')
          .replace(/\s*\(slave\)/i, '')
          .replace(/\s*\(replica\)/i, '')
          .trim();

        return (
          <div className="flex items-center gap-3 py-0.5">
            {/* Server icon box with connection status */}
            <div className="relative shrink-0">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all duration-200 ${
                isConnected
                  ? 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)]'
                  : 'bg-slate-100 dark:bg-white/4 border-slate-200 dark:border-white/8'
              }`}>
                <Icon
                  name="dns"
                  size="18px"
                  className={isConnected ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'}
                  weight={isConnected ? 400 : 300}
                />
              </div>
              {/* Connection status dot */}
              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-background-dark flex items-center justify-center ${
                isConnected ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-white/20'
              }`}>
                {isConnected && <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />}
              </span>
            </div>

            {/* Name + role + address */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[13px] font-bold leading-tight truncate ${
                  isConnected ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'
                }`}>{displayName}</span>
                {roleConfig && (
                  <span className={`inline-flex items-center px-1.5 h-[14px] rounded-[3px] border text-[8px] font-black tracking-wide leading-none shrink-0 ${roleConfig.className}`}>
                    {roleConfig.label}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate mt-0.5">
                {row.address || row.ip || 'localhost'}:{row.port}
              </span>
            </div>
          </div>
        );
      }
    },
    { header: 'ADDRESS', accessor: 'ip', render: (v) => <span className="font-mono text-[11px] text-slate-500">{v || 'Localhost'}</span> },
    { header: 'PORT', accessor: 'port', render: (v) => <span className="font-mono text-[11px] text-slate-500">{v}</span> },
    { header: 'USER', accessor: 'user', render: (v, row) => <span className="text-[12px] text-slate-600 dark:text-slate-400">{row.user || row.id}</span> },
    { 
      header: 'PERMANENT', 
      accessor: 'permFree',
      render: (_, row) => {
        const isConnected = authorizedHosts.includes(row.uid);
        const v = isConnected ? summaries[row.uid]?.permFree : undefined;
        if (v === undefined || v === -1) return <span className="text-slate-300">—</span>;
        return <Badge variant={v > 30 ? 'success' : v > 10 ? 'warning' : 'danger'}>{v}%</Badge>;
      }
    },
    { 
      header: 'PERMANENTTEMP', 
      accessor: 'permTempFree',
      render: (_, row) => {
        const isConnected = authorizedHosts.includes(row.uid);
        const v = isConnected ? summaries[row.uid]?.permTempFree : undefined;
        if (v === undefined || v === -1) return <span className="text-slate-300">—</span>;
        return <Badge variant={v > 30 ? 'success' : v > 10 ? 'warning' : 'danger'}>{v}%</Badge>;
      }
    },
    { 
      header: 'TEMPTEMP', 
      accessor: 'tempTempFree',
      render: (_, row) => {
        const isConnected = authorizedHosts.includes(row.uid);
        const v = isConnected ? summaries[row.uid]?.tempTempFree : undefined;
        if (v === undefined || v === -1) return <span className="text-slate-300">—</span>;
        return <Badge variant={v > 30 ? 'success' : v > 10 ? 'warning' : 'danger'}>{v}%</Badge>;
      }
    },
    { 
      header: 'TPS', 
      accessor: 'tps',
      render: (_, row) => {
        const isConnected = authorizedHosts.includes(row.uid);
        const v = isConnected ? summaries[row.uid]?.tps : undefined;
        if (v === undefined) return <span className="text-slate-300">—</span>;
        return <span className="font-mono text-[12px] text-emerald-600 dark:text-emerald-400 font-bold">{v}</span>;
      }
    },
    { 
      header: 'QPS', 
      accessor: 'qps',
      render: (_, row) => {
        const isConnected = authorizedHosts.includes(row.uid);
        const v = isConnected ? summaries[row.uid]?.qps : undefined;
        if (v === undefined) return <span className="text-slate-300">—</span>;
        return <span className="font-mono text-[12px] text-slate-600 dark:text-slate-300">{v}</span>;
      }
    },
    { 
      header: 'MEMORY', 
      accessor: 'memory',
      render: (_, row) => {
        const isConnected = authorizedHosts.includes(row.uid);
        const s = isConnected ? summaries[row.uid] : undefined;
        if (!s) return <span className="text-slate-300">—</span>;
        return (
          <div className="min-w-[120px]">
            <span className="text-[11px] text-slate-700 dark:text-slate-200 font-mono font-semibold">{formatSize(s.memUsed)} / {formatSize(s.memTotal)}</span>
            <MetricBar pct={s.memory} />
          </div>
        );
      }
    },
    { 
      header: 'CPU', 
      accessor: 'cpu',
      render: (_, row) => {
        const isConnected = authorizedHosts.includes(row.uid);
        const s = isConnected ? summaries[row.uid] : undefined;
        if (!s) return <span className="text-slate-300">—</span>;
        return (
          <div className="min-w-[80px]">
            <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-200">{(s.cpu || 0).toFixed(1)}%</span>
            <MetricBar pct={s.cpu} />
          </div>
        );
      }
    },
    { 
      header: 'DB STATUS', 
      accessor: 'dbStatus',
      render: (_, row) => {
        const isConnected = authorizedHosts.includes(row.uid);
        const s = isConnected ? summaries[row.uid] : undefined;
        if (!s) return <span className="text-slate-300">—</span>;
        return (
          <div className="flex items-center gap-1.5 font-bold text-[10px]">
            <span className="text-emerald-500">ON: {s.dbOn}</span>
            <span className="text-slate-400">OFF: {s.dbOff}</span>
          </div>
        );
      }
    },
    { 
      header: 'ACTIONS', 
      accessor: 'actions',
      render: (_, row) => {
        const isConnected = authorizedHosts.includes(row.uid);
        if (!isConnected) return null;
        return (
          <div className="flex items-center gap-1">
            <button 
              onClick={(e) => handleStartService(e, row)}
              className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-90"
              title="Start Services"
            >
              <Icon name="play_arrow" size="16px" weight={400} />
            </button>
            <button 
              onClick={(e) => handleStopService(e, row)}
              className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90"
              title="Stop Services"
            >
              <Icon name="stop" size="16px" weight={400} />
            </button>
          </div>
        );
      }
    },
  ], [authorizedHosts, summaries]);

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-background-dark overflow-hidden font-sans">
      <header className="px-6 py-2.5 border-b border-slate-100 dark:border-white/4 flex items-center justify-between shrink-0 sticky top-0 z-20 bg-linear-to-r from-amber-500/[0.03] to-transparent bg-white dark:bg-background-dark font-sans shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Icon name="monitoring" size="sm" weight={300} className="text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Typography variant="h1" className="text-[13px] font-bold text-slate-800 dark:text-slate-100 leading-tight">
                Service Dashboard
              </Typography>
              <div className={`px-2 py-0.5 rounded-full border flex items-center gap-1.5 shrink-0 transition-all duration-300 ${preferences.dashboardInterval > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
                <div className={`w-1 h-1 rounded-full ${preferences.dashboardInterval > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span className={`text-[9px] font-bold ${preferences.dashboardInterval > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {preferences.dashboardInterval > 0 ? 'Live' : 'Paused'}
                </span>
              </div>
            </div>
            <Typography variant="label" className="text-[10px] text-slate-400 font-mono tracking-tight mt-0.5">Global Health Overview</Typography>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[12px]">
          <Typography variant="label" className="text-[10px] text-slate-400 font-mono tracking-tight hidden lg:block mr-2">
            Synced {lastRefreshed.toLocaleTimeString('en-US', { hour12: true })}
          </Typography>

          <button
            onClick={refreshAll}
            disabled={isManualRefreshing || authorizedHosts.length === 0}
            className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all active:scale-[0.98]
              ${isManualRefreshing
                ? 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-white/5 cursor-not-allowed opacity-50'
                : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 hover:border-amber-500/50 hover:bg-white dark:hover:bg-white/5'}`}
            title="Refresh dashboard"
          >
            <Icon name="refresh" size="18px" className={isManualRefreshing ? 'animate-spin' : ''} />
          </button>

          <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 mx-0.5" />
          <MonitoringSettingsPopover />

          <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1" />
          <div className="flex items-center gap-4 px-3 py-1 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-lg shadow-xs">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-slate-400 leading-none">Hosts</span>
              <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200 leading-none mt-1">{hosts?.length || 0}</span>
            </div>
            <div className="w-px h-5 bg-slate-200 dark:bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-emerald-500 leading-none tracking-tight">Active</span>
              <span className="text-[13px] font-bold text-emerald-500 leading-none mt-1">{authorizedHosts?.length || 0}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 relative">
        <LoadingOverlay isVisible={isLoading} subtitle={loadingTitle} />
        
        <Card noPadding className="overflow-hidden border-slate-200 dark:border-white/10 shadow-sm rounded-xl bg-white dark:bg-white/1">
          <Table 
            columns={columns} 
            data={hosts} 
            onRowDoubleClick={handleRowDoubleClick}
            className="border-none text-[12px]" 
            hoverable
          />
        </Card>
        
        {authorizedHosts.length === 0 && (
          <InfoBanner variant="warning" title="Sensors Offline" icon="dns" className="animate-pulse">
            Connect to a host server from the navigator to activate global resource monitoring.
          </InfoBanner>
        )}

        <ConfirmDialog
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          description={confirmConfig.description}
          confirmLabel={confirmConfig.confirmLabel}
          variant={confirmConfig.variant}
          onConfirm={confirmConfig.onConfirm}
          onCancel={closeConfirm}
        />
      </div>

      {isError && (
        <Modal isOpen title="Service Error" icon="error" iconVariant="danger" onClose={resetAction} maxWidth="400px">
          <ModalStatusError 
            title="Action Aborted"
            error={actionError}
            onRetry={resetAction}
            onCancel={resetAction}
            retryText="Dismiss"
          />
        </Modal>
      )}
    </div>
  );
}

export default React.memo(Component);
