import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchHosts,
  setSelectedHost,
  loginToHost,
  openDeleteHostModal,
  openEditHostModal,
  openChangePasswordModal,
  revokeHostLogin,
  openServerVersionModal,
  fetchHostEnv
} from '../../host/hostSlice';
import {
  fetchDatabaseStartInfo, startDatabase, stopDatabase, loginDatabase, registerDatabase,
  setSelectedDatabase, setSelectedDatabaseSubItem, clearDatabaseError
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
  openBrokerPropertyModal
} from '../../broker/brokerSlice';
import { setActiveMainTab, openTab, closeHostTabs, showStatusModal } from '../layoutSlice';
import { fetchDatabaseUsers, openCreateUserModal, openEditUserModal, openDropUserModal } from '../../user/userSlice';
import { MenuItem, MenuDivider, SubMenu } from '../../../components/common/DropdownMenu';
import ContextMenuWrapper from '../../../components/common/ContextMenuWrapper';
import { SplitPane } from '../../../components/ds/layout/SplitPane';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Icon } from '../../../components/ds/foundation/Icon';
import { Spinner } from '../../../components/ds/foundation/Spinner';
import { Button } from '../../../components/ds/foundation/Button';

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
  const [tableContextMenu, setTableContextMenu] = useState(null);
  const [viewContextMenu, setViewContextMenu] = useState(null);

  const dispatch = useDispatch();
  const { hosts, selectedHostUid, loading: hostsLoading, authorizedHosts, isLoggingIntoHost, hostAuthErrors } = useSelector((state) => state.host);
  const { databases, activeDatabases, loggedInDatabases, loading: dbActionLoading } = useSelector((state) => state.database);
  const { brokers, actionLoading: brokerActionLoading } = useSelector((state) => state.broker);

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
    setTableContextMenu(null);
    setViewContextMenu(null);
  }, []);

  const handleHostLogin = useCallback((uid) => {
    if (!uid) return;
    
    dispatch(loginToHost(uid))
      .unwrap()
      .then(() => {
        // Rule #1: Automatically open tab if login is successful
        dispatch(setActiveMainTab('host:' + uid));
        dispatch(fetchDatabaseStartInfo(uid));
        dispatch(fetchBrokerList(uid));
        dispatch(fetchHostEnv(uid));
      })
      .catch((err) => {
        console.error('Failed to log into host:', err);
      });
  }, [dispatch]);

  useEffect(() => {
    if (selectedHostUid) {
      handleHostLogin(selectedHostUid);
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

  const handleTableContextMenu = (e, dbName, tableName) => {
    e.preventDefault();
    e.stopPropagation();
    closeAllContextMenus();
    setTableContextMenu({ mouseX: e.clientX, mouseY: e.clientY, db: dbName, table: tableName });
  };

  const handleViewContextMenu = (e, dbName, viewName) => {
    e.preventDefault();
    e.stopPropagation();
    closeAllContextMenus();
    setViewContextMenu({ mouseX: e.clientX, mouseY: e.clientY, db: dbName, view: viewName });
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
  const [serverListSize, setServerListSize] = useState(260);
  const [prevServerListSize, setPrevServerListSize] = useState(260);
  const [isTreeCollapsed, setIsTreeCollapsed] = useState(false);

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
                <Typography variant="caption" className={`font-bold text-[11px] uppercase tracking-widest transition-colors
                  ${!isServerListCollapsed ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500 group-hover/host-header:text-amber-500'}`}>
                  Server List
                </Typography>
              </div>

              <div className="flex items-center gap-2">
                {isServerListCollapsed && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 shadow-xs animate-in zoom-in-95 duration-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 font-mono tracking-tight">
                      {hosts.length}
                    </span>
                  </div>
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
              className={`flex-1 overflow-y-auto p-2 space-y-0.5 bg-slate-50/50 dark:bg-black/20 transition-opacity duration-200 ${isServerListCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
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
                  {/* States Overlay */}
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

                  {(dbActionLoading || brokerActionLoading) && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-bk-main/60 z-200 flex items-center justify-center backdrop-blur-xs animate-in fade-in duration-200">
                      <div className="flex flex-col items-center gap-3 bg-white dark:bg-bk-side px-8 py-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10">
                        <Spinner size="lg" />
                        <Typography variant="caption" className="font-medium text-slate-900 dark:text-bk-yellow text-[13px]">Processing...</Typography>
                      </div>
                    </div>
                  )}

                  <div className={`mt-2 ${(!authorizedHosts.includes(selectedHostUid) || isLoggingIntoHost) ? 'opacity-20 blur-[1px] pointer-events-none' : 'opacity-100'}`} id="db-tree-container">
                    <div className="px-3 flex items-center gap-3 mb-4 opacity-50">
                      <div className="h-px flex-1 bg-slate-200 dark:bg-white/5"></div>
                      <Typography variant="caption" className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[9px]">
                        {activeTab === 'db' ? 'Databases' : activeTab === 'broker' ? 'Brokers' : 'Logs'}
                      </Typography>
                      <div className="h-px flex-1 bg-slate-200 dark:bg-white/5"></div>
                    </div>

                    {activeTab === 'db' && (
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
                        onTableContextMenu={handleTableContextMenu}
                        onViewContextMenu={handleViewContextMenu}
                      />
                    )}
                    {activeTab === 'broker' && <BrokerTree hostUid={selectedHostUid} onContextMenu={handleBrokerContextMenu} />}
                    {activeTab === 'log' && <LogTree hostUid={selectedHostUid} />}
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
          <div className="px-4 py-2 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
            <Typography variant="caption" className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Server: {contextMenu.server}</Typography>
            <Icon name="dns" size="xs" className="opacity-30"  weight={300} />
          </div>
          <MenuItem
            icon="power_settings_new" iconColor="text-rose-500" label="Disconnect"
            onClick={() => {
              const hostUid = contextMenu.hostUid;
              dispatch(revokeHostLogin(hostUid));
              dispatch(closeHostTabs(hostUid));
              if (selectedHostUid === hostUid) {
                dispatch(setSelectedHost(null));
              }
              setContextMenu(null);
            }}
          />
          <MenuDivider />
          <MenuItem icon="add_box" label="Add Host" onClick={() => { onAddHost(); setContextMenu(null); }} />
          <MenuItem icon="edit" label="Edit Host" onClick={() => { dispatch(openEditHostModal(contextMenu.hostUid)); setContextMenu(null); }} />
          <MenuItem icon="delete" iconColor="text-rose-500" label="Delete Host" onClick={() => { dispatch(openDeleteHostModal({ hostUid: contextMenu.hostUid, alias: contextMenu.alias })); setContextMenu(null); }} />
          <MenuDivider />
          <MenuItem 
            icon="lock" 
            label="Change Password" 
            disabled={!(selectedHostUid === contextMenu.hostUid && authorizedHosts.includes(contextMenu.hostUid))}
            onClick={() => { dispatch(openChangePasswordModal(contextMenu.hostUid)); setContextMenu(null); }} 
          />
          <MenuItem icon="info" label="Server Version" onClick={() => { dispatch(openServerVersionModal(contextMenu.hostUid)); setContextMenu(null); }} />
        </ContextMenuWrapper>
      )}

      {dbContextMenu && (
        <ContextMenuWrapper x={dbContextMenu.mouseX} y={dbContextMenu.mouseY} onClose={() => setDbContextMenu(null)}>
          <div className="px-4 py-2 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
            <Typography variant="caption" className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Database: {dbContextMenu.db}</Typography>
            <Icon name="database" size="xs" className="opacity-30"  weight={300} />
          </div>
          {dbContextMenu.isActive ? (
            <MenuItem
              icon="stop"
              iconColor="text-rose-500"
              label="Stop Database"
              onClick={() => {
                dispatch(stopDatabase({ hostUid: selectedHostUid, dbname: dbContextMenu.db }))
                  .unwrap()
                  .then(() => dispatch(fetchDatabaseStartInfo(selectedHostUid)))
                  .catch((err) => dispatch(showStatusModal({ type: 'error', title: 'Action Failed', message: err })));
                setDbContextMenu(null);
              }}
            />
          ) : (
            <MenuItem
              icon="play_arrow"
              iconColor="text-emerald-500"
              label="Start Database"
              onClick={() => {
                dispatch(startDatabase({ hostUid: selectedHostUid, dbname: dbContextMenu.db }))
                  .unwrap()
                  .then(() => dispatch(fetchDatabaseStartInfo(selectedHostUid)))
                  .catch((err) => dispatch(showStatusModal({ type: 'error', title: 'Action Failed', message: err })));
                setDbContextMenu(null);
              }}
            />
          )}
          {dbContextMenu.isActive && !loggedInDatabases.includes(dbContextMenu.db) && (
            <MenuItem
              icon="login"
              label="Login Database"
              onClick={() => {
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
            <MenuItem icon="drive_file_rename_outline" iconColor="text-accent-orange" label="Rename Database" disabled={dbContextMenu.isActive} onClick={() => { dispatch(setSelectedDatabase(dbContextMenu.db)); dispatch(openRenameDatabaseModal()); setDbContextMenu(null); }} />
            <MenuItem icon="restore" label="Restore Database" disabled={dbContextMenu.isActive} onClick={() => { dispatch(setSelectedDatabase(dbContextMenu.db)); dispatch(openRestoreDatabaseModal()); setDbContextMenu(null); }} />
            <MenuItem icon="backup" label="Backup Database" onClick={() => { dispatch(setSelectedDatabase(dbContextMenu.db)); dispatch(openBackupDatabaseModal()); setDbContextMenu(null); }} />
            <MenuDivider />
            <MenuItem icon="delete" iconColor="text-accent-red" label="Delete Database" disabled={dbContextMenu.isActive} onClick={() => { dispatch(setSelectedDatabase(dbContextMenu.db)); dispatch(openDeleteDatabaseModal(dbContextMenu.db)); setDbContextMenu(null); }} />
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
          <div className="px-4 py-2 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
            <Typography variant="caption" className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">All Databases</Typography>
            <Icon name="database" size="xs" className="opacity-30"  weight={300} />
          </div>
          <MenuItem
            icon="play_circle"
            iconColor="text-emerald-500"
            label="Start All Databases"
            onClick={() => {
              databases.forEach(db => {
                if (!activeDatabases.includes(db.dbname)) {
                  dispatch(startDatabase({ hostUid: selectedHostUid, dbname: db.dbname }));
                }
              });
              setDbRootContextMenu(null);
            }}
          />
          <MenuItem
            icon="stop_circle"
            iconColor="text-rose-500"
            label="Stop All Databases"
            onClick={() => {
              activeDatabases.forEach(dbname => {
                dispatch(stopDatabase({ hostUid: selectedHostUid, dbname }));
              });
              setDbRootContextMenu(null);
            }}
          />
          <MenuItem
            icon="restart_alt"
            iconColor="text-amber-500"
            label="Restart All Databases"
            onClick={async () => {
              const currentActive = [...activeDatabases];
              for (const dbname of currentActive) {
                await dispatch(stopDatabase({ hostUid: selectedHostUid, dbname })).unwrap();
              }
              for (const dbname of currentActive) {
                await dispatch(startDatabase({ hostUid: selectedHostUid, dbname })).unwrap();
              }
              setDbRootContextMenu(null);
            }}
          />
          <MenuDivider />
          <MenuItem
            icon="add_circle"
            iconColor="text-emerald-500"
            label="Create Database"
            onClick={() => {
              dispatch(openCreateDatabaseModal());
              setDbRootContextMenu(null);
            }}
          />
          <MenuItem
            icon="refresh"
            label="Refresh"
            onClick={() => {
              dispatch(fetchDatabaseStartInfo(selectedHostUid));
              setDbRootContextMenu(null);
            }}
          />
          <MenuDivider />
          <MenuItem icon="tune" label="Properties" onClick={() => { dispatch(setSelectedDatabase(null)); dispatch(openDatabasePropertyModal()); setDbRootContextMenu(null); }} />
        </ContextMenuWrapper>
      )}

      {brokerRootContextMenu && (
        <ContextMenuWrapper x={brokerRootContextMenu.mouseX} y={brokerRootContextMenu.mouseY} onClose={() => setBrokerRootContextMenu(null)}>
          <div className="px-4 py-2 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
            <Typography variant="caption" className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">All Brokers</Typography>
            <Icon name="hub" size="xs" className="opacity-30"  weight={300} />
          </div>
          <MenuItem
            icon="play_circle"
            iconColor="text-emerald-500"
            label="Start All Brokers"
            onClick={() => {
              brokers.forEach(broker => {
                if (broker.state !== 'ON') {
                  dispatch(startBroker({ hostUid: selectedHostUid, brokerName: broker.name }));
                }
              });
              setBrokerRootContextMenu(null);
            }}
          />
          <MenuItem
            icon="stop_circle"
            iconColor="text-rose-500"
            label="Stop All Brokers"
            onClick={() => {
              brokers.forEach(broker => {
                if (broker.state === 'ON') {
                  dispatch(stopBroker({ hostUid: selectedHostUid, brokerName: broker.name }));
                }
              });
              setBrokerRootContextMenu(null);
            }}
          />
          <MenuItem
            icon="restart_alt"
            iconColor="text-amber-500"
            label="Restart All Brokers"
            onClick={async () => {
              const currentActive = brokers.filter(b => b.state === 'ON').map(b => b.name);
              for (const name of currentActive) {
                await dispatch(stopBroker({ hostUid: selectedHostUid, brokerName: name })).unwrap();
              }
              for (const name of currentActive) {
                await dispatch(startBroker({ hostUid: selectedHostUid, brokerName: name })).unwrap();
              }
              setBrokerRootContextMenu(null);
            }}
          />
          <MenuDivider />
          <MenuItem
            icon="settings"
            label="Edit Broker Config"
            onClick={() => {
              if (selectedHostUid) {
                dispatch(openTab(`broker_config:${selectedHostUid}`));
              }
              setBrokerRootContextMenu(null);
            }}
          />
          <MenuItem
            icon="info"
            label="Show Status"
            onClick={() => {
              if (selectedHostUid) {
                dispatch(openTab(`brokers_status:${selectedHostUid}`));
              }
              setBrokerRootContextMenu(null);
            }}
          />
          <MenuItem
            icon="refresh"
            label="Refresh"
            onClick={() => {
              dispatch(fetchBrokerList(selectedHostUid));
              setBrokerRootContextMenu(null);
            }}
          />
        </ContextMenuWrapper>
      )}

      {brokerContextMenu && (
        <ContextMenuWrapper x={brokerContextMenu.mouseX} y={brokerContextMenu.mouseY} onClose={() => setBrokerContextMenu(null)}>
          <div className="px-4 py-2 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
            <Typography variant="caption" className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Broker: {brokerContextMenu.broker}</Typography>
            <Icon name="hub" size="xs" className="opacity-30"  weight={300} />
          </div>
          {brokerContextMenu.state === 'ON' ? (
            <MenuItem
              icon="stop"
              iconColor="text-rose-500"
              label="Stop Broker"
              onClick={() => {
                dispatch(stopBroker({ hostUid: selectedHostUid, brokerName: brokerContextMenu.broker }))
                  .unwrap()
                  .then(() => dispatch(fetchBrokerList(selectedHostUid)))
                  .catch((err) => dispatch(showStatusModal({ type: 'error', title: 'Action Failed', message: err })));
                setBrokerContextMenu(null);
              }}
            />
          ) : (
            <MenuItem
              icon="play_arrow"
              iconColor="text-emerald-500"
              label="Start Broker"
              onClick={() => {
                dispatch(startBroker({ hostUid: selectedHostUid, brokerName: brokerContextMenu.broker }))
                  .unwrap()
                  .then(() => dispatch(fetchBrokerList(selectedHostUid)))
                  .catch((err) => dispatch(showStatusModal({ type: 'error', title: 'Action Failed', message: err })));
                setBrokerContextMenu(null);
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

      {usersContextMenu && (
        <ContextMenuWrapper x={usersContextMenu.mouseX} y={usersContextMenu.mouseY} onClose={() => setUsersContextMenu(null)}>
          <div className="px-4 py-2 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
             <Typography variant="caption" className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Users: {usersContextMenu.db}</Typography>
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
          <div className="px-4 py-2 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
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
            iconColor="text-rose-500"
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
          <div className="px-4 py-2 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
            <Typography variant="caption" className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Backup Plan</Typography>
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
          <div className="px-4 py-2 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
            <Typography variant="caption" className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Space: {spaceContextMenu.db}</Typography>
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
          <div className="px-4 py-2 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
            <Typography variant="caption" className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Backup: {backupItemContextMenu.planId}</Typography>
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
            iconColor="text-rose-500"
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
          <div className="px-4 py-2 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
            <Typography variant="caption" className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Query Plan: {queryPlanContextMenu.db}</Typography>
            <Icon name="bolt" size="xs" className="opacity-30"  weight={300} />
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
          <div className="px-4 py-2 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
            <Typography variant="caption" className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Query Plan Item: {queryItemContextMenu.qId}</Typography>
            <Icon name="bolt" size="xs" className="opacity-30"  weight={300} />
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
            iconColor="text-rose-500"
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
      {tableContextMenu && (
        <ContextMenuWrapper x={tableContextMenu.mouseX} y={tableContextMenu.mouseY} onClose={() => setTableContextMenu(null)}>
          <div className="px-4 py-2 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
            <div className="flex flex-col">
              <Typography variant="caption" className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest text-[9px] truncate">{tableContextMenu.table}</Typography>
              <Typography variant="label" className="text-[8px] text-slate-400 font-mono mt-0.5">{tableContextMenu.db}</Typography>
            </div>
            <Icon name="table_rows" size="xs" className="opacity-30" weight={300} />
          </div>
          <MenuItem 
            icon="info" 
            label="Show Info" 
            onClick={() => {
              dispatch(openTab(`table_info:${selectedHostUid}:${tableContextMenu.db}:${tableContextMenu.table}`));
              setTableContextMenu(null);
            }} 
          />
          <MenuItem icon="grid_on" label="View Data" />
          <MenuItem icon="edit" label="Edit Table" />
          <MenuDivider />
          <MenuItem icon="key" label="Indices" />
          <MenuItem icon="link" label="Foreign Keys" />
          <MenuDivider />
          <MenuItem icon="difference" label="Rename Table" />
          <MenuItem icon="delete_forever" iconColor="text-rose-500" label="Drop Table" />
        </ContextMenuWrapper>
      )}

      {viewContextMenu && (
        <ContextMenuWrapper x={viewContextMenu.mouseX} y={viewContextMenu.mouseY} onClose={() => setViewContextMenu(null)}>
          <div className="px-4 py-2 border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
            <div className="flex flex-col">
              <Typography variant="caption" className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest text-[9px] truncate">{viewContextMenu.view}</Typography>
              <Typography variant="label" className="text-[8px] text-slate-400 font-mono mt-0.5">{viewContextMenu.db}</Typography>
            </div>
            <Icon name="grid_view" size="xs" className="opacity-30" weight={300} />
          </div>
          <MenuItem 
            icon="info" 
            label="Show Info" 
            onClick={() => {
              dispatch(openTab(`view_info:${selectedHostUid}:${viewContextMenu.db}:${viewContextMenu.view}`));
              setViewContextMenu(null);
            }} 
          />
          <MenuItem icon="grid_on" label="View Data" />
          <MenuDivider />
          <MenuItem icon="delete_forever" iconColor="text-rose-500" label="Drop View" />
        </ContextMenuWrapper>
      )}

      <AutoQueryLogModal />
      <AddQueryPlanModal />
      <SetAutomationVolumeModal />
      <EditQueryPlanModal />
      <DeleteQueryPlanModal />
      <AutoVolumeLogModal />
    </>
  );
}
