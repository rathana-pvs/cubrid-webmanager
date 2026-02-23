import React, { useEffect } from 'react';
import { Modal, Button, Row, Col, Form, Input } from 'antd';
import styles from '@/features/sidenav/styles/Modal.module.css';

const UnloadResult = (props) => {

  const [form] = Form.useForm();
  const onConfirm = () => {
    form.validateFields().then(values => {
      props.onConfirm(values);
      props.onClose();
    })

  }
  useEffect(() => {
    if(props.open){
      form.setFieldValue("dbname", props.node.dbname)
    }
  }, [props.open])

  return (
    <Modal
      title="Confirm DB Password"
      open={props.open}
      footer={() => {
        return (
          <>
            <Button type="primary" onClick={() => props.onClose()}>
              Cancel
            </Button>
            <Button type="primary" onClick={() => onConfirm()}>
              Confirm
            </Button>
          </>
        );
      }}
    >
      <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
        <div className={styles.text_title}>Below you can view the unload database result</div>
        <Form form={form} layout="horizontal">
          <Row>
            <Col span={24}>
              <Form.Item labelCol={{ span: 7 }} name="dbname"
                         label="Database name ">
                <Input readOnly />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                labelCol={{ span: 7 }}
                name="username"
                label="Username"
                rules={[{ required: true, message: 'required' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                labelCol={{ span: 7 }}
                name="password"
                label="Password"
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>
    </Modal>
  );
};

export default UnloadResult;
