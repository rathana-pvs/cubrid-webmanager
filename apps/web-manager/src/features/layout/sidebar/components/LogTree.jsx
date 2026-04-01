import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { setSelectedBroker, setSelectedBrokerSubItem, fetchBrokerLogs, fetchAdminLogs, fetchCMSLogs, fetchDatabaseLogs } from '../../../broker/brokerSlice';
import { openTab } from '../../layoutSlice';
import { TreeNode } from '../../../../components/domain/tree/TreeNode';
import { Spinner } from '../../../../components/ds/foundation/Spinner';
import { Typography } from '../../../../components/ds/foundation/Typography';
import { Icon } from '../../../../components/ds/foundation/Icon';

export default function LogTree({ hostUid }) {
  const dispatch = useDispatch();
  const { databases } = useSelector((state) => state.database, shallowEqual);
  const { brokers, logsByBroker, logsLoading, adminLogsByHost, adminLogsLoading, cmsLogsByHost, selectedBrokerSubItem, dbLogsByDbName, dbLogsLoading } = useSelector((state) => state.broker, shallowEqual);

  return (
    <div className="space-y-0.5 px-1 py-1">
      {/* Broker Logs Section */}
      <TreeNode
        label="Broker"
        icon="hub"
        isActive={selectedBrokerSubItem === 'log-broker-root'}
        hasChildren={true}
        onSelect={() => {
          dispatch(setSelectedBroker(null));
          dispatch(setSelectedBrokerSubItem('log-broker-root'));
        }}
      >
        <div className="space-y-0.5">
          {/* Access Logs */}
          <TreeNode
            label="Access"
            icon="login"
            isActive={selectedBrokerSubItem === 'log-access'}
            hasChildren={false}
            onSelect={() => {
              dispatch(setSelectedBroker(null));
              dispatch(setSelectedBrokerSubItem('log-access'));
            }}
          />

          {/* Error Logs */}
          <TreeNode 
            label="Error"
            icon="report"
            isActive={selectedBrokerSubItem === 'log-error'}
            hasChildren={true}
            onSelect={() => {
              dispatch(setSelectedBroker(null));
              dispatch(setSelectedBrokerSubItem('log-error'));
            }}
            onToggle={() => {
              if (!logsLoading) {
                brokers.forEach(broker => {
                  if (!logsByBroker[broker.name]) {
                    dispatch(fetchBrokerLogs({ hostUid, brokerName: broker.name }));
                  }
                });
              }
            }}
          >
            <div className="space-y-0.5">
              {logsLoading && <div className="px-4 py-2 flex items-center gap-3 animate-pulse"><Spinner size="xs" color="bk-yellow" /><Typography variant="caption" className="text-slate-400">Loading...</Typography></div>}
              {(() => {
                const errorLogs = Object.values(logsByBroker)
                  .flat()
                  .filter(log => log.path.toLowerCase().endsWith('.err'));

                if (!logsLoading && errorLogs.length === 0) {
                  return <div className="px-5 py-2"><Typography variant="caption" className="italic text-slate-500 opacity-60">No error logs found</Typography></div>;
                }

                return errorLogs.map((log, idx) => {
                  const fileName = log.path.split('/').pop();
                  const isLogSelected = selectedBrokerSubItem === log.path;
                  return (
                    <TreeNode
                      key={idx}
                      label={fileName}
                      icon="description"
                      isActive={isLogSelected}
                      level={2}
                      onSelect={() => {
                        dispatch(setSelectedBroker(null));
                        dispatch(setSelectedBrokerSubItem(log.path));
                      }}
                      onDoubleClick={() => dispatch(openTab(`log:${hostUid}:${log.path}`))}
                    />
                  );
                });
              })()}
            </div>
          </TreeNode>

          {/* Admin Logs */}
          <TreeNode 
            label="Admin Log"
            icon="admin_panel_settings"
            isActive={selectedBrokerSubItem === 'log-admin'}
            hasChildren={true}
            onSelect={() => {
              dispatch(setSelectedBroker(null));
              dispatch(setSelectedBrokerSubItem('log-admin'));
            }}
            onToggle={() => {
              if (!adminLogsByHost[hostUid] && !adminLogsLoading) {
                dispatch(fetchAdminLogs(hostUid));
              }
            }}
          >
            <div className="space-y-0.5">
              {adminLogsLoading && <div className="px-4 py-2 flex items-center gap-3 animate-pulse"><Spinner size="xs" color="bk-yellow" /><Typography variant="caption" className="text-slate-400">Loading...</Typography></div>}
              {(adminLogsByHost[hostUid] || []).map((log, idx) => {
                const fileName = log.path.split('/').pop();
                const isLogSelected = selectedBrokerSubItem === log.path;
                return (
                  <TreeNode
                    key={idx}
                    label={fileName}
                    icon="description"
                    isActive={isLogSelected}
                    level={2}
                    onSelect={() => {
                      dispatch(setSelectedBroker(null));
                      dispatch(setSelectedBrokerSubItem(log.path));
                    }}
                    onDoubleClick={() => dispatch(openTab(`log:${hostUid}:${log.path}`))}
                  />
                );
              })}
              {!adminLogsLoading && (adminLogsByHost[hostUid] || []).length === 0 && (
                <div className="px-5 py-2"><Typography variant="caption" className="italic text-slate-500 opacity-60">No admin logs found</Typography></div>
              )}
            </div>
          </TreeNode>
        </div>
      </TreeNode>

      {/* Manager Logs Section */}
      <TreeNode
        label="Manager"
        icon="manage_accounts"
        isActive={selectedBrokerSubItem === 'log-manager-root'}
        hasChildren={true}
        onSelect={() => {
          dispatch(setSelectedBroker(null));
          dispatch(setSelectedBrokerSubItem('log-manager-root'));
        }}
        onToggle={() => {
          if (!cmsLogsByHost[hostUid] && !logsLoading) {
            dispatch(fetchCMSLogs(hostUid));
          }
        }}
      >
        <div className="space-y-0.5">
          <TreeNode
            label="Access log"
            icon="login"
            isActive={selectedBrokerSubItem === 'cms-access'}
            onSelect={() => {
              dispatch(setSelectedBroker(null));
              dispatch(setSelectedBrokerSubItem('cms-access'));
            }}
            onDoubleClick={() => dispatch(openTab(`cms-access:${hostUid}`))}
          />
          <TreeNode
            label="Error log"
            icon="report"
            isActive={selectedBrokerSubItem === 'cms-error'}
            onSelect={() => {
              dispatch(setSelectedBroker(null));
              dispatch(setSelectedBrokerSubItem('cms-error'));
            }}
            onDoubleClick={() => dispatch(openTab(`cms-error:${hostUid}`))}
          />
        </div>
      </TreeNode>

      {/* Server/Database Logs Section */}
      <TreeNode
        label="Server logs"
        icon="dns"
        isActive={selectedBrokerSubItem === 'log-server-root'}
        hasChildren={true}
        onSelect={() => {
          dispatch(setSelectedBroker(null));
          dispatch(setSelectedBrokerSubItem('log-server-root'));
        }}
      >
        <div className="space-y-0.5">
          {(databases || []).map((db, idx) => (
            <TreeNode 
              key={idx} 
              label={db.dbname}
              icon="database"
              isActive={selectedBrokerSubItem === `log-db-${db.dbname}`}
              hasChildren={true}
              onSelect={() => {
                dispatch(setSelectedBroker(null));
                dispatch(setSelectedBrokerSubItem(`log-db-${db.dbname}`));
              }}
              onToggle={() => {
                if (!dbLogsByDbName[db.dbname] && !dbLogsLoading) {
                  dispatch(fetchDatabaseLogs({ hostUid, dbname: db.dbname }));
                }
              }}
            >
              <div className="space-y-0.5">
                  {dbLogsLoading && !dbLogsByDbName[db.dbname] && (
                    <div className="px-4 py-2 flex items-center gap-3 animate-pulse"><Spinner size="xs" color="bk-yellow" /><Typography variant="caption" className="text-slate-400">Loading...</Typography></div>
                  )}
                  {(dbLogsByDbName[db.dbname] || []).map((log, lIdx) => {
                    const fileName = log.path.split('/').pop();
                    const isLogSelected = selectedBrokerSubItem === log.path;
                    return (
                      <TreeNode 
                        key={lIdx}
                        label={fileName}
                        icon="description"
                        isActive={isLogSelected}
                        level={2}
                        onSelect={() => {
                          dispatch(setSelectedBroker(null));
                          dispatch(setSelectedBrokerSubItem(log.path));
                        }}
                        onDoubleClick={() => dispatch(openTab(`log:${hostUid}:${log.path}`))}
                      />
                    );
                  })}
                  {!dbLogsLoading && (dbLogsByDbName[db.dbname] || []).length === 0 && (
                    <div className="px-5 py-2"><Typography variant="caption" className="italic text-slate-500 opacity-60">No logs found</Typography></div>
                  )}
              </div>
            </TreeNode>
          ))}
          {(!databases || databases.length === 0) && (
            <div className="px-6 py-4 flex flex-col items-center justify-center opacity-40">
               <Typography variant="caption" className="italic">No databases available</Typography>
            </div>
          )}
        </div>
      </TreeNode>
    </div>
  );
}
