import { RefreshingOverlay } from '../../../components/ds/feedback/RefreshingOverlay';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch , shallowEqual } from 'react-redux';
import {
  fetchHosts,
  setSelectedHost,
  loginToHost,
  openDeleteHostModal,
  openEditHostModal,
  openChangePasswordModal,
  revokeHostLogin,
  openServerVersionModal,
  fetchHostEnv,
  setSuggestedHaNodes,
  clearLastAddedHostUid,
  editHost,
  openCmsUserManagementModal
} from '../../host/hostSlice';
import {
  fetchDatabaseStartInfo, startDatabase, stopDatabase, loginDatabase, registerDatabase,
  setSelectedDatabase, setSelectedDatabaseSubItem, clearDatabaseError, resetDatabaseState
} from '../../database/databaseCoreSlice';

import {
  fetchDatabaseVolumes, fetchDatabaseSpaceInfo, fetchDashboardVolumes, fetchDashboardLocks,
  fetchDashboardPerformance, fetchDashboardCAS, fetchDashboardData, clearMonitoringError
} from '../../database/databaseMonitoringSlice';

import {
  createDatabase, copyDatabase, deleteDatabase, renameDatabase, fetchCreateDatabaseInfo,
  addVolume, backupDatabase, restoreDatabase, fetchBackupSchedule, addBackupSchedule,
  editBackupSchedule, deleteBackupSchedule, fetchBackupList, fetchBackupDbInfo,
  fetchAutoBackupLog, checkDatabase, compactDatabase, optimizeDatabase, loadDatabase,
  unloadDatabase, fetchQueryPlan, setAutoExecQuery, fetchQueryPlanLog, fetchLockInfo,
  fetchTransactionInfo, killTransaction, clearError
} from '../../database/databaseOperationSlice';

import {
  openUnloadDatabaseModal, closeUnloadDatabaseModal, openLoadDatabaseModal, closeLoadDatabaseModal,
  openCheckDatabaseModal, closeCheckDatabaseModal, openCompactDatabaseModal, closeCompactDatabaseModal,
  openCopyDatabaseModal, closeCopyDatabaseModal, openBackupDatabaseModal, closeBackupDatabaseModal,
  openRestoreDatabaseModal, closeRestoreDatabaseModal, openOptimizeDatabaseModal, closeOptimizeDatabaseModal,
  openAddBackupPlanModal, closeAddBackupPlanModal, openEditBackupPlanModal, closeEditBackupPlanModal,
  openDeleteBackupPlanModal, closeDeleteBackupPlanModal, openAutoBackupLogModal, closeAutoBackupLogModal,
  openLockInformationModal, closeLockInformationModal, openUnloadResultModal, closeUnloadResultModal,
  openTransactionInfoModal, closeTransactionInfoModal, openKillTransactionModal, closeKillTransactionModal,
  openDeleteDatabaseModal, closeDeleteDatabaseModal, openDatabasePropertyModal, closeDatabasePropertyModal,
  openRenameDatabaseModal, closeRenameDatabaseModal, openAddVolumeModal, closeAddVolumeModal,
  openDatabaseInfoModal, closeDatabaseInfoModal, openPlanDumpModal, closePlanDumpModal,
  openAddQueryPlanModal, closeAddQueryPlanModal, openAutoQueryLogModal, closeAutoQueryLogModal,
  openCreateDatabaseModal, closeCreateDatabaseModal, openSetAutomationVolumeModal, closeSetAutomationVolumeModal,
  openAutoVolumeLogModal, closeAutoVolumeLogModal, openLoginDatabaseModal, closeLoginDatabaseModal,
  openEditQueryPlanModal, closeEditQueryPlanModal, openDeleteQueryPlanModal, closeDeleteQueryPlanModal,
  setSelectedBackupId, clearSelectedBackupId, setSelectedQueryPlanId
} from '../../database/databaseUISlice';
import {
  fetchBrokerList,
  startBroker,
  stopBroker,
  openBrokerPropertyModal,
  resetBrokerState
} from '../../broker/brokerSlice';
import { setActiveMainTab, openTab, closeHostTabs, showStatusModal } from '../layoutSlice';
import { fetchDatabaseUsers, openCreateUserModal, openEditUserModal, openDropUserModal } from '../../user/userSlice';
import { clearHostSummary } from '../../server/globalMonitoringSlice';
import { MenuItem, MenuDivider, SubMenu } from '../../../components/common/DropdownMenu';
import ContextMenuWrapper from '../../../components/common/ContextMenuWrapper';
import { SplitPane } from '../../../components/ds/layout/SplitPane';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Icon } from '../../../components/ds/foundation/Icon';
import { Spinner } from '../../../components/ds/foundation/Spinner';
import { useActionState } from '../../../infrastructure/hooks/useActionState';
import { ModalStatusError } from '../../../components/ds/feedback/ActionStatus';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { StatusBadge } from '../../../components/ds/foundation/StatusBadge';

// Internal Sidebar Components
import SidebarHeader from '../sidebar/components/SidebarHeader';
import ServerListItem from '../sidebar/components/ServerListItem';
import TreeTabHeader from '../sidebar/components/TreeTabHeader';
import DatabaseTree from '../sidebar/components/DatabaseTree';
import BrokerTree from '../sidebar/components/BrokerTree';
import LogTree from '../sidebar/components/LogTree';
import SidebarEmptyState from '../sidebar/components/SidebarEmptyState';
import AddQueryPlanModal from '../../database/components/AddQueryPlanModal';
import AutoQueryLogModal from '../../database/components/AutoQueryLogModal';
import SetAutomationVolumeModal from '../../database/components/SetAutomationVolumeModal';
import EditQueryPlanModal from '../../database/components/EditQueryPlanModal';
import DeleteQueryPlanModal from '../../database/components/DeleteQueryPlanModal';
import AutoVolumeLogModal from '../../database/components/AutoVolumeLogModal';
import CMSUserManagementModal from '../../host/components/CMSUserManagementModal';
import EditCMSUserModal from '../../host/components/EditCMSUserModal';

export default function Sidebar({ isCollapsed, onAddHost }) {
  const sidebarRef = useRef(null);
  const hostSectionRef = useRef(null);
  const [activeTab, setActiveTab] = useState('db');
  const [contextMenu, setContextMenu] = useState(null);
  const [dbContextMenu, setDbContextMenu] = useState(null);
  const [brokerContextMenu, setBrokerContextMenu] = useState(null);
  const [usersContextMenu, setUsersContextMenu] = useState(null);
  const [userContextMenu, setUserContextMenu] = useState(null);
  const [backupPlanContextMenu, setBackupPlanContextMenu] = useState(null);
  const [dbRootContextMenu, setDbRootContextMenu] = useState(null);
  const [spaceContextMenu, setSpaceContextMenu] = useState(null);
  const [queryPlanContextMenu, setQueryPlanContextMenu] = useState(null);
  const [queryItemContextMenu, setQueryItemContextMenu] = useState(null);
  const [jobAutomationContextMenu, setJobAutomationContextMenu] = useState(null);
  const [brokerRootContextMenu, setBrokerRootContextMenu] = useState(null);

  const [backupItemContextMenu, setBackupItemContextMenu] = useState(null);
  const [sqlLogContextMenu, setSqlLogContextMenu] = useState(null);
  const [dbLogContextMenu, setDbLogContextMenu] = useState(null);

  const dispatch = useDispatch();
  const { 
    startAction, 
    endError, 
    resetAction,
    isLoading: sidebarActionLoading,
    isError: isSidebarActionError,
    error: sidebarActionError
  } = useActionState();

  const [loadingText, setLoadingText] = useState('Updating Resources...');

  const { hosts, selectedHostUid, loading: hostsLoading, authorizedHosts, isLoggingIntoHost, hostAuthErrors, haInfo, lastAddedHostUid } = useSelector((state) => state.host, shallowEqual);
  const { databases, activeDatabases, loggedInDatabases } = useSelector((state) => state.database, shallowEqual);
  const { brokers } = useSelector((state) => state.broker, shallowEqual);

  useEffect(() => {
    dispatch(fetchHosts());
  }, [dispatch]);

  const closeAllContextMenus = useCallback(() => {
    setContextMenu(null);
    setDbContextMenu(null);
    setBrokerContextMenu(null);
    setUsersContextMenu(null);
    setUserContextMenu(null);
    setBackupPlanContextMenu(null);
    setDbRootContextMenu(null);
    setSpaceContextMenu(null);
    setQueryPlanContextMenu(null);
    setQueryItemContextMenu(null);
    setJobAutomationContextMenu(null);
    setBrokerRootContextMenu(null);
    setBackupItemContextMenu(null);
    setSqlLogContextMenu(null);
    setDbLogContextMenu(null);
  }, []);

  const handleHostLogin = useCallback((uid) => {
    if (!uid) return;
    
    dispatch(loginToHost(uid))
      .unwrap()
      .then((response) => {
        // Rule #1: Automatically open tab if login is successful
        dispatch(setActiveMainTab('host:' + uid));
        dispatch(fetchDatabaseStartInfo(uid));
        dispatch(fetchBrokerList(uid));
        dispatch(fetchHostEnv(uid));

        // Rule #2: Suggest adding peer nodes if HA is detected
        // Constraint: Only popup if this was the 'first create' (just added)
        const isNewlyAdded = lastAddedHostUid === uid;

        if (response.isHA && response.haNodes?.length > 0 && isNewlyAdded) {
          const undiscovered = response.haNodes.filter(node => {
            const isSelf = hosts.find(h => {
              const hAddr = h.address.toLowerCase();
              const nIp = (node.ip || '').toLowerCase();
              const nHost = (node.hostname || '').toLowerCase();
              
              // Direct match
              if (hAddr === nIp || hAddr === nHost) return true;
              
              // Loopback match
              const isLoopback = (addr) => addr === 'localhost' || addr === '127.0.0.1';
              if (isLoopback(hAddr) && (isLoopback(nIp) || isLoopback(nHost))) return true;
              
              return false;
            });
            return !isSelf;
          });
          if (undiscovered.length > 0) {
            dispatch(setSuggestedHaNodes(undiscovered));
          }
        }

        // Always clear the 'newly added' flag after the first login attempt (successful or not)
        if (isNewlyAdded) {
          dispatch(clearLastAddedHostUid());
        }

        // Rule #3: Ensure master has its tag so it matches slaves/replicas in the sidebar
        const host = hosts.find(h => h.uid === uid);
        if (host && response.currentNodeType === 'master' && !host.alias?.toLowerCase().includes('(master)')) {
          const newAlias = `${host.alias || host.id} (master)`;
          dispatch(editHost({ hostUid: uid, payload: { ...host, alias: newAlias } }));
        }
      })
      .catch((err) => {
        console.error('Failed to log into host:', err);
      });
  }, [dispatch, hosts, lastAddedHostUid]);

  useEffect(() => {
    if (selectedHostUid && selectedHostUid !== lastProcessedHostUid.current) {
      handleHostLogin(selectedHostUid);
      lastProcessedHostUid.current = selectedHostUid;
    } else if (!selectedHostUid) {
      lastProcessedHostUid.current = null;
    }
  }, [selectedHostUid, handleHostLogin]);

  const handleContextMenu = (e, serverName, hostUid, alias) => {
    e.preventDefault();
    closeAllContextMenus();
    setContextMenu({ mouseX: e.clientX, mouseY: e.clientY, server: serverName, hostUid, alias });
  };

  const handleDbContextMenu = (e, dbName, isActive) => {
    e.preventDefault();
    e.stopPropagation();
    closeAllContextMenus();
    setDbContextMenu({ mouseX: e.clientX, mouseY: e.clientY, db: dbName, isActive });
  };

  const handleDbRootContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeAllContextMenus();
    setDbRootContextMenu({ mouseX: e.clientX, mouseY: e.clientY });
  };

  const handleBrokerContextMenu = (e, brokerName, state) => {
    e.preventDefault();
    e.stopPropagation();
    closeAllContextMenus();
    setBrokerContextMenu({ mouseX: e.clientX, mouseY: e.clientY, broker: brokerName, state });
  };

  const handleSqlLogContextMenu = (e, brokerName) => {
    e.preventDefault();
    e.stopPropagation();
    closeAllContextMenus();
    setSqlLogContextMenu({ mouseX: e.clientX, mouseY: e.clientY, broker: brokerName });
  };

  const handleDbLogContextMenu = (e, dbName) => {
    e.preventDefault();
    e.stopPropagation();
    closeAllContextMenus();
    setDbLogContextMenu({ mouseX: e.clientX, mouseY: e.clientY, db: dbName });
  };

  const handleUsersContextMenu = (e, dbName) => {
    e.preventDefault();
    e.stopPropagation();
    closeAllContextMenus();
    setUsersContextMenu({ mouseX: e.clientX, mouseY: e.clientY, db: dbName });
  };

  const handleUserContextMenu = (e, dbName, userName) => {
    e.preventDefault();
    e.stopPropagation();
    closeAllContextMenus();
    setUserContextMenu({ mouseX: e.clientX, mouseY: e.clientY, db: dbName, user: userName });
  };

  const handleBackupPlanContextMenu = (e, dbName) => {
    e.preventDefault();
    e.stopPropagation();
    closeAllContextMenus();
    setBackupPlanContextMenu({ mouseX: e.clientX, mouseY: e.clientY, db: dbName });
  };

  const handleSpaceContextMenu = (e, dbName) => {
    e.preventDefault();
    e.stopPropagation();
    closeAllContextMenus();
    setSpaceContextMenu({ mouseX: e.clientX, mouseY: e.clientY, db: dbName });
  };

  const handleQueryPlanContextMenu = (e, dbname) => {
    e.preventDefault();
    e.stopPropagation();
    closeAllContextMenus();
    setQueryPlanContextMenu({ mouseX: e.clientX, mouseY: e.clientY, db: dbname });
  };

  const handleQueryItemContextMenu = (e, dbname, qId) => {
    e.preventDefault();
    e.stopPropagation();
    closeAllContextMenus();
    setQueryItemContextMenu({ mouseX: e.clientX, mouseY: e.clientY, db: dbname, qId });
  };

  const handleBrokerRootContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeAllContextMenus();
    setBrokerRootContextMenu({ mouseX: e.clientX, mouseY: e.clientY });
  };

  const handleBackupItemContextMenu = (e, dbName, planId) => {
    e.preventDefault();
    e.stopPropagation();
    closeAllContextMenus();
    dispatch(setSelectedBackupId(planId));
    setBackupItemContextMenu({ mouseX: e.clientX, mouseY: e.clientY, db: dbName, planId });
  };


  useEffect(() => {
    const handleOutsideAction = (e) => {
      const isInsideMenu = e.target.closest('.context-menu-container');
      if (!isInsideMenu) {
        closeAllContextMenus();
      }
    };
    document.addEventListener('mousedown', handleOutsideAction, true);
    document.addEventListener('contextmenu', handleOutsideAction, true);
    return () => {
      document.removeEventListener('mousedown', handleOutsideAction, true);
      document.removeEventListener('contextmenu', handleOutsideAction, true);
    };
  }, [closeAllContextMenus]);

  const [isServerListCollapsed, setIsServerListCollapsed] = useState(false);
  const [serverListSize, setServerListSize] = useState(320);
  const [prevServerListSize, setPrevServerListSize] = useState(320);
  const [isTreeCollapsed, setIsTreeCollapsed] = useState(false);
  const lastProcessedHostUid = useRef(null);

  const toggleServerListCollapse = () => {
    setIsServerListCollapsed(!isServerListCollapsed);
    if (!isServerListCollapsed) {
      setPrevServerListSize(serverListSize);
      setServerListSize(40);
      setIsTreeCollapsed(false);
    } else {
      setServerListSize(prevServerListSize > 40 ? prevServerListSize : 260);
    }
  };

  const toggleTreeCollapse = () => {
    const nextState = !isTreeCollapsed;
    setIsTreeCollapsed(nextState);
    if (nextState) {
      setPrevServerListSize(serverListSize);
      setServerListSize(800); // Push to bottom
    } else {
      // Expanding: Restore to balanced middle position or previous size
      setIsServerListCollapsed(false);
      setServerListSize(prevServerListSize < 750 && prevServerListSize > 50 ? prevServerListSize : 260);
    }
  };

  return (
    <>
      <aside ref={sidebarRef} className={`w-full h-full bg-white dark:bg-bk-side flex flex-col ${isCollapsed ? 'hidden' : ''}`} id="sidebar">

        <SidebarHeader />

        <SplitPane
          split="horizontal"
          size={serverListSize}
          onSizeChange={setServerListSize}
          minSize={isServerListCollapsed ? 40 : 100}
          maxSize={800}

          className="flex-1 w-full flex flex-col overflow-hidden"
        >
          <div className="h-full flex flex-col overflow-hidden bg-white dark:bg-bk-side">
            <div
              className={`flex-none px-4 py-2 border-b border-slate-200 dark:border-white/5 flex items-center justify-between cursor-pointer transition-all duration-300 group/host-header
                ${!isServerListCollapsed
                  ? 'bg-white dark:bg-bk-side'
                  : 'bg-slate-50 dark:bg-white/2 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              onClick={toggleServerListCollapse}
            >
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all duration-200
                  ${!isServerListCollapsed ? 'text-amber-500' : 'text-slate-400 group-hover/host-header:text-amber-500'}`}>
                  <Icon
                    name="chevron_right"
                    size="xs"
                    className={`transition-transform duration-300 ${!isServerListCollapsed ? 'rotate-90' : ''}`}
                    weight={300}
                  />
                </div>
                <Typography variant="caption" className={`font-bold text-[12px] uppercase tracking-widest transition-colors
                  ${!isServerListCollapsed ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500 group-hover/host-header:text-amber-500'}`}>
                  Server List
                </Typography>
              </div>

              <div className="flex items-center gap-2">
                {isServerListCollapsed && (
                  <StatusBadge 
                    label={hosts.length.toString()} 
                    variant="amber" 
                    pulse={true} 
                    className="shadow-xs animate-in zoom-in-95 duration-200" 
                  />
                )}
                {!isServerListCollapsed && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onAddHost(); }}
                    className="flex items-center gap-1 h-6 px-2 rounded-sm border border-slate-200 dark:border-white/10 bg-white dark:bg-white/4 text-slate-400 hover:text-amber-500 hover:border-amber-400/50 hover:bg-amber-500/5 dark:hover:bg-amber-500/10 transition-all active:scale-95 shadow-xs"
                    title="Add Host"
                  >
                    <Icon name="add" size="12px" weight={400} />
                    <span className="text-[10px] font-semibold tracking-wide">Add</span>
                  </button>
                )}
              </div>


            </div>

            <div
              ref={hostSectionRef}
              className={`flex-1 overflow-y-auto py-1 bg-slate-50/50 dark:bg-black/20 transition-opacity duration-200 ${isServerListCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
              id="host-section"
            >
              {!isServerListCollapsed && (
                hostsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner size="md" />
                  </div>
                ) : hosts.length === 0 ? (
                  <button
                    onClick={onAddHost}
                    className="w-full mt-1 flex flex-col items-center justify-center gap-2 py-6 px-3 rounded-lg border border-dashed border-slate-300 dark:border-white/10 bg-white dark:bg-white/2 hover:border-amber-400/60 hover:bg-amber-500/5 dark:hover:bg-amber-500/10 transition-all group/add-host cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover/add-host:bg-amber-500/10 group-hover/add-host:border-amber-400/40 transition-all">
                      <Icon name="add" size="16px" weight={300} className="text-slate-400 group-hover/add-host:text-amber-500 transition-colors" />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 group-hover/add-host:text-slate-700 dark:group-hover/add-host:text-slate-300 transition-colors">Add your first host</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Connect to a CUBRID server</p>
                    </div>
                  </button>
                ) : (
                  hosts.map((host) => (
                    <ServerListItem
                      key={host.uid}
                      host={host}
                      isSelected={selectedHostUid === host.uid}
                      isAuthorized={authorizedHosts.includes(host.uid)}
                      haInfo={haInfo[host.uid]}
                      onContextMenu={handleContextMenu}
                    />
                  ))
                )
              )}
            </div>
          </div>

          <div className="h-full flex flex-col overflow-hidden" id="tree-section-container">
            {selectedHostUid ? (
              <>
                <div
                  className={`flex-none px-3 py-2 border-b border-t border-slate-200 dark:border-white/5 flex items-center justify-between cursor-pointer transition-all duration-300 group/tree-header
                    ${!isTreeCollapsed
                      ? 'bg-white dark:bg-bk-side'
                      : 'bg-slate-50 dark:bg-white/2 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  onClick={toggleTreeCollapse}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all duration-200
                      ${!isTreeCollapsed ? 'text-amber-500' : 'text-slate-400 group-hover/tree-header:text-amber-500'}`}>
                      <Icon
                        name="chevron_right"
                        size="xs"
                        className={`transition-transform duration-300 ${!isTreeCollapsed ? 'rotate-90' : ''}`}
                        weight={300}
                      />
                    </div>
                    <Typography variant="caption" className={`font-bold text-[11px] uppercase tracking-widest transition-colors
                      ${!isTreeCollapsed ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500 group-hover/tree-header:text-amber-500'}`}>
                      Resources
                    </Typography>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isTreeCollapsed ? (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-amber-500/10 border border-amber-500/20 animate-in fade-in zoom-in-95 duration-200">
                        <Icon
                          name={activeTab === 'db' ? 'database' : activeTab === 'broker' ? 'hub' : 'description'}
                          size="11px"
                          className="text-amber-500"
                          weight={400}
                        />
                        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-tight">
                          {activeTab === 'db' ? 'DB' : activeTab === 'broker' ? 'Broker' : 'Log'}
                        </span>
                      </div>
                    ) : (
                      authorizedHosts.includes(selectedHostUid) && (
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
                      )
                    )}
                  </div>
                </div>

                {!isTreeCollapsed && (
                  <>
                    <TreeTabHeader 
                      activeTab={activeTab} 
                      setActiveTab={setActiveTab} 
                      onDbTabContextMenu={handleDbRootContextMenu} 
                      onBrokerTabContextMenu={handleBrokerRootContextMenu}
                    />

                    <div className="flex-1 overflow-y-auto px-4 pb-4 relative min-h-[200px]">
                      {/* States Overlay - Full screen fixed overlay directly handled by component */}
                      {sidebarActionLoading && (
                        <RefreshingOverlay 
                          show={true} 
                          title={loadingText} 
                          className="fixed"
                        />
                      )}
                      
                      {isLoggingIntoHost && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-bk-side z-210 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                      <div className="size-16 border-4 border-bk-yellow/10 border-t-bk-yellow rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(255,193,7,0.2)]"></div>
                      <Typography variant="p" className="text-sm font-bold text-slate-900 dark:text-bk-yellow tracking-wide">Host login</Typography>
                      <Typography variant="caption" className="text-slate-500 mt-1 dark:text-slate-400">Establishing secure session...</Typography>
                    </div>
                  )}

                  {!isLoggingIntoHost && hostAuthErrors[selectedHostUid] && (
                    <div className="absolute inset-0 bg-white dark:bg-bk-side z-210 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
                      <div className="size-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
                        <Icon name="error" className="text-rose-500"  weight={300} />
                      </div>
                      <Typography variant="p" className="text-sm font-bold text-rose-500 mb-1">Connection failed</Typography>
                      <Typography variant="caption" className="text-slate-500 dark:text-slate-400 mb-6 px-4">{hostAuthErrors[selectedHostUid]}</Typography>
                      <Button variant="primary" size="sm" onClick={() => handleHostLogin(selectedHostUid)} className="px-8 h-9 shadow-[0_4px_12px_rgba(255,193,7,0.3)] text-[13px] font-medium">Try Again</Button>
                    </div>
                  )}


                  <div className={`mt-2 ${(!authorizedHosts.includes(selectedHostUid) || isLoggingIntoHost) ? 'opacity-20 blur-[1px] pointer-events-none' : 'opacity-100'}`} id="db-tree-container">
                    <div className={activeTab !== 'db' ? 'hidden' : ''}>
                      <DatabaseTree
                        onContextMenu={handleDbContextMenu}
                        onRootContextMenu={handleDbRootContextMenu}
                        onUsersContextMenu={handleUsersContextMenu}
                        onUserContextMenu={handleUserContextMenu}
                        onBackupPlanContextMenu={handleBackupPlanContextMenu}
                        onSpaceContextMenu={handleSpaceContextMenu}
                        onBackupItemContextMenu={handleBackupItemContextMenu}
                        onQueryPlanContextMenu={handleQueryPlanContextMenu}
                        onQueryItemContextMenu={handleQueryItemContextMenu}
                      />
                    </div>
                    <div className={activeTab !== 'broker' ? 'hidden' : ''}>
                      <BrokerTree 
                        hostUid={selectedHostUid} 
                        onContextMenu={handleBrokerContextMenu} 
                        onSqlLogContextMenu={handleSqlLogContextMenu} 
                      />
                    </div>
                    <div className={activeTab !== 'log' ? 'hidden' : ''}>
                      <LogTree hostUid={selectedHostUid} onDbLogContextMenu={handleDbLogContextMenu} />
                    </div>
                  </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <SidebarEmptyState />
            )}
          </div>
        </SplitPane>


      </aside>

      {/* Context Menus */}
      {contextMenu && (
        <ContextMenuWrapper x={contextMenu.mouseX} y={contextMenu.mouseY} onClose={() => setContextMenu(null)}>
          <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
            <Typography variant="caption" className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px]">Server: {contextMenu.server}</Typography>
            <Icon name="dns" size="xs" className="opacity-30" weight={300} />
          </div>
          {authorizedHosts.includes(contextMenu.hostUid) ? (
            <MenuItem
              icon="power_settings_new" 
              label="Disconnect"
              onClick={() => {
                const hostUid = contextMenu.hostUid;
                dispatch(revokeHostLogin(hostUid));
                dispatch(closeHostTabs(hostUid));
                if (selectedHostUid === hostUid) {
                  dispatch(setSelectedHost(null));
                  dispatch(resetDatabaseState());
                  dispatch(resetBrokerState());
                }
                dispatch(clearHostSummary(hostUid));
                setContextMenu(null);
              }}
            />
          ) : (
            <MenuItem
              icon="login" 
              label="Connect"
              onClick={() => {
                const hostUid = contextMenu.hostUid;
                handleHostLogin(hostUid);
                setContextMenu(null);
              }}
            />
          )}
          <MenuDivider />
          <MenuItem icon="add_box" label="Add Host" onClick={() => { onAddHost(); setContextMenu(null); }} />
          <MenuItem icon="edit" label="Edit Host" onClick={() => { dispatch(openEditHostModal(contextMenu.hostUid)); setContextMenu(null); }} />
          <MenuItem icon="delete" label="Delete Host" onClick={() => { dispatch(openDeleteHostModal({ hostUid: contextMenu.hostUid, alias: contextMenu.alias })); setContextMenu(null); }} />
          <MenuDivider />
          <MenuItem 
            icon="lock" 
            label="Change Password" 
            disabled={!(selectedHostUid === contextMenu.hostUid && authorizedHosts.includes(contextMenu.hostUid))}
            onClick={() => { dispatch(openChangePasswordModal(contextMenu.hostUid)); setContextMenu(null); }} 
          />
          <MenuItem 
            icon="supervisor_account" 
            label="User Management" 
            disabled={!(selectedHostUid === contextMenu.hostUid && authorizedHosts.includes(contextMenu.hostUid))}
            onClick={() => { dispatch(openCmsUserManagementModal()); setContextMenu(null); }} 
          />
          <MenuItem icon="info" label="Server Version" onClick={() => { dispatch(openServerVersionModal(contextMenu.hostUid)); setContextMenu(null); }} />
        </ContextMenuWrapper>
      )}

      {dbContextMenu && (
        <ContextMenuWrapper x={dbContextMenu.mouseX} y={dbContextMenu.mouseY} onClose={() => setDbContextMenu(null)}>
          <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
            <Typography variant="caption" className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px]">Database: {dbContextMenu.db}</Typography>
            <Icon name="database" size="xs" className="opacity-30" weight={300} />
          </div>
          {dbContextMenu.isActive ? (
            <MenuItem
              icon="stop"
              label="Stop Database"
              onClick={async () => {
                const dbName = dbContextMenu.db;
                setDbContextMenu(null);
                setLoadingText(`Stopping database : ${dbName} ...`);
                startAction();
                try {
                  await dispatch(stopDatabase({ hostUid: selectedHostUid, dbname: dbName })).unwrap();
                  dispatch(fetchDatabaseStartInfo(selectedHostUid));
                  resetAction();
                } catch (err) {
                  endError(err);
                }
              }}
            />
          ) : (
            <MenuItem
              icon="play_arrow"
              label="Start Database"
              onClick={async () => {
                const dbName = dbContextMenu.db;
                setDbContextMenu(null);
                setLoadingText(`Starting database : ${dbName} ...`);
                startAction();
                try {
                  await dispatch(startDatabase({ hostUid: selectedHostUid, dbname: dbName })).unwrap();
                  dispatch(fetchDatabaseStartInfo(selectedHostUid));
                  resetAction();
                } catch (err) {
                  endError(err);
                }
              }}
            />
          )}
          {dbContextMenu.isActive && !loggedInDatabases.includes(dbContextMenu.db) && (
            <MenuItem
              icon="login"
              label="Login Database"
              onClick={() => {
                dispatch(setSelectedDatabase(dbContextMenu.db));
                dispatch(openLoginDatabaseModal(dbContextMenu.db));
                setDbContextMenu(null);
              }}
            />
          )}
          <MenuDivider />
          <SubMenu icon="settings" label="Manage Database">
            <MenuItem icon="upload" label="Database Unload" onClick={() => { dispatch(setSelectedDatabase(dbContextMenu.db)); dispatch(openUnloadDatabaseModal(dbContextMenu.db)); setDbContextMenu(null); }} />
            <MenuItem icon="download" label="Database Load" onClick={() => { dispatch(setSelectedDatabase(dbContextMenu.db)); dispatch(openLoadDatabaseModal(dbContextMenu.db)); setDbContextMenu(null); }} />
            <MenuItem icon="check_circle" label="Check Database" onClick={() => { dispatch(setSelectedDatabase(dbContextMenu.db)); dispatch(openCheckDatabaseModal()); setDbContextMenu(null); }} />
            <MenuItem icon="compress" label="Compact Database" onClick={() => { dispatch(setSelectedDatabase(dbContextMenu.db)); dispatch(openCompactDatabaseModal()); setDbContextMenu(null); }} />
            <MenuItem icon="auto_fix_high" label="Optimize Database" onClick={() => { dispatch(setSelectedDatabase(dbContextMenu.db)); dispatch(openOptimizeDatabaseModal()); setDbContextMenu(null); }} />
            <MenuItem icon="content_copy" label="Copy Database" onClick={() => { dispatch(setSelectedDatabase(dbContextMenu.db)); dispatch(openCopyDatabaseModal()); setDbContextMenu(null); }} />
            <MenuDivider />
            <MenuItem icon="drive_file_rename_outline" label="Rename Database" disabled={dbContextMenu.isActive} onClick={() => { dispatch(setSelectedDatabase(dbContextMenu.db)); dispatch(openRenameDatabaseModal()); setDbContextMenu(null); }} />
            <MenuItem icon="restore" label="Restore Database" disabled={dbContextMenu.isActive} onClick={() => { dispatch(setSelectedDatabase(dbContextMenu.db)); dispatch(openRestoreDatabaseModal()); setDbContextMenu(null); }} />
            <MenuItem icon="backup" label="Backup Database" onClick={() => { dispatch(setSelectedDatabase(dbContextMenu.db)); dispatch(openBackupDatabaseModal()); setDbContextMenu(null); }} />
            <MenuDivider />
            <MenuItem icon="delete" label="Delete Database" disabled={dbContextMenu.isActive} onClick={() => { dispatch(setSelectedDatabase(dbContextMenu.db)); dispatch(openDeleteDatabaseModal(dbContextMenu.db)); setDbContextMenu(null); }} />
          </SubMenu>

          <SubMenu icon="info" label="Database Info" width="w-52">
            <MenuItem icon="lock_open" label="Lock Information" onClick={() => { dispatch(setSelectedDatabase(dbContextMenu.db)); dispatch(openLockInformationModal()); setDbContextMenu(null); }} />
            <MenuItem icon="swap_horiz" label="Transaction Info" onClick={() => { dispatch(setSelectedDatabase(dbContextMenu.db)); dispatch(openTransactionInfoModal()); setDbContextMenu(null); }} />
            <MenuItem 
              icon="data_object" 
              label="Param Dump" 
              onClick={() => { 
                dispatch(setSelectedDatabase(dbContextMenu.db)); 
                dispatch(openDatabaseInfoModal()); 
                setDbContextMenu(null); 
              }} 
            />
            <MenuItem 
              icon="schema" 
              label="Plan Dump" 
              onClick={() => { 
                dispatch(setSelectedDatabase(dbContextMenu.db)); 
                dispatch(openPlanDumpModal()); 
                setDbContextMenu(null); 
              }} 
            />
          </SubMenu>
          
          <MenuDivider />
          <MenuItem icon="tune" label="Properties" onClick={() => { dispatch(setSelectedDatabase(dbContextMenu.db)); dispatch(openDatabasePropertyModal()); setDbContextMenu(null); }} />
          <MenuDivider />
          <MenuItem
            icon="refresh"
            label="Refresh"
            onClick={() => {
              dispatch(fetchDatabaseStartInfo(selectedHostUid));
              setDbContextMenu(null);
            }}
          />
        </ContextMenuWrapper>
      )}

      {dbRootContextMenu && (
        <ContextMenuWrapper x={dbRootContextMenu.mouseX} y={dbRootContextMenu.mouseY} onClose={() => setDbRootContextMenu(null)}>
          <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
            <Typography variant="caption" className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px]">All Databases</Typography>
            <Icon name="database" size="xs" className="opacity-30" weight={300} />
          </div>
          <MenuItem
            icon="play_circle"
            label="Start All Databases"
            onClick={async () => {
              setDbRootContextMenu(null);
              setLoadingText(`Starting all databases ...`);
              startAction();
              try {
                for (const db of databases) {
                  if (!activeDatabases.includes(db.dbname)) {
                    await dispatch(startDatabase({ hostUid: selectedHostUid, dbname: db.dbname })).unwrap();
                  }
                }
                dispatch(fetchDatabaseStartInfo(selectedHostUid));
                resetAction();
              } catch (err) {
                endError(err);
              }
            }}
          />
          <MenuItem
            icon="stop_circle"
            label="Stop All Databases"
            onClick={async () => {
              setDbRootContextMenu(null);
              setLoadingText(`Stopping all databases ...`);
              startAction();
              try {
                for (const dbname of activeDatabases) {
                  await dispatch(stopDatabase({ hostUid: selectedHostUid, dbname })).unwrap();
                }
                dispatch(fetchDatabaseStartInfo(selectedHostUid));
                resetAction();
              } catch (err) {
                endError(err);
              }
            }}
          />
          <MenuItem
            icon="restart_alt"
            label="Restart All Databases"
            onClick={async () => {
              setDbRootContextMenu(null);
              setLoadingText(`Restarting all databases ...`);
              startAction();
              try {
                const currentActive = [...activeDatabases];
                for (const dbname of currentActive) {
                  await dispatch(stopDatabase({ hostUid: selectedHostUid, dbname })).unwrap();
                }
                for (const dbname of currentActive) {
                  await dispatch(startDatabase({ hostUid: selectedHostUid, dbname })).unwrap();
                }
                dispatch(fetchDatabaseStartInfo(selectedHostUid));
                resetAction();
              } catch (err) {
                endError(err);
              }
            }}
          />
          <MenuDivider />
          <MenuItem
            icon="add_circle"
            label="Create Database"
            onClick={() => {
              setDbRootContextMenu(null);
              dispatch(openCreateDatabaseModal());
            }}
          />
          <MenuItem
            icon="refresh"
            label="Refresh"
            onClick={() => {
              setDbRootContextMenu(null);
              dispatch(fetchDatabaseStartInfo(selectedHostUid));
            }}
          />
          <MenuDivider />
          <MenuItem icon="tune" label="Properties" onClick={() => { setDbRootContextMenu(null); dispatch(setSelectedDatabase(null)); dispatch(openDatabasePropertyModal()); }} />
        </ContextMenuWrapper>
      )}

      {brokerRootContextMenu && (
        <ContextMenuWrapper x={brokerRootContextMenu.mouseX} y={brokerRootContextMenu.mouseY} onClose={() => setBrokerRootContextMenu(null)}>
          <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
            <Typography variant="caption" className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px]">All Brokers</Typography>
            <Icon name="hub" size="xs" className="opacity-30" weight={300} />
          </div>
          <MenuItem
            icon="play_circle"
            label="Start All Brokers"
            onClick={async () => {
              setBrokerRootContextMenu(null);
              setLoadingText(`Starting all brokers ...`);
              startAction();
              try {
                for (const broker of brokers) {
                  if (broker.state !== 'ON') {
                    await dispatch(startBroker({ hostUid: selectedHostUid, brokerName: broker.name })).unwrap();
                  }
                }
                dispatch(fetchBrokerList(selectedHostUid));
                resetAction();
              } catch (err) {
                endError(err);
              }
            }}
          />
          <MenuItem
            icon="stop_circle"
            label="Stop All Brokers"
            onClick={async () => {
              setBrokerRootContextMenu(null);
              setLoadingText(`Stopping all brokers ...`);
              startAction();
              try {
                for (const broker of brokers) {
                  if (broker.state === 'ON') {
                    await dispatch(stopBroker({ hostUid: selectedHostUid, brokerName: broker.name })).unwrap();
                  }
                }
                dispatch(fetchBrokerList(selectedHostUid));
                resetAction();
              } catch (err) {
                endError(err);
              }
            }}
          />
          <MenuItem
            icon="restart_alt"
            label="Restart All Brokers"
            onClick={async () => {
              setBrokerRootContextMenu(null);
              setLoadingText(`Restarting all brokers ...`);
              startAction();
              try {
                const currentActive = brokers.filter(b => b.state === 'ON').map(b => b.name);
                for (const name of currentActive) {
                  await dispatch(stopBroker({ hostUid: selectedHostUid, brokerName: name })).unwrap();
                }
                for (const name of currentActive) {
                  await dispatch(startBroker({ hostUid: selectedHostUid, brokerName: name })).unwrap();
                }
                dispatch(fetchBrokerList(selectedHostUid));
                resetAction();
              } catch (err) {
                endError(err);
              }
            }}
          />
          <MenuDivider />
          <MenuItem
            icon="settings"
            label="Edit Broker Config"
            onClick={() => {
              setBrokerRootContextMenu(null);
              if (selectedHostUid) {
                dispatch(openTab(`broker_config:${selectedHostUid}`));
              }
            }}
          />
          <MenuItem
            icon="info"
            label="Show Status"
            onClick={() => {
              setBrokerRootContextMenu(null);
              if (selectedHostUid) {
                dispatch(openTab(`brokers_status:${selectedHostUid}`));
              }
            }}
          />
          <MenuItem
            icon="refresh"
            label="Refresh"
            onClick={() => {
              setBrokerRootContextMenu(null);
              dispatch(fetchBrokerList(selectedHostUid));
            }}
          />
        </ContextMenuWrapper>
      )}

      {brokerContextMenu && (
        <ContextMenuWrapper x={brokerContextMenu.mouseX} y={brokerContextMenu.mouseY} onClose={() => setBrokerContextMenu(null)}>
          <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
            <Typography variant="caption" className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px]">Broker: {brokerContextMenu.broker}</Typography>
            <Icon name="hub" size="xs" className="opacity-30" weight={300} />
          </div>
          {brokerContextMenu.state === 'ON' ? (
            <MenuItem
              icon="stop"
              label="Stop Broker"
              onClick={async () => {
                const bName = brokerContextMenu.broker;
                setBrokerContextMenu(null);
                setLoadingText(`Stopping broker : ${bName} ...`);
                startAction();
                try {
                  await dispatch(stopBroker({ hostUid: selectedHostUid, brokerName: bName })).unwrap();
                  dispatch(fetchBrokerList(selectedHostUid));
                  resetAction();
                } catch (err) {
                  endError(err);
                }
              }}
            />
          ) : (
            <MenuItem
              icon="play_arrow"
              label="Start Broker"
              onClick={async () => {
                const bName = brokerContextMenu.broker;
                setBrokerContextMenu(null);
                setLoadingText(`Starting broker : ${bName} ...`);
                startAction();
                try {
                  await dispatch(startBroker({ hostUid: selectedHostUid, brokerName: bName })).unwrap();
                  dispatch(fetchBrokerList(selectedHostUid));
                  resetAction();
                } catch (err) {
                  endError(err);
                }
              }}
            />
          )}
          <MenuDivider />
          <MenuItem 
            icon="info" 
            label="Show Status" 
            onClick={() => {
              if (selectedHostUid) {
                dispatch(setActiveMainTab(`broker_status:${selectedHostUid}:${brokerContextMenu.broker}`));
              }
              setBrokerContextMenu(null);
            }} 
          />
          <MenuItem 
            icon="tune" 
            label="Properties" 
            onClick={() => { 
                dispatch(openBrokerPropertyModal({ hostUid: selectedHostUid, brokerName: brokerContextMenu.broker }));
                setBrokerContextMenu(null); 
            }} 
          />
        </ContextMenuWrapper>
      )}

      {sqlLogContextMenu && (
        <ContextMenuWrapper x={sqlLogContextMenu.mouseX} y={sqlLogContextMenu.mouseY} onClose={() => setSqlLogContextMenu(null)}>
          <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
            <Typography variant="caption" className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px]">SQL Logs: {sqlLogContextMenu.broker}</Typography>
            <Icon name="history_edu" size="xs" className="opacity-30" weight={300} />
          </div>
          <MenuItem
            icon="visibility"
            label="View All Logs"
            onClick={() => {
              if (selectedHostUid) {
                dispatch(openTab(`all_logs:${selectedHostUid}:${sqlLogContextMenu.broker}`));
              }
              setSqlLogContextMenu(null);
            }}
          />
        </ContextMenuWrapper>
      )}

      {dbLogContextMenu && (
        <ContextMenuWrapper x={dbLogContextMenu.mouseX} y={dbLogContextMenu.mouseY} onClose={() => setDbLogContextMenu(null)}>
          <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
            <Typography variant="caption" className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px]">Server Logs: {dbLogContextMenu.db}</Typography>
            <Icon name="dns" size="xs" className="opacity-30" weight={300} />
          </div>
          <MenuItem
            icon="visibility"
            label="View All Logs"
            onClick={() => {
              if (selectedHostUid) {
                dispatch(openTab(`all_db_logs:${selectedHostUid}:${dbLogContextMenu.db}`));
              }
              setDbLogContextMenu(null);
            }}
          />
        </ContextMenuWrapper>
      )}

      {usersContextMenu && (
        <ContextMenuWrapper x={usersContextMenu.mouseX} y={usersContextMenu.mouseY} onClose={() => setUsersContextMenu(null)}>
          <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
             <Typography variant="caption" className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px]">Users: {usersContextMenu.db}</Typography>
             <Icon name="groups" size="xs" className="opacity-30"  weight={300} />
          </div>
          <MenuItem
            icon="person_add"
            label="Create DB User"
            onClick={() => {
              dispatch(openCreateUserModal(usersContextMenu.db));
              setUsersContextMenu(null);
            }}
          />
          <MenuItem
            icon="refresh"
            label="Refresh"
            onClick={() => {
              dispatch(fetchDatabaseUsers({ hostUid: selectedHostUid, dbname: usersContextMenu.db }));
              setUsersContextMenu(null);
            }}
          />
        </ContextMenuWrapper>
      )}

      {userContextMenu && (
        <ContextMenuWrapper x={userContextMenu.mouseX} y={userContextMenu.mouseY} onClose={() => setUserContextMenu(null)}>
          <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
            <Typography variant="caption" className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest text-[9px]">{userContextMenu.user}</Typography>
            <Icon name="person" size="xs" className="opacity-30"  weight={300} />
          </div>
          <MenuItem
            icon="edit"
            label="Edit DB User"
            onClick={() => {
              dispatch(openEditUserModal({ dbname: userContextMenu.db, userName: userContextMenu.user }));
              setUserContextMenu(null);
            }}
          />
          <MenuItem
            icon="person_remove"
            label="Drop DB User"
            onClick={() => {
              dispatch(openDropUserModal({ dbname: userContextMenu.db, userName: userContextMenu.user }));
              setUserContextMenu(null);
            }}
          />
          <MenuDivider />
          <MenuItem
            icon="refresh"
            label="Refresh"
            onClick={() => {
              dispatch(fetchDatabaseUsers({ hostUid: selectedHostUid, dbname: userContextMenu.db }));
              setUserContextMenu(null);
            }}
          />
        </ContextMenuWrapper>
      )}
      {backupPlanContextMenu && (
        <ContextMenuWrapper x={backupPlanContextMenu.mouseX} y={backupPlanContextMenu.mouseY} onClose={() => setBackupPlanContextMenu(null)}>
          <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
            <Typography variant="caption" className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px]">Backup Plan</Typography>
            <Icon name="backup" size="xs" className="opacity-30"  weight={300} />
          </div>
          <MenuItem
            icon="add_circle"
            label="Add Backup Plan"
            onClick={() => {
              dispatch(setSelectedDatabase(backupPlanContextMenu.db));
              dispatch(openAddBackupPlanModal());
              setBackupPlanContextMenu(null);
            }}
          />
          <MenuItem
            icon="history"
            label="Auto Backup Log"
            onClick={() => {
              dispatch(setSelectedDatabase(backupPlanContextMenu.db));
              dispatch(openAutoBackupLogModal());
              setBackupPlanContextMenu(null);
            }}
          />
          <MenuDivider />
          <MenuItem
            icon="refresh"
            label="Refresh"
            onClick={() => {
              if (selectedHostUid) {
                dispatch(fetchBackupSchedule({ hostUid: selectedHostUid, dbname: backupPlanContextMenu.db }));
              }
              setBackupPlanContextMenu(null);
            }}
          />
        </ContextMenuWrapper>
      )}
      {spaceContextMenu && (
        <ContextMenuWrapper x={spaceContextMenu.mouseX} y={spaceContextMenu.mouseY} onClose={() => setSpaceContextMenu(null)}>
          <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
            <Typography variant="caption" className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px]">Space: {spaceContextMenu.db}</Typography>
            <Icon name="donut_small" size="xs" className="opacity-30"  weight={300} />
          </div>
          <MenuItem
            icon="add_to_drive"
            label="Add Volume"
            onClick={() => {
              dispatch(setSelectedDatabase(spaceContextMenu.db));
              dispatch(openAddVolumeModal());
              setSpaceContextMenu(null);
            }}
          />
          <MenuItem
            icon="settings_suggest"
            label="Set Automation Volume"
            onClick={() => {
              dispatch(setSelectedDatabase(spaceContextMenu.db));
              dispatch(openSetAutomationVolumeModal());
              setSpaceContextMenu(null);
            }}
          />
          <MenuItem
            icon="history_edu"
            label="Auto Volume Log"
            onClick={() => {
              dispatch(setSelectedDatabase(spaceContextMenu.db));
              dispatch(openAutoVolumeLogModal());
              setSpaceContextMenu(null);
            }}
          />
          <MenuDivider />
          <MenuItem
            icon="visibility"
            label="View Database"
            onClick={() => {
              dispatch(setActiveMainTab(`db_space:${selectedHostUid}:${spaceContextMenu.db}`));
              setSpaceContextMenu(null);
            }}
          />
          <MenuDivider />
          <MenuItem
            icon="refresh"
            label="Refresh"
            onClick={() => {
              setSpaceContextMenu(null);
            }}
          />
        </ContextMenuWrapper>
      )}

      {backupItemContextMenu && (
        <ContextMenuWrapper x={backupItemContextMenu.mouseX} y={backupItemContextMenu.mouseY} onClose={() => setBackupItemContextMenu(null)}>
          <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
            <Typography variant="caption" className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px]">Backup: {backupItemContextMenu.planId}</Typography>
            <Icon name="event_note" size="xs" className="opacity-30"  weight={300} />
          </div>

          <MenuItem
            icon="edit"
            label="Edit Backup Plan"
            onClick={() => {
              dispatch(setSelectedDatabase(backupItemContextMenu.db));
              dispatch(setSelectedBackupId(backupItemContextMenu.planId));
              dispatch(openEditBackupPlanModal());
              setBackupItemContextMenu(null);
            }}
          />
          <MenuItem
            icon="delete_forever"
            label="Delete Backup Plan"
            onClick={() => {
              dispatch(setSelectedDatabase(backupItemContextMenu.db));
              dispatch(setSelectedBackupId(backupItemContextMenu.planId));
              dispatch(openDeleteBackupPlanModal());
              setBackupItemContextMenu(null);
            }}
          />
          <MenuDivider />
          <MenuItem
            icon="refresh"
            label="Refresh"
            onClick={() => {
              dispatch(fetchBackupSchedule({ hostUid: selectedHostUid, dbname: backupItemContextMenu.db }));
              setBackupItemContextMenu(null);
            }}
          />
        </ContextMenuWrapper>
      )}

      {queryPlanContextMenu && (
        <ContextMenuWrapper x={queryPlanContextMenu.mouseX} y={queryPlanContextMenu.mouseY} onClose={() => setQueryPlanContextMenu(null)}>
          <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
            <Typography variant="caption" className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px]">Query Plan: {queryPlanContextMenu.db}</Typography>
            <Icon name="bolt" size="xs" className="opacity-30" weight={300} />
          </div>
          <MenuItem
            icon="add_circle"
            label="Add Query Plan"
            onClick={() => {
              dispatch(setSelectedDatabase(queryPlanContextMenu.db));
              dispatch(openAddQueryPlanModal());
              setQueryPlanContextMenu(null);
            }}
          />
          <MenuItem
            icon="history"
            label="Auto Query Log"
            onClick={() => {
              dispatch(setSelectedDatabase(queryPlanContextMenu.db));
              dispatch(openAutoQueryLogModal());
              setQueryPlanContextMenu(null);
            }}
          />
          <MenuDivider />
          <MenuItem
            icon="refresh"
            label="Refresh"
            onClick={() => {
              if (selectedHostUid) {
                dispatch(fetchQueryPlan({ hostUid: selectedHostUid, dbname: queryPlanContextMenu.db }));
              }
              setQueryPlanContextMenu(null);
            }}
          />
        </ContextMenuWrapper>
      )}

      {queryItemContextMenu && (
        <ContextMenuWrapper x={queryItemContextMenu.mouseX} y={queryItemContextMenu.mouseY} onClose={() => setQueryItemContextMenu(null)}>
          <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
            <Typography variant="caption" className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px]">Query Plan Item: {queryItemContextMenu.qId}</Typography>
            <Icon name="bolt" size="xs" className="opacity-30" weight={300} />
          </div>
          <MenuItem
            icon="edit"
            label="Edit Query Plan"
            onClick={() => {
              dispatch(setSelectedDatabase(queryItemContextMenu.db));
              dispatch(openEditQueryPlanModal(queryItemContextMenu.qId));
              setQueryItemContextMenu(null);
            }}
          />
          <MenuItem
            icon="delete_forever"
            label="Delete Query Plan"
            onClick={() => {
              dispatch(setSelectedDatabase(queryItemContextMenu.db));
              dispatch(openDeleteQueryPlanModal(queryItemContextMenu.qId));
              setQueryItemContextMenu(null);
            }}
          />
          <MenuDivider />
          <MenuItem
            icon="refresh"
            label="Refresh"
            onClick={() => {
              if (selectedHostUid) {
                dispatch(fetchQueryPlan({ hostUid: selectedHostUid, dbname: queryItemContextMenu.db }));
              }
              setQueryItemContextMenu(null);
            }}
          />
        </ContextMenuWrapper>
      )}

      <AutoQueryLogModal />
      <AddQueryPlanModal />
      <SetAutomationVolumeModal />
      <EditQueryPlanModal />
      <DeleteQueryPlanModal />
      <AutoVolumeLogModal />
      <CMSUserManagementModal />
      <EditCMSUserModal />
      {isSidebarActionError && (
        <Modal isOpen title="Action Failed" icon="error" iconVariant="danger" onClose={resetAction} maxWidth="400px">
          <ModalStatusError 
            title="Update Interrupted"
            error={sidebarActionError}
            onRetry={resetAction}
            onCancel={resetAction}
            retryText="Dismiss"
          />
        </Modal>
      )}
    </>
  );
}
