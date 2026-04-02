import { useState, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { closeLoadDatabaseModal } from '../databaseSlice';
import { databaseApi } from '../databaseApi';

import LoadConfigSection from './load/LoadConfigSection';
import LoadSourceSection from './load/LoadSourceSection';
import LoadOptionsSection from './load/LoadOptionsSection';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';
import { Typography } from '../../../components/ds/foundation/Typography';
import { useActionState } from '../../../infrastructure/hooks/useActionState';
import { 
  ModalStatusLoading, 
  ModalStatusSuccess, 
  ModalStatusError 
} from '../../../components/ds/feedback/ActionStatus';

// view states
const VIEW_FORM    = 'form';
const VIEW_LOADING = 'loading';
const VIEW_SUCCESS = 'success';
const VIEW_ERROR   = 'error';

export default function LoadDatabaseModal() {
  const dispatch = useDispatch();
  const { isLoadDatabaseModalOpen: isLoadDBModalOpen } = useSelector((state) => state.databaseUI, shallowEqual);
  const { selectedDatabase } = useSelector((state) => state.database, shallowEqual);
  const { selectedHostUid } = useSelector((state) => state.host, shallowEqual);
  
  const { 
    state, 
    error: actionError, 
    startAction, 
    endSuccess, 
    endError, 
    resetAction,
    isLoading,
    isSuccess,
    isError
  } = useActionState();

  const [unloadList, setUnloadList] = useState([]);
  const [selectedUnload, setSelectedUnload] = useState("");
  const [dataSource, setDataSource] = useState([]);
  const [radio, setRadio] = useState(0); // 0: Pre-defined source, 1: Specific path

  const [formData, setFormData] = useState({
    targetDbName: '',
    dbUsername: 'dba',
    unloadFiles: {
      schema: '',
      object: '',
      index: '',
      trigger: ''
    },
    checkBoxes: {
      schema: false,
      object: false,
      index: false,
      trigger: false,
      checkoption: false,
      nolog: false,
      oiduse: false,
      statisticsuse: false,
      estimated: false,
      period: false,
      errorcontrolfile: false,
      ignoreclassfile: false
    },
    values: {
      estimated: '',
      period: '',
      errorcontrolfile: '',
      ignoreclassfile: ''
    }
  });

  const updateDataSource = (rawData) => {
    const convertedList = Object.entries(rawData)
      .filter(([key]) => key !== 'dbname')
      .map(([key, value]) => {
        const [path, date] = value.split(';');
        return {
          loadType: key,
          path: path,
          date: date,
          key: Math.random().toString(36).substr(2, 4),
          checked: false
        };
      });
    setDataSource(convertedList);
  };

  useEffect(() => {
    if (isLoadDBModalOpen && selectedDatabase) {
      resetAction();
      setFormData(prev => ({
        ...prev,
        targetDbName: selectedDatabase,
      }));

      databaseApi.getUnloadInfo(selectedHostUid).then((res) => {
        const dbs = res.database || [];
        setUnloadList(dbs);
        if (dbs.length > 0) {
          const firstDb = dbs[0];
          setSelectedUnload(firstDb.dbname);
          updateDataSource(firstDb);
        }
      }).catch(err => console.error("Failed to fetch unload info:", err));
    }
  }, [isLoadDBModalOpen, selectedDatabase, selectedHostUid, resetAction]);

  if (!isLoadDBModalOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleValueChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      values: { ...prev.values, [name]: value }
    }));
  };

  const handleCheckBoxChange = (name, checked) => {
    setFormData(prev => ({
      ...prev,
      checkBoxes: { ...prev.checkBoxes, [name]: checked }
    }));
  };

  const handleUnloadPathChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      unloadFiles: { ...prev.unloadFiles, [name]: value }
    }));
  };

  const handleTableCheckboxChange = (checked, key) => {
    setDataSource(prev => prev.map(item => item.key === key ? { ...item, checked } : item));
  };

  const handleUnloadSelectChange = (dbname) => {
    setSelectedUnload(dbname);
    const dbData = unloadList.find(d => d.dbname === dbname);
    if (dbData) {
      updateDataSource(dbData);
    }
  };

  const handleLoadDatabase = async () => {
    if (!selectedHostUid || !selectedDatabase) return;
    
    startAction();
    try {
      const toYesNo = (val) => (val ? "yes" : "no");
      let loadObject = {};

      if (radio === 0) {
        ["index", "schema", "object", "trigger"].forEach(item => {
          const found = dataSource.find(res => res.checked && res.loadType === item);
          loadObject[item] = found ? found.path : "none";
        });
      } else {
        loadObject = {
          index: formData.checkBoxes.index ? formData.unloadFiles.index : "none",
          schema: formData.checkBoxes.schema ? formData.unloadFiles.schema : "none",
          object: formData.checkBoxes.object ? formData.unloadFiles.object : "none",
          trigger: formData.checkBoxes.trigger ? formData.unloadFiles.trigger : "none",
        };
      }

      const payload = {
        dbname: selectedDatabase,
        ...loadObject,
        user: formData.dbUsername,
        oiduse: toYesNo(formData.checkBoxes.oiduse),
        statisticsuse: toYesNo(formData.checkBoxes.statisticsuse),
        nolog: toYesNo(formData.checkBoxes.nolog),
        period: formData.checkBoxes.period ? formData.values.period : "none",
        estimated: formData.checkBoxes.estimated ? formData.values.estimated : "none",
        errorcontrolfile: formData.checkBoxes.errorcontrolfile ? formData.values.errorcontrolfile : "none",
        ignoreclassfile: formData.checkBoxes.ignoreclassfile ? formData.values.ignoreclassfile : "none",
        checkoption: formData.checkBoxes.checkoption ? "both" : "none",
      };

      await databaseApi.loadDatabase(selectedHostUid, selectedDatabase, payload);
      endSuccess(`Infrastructure for ${selectedDatabase} has been populated with the provided source payload.`);
    } catch (err) {
      endError(typeof err === 'string' ? err : (err.message || 'The data injection process was interrupted. Verify the source payload integrity.'));
    }
  };

  const handleClose = () => dispatch(closeLoadDatabaseModal());

  /* ─── LOADING view ─── */
  if (isLoading) {
    return (
      <Modal isOpen title="Loading Instance" icon="download" onClose={handleClose} maxWidth="720px">
        <ModalStatusLoading 
          title="Injecting Instance Payload" 
          subtitle={`Synchronizing schema objects and data records for ${selectedDatabase}.`}
        />
      </Modal>
    );
  }

  /* ─── SUCCESS view ─── */
  if (isSuccess) {
    return (
      <Modal isOpen title="System Synchronized" icon="download" iconVariant="success" onClose={handleClose} maxWidth="720px">
        <ModalStatusSuccess 
          title="Injection Finalized"
          message={`Infrastructure for ${selectedDatabase} has been populated with the provided source payload.`}
          onConfirm={handleClose}
          confirmText="Acknowledge"
        />
      </Modal>
    );
  }

  /* ─── ERROR view ─── */
  if (isError) {
    return (
      <Modal isOpen title="Execution Error" icon="database_upload" iconVariant="danger" onClose={resetAction} maxWidth="700px">
        <ModalStatusError 
          title="Transaction Dropped"
          error={actionError}
          onRetry={handleLoadDatabase}
          onCancel={resetAction}
          retryText="Retry Submission"
          cancelText="Dismiss"
        />
      </Modal>
    );
  }

  /* ─── FORM view ─── */
  return (
    <Modal
      isOpen={isLoadDBModalOpen}
      onClose={handleClose}
      title="Load Database Asset"
      subtitle="Inject schema and records from portable source files"
      icon="download"
      maxWidth="720px"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="ghost" onClick={handleClose}>Discard</Button>
          <Button 
            onClick={handleLoadDatabase}
            icon="play_circle"
            className="min-w-[140px]"
          >
            Execute Load
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        <LoadConfigSection 
          formData={formData} 
          handleInputChange={handleInputChange} 
        />

        <LoadSourceSection 
          radio={radio}
          setRadio={setRadio}
          selectedUnload={selectedUnload}
          handleUnloadSelectChange={handleUnloadSelectChange}
          unloadList={unloadList}
          dataSource={dataSource}
          handleTableCheckboxChange={handleTableCheckboxChange}
          formData={formData}
          handleCheckBoxChange={handleCheckBoxChange}
          handleUnloadPathChange={handleUnloadPathChange}
        />

        <LoadOptionsSection 
          formData={formData}
          handleCheckBoxChange={handleCheckBoxChange}
          handleValueChange={handleValueChange}
        />
      </div>
    </Modal>
  );
}
