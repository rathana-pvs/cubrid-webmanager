import React, { useEffect, useState } from 'react';
import { Modal, Button, Checkbox, Table, Divider } from 'antd';
import styles from '@/features/sidenav/styles/Modal.module.css';



const UnloadResult = (props) => {
  const [dataSource, setDataSource] = useState([]);
  const columns = [
    { title: 'Table', dataIndex: 'table', key: 'table' },
    {title: "Row count", dataIndex: "rowcount", key: 'rowcount' },
    {title: "Progress (%)", dataIndex: "progress", key: 'progress' },
  ]

  useEffect(() => {
    if(props.open){
      console.log(props);
      const result = Object.entries(props.data[0]).map(([tableName, valueString]) => {
        // Regex explanation:
        // (\d+)      -> captures the row count (digits)
        // .*?\/      -> skips everything until the forward slash
        // (\d+)      -> captures the progress (digits)
        const match = valueString.match(/(\d+)\s*\(.*?\/(\d+)%\)/);

        return {
          table: tableName,
          rowcount: match ? parseInt(match[1], 10) : 0,
          progress: match ? parseInt(match[2], 10) : 0,
        };
      });
      setDataSource(result)
    }
  },[props.data])
  return (
    <Modal
      title="Unnload Result"
      open={props.open}
      footer={() => {
        return (
          <>
            <Button type="primary" onClick={() => props.onClose()}>
              OK
            </Button>
          </>
        );
      }}
    >
      <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
        <div className={styles.title}>Below you can view the unload database result</div>
          <Divider/>
          <Table
            dataSource={dataSource}
            bordered
            columns={columns}
            pagination={false}
          />
        </div>
    </Modal>
  );
};

export default UnloadResult;
