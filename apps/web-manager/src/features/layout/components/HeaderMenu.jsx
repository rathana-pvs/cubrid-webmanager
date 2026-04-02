import { RefreshingOverlay } from '../../../components/ds/feedback/RefreshingOverlay';
import { useState } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { DropdownMenu, SubMenu, MenuItem, MenuDivider } from '../../../components/common/DropdownMenu';
import { openTab, showStatusModal, setActiveMainTab } from '../layoutSlice';
import { openAddHostModal, openEditHostModal, startService, stopService, openServerVersionModal, openImportExportModal } from '../../host/hostSlice';
import { startDatabase, stopDatabase, fetchDatabaseStartInfo } from '../../database/databaseSlice';
import { startBroker, stopBroker, fetchBrokerList } from '../../broker/brokerSlice';
import { setAboutCubrid } from '../appBarSlice';
import { Typography } from '../../../components/ds/foundation/Typography';
import { useActionState } from '../../../infrastructure/hooks/useActionState';
import { Modal } from '../../../components/ds/layout/Modal';
import { ModalStatusError } from '../../../components/ds/feedback/ActionStatus';

export default function HeaderMenu() {
  const dispatch = useDispatch();
  const { selectedHostUid } = useSelector((state) => state.host, shallowEqual);
  const { selectedDatabase, activeDatabases } = useSelector((state) => state.database, shallowEqual);
  const { brokers, selectedBroker } = useSelector((state) => state.broker, shallowEqual);

  const { 
    startAction, 
    endError, 
    resetAction,
    isLoading: menuActionLoading,
    isError: isMenuActionError,
    error: menuActionError
  } = useActionState();

  const [loadingTitle, setLoadingTitle] = useState('Processing...');

  const handleServiceAction = async (action) => {
    if (!selectedHostUid) return;
    setLoadingTitle(`${action === 'start' ? 'Starting' : 'Stopping'} Service`);
    startAction();
    try {
      if (action === 'start') {
        await dispatch(startService(selectedHostUid)).unwrap();
      } else {
        await dispatch(stopService(selectedHostUid)).unwrap();
      }
      resetAction();
    } catch (err) {
      endError(err);
    }
  };

  const handleDatabaseAction = async (action) => {
    if (!selectedDatabase) return;
    setLoadingTitle(`${action === 'start' ? 'Starting' : 'Stopping'} database : ${selectedDatabase}`);
    startAction();
    try {
      if (action === 'start') {
        await dispatch(startDatabase({ hostUid: selectedHostUid, dbname: selectedDatabase })).unwrap();
      } else {
        await dispatch(stopDatabase({ hostUid: selectedHostUid, dbname: selectedDatabase })).unwrap();
      }
      dispatch(fetchDatabaseStartInfo(selectedHostUid));
      resetAction();
    } catch (err) {
      endError(err);
    }
  };

  const handleBrokerAction = async (action) => {
    if (!selectedBroker) return;
    setLoadingTitle(`${action === 'start' ? 'Starting' : 'Stopping'} Broker: ${selectedBroker}`);
    startAction();
    try {
      if (action === 'start') {
        await dispatch(startBroker({ hostUid: selectedHostUid, brokerName: selectedBroker })).unwrap();
      } else {
        await dispatch(stopBroker({ hostUid: selectedHostUid, brokerName: selectedBroker })).unwrap();
      }
      dispatch(fetchBrokerList(selectedHostUid));
      resetAction();
    } catch (err) {
      endError(err);
    }
  };

  const handleExport = () => {
    dispatch(openImportExportModal('export'));
  };

  const handleImport = () => {
    dispatch(openImportExportModal('import'));
  };

  const MenuLabel = ({ children }) => (
    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide group-hover:text-amber-500 transition-colors">
      {children}
    </span>
  );

  return (
    <nav className="flex items-center gap-6 font-sans">
      {/* Loading Overlay - Using direct fixed component call */}
      {menuActionLoading && (
        <RefreshingOverlay 
          show={true} 
          title={loadingTitle} 
          className="fixed z-[10002]"
        />
      )}

      <DropdownMenu label={<MenuLabel>File</MenuLabel>}>
        <MenuItem
          icon="add_box"
          label="Add Host"
          onClick={() => dispatch(openAddHostModal())}
        />
        <MenuItem
          icon="edit"
          label="Change Host"
          disabled={!selectedHostUid}
          onClick={() => dispatch(openEditHostModal(selectedHostUid))}
        />
        <MenuItem
          icon="file_upload"
          label="Export Host"
          onClick={handleExport}
        />
        <MenuItem
          icon="file_download"
          label="Import Host"
          onClick={handleImport}
        />
      </DropdownMenu>

      <DropdownMenu label={<MenuLabel>Tool</MenuLabel>} width="w-56">
        <MenuItem
          icon="space_dashboard"
          label="Service Dashboard"
          onClick={() => dispatch(openTab('service_dashboard'))}
        />
        <MenuDivider />
        <MenuItem
          icon="play_arrow"
          label="Start Service"
          disabled={!selectedHostUid || menuActionLoading}
          onClick={() => handleServiceAction('start')}
        />
        <MenuItem
          icon="stop"
          label="Stop Service"
          disabled={!selectedHostUid || menuActionLoading}
          onClick={() => handleServiceAction('stop')}
        />
        <MenuDivider />
        <MenuItem
          icon="database"
          label="Start Database"
          disabled={!selectedDatabase || activeDatabases.includes(selectedDatabase) || menuActionLoading}
          onClick={() => handleDatabaseAction('start')}
        />
        <MenuItem
          icon="database_off"
          label="Stop Database"
          disabled={!selectedDatabase || !activeDatabases.includes(selectedDatabase) || menuActionLoading}
          onClick={() => handleDatabaseAction('stop')}
        />
        <MenuDivider />
        <MenuItem
          icon="hub"
          label="Start Broker"
          disabled={!selectedBroker || brokers.find(b => b.name === selectedBroker)?.state === 'ON' || menuActionLoading}
          onClick={() => handleBrokerAction('start')}
        />
        <MenuItem
          icon="hub"
          label="Stop Broker"
          disabled={!selectedBroker || brokers.find(b => b.name === selectedBroker)?.state !== 'ON' || menuActionLoading}
          onClick={() => handleBrokerAction('stop')}
        />
      </DropdownMenu>

      <DropdownMenu label={<MenuLabel>Action</MenuLabel>} width="w-48">
        <MenuItem icon="tune" label="Properties" href="#" />
        <SubMenu icon="settings" label="Config Param" width="w-56" gap="ml-3">
          <MenuItem
            icon="edit_document"
            label="Edit Cubrid Config"
            onClick={() => {
              if (selectedHostUid) {
                dispatch(openTab(`edit_config:${selectedHostUid}:cubridconf`));
              } else {
                dispatch(showStatusModal({ type: 'info', title: 'No host selected', message: 'Please select a host from the sidebar first.' }));
              }
            }}
          />
          <MenuItem
            icon="edit_note"
            label="Edit Broker Config"
            onClick={() => {
              if (selectedHostUid) {
                dispatch(openTab(`broker_config:${selectedHostUid}`));
              } else {
                dispatch(showStatusModal({ type: 'info', title: 'No host selected', message: 'Please select a host from the sidebar first.' }));
              }
            }}
          />
          <MenuItem
            icon="manage_accounts"
            label="Edit CM Config"
            onClick={() => {
              if (selectedHostUid) {
                dispatch(openTab(`edit_config:${selectedHostUid}:cmconf`));
              } else {
                dispatch(showStatusModal({ type: 'info', title: 'No host selected', message: 'Please select a host from the sidebar first.' }));
              }
            }}
          />
        </SubMenu>
      </DropdownMenu>

      <DropdownMenu label={<MenuLabel>Help</MenuLabel>} width="w-56">
        <MenuItem
          icon="help"
          label="Help"
          onClick={() => window.open('https://www.cubrid.org/', '_blank')}
        />
        <MenuItem
          icon="bug_report"
          label="Report Bug"
          onClick={() => window.open('http://jira.cubrid.org/secure/Dashboard.jspa', '_blank')}
        />
        <MenuItem
          icon="forum"
          label="CUBRID Online Forum"
          onClick={() => window.open('https://www.reddit.com/r/CUBRID/', '_blank')}
        />
        <MenuItem
          icon="code"
          label="CUBRID tools developments"
          onClick={() => window.open('https://github.com/CUBRID/cubrid-manager', '_blank')}
        />
        <MenuDivider />
        <MenuItem
          icon="update"
          label="Check for Updates"
          disabled={true}
          onClick={() => {}}
        />
        <MenuItem
          icon="info"
          label="Server Version"
          disabled={!selectedHostUid}
          onClick={() => dispatch(openServerVersionModal(selectedHostUid))}
        />
        <MenuItem
          icon="admin_panel_settings"
          label="About CUBRID Admin"
          onClick={() => dispatch(setAboutCubrid(true))}
        />
      </DropdownMenu>
      {isMenuActionError && (
        <Modal isOpen title="Action Failed" icon="error" iconVariant="danger" onClose={resetAction} maxWidth="400px">
          <ModalStatusError 
            title="Update Interrupted"
            error={menuActionError}
            onRetry={resetAction}
            onCancel={resetAction}
            retryText="Dismiss"
          />
        </Modal>
      )}
    </nav>
  );
}
