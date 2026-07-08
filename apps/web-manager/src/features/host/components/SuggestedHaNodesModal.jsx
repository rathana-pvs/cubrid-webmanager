import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { clearSuggestedHaNodes, openAddHostModal, closeDiscoveryModal } from '../hostSlice';
import { findUndiscoveredHaPeers } from '../haPeerUtils';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Icon } from '../../../components/ds/foundation/Icon';
import { SectionHeader } from '../../../components/ds/foundation/SectionHeader';
import { useCM } from '../../../constants/useCM';

export default function SuggestedHaNodesModal() {
  const CM = useCM();
  const dispatch = useDispatch();
  const { suggestedHaNodes, suggestedHaGroupId, hosts, isDiscoveryModalOpen } = useSelector((state) => state.host, shallowEqual);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredNodes = findUndiscoveredHaPeers(hosts, suggestedHaNodes);

  const HA_ROLE_LABEL = {
    master: CM.haMaster,
    slave: CM.haSlave,
    replica: CM.haReplica,
  };

  useEffect(() => {
    if (isDiscoveryModalOpen && filteredNodes.length === 0) {
      dispatch(clearSuggestedHaNodes());
    }
  }, [dispatch, filteredNodes.length, isDiscoveryModalOpen]);

  if (filteredNodes.length === 0) return null;

  const handleAddNode = () => {
    const node = filteredNodes[selectedIndex];
    if (!node) return;

    const initialData = {
      alias: `${node.hostname} (${node.state})`,
      address: node.ip || '',
      port: 8001,
      id: 'admin',
      password: '',
      ...(suggestedHaGroupId ? { groupId: suggestedHaGroupId } : {}),
    };

    // Hide this modal so AddHostModal can take focus
    dispatch(closeDiscoveryModal());
    
    // Open the standardized Add Host Modal with pre-filled data
    dispatch(openAddHostModal(initialData));
  };

  return (
    <Modal
      isOpen={isDiscoveryModalOpen && filteredNodes.length > 0}
      onClose={() => dispatch(clearSuggestedHaNodes())}
      title={CM.haPeersDiscovered}
      icon="hub"
      zIndexClass="z-[2200]"
      maxWidth="max-w-[450px]"
      footer={
        <>
          <Button variant="secondary" onClick={() => dispatch(clearSuggestedHaNodes())}>
            {CM.discard}
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddNode} 
            icon="add_link"
            className="min-w-[140px]"
          >
            {CM.add}
          </Button>
        </>
      }
    >
      <div className="space-y-6 p-1">
        <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl flex gap-3">
          <Icon name="info" className="text-amber-500 shrink-0" size="sm" />
          <p className="text-[11.5px] text-slate-600 dark:text-slate-400 leading-relaxed">
            This server is part of an HA cluster. Select a peer node to configure and add it to your server list.
          </p>
        </div>

        <SectionHeader title={CM.peerNodes} icon="checklist" />
        <div className="space-y-2 max-h-[300px] overflow-y-auto px-1 custom-scrollbar">
          {filteredNodes.map((node, i) => (
            <div 
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none group
                ${selectedIndex === i 
                  ? 'bg-amber-500/5 border-amber-500/30 ring-1 ring-amber-500/10 shadow-sm' 
                  : 'bg-white dark:bg-white/2 border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/4'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                  ${selectedIndex === i ? 'bg-amber-500/20 text-amber-600' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                  <Icon 
                    name={node.state === 'master' ? 'star' : node.state === 'replica' ? 'copy_all' : 'settings_backup_restore'} 
                    size="16px" 
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate">
                    {node.hostname || node.ip}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                    {node.ip && node.hostname ? `${node.ip} · ` : ''}{HA_ROLE_LABEL[node.state] || node.state}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div 
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                    ${selectedIndex === i ? 'border-amber-500' : 'border-slate-300 dark:border-white/10'}`}
                >
                  {selectedIndex === i && <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
