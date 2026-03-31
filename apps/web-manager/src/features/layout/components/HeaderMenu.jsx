import { useDispatch, useSelector } from 'react-redux';
import { DropdownMenu, SubMenu, MenuItem, MenuDivider } from '../../../components/common/DropdownMenu';
import { openTab, showStatusModal, setActiveMainTab } from '../layoutSlice';
import { openAddHostModal, openEditHostModal, startService, stopService, openServerVersionModal, openImportExportModal } from '../../host/hostSlice';
import { startDatabase, stopDatabase, fetchDatabaseStartInfo } from '../../database/databaseSlice';
import { startBroker, stopBroker, fetchBrokerList } from '../../broker/brokerSlice';
import { setAboutCubrid } from '../appBarSlice';
import { Typography } from '../../../components/ds/foundation/Typography';

export default function HeaderMenu() {
  const dispatch = useDispatch();
  const { selectedHostUid } = useSelector((state) => state.host);
  const { selectedDatabase, activeDatabases } = useSelector((state) => state.database);
  const { brokers, selectedBroker } = useSelector((state) => state.broker);

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
          disabled={!selectedHostUid}
          onClick={() => dispatch(startService(selectedHostUid))}
        />
        <MenuItem
          icon="stop"
          label="Stop Service"
          disabled={!selectedHostUid}
          onClick={() => dispatch(stopService(selectedHostUid))}
        />
        <MenuDivider />
        <MenuItem
          icon="database"
          label="Start Database"
          disabled={!selectedDatabase || activeDatabases.includes(selectedDatabase)}
          onClick={() => {
            dispatch(startDatabase({ hostUid: selectedHostUid, dbname: selectedDatabase }))
              .unwrap()
              .then(() => {
                dispatch(fetchDatabaseStartInfo(selectedHostUid));
              })
              .catch((err) => {
                dispatch(showStatusModal({ type: 'error', title: 'Action Failed', message: err }));
              });
          }}
        />
        <MenuItem
          icon="database_off"
          label="Stop Database"
          disabled={!selectedDatabase || !activeDatabases.includes(selectedDatabase)}
          onClick={() => {
            dispatch(stopDatabase({ hostUid: selectedHostUid, dbname: selectedDatabase }))
              .unwrap()
              .then(() => {
                dispatch(fetchDatabaseStartInfo(selectedHostUid));
              })
              .catch((err) => {
                dispatch(showStatusModal({ type: 'error', title: 'Action Failed', message: err }));
              });
          }}
        />
        <MenuDivider />
        <MenuItem
          icon="hub"
          label="Start Broker"
          disabled={!selectedBroker || brokers.find(b => b.name === selectedBroker)?.state === 'ON'}
          onClick={() => {
            dispatch(startBroker({ hostUid: selectedHostUid, brokerName: selectedBroker }))
              .unwrap()
              .then(() => {
                dispatch(fetchBrokerList(selectedHostUid));
              })
              .catch((err) => {
                dispatch(showStatusModal({ type: 'error', title: 'Action Failed', message: err }));
              });
          }}
        />
        <MenuItem
          icon="hub"
          label="Stop Broker"
          disabled={!selectedBroker || brokers.find(b => b.name === selectedBroker)?.state !== 'ON'}
          onClick={() => {
            dispatch(stopBroker({ hostUid: selectedHostUid, brokerName: selectedBroker }))
              .unwrap()
              .then(() => {
                dispatch(fetchBrokerList(selectedHostUid));
              })
              .catch((err) => {
                dispatch(showStatusModal({ type: 'error', title: 'Action Failed', message: err }));
              });
          }}
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
    </nav>
  );
}
