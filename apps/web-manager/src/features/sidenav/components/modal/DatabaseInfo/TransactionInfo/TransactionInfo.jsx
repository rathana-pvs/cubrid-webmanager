import React, { useEffect, useRef, useState } from 'react';
import { Modal, Button, Table, Divider } from 'antd';
import styles from '@/features/sidenav/styles/Modal.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { getTransactionInfoAPI } from '../../../../../domain/transaction/transactionAPI';
import ConfirmDBPassword from '../../../../../../components/composite/ConfirmDBPassword/ConfirmDBPassword';
import KillTransaction from './KillTransaction';
import { setTransactionInfo } from '../../../../sideNavSlice';


const TransactionInfo = () => {
  const {activeHost} = useSelector((state) => state.host);
  const {transactionInfo} = useSelector((state) => state.sidenav);
  const dispatch = useDispatch();

  const [dataSource, setDataSource] = useState([]);
  const [confirmPassword, setConfirmPassword] = useState(false);
  const dbLogin = useRef({login: false});
  const [killTransaction, setKillTransaction] = useState({open: false});
  const [selectedRowId, setSelectedRowId] = useState(null);
  const columns = [
    { title: 'Tran index', dataIndex: 'tranindex', key: 'tranindex' },
    { title: 'User name', dataIndex: '@user', key: '@user' },
    { title: 'Host', dataIndex: 'host', key: 'host' },
    { title: 'Process id', dataIndex: 'pid', key: 'pid' },
    { title: 'Program name', dataIndex: 'program', key: 'program' },
  ];

  const refreshData = async () => {
    // console.log(transactionInfo.node);
    // if(!dbLogin.current.login) {
    //   setConfirmPassword(true);
    //   return
    // }

    const {result, success} = await getTransactionInfoAPI(activeHost, {
      dbname: transactionInfo.node.dbname,
    })
    dbLogin.current.login = success;
    if(success){
      if(result.transactioninfo){
        setDataSource(result.transactioninfo[0].transaction);
      }

    }

  }
  const onConfirmPassword = (value) => {
    // dbLogin.current = {...value, login: true};
    refreshData()
  }

  useEffect(() => {
    if(transactionInfo.open) {
      refreshData()
    }

  }, [transactionInfo]);

  const handleClose = () => {
    dispatch(setTransactionInfo({open: false}));


  }
  const handleKillTransaction = (value) => {
    setKillTransaction({open: true,
      data: {...dataSource.find(res=>res.pid === value),
      dbname: transactionInfo.node.dbname}})
  }
  return (
    <>
      <KillTransaction {...killTransaction}
                       onClose={()=>setKillTransaction({open: false})} />
      <Modal
        onClose={handleClose}
        width={760}
        title="Transaction Information"
        open={transactionInfo.open}
        footer={() => {
          return (
            <>
              <Button type="primary" disabled={!selectedRowId} onClick={() => handleKillTransaction(selectedRowId)}>
                Kill transaction
              </Button>
              <Button type="primary" onClick={() => handleClose()}>
                Cancel
              </Button>
              <Button type="primary" onClick={() => refreshData()}>
                Refresh
              </Button>
            </>
          );
        }}
      >
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <div className={styles.text__title}>Transaction information</div>
          <Divider />
          <div>Active transactions of database: </div>
          <div className={styles.db__layout}>
            <div className={'border__text'}>Transactions:</div>
            <Table
              rowKey="id"
              rowClassName={(record) => (record.pid === selectedRowId ? 'ant-table-row-selected' : '')}
              onRow={(record) => ({
                onClick: () => {
                  setSelectedRowId(record.pid);
                },
              })}
              dataSource={dataSource}
              bordered
              columns={columns}
              pagination={false}
            />
          </div>
        </div>
        <ConfirmDBPassword
          open={confirmPassword}
          node={transactionInfo.node}
          onClose={() => setConfirmPassword(false)}
          onConfirm={(value) => onConfirmPassword(value)}
        />
      </Modal>
    </>

  );
};

export default TransactionInfo;
