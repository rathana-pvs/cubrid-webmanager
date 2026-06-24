import React, { useState, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setSelectedGroup, openAddHostModal, moveHost } from '../../../host/hostSlice';
import { orderedGroupEntries, sortHostUidsByHaRole } from '../../../host/hostGroupUtils';
import ServerListItem from './ServerListItem';
import { Icon } from '../../../../components/ds/foundation/Icon';
import { TreeNode } from '../../../../components/domain/tree/TreeNode';
import { useCM } from '../../../../constants/useCM';

const HOST_DRAG_MIME = 'application/x-cubrid-host';

export default function HostGroupTree({
  hostGroups,
  selectedGroupUid,
  selectedHostUid,
  authorizedHosts,
  haInfo,
  onContextMenu,
  onGroupContextMenu,
}) {
  const CM = useCM();
  const dispatch = useDispatch();
  const [expandedGroups, setExpandedGroups] = useState(() => new Set());
  const [draggedHost, setDraggedHost] = useState(null);
  const [dropTargetGroupId, setDropTargetGroupId] = useState(null);
  const draggedHostRef = useRef(null);

  const clearDragState = useCallback(() => {
    draggedHostRef.current = null;
    setDraggedHost(null);
    setDropTargetGroupId(null);
  }, []);

  const handleHostDragStart = useCallback((e, hostUid, sourceGroupId) => {
    const payload = { hostUid, sourceGroupId };
    draggedHostRef.current = payload;
    setDraggedHost(payload);
    e.dataTransfer.setData(HOST_DRAG_MIME, JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleHostDragEnd = useCallback(() => {
    clearDragState();
  }, [clearDragState]);

  const handleGroupDragOver = useCallback((e, groupId) => {
    const payload = draggedHostRef.current;
    if (!payload) return;
    e.preventDefault();
    if (payload.sourceGroupId === groupId) {
      e.dataTransfer.dropEffect = 'none';
      setDropTargetGroupId(null);
      return;
    }
    e.dataTransfer.dropEffect = 'move';
    setDropTargetGroupId(groupId);
  }, []);

  const handleGroupDragLeave = useCallback((e, groupId) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropTargetGroupId((prev) => (prev === groupId ? null : prev));
    }
  }, []);

  const handleGroupDrop = useCallback(async (e, groupId) => {
    e.preventDefault();
    e.stopPropagation();

    let payload = draggedHostRef.current || draggedHost;
    if (!payload) {
      try {
        payload = JSON.parse(e.dataTransfer.getData(HOST_DRAG_MIME));
      } catch {
        clearDragState();
        return;
      }
    }

    clearDragState();

    if (!payload?.hostUid || payload.sourceGroupId === groupId) {
      return;
    }

    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.add(groupId);
      return next;
    });

    await dispatch(moveHost({ hostUid: payload.hostUid, targetGroupId: groupId }));
  }, [clearDragState, dispatch]);

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const handleGroupSelect = (groupId) => {
    dispatch(setSelectedGroup({ groupId, hostUid: selectedHostUid }));
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (!next.has(groupId)) {
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
        const isDropTarget = dropTargetGroupId === groupId && draggedHost?.sourceGroupId !== groupId;

        return (
          <div
            key={groupId}
            onDragOver={(e) => handleGroupDragOver(e, groupId)}
            onDragLeave={(e) => handleGroupDragLeave(e, groupId)}
            onDrop={(e) => handleGroupDrop(e, groupId)}
            className={`rounded-md transition-colors ${
              isDropTarget ? 'bg-amber-500/8 ring-1 ring-amber-400/40' : ''
            }`}
          >
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
              onDoubleClick={() => toggleGroup(groupId)}
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
                      draggable
                      isDragging={draggedHost?.hostUid === uid}
                      onDragStart={(e) => handleHostDragStart(e, uid, groupId)}
                      onDragEnd={handleHostDragEnd}
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
                {CM.addNodeToGroup}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
