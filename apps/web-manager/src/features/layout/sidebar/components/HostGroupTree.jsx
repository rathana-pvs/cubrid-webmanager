import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setSelectedGroup, openAddHostModal } from '../../../host/hostSlice';
import { orderedGroupEntries, sortHostUidsByHaRole } from '../../../host/hostGroupUtils';
import ServerListItem from './ServerListItem';
import { Icon } from '../../../../components/ds/foundation/Icon';
import { TreeNode } from '../../../../components/domain/tree/TreeNode';

export default function HostGroupTree({
  hostGroups,
  selectedGroupUid,
  selectedHostUid,
  authorizedHosts,
  haInfo,
  onContextMenu,
  onGroupContextMenu,
}) {
  const dispatch = useDispatch();
  const [expandedGroups, setExpandedGroups] = useState(() => new Set());

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const handleGroupSelect = (groupId) => {
    dispatch(setSelectedGroup({ groupId }));
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        if (selectedGroupUid === groupId) {
          next.delete(groupId);
        }
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  return (
    <div className="py-1">
      {orderedGroupEntries(hostGroups).map(([groupId, group]) => {
        const hostsMap = group.hosts || {};
        const hostUids = sortHostUidsByHaRole(Object.keys(hostsMap), hostsMap, haInfo);
        const isExpanded = expandedGroups.has(groupId);
        const isGroupSelected = selectedGroupUid === groupId;

        return (
          <div key={groupId}>
            <TreeNode
              id={groupId}
              label={group.name}
              icon="folder"
              level={0}
              isActive={isGroupSelected}
              hasChildren={hostUids.length > 0}
              isExpanded={isExpanded}
              open={isExpanded}
              onToggle={() => toggleGroup(groupId)}
              onSelect={() => handleGroupSelect(groupId)}
              onContextMenu={(e) => {
                if (onGroupContextMenu) onGroupContextMenu(e, groupId, group.name);
              }}
            >
              {hostUids.map((uid) => {
                const host = hostsMap[uid];
                return (
                  <div key={uid} className="pl-2">
                    <ServerListItem
                      host={host}
                      isSelected={selectedHostUid === uid}
                      isAuthorized={authorizedHosts.includes(uid)}
                      haInfo={haInfo[uid]}
                      onContextMenu={onContextMenu}
                      compact
                    />
                  </div>
                );
              })}
            </TreeNode>
            {isGroupSelected && (
              <button
                type="button"
                onClick={() => dispatch(openAddHostModal({ groupId, alias: '', address: '', port: '8001', id: 'admin', password: '' }))}
                className="ml-8 mb-1 flex items-center gap-1 px-2 py-0.5 text-[10px] text-slate-400 hover:text-amber-500 transition-colors"
              >
                <Icon name="add" size="12px" />
                Add node to group
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
