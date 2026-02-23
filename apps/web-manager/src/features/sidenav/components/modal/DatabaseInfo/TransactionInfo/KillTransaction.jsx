import React, { useEffect, useState } from 'react';
import { Modal, Button, Row, Col, Form, Input, Select } from 'antd';
import styles from '@/features/sidenav/styles/Modal.module.css';
import { killTransactionAPI } from '../../../../../domain/transaction/transactionAPI';
import { useDispatch, useSelector } from 'react-redux';
import { setBuffering } from '../../../../../../shared/slice/globalSlice';

const KillTransaction = (props) => {
  const {activeHost} = useSelector(state => state.host);
  const dispatch = useDispatch();
  const [form] = Form.useForm();


  useEffect(() => {
    if (props.open) {
      form.setFieldsValue({
        ...props.data,
        type: "i"
      })
    }
  }, [props.data]);

  const onOK = async () => {
    dispatch(setBuffering(true));
    const { tranindex, dbname } = props.data;
    const idx = tranindex?.match(/\d+/)?.[0] || '';
    const payload = {
      dbname,
      type: form.getFieldValue("type"),
      parameter: idx
    }
    const response = await killTransactionAPI(activeHost,payload)
      .finally(()=>{
        dispatch(setBuffering(false));
      });
    if(response.success) {
      props.onClose();
    }
  }
  return (
    <Modal
      width={680}
      title="Kill Transaction"
      open={props.open}
      footer={() => {
        return (
          <>
            <Button type="primary" onClick={() => props.onClose()}>
              Cancel
            </Button>
            <Button type="primary" onClick={() => onOK()}>
              OK
            </Button>
          </>
        );
      }}
    >
      <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
        <div className={styles.title}>Kill Transaction</div>
        <Form form={form} layout="horizontal">
          <div className={styles.db__layout}>
            <div className={'border__text'}>Transaction information</div>
            <Row gutter={[12, 0]}>
              <Col span={12}>
                <Form.Item labelCol={{ span: 10 }} name="@user" label="User name: ">
                  <Input readOnly />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item labelCol={{ span: 10 }} name="host" label="Host: ">
                  <Input readOnly />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item labelCol={{ span: 10 }} name="pid" label="Process id: ">
                  <Input readOnly />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item labelCol={{ span: 10 }} name="program" label="Program name: ">
                  <Input readOnly />
                </Form.Item>
              </Col>
            </Row>
          </div>
          <Row>
            <Col span={24}>
              <Form.Item name="type" labelCol={{ span: 7 }} label="Kill type: ">
                <Select>
                  <Option value="i">Kill the selected transaction only</Option>
                  <Option value="h">
                    Kil all transactions associated with the same client host
                  </Option>
                  <Option value="p">
                    Kill all transactions associated with the same program name
                  </Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>
    </Modal>
  );
};

export default KillTransaction;
