import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { 
  setSelectedDatabase, 
  setSelectedDatabaseSubItem, 
  fetchBackupSchedule, 
  fetchQueryPlan,
  openLoginDatabaseModal,
  loginDatabase,
  fetchDatabaseSpaceInfo,
} from '../../../database/databaseSlice';
import { 
  fetchDatabaseParamDump, 
  fetchDatabasePlanDump, 
  fetchDatabaseClasses, 
  fetchAutoVolumeConfig 
} from '../../../database/databaseConfigurationSlice';
import { fetchDatabaseUsers } from '../../../user/userSlice';
import { openTab } from '../../layoutSlice';
import { TreeNode } from '../../../../components/domain/tree/TreeNode';
import { Skeleton } from '../../../../components/ds/layout/Skeleton';
import { Icon } from '../../../../components/ds/foundation/Icon';
import { Typography } from '../../../../components/ds/foundation/Typography';
import { Spinner } from '../../../../components/ds/foundation/Spinner';

// Granular selectors to avoid unnecessary re-renders when dashboard data or other slice state changes
const selectDatabases = (state) => state.database.databases || [];
const selectActiveDatabases = (state) => state.database.activeDatabases || [];
const selectLoading = (state) => state.database.loading;
const selectSelection = (state) => ({
  selectedDatabase: state.database.selectedDatabase,
  selectedDatabaseSubItem: state.database.selectedDatabaseSubItem
});
const selectStatusStates = (state) => ({
  loggedInDatabases: state.database.loggedInDatabases || [],
  loggingInDatabases: state.database.loggingInDatabases || {},
  backupSchedules: state.databaseOperation.backupSchedules,
  backupSchedulesLoading: state.databaseOperation.backupSchedulesLoading,
  queryPlans: state.databaseOperation.queryPlans,
  queryPlansLoading: state.databaseOperation.queryPlansLoading,
  spaceInfo: state.databaseMonitoring.spaceInfo,
  spaceInfoLoading: state.databaseMonitoring.spaceInfoLoading,
  databaseClasses: state.databaseConfiguration.databaseClasses,
  databaseClassesLoading: state.databaseConfiguration.databaseClassesLoading,
});

// Tables Folder
const TablesFolder = React.memo(({ db, selectedDatabase, selectedDatabaseSubItem, classes, isLoading, onSelect, onTabOpen, selectedHostUid, onTableContextMenu }) => {
  const dispatch = useDispatch();
  const isSelected = selectedDatabase === db.dbname && selectedDatabaseSubItem === 'Tables';

  const allUserClasses = classes?.userclass?.[0]?.class || [];
  const allSystemClasses = classes?.systemclass?.[0]?.class || [];

  const userTables = allUserClasses.filter(c => c.virtual === 'normal');
  const systemTables = allSystemClasses.filter(c => c.virtual === 'normal');
  const totalCount = userTables.length;

  return (
    <TreeNode
      id="Tables"
      label={`Tables${totalCount > 0 ? `(${totalCount})` : ''}`}
      icon="table_chart"
      level={2}
      isActive={isSelected}
      hasChildren={true}
      isLoading={isLoading}
      onToggle={() => {
        if (selectedHostUid && !classes && !isLoading) {
          dispatch(fetchDatabaseClasses({ hostUid: selectedHostUid, dbname: db.dbname }));
        }
      }}
      onSelect={() => onSelect(db.dbname, 'Tables')}
    >
      <TreeNode
        id="System tables"
        label="System tables"
        icon="settings_applications"
        level={3}
        isActive={selectedDatabase === db.dbname && selectedDatabaseSubItem === 'System tables'}
        hasChildren={true}
        onSelect={() => onSelect(db.dbname, 'System tables')}
      >
        {systemTables.map(c => (
          <TreeNode
            key={c.classname}
            id={c.classname}
            label={c.classname}
            icon="description"
            level={4}
            isActive={selectedDatabase === db.dbname && selectedDatabaseSubItem === `table:${c.classname}`}
            onSelect={() => onSelect(db.dbname, `table:${c.classname}`)}
          />
        ))}
      </TreeNode>

      {userTables.map(c => {
        return (
          <TreeNode
            key={c.classname}
            id={c.classname}
            label={c.classname}
            icon="table_rows"
            level={3}
            isActive={selectedDatabase === db.dbname && selectedDatabaseSubItem === `table:${c.classname}`}
            onSelect={() => onSelect(db.dbname, `table:${c.classname}`)}
          />
        );
      })}
    </TreeNode>
  );
});

// Views Folder
const ViewsFolder = React.memo(({ db, selectedDatabase, selectedDatabaseSubItem, classes, isLoading, onSelect, onTabOpen, selectedHostUid, onViewContextMenu }) => {
  const dispatch = useDispatch();
  const isSelected = selectedDatabase === db.dbname && selectedDatabaseSubItem === 'Views';

  const allUserClasses = classes?.userclass?.[0]?.class || [];
  const allSystemClasses = classes?.systemclass?.[0]?.class || [];

  const userViews = allUserClasses.filter(c => c.virtual === 'view');
  const systemViews = allSystemClasses.filter(c => c.virtual === 'view');
  const totalCount = userViews.length;

  return (
    <TreeNode
      id="Views"
      label={`Views${totalCount > 0 ? `(${totalCount})` : ''}`}
      icon="visibility"
      level={2}
      isActive={isSelected}
      hasChildren={true}
      isLoading={isLoading}
      onToggle={() => {
        if (selectedHostUid && !classes && !isLoading) {
          dispatch(fetchDatabaseClasses({ hostUid: selectedHostUid, dbname: db.dbname }));
        }
      }}
      onSelect={() => onSelect(db.dbname, 'Views')}
    >
      <TreeNode
        id="System views"
        label="System views"
        icon="settings_applications"
        level={3}
        isActive={selectedDatabase === db.dbname && selectedDatabaseSubItem === 'System views'}
        hasChildren={true}
        onSelect={() => onSelect(db.dbname, 'System views')}
      >
        {systemViews.map(c => (
          <TreeNode
            key={c.classname}
            id={c.classname}
            label={c.classname}
            icon="description"
            level={4}
            isActive={selectedDatabase === db.dbname && selectedDatabaseSubItem === `view:${c.classname}`}
            onSelect={() => onSelect(db.dbname, `view:${c.classname}`)}
          />
        ))}
      </TreeNode>

      {userViews.map(c => {
        return (
          <TreeNode
            key={c.classname}
            id={c.classname}
            label={c.classname}
            icon="grid_view"
            level={3}
            isActive={selectedDatabase === db.dbname && selectedDatabaseSubItem === `view:${c.classname}`}
            onSelect={() => onSelect(db.dbname, `view:${c.classname}`)}
          />
        );
      })}
    </TreeNode>
  );
});

export default function DatabaseTree({ 
  onContextMenu, 
  onRootContextMenu, 
  onUsersContextMenu,
  onUserContextMenu,
  onBackupPlanContextMenu,
  onSpaceContextMenu,
  onQueryPlanContextMenu,
  onQueryItemContextMenu,
  onJobAutomationContextMenu,
  onBackupItemContextMenu,
  onTableContextMenu,
  onViewContextMenu
}) {
  const dispatch = useDispatch();
  const selectedHostUid = useSelector((state) => state.host.selectedHostUid);
  
  const databases = useSelector(selectDatabases, shallowEqual);
  const activeDatabases = useSelector(selectActiveDatabases, shallowEqual);
  const loading = useSelector(selectLoading);
  const { selectedDatabase, selectedDatabaseSubItem } = useSelector(selectSelection, shallowEqual);
  const { 
    loggedInDatabases, 
    backupSchedules, 
    backupSchedulesLoading, 
    queryPlans, 
    queryPlansLoading, 
    spaceInfo, 
    spaceInfoLoading,
    loggingInDatabases,
    databaseClasses,
    databaseClassesLoading,
  } = useSelector(selectStatusStates, shallowEqual);
  
  const { databaseUsers, databaseUsersLoading } = useSelector((state) => state.user, shallowEqual, shallowEqual);

  const handleDbToggle = useCallback((db, isActive, isLoggedIn) => {
    if (!isActive) return;

    // We use a small timeout to let the browser finish processing 
    // click sequences (like double-clicks) before we trigger state-changing 
    // dispatches that could cause a reset-rendering of the tree node.
    setTimeout(() => {
      if (!isLoggedIn) {
        if (db.isProfileExists) {
          dispatch(loginDatabase({ hostUid: selectedHostUid, dbname: db.dbname, isBackground: true })).unwrap()
            .then(() => {
              dispatch(fetchDatabaseUsers({ hostUid: selectedHostUid, dbname: db.dbname }));
              dispatch(fetchBackupSchedule({ hostUid: selectedHostUid, dbname: db.dbname }));
              dispatch(fetchQueryPlan({ hostUid: selectedHostUid, dbname: db.dbname }));
            });
        } else {
          dispatch(openLoginDatabaseModal(db.dbname));
        }
      } else {
        if (!databaseUsers[db.dbname] && !databaseUsersLoading[db.dbname]) {
          dispatch(fetchDatabaseUsers({ hostUid: selectedHostUid, dbname: db.dbname }));
        }
        if (!backupSchedules[db.dbname] && !backupSchedulesLoading[db.dbname]) {
          dispatch(fetchBackupSchedule({ hostUid: selectedHostUid, dbname: db.dbname }));
        }
        if (!queryPlans[db.dbname] && !queryPlansLoading[db.dbname]) {
          dispatch(fetchQueryPlan({ hostUid: selectedHostUid, dbname: db.dbname }));
        }
      }
    }, 50);
  }, [selectedHostUid, databaseUsers, databaseUsersLoading, backupSchedules, backupSchedulesLoading, queryPlans, queryPlansLoading, dispatch]);

  const handleSelectSubItem = useCallback((dbname, subId, onClick) => {
    dispatch(setSelectedDatabase(dbname));
    dispatch(setSelectedDatabaseSubItem(subId));
    if (onClick) onClick();
  }, [dispatch]);

  const handleTabOpen = useCallback((tabId) => {
    dispatch(openTab(tabId));
  }, [dispatch]);

  if (loading && (!databases || databases.length === 0)) {
    return (
      <div className="flex flex-col gap-4 px-2 py-2 animate-in fade-in duration-500">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
               <Skeleton variant="circular" width="16px" height="16px" className="opacity-40" />
               <Skeleton variant="text" width="85%" height="18px" className="rounded-md" />
            </div>
            <div className="flex items-center gap-2 ml-6 opacity-30">
               <Skeleton variant="text" width="60%" height="14px" className="rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!databases || databases.length === 0) {
    return (
      <div className="px-6 py-12 flex flex-col items-center justify-center text-center space-y-3 opacity-40">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-2">
          <Icon name="database" size="md" className="text-slate-400" weight={100} />
        </div>
        <Typography variant="caption" className="text-slate-500 font-black uppercase tracking-widest text-[10px]">
          No databases found
        </Typography>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 px-2 py-2" onContextMenu={(e) => onRootContextMenu(e)}>
      {databases.map((db) => {
        const isActive = activeDatabases.includes(db.dbname);
        const isLoggedIn = loggedInDatabases.includes(db.dbname);
        const isDbSelected = db.dbname === selectedDatabase && !selectedDatabaseSubItem;

        return (
          <TreeNode
            key={db.dbname}
            id={db.dbname}
            label={db.dbname}
            icon="database"
            level={1}
            isActive={isDbSelected}
            hasChildren={true}
            isLoading={loggingInDatabases[db.dbname]}
            status={isActive ? 'on' : 'off'}
            onToggle={() => handleDbToggle(db, isActive, isLoggedIn)}
            onSelect={() => {
              dispatch(setSelectedDatabase(db.dbname));
              dispatch(setSelectedDatabaseSubItem(null));
            }}
            onDoubleClick={() => handleTabOpen('db:' + db.dbname)}
            onContextMenu={(e) => onContextMenu(e, db.dbname, isActive)}
          >
            {/* Level 2 items */}
            <TablesFolder 
              db={db}
              selectedDatabase={selectedDatabase}
              selectedDatabaseSubItem={selectedDatabaseSubItem}
              classes={databaseClasses[db.dbname]}
              isLoading={databaseClassesLoading[db.dbname]}
              onSelect={handleSelectSubItem}
              onTabOpen={handleTabOpen}
              selectedHostUid={selectedHostUid}
              onTableContextMenu={onTableContextMenu}
            />

            <ViewsFolder 
              db={db}
              selectedDatabase={selectedDatabase}
              selectedDatabaseSubItem={selectedDatabaseSubItem}
              classes={databaseClasses[db.dbname]}
              isLoading={databaseClassesLoading[db.dbname]}
              onSelect={handleSelectSubItem}
              onTabOpen={handleTabOpen}
              selectedHostUid={selectedHostUid}
              onViewContextMenu={onViewContextMenu}
            />

            <UsersFolder 
              db={db}
              selectedDatabase={selectedDatabase}
              selectedDatabaseSubItem={selectedDatabaseSubItem}
              users={databaseUsers[db.dbname]}
              isLoading={databaseUsersLoading[db.dbname]}
              onUsersContextMenu={onUsersContextMenu}
              onUserContextMenu={onUserContextMenu}
              onSelect={handleSelectSubItem}
              selectedHostUid={selectedHostUid}
            />

            <JobAutomationFolder 
              db={db}
              selectedDatabase={selectedDatabase}
              selectedDatabaseSubItem={selectedDatabaseSubItem}
              backupSchedules={backupSchedules[db.dbname]}
              backupSchedulesLoading={backupSchedulesLoading[db.dbname]}
              queryPlans={queryPlans[db.dbname]}
              queryPlansLoading={queryPlansLoading[db.dbname]}
              onJobAutomationContextMenu={onJobAutomationContextMenu}
              onBackupPlanContextMenu={onBackupPlanContextMenu}
              onQueryPlanContextMenu={onQueryPlanContextMenu}
              onQueryItemContextMenu={onQueryItemContextMenu}
              onBackupItemContextMenu={onBackupItemContextMenu}
              onSelect={handleSelectSubItem}
              selectedHostUid={selectedHostUid}
            />

            <SpaceFolder 
              db={db}
              selectedDatabase={selectedDatabase}
              selectedDatabaseSubItem={selectedDatabaseSubItem}
              spaceInfo={spaceInfo[db.dbname]}
              spaceInfoLoading={spaceInfoLoading[db.dbname]}
              onSpaceContextMenu={onSpaceContextMenu}
              onSelect={handleSelectSubItem}
              onTabOpen={handleTabOpen}
              selectedHostUid={selectedHostUid}
            />
          </TreeNode>
        );
      })}
    </div>
  );
}

// Sub-components to isolate re-renders and logic
const UsersFolder = React.memo(({ db, selectedDatabase, selectedDatabaseSubItem, users, isLoading, onUsersContextMenu, onUserContextMenu, onSelect, selectedHostUid }) => {
  const dispatch = useDispatch();
  const isSelected = selectedDatabase === db.dbname && selectedDatabaseSubItem === 'Users';

  return (
    <TreeNode
      id="Users"
      label="Users"
      icon="group"
      level={2}
      isActive={isSelected}
      hasChildren={true}
      isLoading={isLoading}
      onToggle={() => {
        if (selectedHostUid && !users && !isLoading) {
          dispatch(fetchDatabaseUsers({ hostUid: selectedHostUid, dbname: db.dbname }));
        }
      }}
      onSelect={() => onSelect(db.dbname, 'Users')}
      onContextMenu={(e) => onUsersContextMenu(e, db.dbname)}
    >
      {!isLoading && users?.length === 0 ? (
        <div className="px-10 py-3 opacity-30 flex items-center gap-2">
           <Icon name="block" size="xs" weight={300} />
           <Typography variant="caption" className="italic font-bold uppercase tracking-widest text-[8px]">Index Empty</Typography>
        </div>
      ) : (
        (users || []).map(u => {
          const uName = typeof u === 'string' ? u : u.name;
          const isUSelected = selectedDatabase === db.dbname && selectedDatabaseSubItem === uName;
          return (
            <TreeNode
              key={uName}
              id={uName}
              label={uName}
              icon="person"
              level={3}
              isActive={isUSelected}
              onSelect={() => onSelect(db.dbname, uName)}
              onContextMenu={(e) => onUserContextMenu(e, db.dbname, uName)}
            />
          );
        })
      )}
    </TreeNode>
  );
});

const JobAutomationFolder = React.memo(({ db, selectedDatabase, selectedDatabaseSubItem, backupSchedules, backupSchedulesLoading, queryPlans, queryPlansLoading, onJobAutomationContextMenu, onBackupPlanContextMenu, onQueryPlanContextMenu, onQueryItemContextMenu, onBackupItemContextMenu, onSelect, selectedHostUid }) => {
  const dispatch = useDispatch();
  const isSelected = selectedDatabase === db.dbname && selectedDatabaseSubItem === 'Job automation';

  return (
    <TreeNode
      id="Job automation"
      label="Job automation"
      icon="bolt"
      level={2}
      isActive={isSelected}
      hasChildren={true}
      onToggle={() => {
        if (selectedHostUid) {
          if (!backupSchedules && !backupSchedulesLoading) {
            dispatch(fetchBackupSchedule({ hostUid: selectedHostUid, dbname: db.dbname }));
          }
          if (!queryPlans && !queryPlansLoading) {
            dispatch(fetchQueryPlan({ hostUid: selectedHostUid, dbname: db.dbname }));
          }
        }
      }}
      onSelect={() => onSelect(db.dbname, 'Job automation')}
      onContextMenu={(e) => onJobAutomationContextMenu?.(e, db.dbname)}
    >
       <TreeNode
          id="Backup Plan"
          label="Backup Plan"
          icon="backup"
          level={3}
          isActive={selectedDatabase === db.dbname && selectedDatabaseSubItem === 'Backup Plan'}
          hasChildren={true}
          isLoading={backupSchedulesLoading}
          onSelect={() => onSelect(db.dbname, 'Backup Plan')}
          onContextMenu={(e) => onBackupPlanContextMenu(e, db.dbname)}
        >
          {backupSchedules?.map(plan => {
            const planId = plan.backupid;
            const isPlanSelected = selectedDatabase === db.dbname && selectedDatabaseSubItem === `backup:${planId}`;
            return (
              <TreeNode
                key={planId}
                id={planId}
                label={planId}
                icon="event_note"
                level={4}
                isActive={isPlanSelected}
                onSelect={() => onSelect(db.dbname, `backup:${planId}`)}
                onContextMenu={(e) => onBackupItemContextMenu(e, db.dbname, planId)}
              />
            );
          })}
        </TreeNode>

        <TreeNode
          id="Query Plan"
          label="Query Plan"
          icon="schema"
          level={3}
          isActive={selectedDatabase === db.dbname && selectedDatabaseSubItem === 'Query Plan'}
          hasChildren={true}
          isLoading={queryPlansLoading}
          onSelect={() => onSelect(db.dbname, 'Query Plan')}
          onContextMenu={(e) => onQueryPlanContextMenu(e, db.dbname)}
        >
          {queryPlans?.map(plan => {
            const qId = plan.query_id;
            return (
              <TreeNode
                key={qId}
                id={qId}
                label={qId}
                icon="sticky_note_2"
                level={4}
                isActive={selectedDatabase === db.dbname && selectedDatabaseSubItem === `query:${qId}`}
                onSelect={() => onSelect(db.dbname, `query:${qId}`)}
                onContextMenu={(e) => onQueryItemContextMenu?.(e, db.dbname, qId)}
              />
            );
          })}
        </TreeNode>
    </TreeNode>
  );
});

const SpaceFolder = React.memo(({ db, selectedDatabase, selectedDatabaseSubItem, spaceInfo, spaceInfoLoading, onSpaceContextMenu, onSelect, onTabOpen, selectedHostUid }) => {
  const dispatch = useDispatch();
  const isSelected = selectedDatabase === db.dbname && selectedDatabaseSubItem === 'Space';

  const renderCategory = (id, label, icon, filterFn) => {
    const isCatSelected = selectedDatabase === db.dbname && selectedDatabaseSubItem === id;
    const volumes = spaceInfo?.volumes?.filter(filterFn) || [];

    return (
      <TreeNode
        id={id}
        label={label}
        icon={icon}
        level={3}
        isActive={isCatSelected}
        hasChildren={true}
        isLoading={spaceInfoLoading && !spaceInfo}
        onSelect={() => onSelect(db.dbname, id)}
        onDoubleClick={() => onTabOpen(`vol_category:${selectedHostUid}:${db.dbname}:${id}`)}
      >
        {volumes.map(vol => {
          const fileName = vol.spacename.split(/[\\/]/).pop();
          const subItemId = `vol:${vol.spacename}`;
          return (
            <TreeNode
              key={vol.spacename}
              id={vol.spacename}
              label={fileName}
              icon="description"
              level={4}
              isActive={selectedDatabase === db.dbname && selectedDatabaseSubItem === subItemId}
              onSelect={() => onSelect(db.dbname, subItemId)}
              onDoubleClick={() => onTabOpen(`vol_info:${selectedHostUid}:${db.dbname}:${vol.spacename}`)}
            />
          );
        })}
      </TreeNode>
    );
  };

  return (
    <TreeNode
      id="Space"
      label="Space"
      icon="donut_small"
      level={2}
      isActive={isSelected}
      hasChildren={true}
      onSelect={() => onSelect(db.dbname, 'Space')}
      onDoubleClick={() => onTabOpen(`db_space:${selectedHostUid}:${db.dbname}`)}
      onContextMenu={(e) => onSpaceContextMenu(e, db.dbname)}
      onToggle={() => {
        // Only fetch if we have a host, aren't already loading, AND the data is genuinely missing
        if (selectedHostUid && !spaceInfoLoading && !spaceInfo) {
          dispatch(fetchDatabaseSpaceInfo({ hostUid: selectedHostUid, dbname: db.dbname }));
        }
      }}
    >
      {renderCategory('Permanent_PermanentData', 'Permanent Data', 'data_usage', v => v.type === 'PERMANENT' && (v.purpose === 'PERMANENT' || !v.purpose))}
      {renderCategory('Permanent_TemporaryData', 'Permanent Temp', 'layers', v => v.type === 'PERMANENT' && v.purpose === 'TEMPORARY')}
      {renderCategory('Temporary_TemporaryData', 'Temporary', 'auto_delete', v => v.type === 'TEMPORARY')}
      
      <TreeNode
        id="Log"
        label="Log"
        icon="history"
        level={3}
        isActive={selectedDatabase === db.dbname && selectedDatabaseSubItem === 'Log'}
        hasChildren={true}
      >
        {renderCategory('Active', 'Active', 'radio_button_checked', v => v.type === 'Active_log')}
        {renderCategory('Archive', 'Archive', 'inventory_2', v => v.type === 'Archive_log')}
      </TreeNode>
    </TreeNode>
  );
});
