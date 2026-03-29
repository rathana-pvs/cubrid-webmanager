import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom';
import { toggleTheme, toggleSidebar, setIsResizing, setActiveMainTab, closeTab, closeOtherTabs, closeAllTabs } from '../features/layout/layoutSlice';
import { openAddHostModal, closeAddHostModal, setSelectedHost } from '../features/host/hostSlice';
import { setSelectedDatabase } from '../features/database/databaseSlice';
import { closeCreateUserModal, closeEditUserModal, closeDropUserModal } from '../features/user/userSlice';
import Sidebar from '../features/layout/components/Sidebar';
import Header from '../features/layout/components/Header';
import Breadcrumb from '../features/layout/components/Breadcrumb';
import Footer from '../features/layout/components/Footer';
import AddHostModal from '../features/host/components/AddHostModal';
import ServerContent from '../features/server/components/ServerContent';
import DatabaseDashboard from '../features/database/components/DatabaseDashboard';
import DatabaseSpaceMonitor from '../features/database/components/DatabaseSpaceMonitor';
import VolumeInfoMonitor from '../features/database/components/VolumeInfoMonitor';
import VolumeCategoryMonitor from '../features/database/components/VolumeCategoryMonitor';
import CubridConfigEditor from '../features/server/components/CubridConfigEditor';
import BrokerConfigEditor from '../features/server/components/BrokerConfigEditor';
import { SplitPane } from '../components/ds/layout/SplitPane';
import UnloadDatabaseModal from '../features/database/components/UnloadDatabaseModal';
import LoadDatabaseModal from '../features/database/components/LoadDatabaseModal';
import DeleteDatabaseModal from '../features/database/components/DeleteDatabaseModal';
import OptimizeDatabaseModal from '../features/database/components/OptimizeDatabaseModal';
import CheckDatabaseModal from '../features/database/components/CheckDatabaseModal';
import CompactDatabaseModal from '../features/database/components/CompactDatabaseModal';
import CopyDatabaseModal from '../features/database/components/CopyDatabaseModal';
import BackupDatabaseModal from '../features/database/components/BackupDatabaseModal';
import AddBackupPlanModal from '../features/database/components/AddBackupPlanModal';
import AutoBackupLogModal from '../features/database/components/AutoBackupLogModal';
import DeleteBackupPlanModal from '../features/database/components/DeleteBackupPlanModal';
import DatabaseInfoModal from '../features/database/components/DatabaseInfoModal';
import DatabasePlanDumpModal from '../features/database/components/DatabasePlanDumpModal';
import CreateDatabaseModal from '../features/database/components/CreateDatabaseModal';
import EditBackupPlanModal from '../features/database/components/EditBackupPlanModal';
import LoginDatabaseModal from '../features/database/components/LoginDatabaseModal';
import RestoreDatabaseModal from '../features/database/components/RestoreDatabaseModal';
import SetAutomationVolumeModal from '../features/database/components/SetAutomationVolumeModal';
import AutoVolumeLogModal from '../features/database/components/AutoVolumeLogModal';
import AddQueryPlanModal from '../features/database/components/AddQueryPlanModal';
import AutoQueryLogModal from '../features/database/components/AutoQueryLogModal';

import LockInformationModal from '../features/database/components/LockInformationModal';
import UnloadResultModal from '../features/database/components/UnloadResultModal';
import TransactionInfoModal from '../features/database/components/TransactionInfoModal';
import KillTransactionModal from '../features/database/components/KillTransactionModal';
import DeleteHostModal from '../features/host/components/DeleteHostModal';
import EditHostModal from '../features/host/components/EditHostModal';
import ServerVersionModal from '../features/host/components/ServerVersionModal';
import LoginPage from '../features/auth/components/LoginPage';
import RegisterPage from '../features/auth/components/RegisterPage';
import ForgotPasswordPage from '../features/auth/components/ForgotPasswordPage';
import StatusModal from '../components/common/StatusModal';
import LoadingOverlay from '../components/common/LoadingOverlay';
import LogViewer from '../features/broker/components/LogViewer';
import CMSLogViewer from '../features/broker/components/CMSLogViewer';
import BrokerStatus from '../features/broker/components/BrokerStatus';
import BrokerPropertyModal from '../features/broker/components/BrokerPropertyModal';
import Brokers from '../features/server/components/Brokers';

import CreateUserModal from '../features/user/components/CreateUserModal';
import DropUserModal from '../features/user/components/DropUserModal';
import MonitoringProvider from '../features/layout/components/MonitoringProvider';
import ImportExportHostModal from '../features/host/components/ImportExportHostModal';
import DatabasePropertyModal from '../features/database/components/DatabasePropertyModal';
import RenameDatabaseModal from '../features/database/components/RenameDatabaseModal';
import AddVolumeModal from '../features/database/components/AddVolumeModal';

import { Icon } from '../components/ds/foundation/Icon';

function DashboardLayout() {
  const dispatch = useDispatch();
  const { loading: dbCoreLoading } = useSelector((state) => state.database);
  const { actionLoading: dbUILoading } = useSelector((state) => state.databaseUI);
  const { operationLoading: dbOpLoading } = useSelector((state) => state.databaseOperation);
  const dbActionLoading = dbCoreLoading || dbOpLoading || dbUILoading;
  const { theme, isSidebarCollapsed, isResizing, activeMainTab, openTabs } = useSelector((state) => state.layout);
  const { isAddHostModalOpen, hosts, isServiceOperating, serviceOperationType, serviceProgressMessage } = useSelector((state) => state.host);
  const { isCreateUserModalOpen, createUserDbName, isEditUserModalOpen, editUserData, isDropUserModalOpen } = useSelector((state) => state.user);
  const { actionLoading: brokerActionLoading } = useSelector((state) => state.broker);
  const tabLabels = openTabs.reduce((acc, tabId) => {
    if (tabId.startsWith('host:')) {
      const uid = tabId.split(':')[1];
      const host = hosts.find(h => h.uid === uid);
      acc[tabId] = host ? (host.alias || host.id) : uid;
    } else if (tabId.startsWith('db:')) {
      acc[tabId] = tabId.split(':')[1];
    } else if (tabId.startsWith('edit_config:')) {
      acc[tabId] = `Edit ${tabId.split(':')[2]}`;
    } else if (tabId.startsWith('broker_config:')) {
      acc[tabId] = 'Broker Config';
    } else if (tabId.startsWith('log:')) {
      const parts = tabId.split(':');
      const path = parts[parts.length - 1];
      acc[tabId] = path.split('/').pop();
    } else if (tabId.startsWith('cms-access:')) {
      acc[tabId] = 'Manager Access';
    } else if (tabId.startsWith('cms-error:')) {
      acc[tabId] = 'Manager Error';
    } else if (tabId.startsWith('broker_status:')) {
      acc[tabId] = `Status: ${tabId.split(':')[2]}`;
    } else if (tabId.startsWith('brokers_status:')) {
      acc[tabId] = 'Brokers Status';
    } else if (tabId.startsWith('db_space:')) {
      acc[tabId] = `Space: ${tabId.split(':')[2]}`;
    } else if (tabId.startsWith('vol_info:')) {
      const fullPath = tabId.split(':')[3];
      acc[tabId] = `Volume: ${fullPath.split(/[\\/]/).pop()}`;
    } else if (tabId.startsWith('vol_category:')) {
      const category = tabId.split(':')[3];
      acc[tabId] = `Volumes: ${category.replace(/_/g, ' ')}`;
    }

    return acc;
  }, {});

  // Sync global selection with active tab
  useEffect(() => {
    if (activeMainTab) {
      if (activeMainTab.startsWith('host:')) {
        dispatch(setSelectedHost(activeMainTab.split(':')[1]));
      } else if (activeMainTab.startsWith('db:')) {
        dispatch(setSelectedDatabase(activeMainTab.split(':')[1]));
      }
    }
  }, [activeMainTab, dispatch]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <MonitoringProvider>
      <div className={`h-screen overflow-hidden ${isResizing ? 'select-none' : ''}`}>
        <SplitPane split="vertical" defaultSize={288} minSize={200} maxSize={600} className="h-full w-full">
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => dispatch(toggleSidebar())}
            onResizeChange={(val) => dispatch(setIsResizing(val))}
            onAddHost={() => dispatch(openAddHostModal())}
          />

          <main className="w-full h-full flex flex-col bg-background-light dark:bg-bk-main overflow-hidden">

            <Header theme={theme} toggleTheme={() => dispatch(toggleTheme())} />
          <div className="shrink-0 bg-slate-50 dark:bg-bk-main">

            <Breadcrumb
              activeTab={activeMainTab}
              openTabs={openTabs}
              labels={tabLabels}
              onTabChange={(tabId) => dispatch(setActiveMainTab(tabId))}
              onCloseTab={(tab) => dispatch(closeTab(tab))}
              onCloseOthers={(tabId) => dispatch(closeOtherTabs(tabId))}
              onCloseAll={() => dispatch(closeAllTabs())}
            />
          </div>


          {openTabs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-white dark:bg-bk-main select-none">

              {/* Grid background */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
              />
              <div className="absolute inset-0 dark:block hidden pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
              />

              {/* Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-400/5 dark:bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center gap-14 max-w-md mt-[-40px]">


                {/* Icon cluster */}
                <div className="relative flex items-center justify-center">
                  {/* Orbit ring 1 */}
                  <div className="absolute w-28 h-28 rounded-full border border-dashed border-amber-500/15 dark:border-amber-500/20 animate-[spin_18s_linear_infinite]" />
                  {/* Orbit ring 2 */}
                  <div className="absolute w-40 h-40 rounded-full border border-slate-200 dark:border-white/6 animate-[spin_30s_linear_infinite_reverse]" />

                  {/* Central badge */}
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-white/4 border border-slate-200 dark:border-white/8 shadow-lg flex items-center justify-center">
                    <Icon name="database" weight={300} size="28px" className="text-amber-500" />
                  </div>

                  {/* Satellite dot – top right */}
                  <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-emerald-400/80 border-2 border-white dark:border-bk-main shadow-xs shadow-emerald-500/30" />
                  {/* Satellite dot – bottom left */}
                  <div className="absolute bottom-3 left-3 w-2 h-2 rounded-full bg-amber-500/50" />
                </div>

                {/* Text */}
                <div className="text-center space-y-2">
                  <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight uppercase">
                    CUBRID Manager
                  </h2>
                  <p className="text-[12px] text-slate-400 dark:text-slate-500 max-w-[260px] leading-relaxed">
                    Select a host from the sidebar to start monitoring databases, brokers, and logs.
                  </p>
                </div>

                {/* Feature pills */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {[
                    { icon: 'dns', label: 'Host Management' },
                    { icon: 'storage', label: 'Volume Monitor' },
                    { icon: 'analytics', label: 'Performance' },
                    { icon: 'lock', label: 'Lock Info' },
                  ].map(f => (
                    <div key={f.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/4 border border-slate-200 dark:border-white/6">
                      <Icon name={f.icon} size="13px" weight={300} className="text-slate-400 dark:text-slate-500" />
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{f.label}</span>
                    </div>
                  ))}
                </div>

                {/* Status bar */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-white/6 bg-slate-50 dark:bg-white/2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">System Ready</span>
                </div>

              </div>
            </div>

          ) : (
            openTabs.map((tabId) => {
              const isActive = tabId === activeMainTab;
              const isHost = tabId.startsWith('host:');
              const isDb = tabId.startsWith('db:');
              const isEditConfig = tabId.startsWith('edit_config:');
              const isBrokerConfig = tabId.startsWith('broker_config:');
              const isLogViewer = tabId.startsWith('log:');
              const isCmsAccessLog = tabId.startsWith('cms-access:');
              const isCmsErrorLog = tabId.startsWith('cms-error:');
              const isBrokerStatus = tabId.startsWith('broker_status:');
              const isBrokersStatus = tabId.startsWith('brokers_status:');
              const isDbSpace = tabId.startsWith('db_space:');

              const resourceId = tabId.split(':')[1];

              return (
                <div key={tabId} className={`flex-1 flex flex-col overflow-hidden ${isActive ? '' : 'hidden'}`}>
                  {isHost && <ServerContent hostUid={resourceId} />}
                  {isDb && <DatabaseDashboard dbname={resourceId} />}
                  {isDbSpace && (
                    <DatabaseSpaceMonitor 
                      hostUid={tabId.split(':')[1]} 
                      dbname={tabId.split(':')[2]} 
                    />
                  )}
                  {tabId.startsWith('vol_info:') && (
                    <VolumeInfoMonitor tabId={tabId} />
                  )}
                  {tabId.startsWith('vol_category:') && (
                    <VolumeCategoryMonitor 
                      hostUid={tabId.split(':')[1]}
                      dbname={tabId.split(':')[2]}
                      category={tabId.split(':')[3]}
                    />
                  )}
                  {isEditConfig && (
                    <CubridConfigEditor
                      hostUid={resourceId}
                      confname={tabId.split(':')[2]}
                    />
                  )}
                  {isBrokerConfig && (
                    <BrokerConfigEditor
                      hostUid={resourceId}
                    />
                  )}
                  {isLogViewer && (
                    <LogViewer
                      hostUid={tabId.split(':')[1]}
                      path={tabId.split(':').slice(2).join(':')}
                    />
                  )}
                  {isCmsAccessLog && (
                    <CMSLogViewer
                      hostUid={tabId.split(':')[1]}
                      type="access"
                    />
                  )}
                  {isCmsErrorLog && (
                    <CMSLogViewer
                      hostUid={tabId.split(':')[1]}
                      type="error"
                    />
                  )}
                  {isBrokerStatus && (
                    <BrokerStatus
                      hostUid={tabId.split(':')[1]}
                      brokerName={tabId.split(':')[2]}
                    />
                  )}
                  {isBrokersStatus && (
                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-bk-main">
                      <Brokers hostUid={tabId.split(':')[1]} />
                    </div>
                  )}

                </div>
              );
            })
          )}

          <Footer />
          </main>
        </SplitPane>

        <AddHostModal
          isOpen={isAddHostModalOpen}
          onClose={() => dispatch(closeAddHostModal())}
        />
        <DeleteHostModal />
        <EditHostModal />
        <ServerVersionModal />
        <ImportExportHostModal />

        <UnloadDatabaseModal />
        <LoadDatabaseModal />
        <DeleteDatabaseModal />
        <CheckDatabaseModal />
        <CompactDatabaseModal />
        <OptimizeDatabaseModal />
        <CopyDatabaseModal />
        <BackupDatabaseModal />
        <AddBackupPlanModal />
        <AutoBackupLogModal />
        <DeleteBackupPlanModal />
        <EditBackupPlanModal />
        <CreateDatabaseModal />
        <LoginDatabaseModal />
        <RestoreDatabaseModal />
        <SetAutomationVolumeModal />
        <AutoVolumeLogModal />
        <AddQueryPlanModal />
        <AutoQueryLogModal />

        <LockInformationModal />
        <UnloadResultModal />
        <TransactionInfoModal />
        <KillTransactionModal />
        <CreateUserModal
          isOpen={isCreateUserModalOpen}
          onClose={() => dispatch(closeCreateUserModal())}
          dbname={createUserDbName}
        />
        <CreateUserModal
          isOpen={isEditUserModalOpen}
          onClose={() => dispatch(closeEditUserModal())}
          dbname={editUserData?.dbname}
          editingUser={editUserData?.userName}
        />
        <DropUserModal />
        <DatabasePropertyModal />
        <DatabaseInfoModal />
        <DatabasePlanDumpModal />
        <RenameDatabaseModal />
        <BrokerPropertyModal />
        <AddVolumeModal />
        <StatusModal />

        <LoadingOverlay 
          isVisible={isServiceOperating || dbActionLoading || brokerActionLoading} 
          title={
            isServiceOperating 
              ? (serviceOperationType === 'start' ? 'Starting CUBRID Service' : 'Stopping CUBRID Service')
              : (dbActionLoading ? 'Database Action' : 'Broker Action')
          }
          subtitle={
            isServiceOperating
              ? (serviceProgressMessage || `Please wait while we ${serviceOperationType === 'start' ? 'start' : 'stop'} all brokers and databases...`)
              : "Processing your request, please wait..."
          }
        />
      </div>
    </MonitoringProvider>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
