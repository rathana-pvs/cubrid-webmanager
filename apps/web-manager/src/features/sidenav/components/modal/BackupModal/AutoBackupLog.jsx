import React, { useEffect, useState } from 'react';
import { Modal, Button, Table, Divider } from 'antd';
import styles from '@/features/sidenav/styles/Modal.module.css';
import { getAutoBackupDBErrLogAPI } from '../../../../domain/log/logAPI';
import { useDispatch, useSelector } from 'react-redux';
import { setAutoBackupLog } from '../../../sideNavSlice';

const AutoBackupLog = (props) => {
  const {activeHost} = useSelector((state) => state.host);
  const {autoBackupLog} = useSelector((state) => state.sidenav);
  const dispatch = useDispatch();
  const [dataSource, setDataSource] = useState([]);
  const columns = [
    { title: 'Database', dataIndex: 'database', key: 'database' },
    { title: 'Backup ID', dataIndex: 'backup_id', key: 'backup_id' },
    { title: 'Log Time', dataIndex: 'log_time', key: 'log_time' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
  ];

  useEffect(() => {
    if (autoBackupLog.open) {
      getAutoBackupDBErrLogAPI(activeHost).then(res=>{
        if(res.success){
          console.log(res.data);
        }
      })
    }
  }, [autoBackupLog]);
  const handleClose = () => {
    dispatch(setAutoBackupLog({ open: false }));
  }
  return (
    <Modal
      title="Auto Backup Log"
      open={autoBackupLog.open}
      footer={() => {
        return (
          <>
            <Button type="primary" onClick={() => handleClose()}>
              OK
            </Button>
          </>
        );
      }}
    >
      <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
        <div className={styles.title}>Below you can view the unload database result</div>
        <Divider />
        <Table dataSource={dataSource} bordered columns={columns} pagination={false} />
      </div>
    </Modal>
  );
};

export default AutoBackupLog;
