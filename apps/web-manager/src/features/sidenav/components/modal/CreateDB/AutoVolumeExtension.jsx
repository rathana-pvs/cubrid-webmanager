import React, { useEffect, useState } from 'react';
import styles from "@/features/sidenav/styles/Modal.module.css"
import { Checkbox, Col, Form, Input, Row, Select } from 'antd';



const AutoVolumeExtension = ({dbname, form})=>{
  const [addVolCheck, setAddVolCheck] = useState({
    data: false,
    index: false
  })


  const handleAddVolCheckBox = (e)=>{
    const {name, checked} = e.target
    setAddVolCheck(prevState => ({...prevState, [name]: checked}))
  }

  useEffect(() => {
    form.setFieldsValue({
      data_ext_page:"32768",
      index_ext_page:"32768",
      data_warn_outofspace: "0.15",
      index_warn_outofspace: "0.15"

    })
  }, [dbname]);



  return (
    <Row gutter={[12, 4]}>
      <div className={styles.db__layout}>
        <div className="border__text">Volume Purpose: Permanent</div>
        <Checkbox name="data" value={addVolCheck.data}
                  onClick={handleAddVolCheckBox}
        >Create Volume Automatically when out of space</Checkbox>

        <Col span={24}>
          <Form.Item
            label="Out of space warning level"
            name="data_warn_outofspace"
            labelCol={{span: 6}}
          >
            <Select>
              {
                Array.from({ length: 26 }, (_, i) => {
                  return <Select.Option key={i} value={(i+5)/100}>{i + 5}</Select.Option>
                })
              }
            </Select>
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item
            label="Volume size (Mbyte)"
            name="data_ext_page"
            labelCol={{span: 6}}
          >
            <Input/>
          </Form.Item>
        </Col>

      </div>

      <div className={styles.db__layout}>
        <div className="border__text">Volume Purpose: Temporary</div>
        <Checkbox name="index" value={addVolCheck.index}
                  onClick={handleAddVolCheckBox}
        >Create Volume Automatically when out of space</Checkbox>
        <Col span={24}>
          <Form.Item
            label="Out of space warning level"
            name="index_warn_outofspace"
            labelCol={{span: 6}}
          >
            <Select>
              {
                Array.from({ length: 26 }, (_, i) => {
                  return <Select.Option key={i} value={(i+5)/100}>{i + 5}</Select.Option>
                })
              }
            </Select>
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item
            label="Volume size (Mbyte)"
            name="index_ext_page"
            labelCol={{span: 6}}
          >
            <Input/>
          </Form.Item>
        </Col>

      </div>
    </Row>
  )
}

export default AutoVolumeExtension;