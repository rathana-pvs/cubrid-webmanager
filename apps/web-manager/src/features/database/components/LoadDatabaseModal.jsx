import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeLoadDBModal } from '../databaseSlice';
import { showStatusModal } from '../../layout/layoutSlice';
import { databaseApi } from '../databaseApi';

import LoadConfigSection from './load/LoadConfigSection';
import LoadSourceSection from './load/LoadSourceSection';
import LoadOptionsSection from './load/LoadOptionsSection';

import { Icon } from '../../../components/ds/foundation/Icon';
import { Modal } from '../../../components/ds/layout/Modal';
import { Button } from '../../../components/ds/foundation/Button';

export default function LoadDatabaseModal() {
  const dispatch = useDispatch();
  const { isLoadDBModalOpen, selectedDatabase } = useSelector((state) => state.database);
  const { selectedHostUid } = useSelector((state) => state.host);
  
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

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
  }, [isLoadDBModalOpen, selectedDatabase, selectedHostUid]);

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
    
    setIsLoading(true);
    setError(null);
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
      dispatch(closeLoadDBModal());
      dispatch(showStatusModal({
        type: 'success',
        title: 'Load success',
        message: 'Database load operation has been queued successfully.'
      }));
    } catch (err) {
      console.error('Failed to load database:', err);
      setError(err.response?.data?.note || err.response?.data?.message || 'Database restoration failed. Verify source file access.');
    } finally {
      setIsLoading(false);
    }
  };

  const footer = (
    <>
      <Button 
        variant="ghost" 
        onClick={() => dispatch(closeLoadDBModal())}
      >
        Discard
      </Button>
      <Button 
        onClick={handleLoadDatabase}
        loading={isLoading}
        icon="play_circle"
        className="min-w-[130px]"
      >
        Run load
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isLoadDBModalOpen}
      onClose={() => dispatch(closeLoadDBModal())}
      title="Load database"
      icon="download"
      footer={footer}
      loading={isLoading}
      error={error}
      onErrorClose={() => setError(null)}
      onErrorRetry={handleLoadDatabase}
      maxWidth="max-w-[720px]"
    >
      <div className="space-y-6">
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
