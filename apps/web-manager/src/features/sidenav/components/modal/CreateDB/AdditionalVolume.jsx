import { Button, Col, Form, Input, Row, Select, Space } from 'antd';
import styles from "@/features/sidenav/styles/Modal.module.css"
import EditableTable from '../../../../../components/common/table/EditableTable';
import React, { useEffect, useState } from 'react';
import { nanoid } from 'nanoid';


const AdditionalVolume = ({dbname, env, form})=>{
  const [exvol, setExvol] = useState([]);
  const columns = [
    {
      title: 'Volume Name',
      dataIndex: 'volume_name',
      onCell: (record) => ({
        record,
        editable: true,
        dataIndex: 'volume_name',
        title: 'Volume Name',
        handleSave,
        cellProps: {
          type: 'text',
        },
      }),
      key: nanoid(4),
    },
    {
      title: 'Volume Type',
      dataIndex: 'volume_type',
      key: nanoid(4),
      onCell: (record) => ({
        record,
        editable: true,
        dataIndex: 'volume_type',
        title: 'Volume Type',
        cellProps: {
          type: 'select',
          list: ['data', 'index', 'temp', 'generic'],
        },
        handleSave,
      }),
    },
    {
      title: 'Volume Size (Mbyte)',
      dataIndex: 'volume_size',
      onCell: (record) => ({
        record,
        editable: true,
        dataIndex: 'volume_size',
        title: 'Volume Size (Mbyte)',
        cellProps: {
          type: 'number',
        },
        handleSave,
      }),
      key: nanoid(4),
    },
    {
      title: 'Volume Path',
      dataIndex: 'volume_path',
      key: nanoid(4),
    },
    {
      title: 'action',
      key: 'action',
      width: 80,         // Keep it narrow if it's just one icon
      align: 'center',    // Centers the "action" text and the icon
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            center
            danger
            icon={<i className="fa-regular fa-trash"></i>}
            onClick={() => {
              setExvol(exvol.filter((res) => res.key !== record.key));
            }}
          >
          </Button>
        </Space>
      ),
    },
  ];
  const handleSave = (row)=>{
    const newData = exvol.map(res=>{
      if(res.key === row.key){
        return row
      }
      return res
    })
    setExvol(newData)
  }
  const handleAddVolume = ()=>{
    setExvol(prevState => [...prevState, form.getFieldsValue()])
  }

  useEffect(() => {
    const {CUBRID_DATABASES} = env;
    setExvol([
      {
        volume_name: `${dbname}_data_x001`,
        volume_type: "data",
        volume_size: 512,
        volume_path: `${CUBRID_DATABASES}/${dbname}`,
        key: nanoid(4)
      },
      {
        volume_name: `${dbname}_temp_x001`,
        volume_type: "temp",
        volume_size: 512,
        volume_path: `${CUBRID_DATABASES}/${dbname}`,
        key: nanoid(4)
      }
    ])
      form.setFieldsValue({
        volume_name: `${dbname}_data_x002`,
        volume_type: "data",
        volume_size: 512,
        volume_path: `${CUBRID_DATABASES}/${dbname}`
      })
  }, [dbname])


  return (
  <Row gutter={[12, 4]}>
    <div className={styles.db__layout}>
      <div className="border__text">Additional Volume</div>
      <Col span={24}>
        <Form.Item label="Volume Name" name="volume_name" labelCol={{span: 6}}>
          <Input readOnly={true}/>
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item label="Volume Path" name="volume_path" labelCol={{span: 6}}>
          <Input />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item label="Volume Type" name="volume_type" labelCol={{span: 6}}>
          <Select>
            <Select.Option value="data">data</Select.Option>
            <Select.Option value="temp">temp</Select.Option>
          </Select>
        </Form.Item>
      </Col>

      <Col span={24}>
        <Form.Item label="Volume Size (Mbtye): " name="volume_size" labelCol={{span: 6}}>
          <Input readOnly={true}/>
        </Form.Item>
      </Col>
      <Col style={{display:"flex", gap: 12, justifyContent: "end", padding: "12px 6px"}}>
        <Button type="primary" onClick={handleAddVolume}>
          Add Volume
        </Button>
      </Col>

      <EditableTable columns={columns} dataSource={exvol} />

    </div>
  </Row>
  )
}


export default AdditionalVolume;