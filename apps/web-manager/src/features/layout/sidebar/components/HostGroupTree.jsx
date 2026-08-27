import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setSelectedGroup, openAddHostModal, moveHost } from '../../../host/hostSlice';
import { orderedGroupEntries, sortHostUidsByHaRole, UNGROUPED_GROUP_ID, HOST_DRAG_MIME } from '../../../host/hostGroupUtils';
import ServerListItem from './ServerListItem';
import { Icon } from '../../../../components/ds/foundation/Icon';
import { TreeNode } from '../../../../components/domain/tree/TreeNode';
import { useCM } from '../../../../constants/useCM';

export default function HostGroupTree({
  hostGroups,
  selectedGroupUid,
  selectedHostUid,
  authorizedHosts,
  haInfo,
  onContextMenu,
  onGroupContextMenu,
  onHostActivate,
}) {
  const CM = useCM();
  const dispatch = useDispatch();
  const [expandedGroups, setExpandedGroups] = useState(() => new Set());
  const [focusedHostUid, setFocusedHostUid] = useState(selectedHostUid);
  const [draggedHost, setDraggedHost] = useState(null);
  const [dropTargetGroupId, setDropTargetGroupId] = useState(null);
  const draggedHostRef = useRef(null);

  // External activation (or host deletion) should bring list focus back in
  // sync. Merely focusing another row does not change selectedHostUid.
  useEffect(() => {
    setFocusedHostUid(selectedHostUid);
  }, [selectedHostUid]);

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

  // A single click both selects and toggles expand/collapse — no double-click needed.
  const handleGroupSelect = (groupId) => {
    dispatch(setSelectedGroup({ groupId, hostUid: selectedHostUid }));
    toggleGroup(groupId);
  };

  const allEntries = orderedGroupEntries(hostGroups);
  const groupEntries = allEntries.filter(([groupId]) => groupId !== UNGROUPED_GROUP_ID);
  const ungroupedEntry = allEntries.find(([groupId]) => groupId === UNGROUPED_GROUP_ID);
  const ungroupedHostsMap = ungroupedEntry?.[1]?.hosts || {};
  const ungroupedHostUids = sortHostUidsByHaRole(Object.keys(ungroupedHostsMap), ungroupedHostsMap, haInfo);
  const isUngroupedDropTarget = dropTargetGroupId === UNGROUPED_GROUP_ID && draggedHost?.sourceGroupId !== UNGROUPED_GROUP_ID;

  return (
    <div className="py-1">
      {groupEntries.map(([groupId, group]) => {
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
                      isSelected={focusedHostUid === uid}
                      isAuthorized={authorizedHosts.includes(uid)}
                      haInfo={haInfo[uid]}
                      onContextMenu={onContextMenu}
                      onSelect={setFocusedHostUid}
                      onActivate={onHostActivate}
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

      {/* Always rendered (even with zero hosts) so it stays a valid drop target for un-grouping a host. */}
      <div
        onDragOver={(e) => handleGroupDragOver(e, UNGROUPED_GROUP_ID)}
        onDragLeave={(e) => handleGroupDragLeave(e, UNGROUPED_GROUP_ID)}
        onDrop={(e) => handleGroupDrop(e, UNGROUPED_GROUP_ID)}
        className={`rounded-md transition-colors ${ungroupedHostUids.length === 0 ? 'min-h-[8px]' : ''} ${
          isUngroupedDropTarget ? 'bg-amber-500/8 ring-1 ring-amber-400/40' : ''
        }`}
      >
        {ungroupedHostUids.map((uid) => {
          const host = ungroupedHostsMap[uid];
          return (
            <ServerListItem
              key={uid}
              host={host}
              isSelected={focusedHostUid === uid}
              isAuthorized={authorizedHosts.includes(uid)}
              haInfo={haInfo[uid]}
              onContextMenu={onContextMenu}
              onSelect={setFocusedHostUid}
              onActivate={onHostActivate}
              draggable
              isDragging={draggedHost?.hostUid === uid}
              onDragStart={(e) => handleHostDragStart(e, uid, UNGROUPED_GROUP_ID)}
              onDragEnd={handleHostDragEnd}
            />
          );
        })}
      </div>
    </div>
  );
}
