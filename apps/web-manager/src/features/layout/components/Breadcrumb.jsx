import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { MenuItem, MenuDivider } from '../../../components/common/DropdownMenu';
import { ConfirmDialog } from '../../../components/ds/layout/ConfirmDialog';
import ContextMenuWrapper from '../../../components/common/ContextMenuWrapper';
import TabItem from './TabItem';

export default function Breadcrumb({ 
  activeTab, 
  onTabChange, 
  openTabs = [], 
  onCloseTab, 
  onCloseOthers, 
  onCloseAll, 
  labels = {} 
}) {
  const [contextMenu, setContextMenu] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });
  const { dirtyTabs } = useSelector((state) => state.layout);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', handleClickOutside, true);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', handleClickOutside, true);
    };
  }, []);

  const handleCloseTab = (tabId, queue = []) => {
    if (dirtyTabs.includes(tabId)) {
      onTabChange(tabId);
      setConfirmModal({
        isOpen: true,
        title: 'Discard Changes?',
        message: `You have unsaved changes in "${labels[tabId] || tabId}". If you close it, your changes will be lost.`,
        onConfirm: () => {
          onCloseTab(tabId);
          if (queue.length > 1) {
            const nextQueue = queue.slice(1);
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            setTimeout(() => handleCloseTab(nextQueue[0], nextQueue), 100);
          }
        }
      });
    } else {
      onCloseTab(tabId);
      if (queue.length > 1) {
        const nextQueue = queue.slice(1);
        handleCloseTab(nextQueue[0], nextQueue);
      }
    }
  };

  const handleCloseOthers = (tabId) => {
    const others = openTabs.filter(tid => tid !== tabId);
    const dirtyOthers = others.filter(tid => dirtyTabs.includes(tid));
    const cleanOthers = others.filter(tid => !dirtyTabs.includes(tid));

    cleanOthers.forEach(tid => onCloseTab(tid));

    if (dirtyOthers.length > 0) {
      handleCloseTab(dirtyOthers[0], dirtyOthers);
    }
  };

  const handleCloseAll = () => {
    const dirtyOnes = openTabs.filter(tid => dirtyTabs.includes(tid));
    const cleanOnes = openTabs.filter(tid => !dirtyTabs.includes(tid));

    cleanOnes.forEach(tid => onCloseTab(tid));

    if (dirtyOnes.length > 0) {
      handleCloseTab(dirtyOnes[0], dirtyOnes);
    }
  };

  const handleContextMenu = (e, tabId) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, tabId });
  };

  const getTabIcon = (id) => {
    if (id.startsWith('host:')) return 'dns';
    if (id.startsWith('db:')) return 'database';
    if (id.startsWith('edit_config:')) return 'settings_applications';
    if (id.startsWith('broker_config:')) return 'table_rows';
    if (id.startsWith('log:')) return 'description';
    return 'description';
  };

  const getTabLabel = (id) => {
    if (labels[id]) return labels[id];
    return id;
  };

  return (
    <div className="bg-slate-50 dark:bg-bk-main border-b border-slate-200 dark:border-white/5 font-sans relative">
      <div className="flex overflow-x-auto scrollbar-hide h-10">
        {openTabs.map((tabId) => (
          <TabItem
            key={tabId}
            tabId={tabId}
            isActive={activeTab === tabId}
            isDirty={dirtyTabs.includes(tabId)}
            label={getTabLabel(tabId)}
            icon={getTabIcon(tabId)}
            onClick={() => onTabChange(tabId)}
            onClose={() => handleCloseTab(tabId)}
            onContextMenu={(e) => handleContextMenu(e, tabId)}
          />
        ))}
      </div>

      {contextMenu && (
        <ContextMenuWrapper 
          x={contextMenu.x} 
          y={contextMenu.y} 
          onClose={() => setContextMenu(null)}
        >
          <MenuItem 
            icon="close" 
            label="Close Tab" 
            onClick={() => {
              handleCloseTab(contextMenu.tabId);
              setContextMenu(null);
            }} 
          />
          <MenuItem 
            icon="close_fullscreen" 
            label="Close Other Tabs" 
            onClick={() => {
              handleCloseOthers(contextMenu.tabId);
              setContextMenu(null);
            }} 
          />
          <MenuItem 
            icon="tab_close" 
            label="Close All Tabs" 
            onClick={() => {
              handleCloseAll();
              setContextMenu(null);
            }} 
          />
          <MenuDivider />
          <MenuItem 
            icon="refresh" 
            label="Reload Tab" 
            onClick={() => setContextMenu(null)}
          />
        </ContextMenuWrapper>
      )}
 
      <ConfirmDialog 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        confirmText="Discard Changes"
        type="warning"
      />
    </div>
  );
}
