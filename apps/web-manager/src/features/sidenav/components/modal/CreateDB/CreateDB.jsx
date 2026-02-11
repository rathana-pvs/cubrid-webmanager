import React, { useEffect, useState } from 'react';
import { Button, Checkbox, Col, Form, Input, Modal, Radio, Row, Select } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import styles from '@/features/sidenav/styles/Modal.module.css';
import { setCreateDB } from '../../../sideNavSlice';
import { isEmptyString } from '../../../../../lib/utils';
import * as Yup from 'yup';
import { getHostVersionAPI } from '../../../../domain/host/hostAPI';
import AdditionalVolume from './AdditionalVolume';
import AutoVolumeExtension from './AutoVolumeExtension';
import UpdateDBPassword from './UpdateDBPassword';
import { createDBAPI } from '../../../../domain/database/databaseAPI';
import { setBuffering } from '../../../../../shared/slice/globalSlice';

const collations = ['en_US.iso88591', 'ko_KR.utf8', 'en_US.utf8', 'User Defined', 'ko_KR.euckr'];

const validation = [
  Yup.object().shape({
    dbname: Yup.string().required('dbname required'),
  }),
  false,
  Yup.object().shape({
    data_warn_outofspace: Yup.number().required('required'),
    data_ext_page: Yup.number().required('required'),
    index_warn_outofspace: Yup.number().required('required'),
    index_ext_page: Yup.number().required('required'),
  }),
];

function getNumPage(totalSize, pageSize) {
  return (totalSize * 1048576) / pageSize;
}

export default function () {
  // const {servers, databases} = useSelector(state => state);
  const { activeHost } = useSelector((state) => state.host);
  const { createDB } = useSelector((state) => state.sidenav);
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [pageId, setPageId] = useState(0);
  const [db, setDB] = useState({});
  const [dbname, setDBName] = useState('');
  const [autoStart, setAutoStart] = useState(false);
  const [exvol, setExvol] = useState([]);
  const [addVol, setAddVol] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [env, setEnv] = useState({});
  const [checkBox, setCheckBox] = useState({});

  const handleCheckBox = (e) => {
    const { name, checked } = e.target;
    setCheckBox((prevState) => ({ ...prevState, [name]: checked }));
  };
  const handleCreate = async () => {
    dispatch(setBuffering(true))
    form.validateFields().then(async (values) => {
      let setAutoAddVol = {}
      if(checkBox.index){
        setAutoAddVol = {
          index: "ON",
          index_warn_outofspace: addVol.index_warn_outofspace,
          index_ext_page: addVol.index_ext_page,
        }
      }
      if(checkBox.data){
        setAutoAddVol = {
          ...setAutoAddVol,
          data: "ON",
          data_warn_outofspace: addVol.data_warn_outofspace,
          data_ext_page: addVol.data_ext_page,
        }
      }
      const payload = {
        ...db,
        setAutoStart: checkBox.setAutoStart,
        overwrite_config_file: checkBox.overwrite_config_file ? "YES" : "NO",
        numpage: getNumPage(db.db_volume_size, db.pagesize),
        exvol: exvol.map((item) => {
          return {
            [item.volume_name]: {
              type: item.volume_type,
              size: item.volume_size,
              pagesize: db.pagesize,
              volpath: item.volume_path,
            },
          };
        }),
        setAutoAddVol: setAutoAddVol,
        username: values.username,
        updateUser: {
          userpass: values.password,
        },
      };

      const response = await createDBAPI(activeHost, payload)
        .finally(()=>{
          dispatch(setBuffering(false))
        })
      if(response.success){
        handleClose()
      }

    });
  };

  useEffect(() => {
    if (createDB.node) {
      getHostVersionAPI(activeHost).then((res) => {
        if (res.success) {
          setEnv(res.result);
          form.setFieldsValue({
            genvolpath: res.result['CUBRID_DATABASES'],
            logvolpath: res.result['CUBRID_DATABASES'],
          });
          const shortVersion = res.result['CUBRIDVER'].match(/\d+\.\d+/)[0];
          if (parseFloat(shortVersion) >= 10.2) {
            setNewVersion(true);
          }
        }
      });
    }
  }, [createDB.node]);

  useEffect(() => {
    const { CUBRID_DATABASES } = env;
    if (pageId === 0) {
      form.setFieldsValue({
        genvolpath: `${CUBRID_DATABASES}/${dbname}`,
        logvolpath: `${CUBRID_DATABASES}/${dbname}`,
        charset: 'en_US.iso88591',
        numpage: 512,
        pagesize: 16384,
        logsize: 512,
        logpagesize: 16384,
        db_volume_size: 512,
      });
    }
  }, [dbname, pageId]);

  const updateNextPage = async (counter) => {
    const index = pageId + counter;
    if (index > -1 && index < 5) {
      if (counter === -1) {
        setPageId(index);
      } else {
        const validate = validation[pageId];
        if (index === 1) {
          validate.validate({ ...form.getFieldsValue() }).then((res) => {
            setDB(res);
            setPageId(index);
          });
        } else if (index === 3) {
          setAddVol(form.getFieldsValue());
          setPageId(index);
        } else if (index === 4) {
          const { password, confirm_password } = form.getFieldsValue();
          if (password === confirm_password) {
            await handleCreate();
          }
        } else {
          setPageId(index);
        }
      }
    }
  };

  const handleClose = () => {
    dispatch(setCreateDB({ open: false }));
    form.resetFields()
  };

  const getPages = () => {
    if (pageId === 0) {
      return (
        <Row gutter={[0, 0]}>
          <div className={styles.db__layout}>
            <div className="border__text">General</div>
            <Col span={24}>
              <Form.Item
                label="Database"
                name="dbname"
                labelCol={{ span: 5 }}
                onChange={(e) => {
                  setDBName(e.target.value);
                }}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Page Size" name="pagesize" labelCol={{ span: 5 }}>
                <Select>
                  <Select.Option value={4096}>4096</Select.Option>
                  <Select.Option value={8192}>8192</Select.Option>
                  <Select.Option value={16384}>16384</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </div>

          <div className={styles.db__layout}>
            <div className="border__text">Collation (Charset)</div>
            <Col>
              <Form.Item name="charset">
                <Radio.Group>
                  <Row gutter={[16, 8]}>
                    {collations.map((c, index) => (
                      <Col span={8} key={c}>
                        <Radio value={c}>{c}</Radio>
                      </Col>
                    ))}
                  </Row>
                </Radio.Group>
              </Form.Item>
            </Col>
          </div>

          <div className={styles.db__layout}>
            <div className="border__text">General Volume Information</div>

            <Col span={24}>
              <Form.Item label="Generic Volume Size" name="db_volume_size" labelCol={{ span: 8 }}>
                <Input type={'number'} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Generic Volume Path" name="genvolpath" labelCol={{ span: 8 }}>
                <Input />
              </Form.Item>
            </Col>
          </div>

          <div className={styles.db__layout}>
            <div className="border__text">Log Volume Information</div>
            <Col span={24}>
              <Form.Item label="Log page size (btye): " name="logpagesize" labelCol={{ span: 8 }}>
                <Select>
                  <Select.Option value={4096}>4096</Select.Option>
                  <Select.Option value={8192}>8192</Select.Option>
                  <Select.Option value={16384}>16384</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Volume size (Mbtye): " name="logsize" labelCol={{ span: 8 }}>
                <Input type={'number'} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Log volume path: " name="logvolpath" labelCol={{ span: 8 }}>
                <Input />
              </Form.Item>
            </Col>
          </div>
          <div className={styles.db__layout}>
            <div className="border__text">Attribute</div>
            <Checkbox
              name="setAutoStart"
              value={autoStart}
              onChange={handleCheckBox}
            >
              Auto start database when start cubrid service
            </Checkbox>
            {/*<br/> Set the current database to start automatically when start cubrid service*/}
            <br />
            <Checkbox name="overwrite_config_file" onChange={handleCheckBox}>
              overwrite config file
            </Checkbox>
          </div>
        </Row>
      );
    } else if (pageId === 1) {
      return <AdditionalVolume form={form} env={env} dbname={dbname} onExvolChange={setExvol} />;
    } else if (pageId === 2) {
      return (
        <AutoVolumeExtension
          form={form}
          onChangeCheckBox={handleCheckBox}
        />
      );
    } else if (pageId === 3) {
      return <UpdateDBPassword />;
    }
  };

  const isNext = () => {
    if (pageId === 0) {
      setIsValid(!isEmptyString(form.getFieldValue('dbname')));
    } else if (pageId === 3) {
      const { password, confirm_password } = form.getFieldsValue();
      setIsValid(password === confirm_password);
    } else {
      setIsValid(true);
    }
  };

  return (
    <Modal
      width={800}
      title="Create DB"
      open={createDB.open}
      footer={() => {
        return (
          <>
            <Button type="primary" disabled={pageId === 0} onClick={() => updateNextPage(-1)}>
              Back
            </Button>
            <Button
              type="primary"
              disabled={!isValid || pageId === 3}
              onClick={() => updateNextPage(1)}
            >
              Next
            </Button>
            <Button type="primary" disabled={pageId !== 3} onClick={handleCreate}>
              Finish
            </Button>
            <Button
              type={'primary'}
              variant={'filled'}
              className={'button button__small'}
              onClick={() => handleClose()}
            >
              Cancel
            </Button>
          </>
        );
      }}
    >
      <Form form={form} autoComplete="off" onFieldsChange={isNext} layout="horizontal">
        {getPages()}
      </Form>
    </Modal>
  );
}
