import { useDispatch, useSelector } from 'react-redux';
import { setSelectedBroker, setSelectedBrokerSubItem, fetchBrokerLogs } from '../../../broker/brokerSlice';
import { openTab } from '../../layoutSlice';
import { TreeNode } from '../../../../components/domain/tree/TreeNode';
import { Spinner } from '../../../../components/ds/foundation/Spinner';
import { Typography } from '../../../../components/ds/foundation/Typography';
import { Icon } from '../../../../components/ds/foundation/Icon';

export default function BrokerTree({ hostUid, onContextMenu }) {
  const dispatch = useDispatch();
  const { brokers, loading, logsByBroker, selectedBroker, selectedBrokerSubItem, logsLoading } = useSelector((state) => state.broker);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-3">
        <Spinner size="lg" color="bk-yellow" />
        <Typography variant="caption" className="text-slate-500 animate-pulse">Scanning brokers...</Typography>
      </div>
    );
  }

  if (!brokers || brokers.length === 0) {
    return (
      <div className="px-6 py-10 flex flex-col items-center justify-center text-center space-y-2 opacity-60">
        <Icon name="hub" size="lg" className="text-slate-400 mb-2" weight={200} />
        <Typography variant="caption" className="text-slate-500 font-medium">
          No brokers found on this host
        </Typography>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 px-1 py-1">
      {brokers.map((broker) => {
        const isBrokerSelected = selectedBroker === broker.name;
        const brokerLogs = (logsByBroker[broker.name] || []).filter(log => log.path.toLowerCase().endsWith('.log'));
        
        return (
          <TreeNode
            key={broker.name}
            id={broker.name}
            label={`${broker.name} (${broker.port})`}
            icon="hub"
            status={broker.state === 'ON' ? 'on' : 'off'}
            isActive={isBrokerSelected && !selectedBrokerSubItem}
            hasChildren={true}
            onSelect={() => {
              dispatch(setSelectedBroker(broker.name));
              dispatch(setSelectedBrokerSubItem(null));
            }}
            onToggle={() => {
              if (!logsByBroker[broker.name] && !logsLoading) {
                dispatch(fetchBrokerLogs({ hostUid, brokerName: broker.name }));
              }
            }}
            onDoubleClick={() => dispatch(openTab(`broker_status:${hostUid}:${broker.name}`))}
            onContextMenu={(e) => onContextMenu(e, broker.name, broker.state)}
          >
            <TreeNode
              label="SQL Log"
              icon="history_edu"
              isActive={isBrokerSelected && selectedBrokerSubItem === 'SQL Log'}
              hasChildren={true}
              onSelect={() => {
                dispatch(setSelectedBroker(broker.name));
                dispatch(setSelectedBrokerSubItem('SQL Log'));
              }}
            >
              <div className="space-y-0.5">
                {logsLoading && !logsByBroker[broker.name] && (
                  <div className="px-4 py-2 flex items-center gap-3">
                    <Spinner size="sm" color="bk-yellow" />
                    <Typography variant="caption" className="text-slate-400 animate-pulse">Loading log files...</Typography>
                  </div>
                )}
                {brokerLogs.map((log, idx) => {
                  const fileName = log.path.split('/').pop();
                  const isLogSelected = isBrokerSelected && selectedBrokerSubItem === log.path;
                  return (
                    <TreeNode
                      key={idx}
                      label={fileName}
                      icon="description"
                      isActive={isLogSelected}
                      level={2}
                      onSelect={() => {
                        dispatch(setSelectedBroker(broker.name));
                        dispatch(setSelectedBrokerSubItem(log.path));
                      }}
                      onDoubleClick={() => dispatch(openTab(`log:${hostUid}:${log.path}`))}
                    />
                  );
                })}
                {!logsLoading && brokerLogs.length === 0 && (
                  <div className="px-5 py-2">
                     <Typography variant="caption" className="italic text-slate-500 opacity-60">No log entries found</Typography>
                  </div>
                )}
              </div>
            </TreeNode>
          </TreeNode>
        );
      })}
    </div>
  );
}
