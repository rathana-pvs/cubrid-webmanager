import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeImportExportModal, addHost } from '../hostSlice';
import { showStatusModal } from '../../layout/layoutSlice';
import { exportHostsToXml, parseHostsXml } from '../hostImportExport';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Table } from '../../../components/ds/layout/Table';
import { Badge } from '../../../components/ds/foundation/Badge';
import { Input } from '../../../components/ds/forms/Input';
import { FileUpload } from '../../../components/ds/forms/FileUpload';
import { Typography } from '../../../components/ds/foundation/Typography';
import { Checkbox } from '../../../components/ds/forms/Checkbox';

import { Icon } from '../../../components/ds/foundation/Icon';

export default function ImportExportHostModal() {
  const dispatch = useDispatch();
  const { isImportExportModalOpen, importExportMode, hosts } = useSelector((state) => state.host, shallowEqual);
  const [selectedHosts, setSelectedHosts] = useState([]);
  const [importList, setImportList] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('export_servers');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isImportExportModalOpen) {
      if (importExportMode === 'export') {
        setImportList(hosts);
        setSelectedHosts(hosts.map(h => h.uid));
      } else {
        setImportList([]);
        setSelectedHosts([]);
      }
    }
  }, [isImportExportModalOpen, importExportMode, hosts]);

  if (!isImportExportModalOpen) return null;

  const handleToggleHost = (uid) => {
    setSelectedHosts(prev => 
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleToggleAll = () => {
    const selectable = importList.filter(h => !h.isDuplicate);
    if (selectedHosts.length === selectable.length) {
      setSelectedHosts([]);
    } else {
      setSelectedHosts(selectable.map(h => h.uid));
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const xmlString = event.target.result;
        const parsed = parseHostsXml(xmlString);
        
        const listWithStatus = parsed.map(h => {
          const isDuplicate = hosts.find(existing => 
            existing.address === h.address && String(existing.port) === String(h.port)
          );
          return {
            ...h,
            uid: h.address + ':' + h.port + ':' + h.id,
            isDuplicate: !!isDuplicate
          };
        });

        setImportList(listWithStatus);
        setSelectedHosts(listWithStatus.filter(h => !h.isDuplicate).map(h => h.uid));
      } catch (err) {
        dispatch(showStatusModal({ 
          type: 'error', 
          title: 'Import Error', 
          message: err.message || 'An error occurred while parsing the file.' 
        }));
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleAction = async () => {
    if (selectedHosts.length === 0) return;

    setIsProcessing(true);
    try {
      if (importExportMode === 'export') {
        const hostsToExport = hosts.filter(h => selectedHosts.includes(h.uid));
        const finalFileName = `${fileName || 'export_servers'}.xml`;
        exportHostsToXml(hostsToExport, finalFileName);
        dispatch(closeImportExportModal());
      } else {
        const hostsToImport = importList.filter(h => selectedHosts.includes(h.uid));
        let addedCount = 0;
        let skippedCount = 0;

        for (const hostData of hostsToImport) {
          const isDuplicate = hosts.find(h => h.address === hostData.address && String(h.port) === String(hostData.port));
          if (isDuplicate) {
            skippedCount++;
            continue;
          }
          
          try {
            await dispatch(addHost({ ...hostData, port: Number(hostData.port) })).unwrap();
            addedCount++;
          } catch (err) {
            skippedCount++;
          }
        }

        dispatch(showStatusModal({ 
          type: 'success', 
          title: 'Import Result', 
          message: `Imported ${addedCount} hosts successfully. ${skippedCount} items were skipped.` 
        }));
        dispatch(closeImportExportModal());
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const title = importExportMode === 'export' ? 'Export Hosts' : 'Import Hosts';
  const actionLabel = importExportMode === 'export' ? 'Export' : 'Import';
  const icon = importExportMode === 'export' ? 'file_upload' : 'file_download';

  const selectable = importList.filter(h => !h.isDuplicate);
  const isAllSelected = selectable.length > 0 && selectedHosts.length === selectable.length;
  const isSomeSelected = selectedHosts.length > 0 && selectedHosts.length < selectable.length;

  return (
    <Modal
      isOpen={isImportExportModalOpen}
      onClose={() => dispatch(closeImportExportModal())}
      title={title}
      icon={icon}
      loading={isProcessing}
      maxWidth="max-w-[720px]"
      subtitle={importExportMode === 'export' 
        ? 'Export hosts to XML file. Note: The passwords are not included.' 
        : 'Import hosts from XML file.'}
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-4">
            {importExportMode === 'import' && importList.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                icon="change_circle"
                onClick={() => { setImportList([]); setSelectedHosts([]); }}
              >
                Change File
              </Button>
            )}
            {importExportMode === 'export' && (
              <div className="flex items-center gap-2">
                <Typography variant="caption" className="font-bold text-slate-400 uppercase tracking-tight">Filename:</Typography>
                <div className="w-48">
                  <Input 
                    size="sm"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="export_servers"
                    suffix=".XML"
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              onClick={() => dispatch(closeImportExportModal())}
              disabled={isProcessing}
            >
              Discard
            </Button>
            <Button 
              variant="primary" 
              onClick={handleAction}
              disabled={selectedHosts.length === 0 || isProcessing}
              loading={isProcessing}
              icon={icon === 'file_upload' ? 'bolt' : icon}
              className="min-w-[120px]"
            >
              {actionLabel}
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col h-[500px]">
        {importExportMode === 'import' && importList.length === 0 ? (
            <div className="p-8">
              <FileUpload
                label="Import Hosts XML"
                accept=".xml"
                onFileSelect={(file) => {
                  const event = { target: { files: [file] } };
                  handleFileChange(event);
                }}
              />
              <Typography variant="p" className="text-slate-500 mt-4 text-center text-[11px] max-w-[280px] mx-auto">
                Select an XML file containing host connections exported from CUBRID Admin.
              </Typography>
            </div>
        ) : (
          <>
            <div className="px-4 py-2 bg-slate-50/50 dark:bg-bk-main/20 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={isAllSelected}
                  indeterminate={isSomeSelected}
                  onChange={handleToggleAll}
                  disabled={selectable.length === 0}
                  label="SELECT ALL"
                  className="text-[10px]! font-bold tracking-wider text-slate-500"
                />
              </div>
              <Badge variant="yellow" size="sm">
                {selectedHosts.length} SELECTED
              </Badge>
            </div>

            <div className="flex-1 overflow-hidden">
               <Table
                  className="h-full"
                   columns={[
                    { 
                      accessor: 'select', 
                      header: '', 
                      width: '48px',
                      render: (_, host) => {
                        const id = host.uid || host.address + host.port + host.id;
                        const isSelected = selectedHosts.includes(id);
                        return (
                          <div className="flex justify-center">
                            <Checkbox 
                              checked={isSelected}
                              onChange={() => !host.isDuplicate && handleToggleHost(id)}
                              disabled={host.isDuplicate}
                            />
                          </div>
                        );
                      }
                    },
                    { 
                      accessor: 'alias', 
                      header: 'Name',
                      render: (alias, host) => (
                        <div className="flex items-center gap-2">
                          <Typography variant="caption" className={`font-bold ${host.isDuplicate ? 'text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                            {alias || 'Unnamed'}
                          </Typography>
                          {host.isDuplicate && (
                            <Badge variant="secondary" size="xs">DUPLICATE</Badge>
                          )}
                        </div>
                      )
                    },
                    { accessor: 'address', header: 'Address' },
                    { accessor: 'port', header: 'Port' }
                  ]}
                  data={importList}
                  onRowClick={(host) => {
                    const id = host.uid || host.address + host.port + host.id;
                    if (!host.isDuplicate) handleToggleHost(id);
                  }}
                  rowClassName={(host) => {
                    const id = host.uid || host.address + host.port + host.id;
                    const isSelected = selectedHosts.includes(id);
                    return `
                      ${isSelected ? 'bg-bk-yellow/3' : ''} 
                      ${host.isDuplicate ? 'opacity-60 grayscale-[0.5]' : 'cursor-pointer'}
                    `;
                  }}
               />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
