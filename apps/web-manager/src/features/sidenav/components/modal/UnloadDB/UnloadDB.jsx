import React, { useEffect, useState } from 'react';
import { Button, Checkbox, Col, Divider, Form, Input, Modal, Radio, Row, Space } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { setUnloadDB } from '../../../sideNavSlice';
import styles from '../../../styles/Modal.module.css';
import { getTablesAPI, unloadDBAPI } from '../../../../domain/database/databaseAPI';
import { setBuffering } from '../../../../../shared/slice/globalSlice';
import UnloadResult from './UnloadResult';



const UnloadDB = ()=>{
  const {activeHost} = useSelector((state) => state.host);
  const {unloadDB} = useSelector(state=>state.sidenav)
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [tables, setTables] = useState([]);
  const [checkBox, setCheckBox ] = useState({});
  const [selectedTables, setSelectedTables] = useState([]);
  const [disabledRef, setDisabledRef] = useState(true);
  const [showResult, setShowResult] = useState({open: false});
  const handleOk = () => {
    form.validateFields().then(async (values) => {
      // 1. Define Boolean to "yes"/"no" helper
      const toYesNo = (val) => (val ? "yes" : "no");
      // 2. Base Object with standard mappings
      const temp = {
        dbname: unloadDB.node.dbname,
        targetdir: values.targetdir,
        isSchemaIncluded: values.schema !== 3,
        isDataIncluded: values.data !== 2,
        dbuser: values.dbuser,
        dbpasswd: values.dbpassword?values.dbpassword:"",
        usehash: toYesNo(checkBox.ch_hashfile),
        delimit: toYesNo(checkBox.delimit),
        classonly: toYesNo(checkBox.classonly),
        "as-dba": toYesNo(checkBox["as-dba"]),
        ref: toYesNo(!disabledRef && checkBox.ref),
        "skip-index-detail": toYesNo(checkBox["skip-index-detail"]),
        "split-schema-files": toYesNo(checkBox["split-schema-files"]),
      };

      // 3. Dynamic Property Assignment
      // Maps the checkbox state to specific form values
      const dynamicMappings = {
        ch_hashfile: { key: "hashdir", val: values.hashfile },
        ch_numcach:  { key: "cach",    val: values.numbcach },
        ch_lofile:   { key: "lofile",  val: values.lofile },
        ch_numinstance : { key: "estimate", val: values.numinstance}

      };

      Object.entries(dynamicMappings).forEach(([checkKey, target]) => {
        if (checkBox[checkKey]) {
          temp[target.key] = target.val;
        }
      });

      // 4. Array Mapping
      if (selectedTables?.length) {
        temp.class = selectedTables.map((classname) => ({ classname }));
      }
      dispatch(setBuffering(true))
      const response = await unloadDBAPI(activeHost, temp)
        .finally(async () => {
          dispatch(setBuffering(false))
        })

      if(response.success){
        handleClose();
        setShowResult({open: true, data: response.result});
      }
      // handleClose() should usually be inside the .then
      // to ensure we don't close if validation fails


    }).catch(err => console.error("Validation Failed:", err));
  };

  const handleClose = ()=>{
    dispatch(setUnloadDB({open: false}))
  }

  const initialData = async () => {
    const response = await getTablesAPI(activeHost,
      { dbname: unloadDB.node.dbname })
    if(response.success){
      const items = Array.isArray(response.result.userclass) ? response.result.userclass[0].class : [];
      setTables(items)
    }
  }

  useEffect(()=>{
    if(unloadDB.open){
      const {dbname, dbdir} = unloadDB.node;
      form.setFieldsValue({
        dbname,
        targetdir: dbdir,
        hashfile: `${dbdir}/hashfile`
      })
      initialData()
    }
  },[unloadDB])


  const handleCheckBox = (e)=>{
    const {name, checked} = e.target;
    setCheckBox(prevState => ({...prevState, [name]: checked}));
  }


  const onChangeSchema = (e)=>{
    const {value} = e.target;
    if(value === 1){
      setSelectedTables(tables.map(res=>res.classname))
    }else{
      setSelectedTables([])
    }
    setDisabledRef(value !== 2)

  }


  return (
    <>
      <UnloadResult {...showResult} onClose={()=>setShowResult({open: false})}/>
      <Modal
        title="Unload DB"
        open={unloadDB.open}
        width={640}
        footer={() => {
          return (
            <>
              <Button type="primary" onClick={handleOk} style={{marginRight: 8}}>
                OK
              </Button>

              <Button type={"primary"} variant={"filled"} className={"button button__small"}
                      onClick={() => handleClose()}>
                Close
              </Button>
            </>
          )
        }}
      >
        <div style={{ overflowY: 'auto' }}>
          <Form form={form} layout="horizontal">
            <div className={styles.db__layout}>
              <div className={"border__text"}>
                Database Information
              </div>

              <Row>
                <Col span={24}>
                  <Form.Item labelCol={{span: 7}} name="dbname" label="Target database name: ">
                    <Input readOnly/>
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item labelCol={{span: 7}} name="targetdir" label="Target directory: "
                             rules={[{required:true, message:"required"}]}
                  >
                    <Input/>
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <div className={styles.db__layout}>
              <div className={"border__text"}>
                Database Auth
              </div>

              <Row>
                <Col span={24}>
                  <Form.Item labelCol={{span: 7}} name="dbuser" label="DB Username"
                             rules={[{required:true, message:"required"}]}
                  >
                    <Input/>
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item labelCol={{span: 7}} name="dbpassword" label="DB Password">
                    <Input.Password/>
                  </Form.Item>
                </Col>
              </Row>
            </div>
            <div className={styles.db__layout}>
              <div className={"border__text"}>
                Unload Target
              </div>
              <Row gutter={[8, 0]}>
                <Col span={12}>
                  <div className={styles.db__layout}>
                    <div className={"border__text"}>
                      Schema
                    </div>
                    <Radio.Group name={"schema"} onChange={onChangeSchema}>
                      <Space direction="vertical" size={0}>
                        <Radio value={1}>All</Radio>
                        <Radio value={2}>Selected tables</Radio>
                        <Radio value={3}>Not include</Radio>
                      </Space>
                    </Radio.Group>
                  </div>
                </Col>
                <Col span={12}>
                  <div className={styles.db__layout}>
                    <div className={"border__text"}>
                      Data
                    </div>
                    <Radio.Group >
                      <Space direction="vertical" size={0}>
                        <Radio value={1}>Selected tables</Radio>
                        <Radio value={3}>Not include</Radio>
                      </Space>
                    </Radio.Group>
                  </div>
                </Col>
                <Col span={24}>
                  <div className={styles.db__layout} style={{height: 120, overflowY: 'auto'}}>
                    <Checkbox.Group value={selectedTables} onChange={setSelectedTables}>
                      {
                        tables.map(res=>{
                          return(
                            <Col span={24}>
                              <Checkbox value={res.classname}> {res.classname}</Checkbox>
                            </Col>
                          )
                        })
                      }
                    </Checkbox.Group>

                  </div>
                </Col>
              </Row>
            </div>
            <div className={styles.db__layout}>
              <div className={"border__text"}>
                Unload Option
              </div>
              <Row>
                <Col span={8}>
                  <Checkbox name="as-dba" onChange={handleCheckBox}> As dba </Checkbox>
                </Col>
                <Col span={8}>
                  <Checkbox name="split-schema-files" onChange={handleCheckBox}> Split schema files</Checkbox>
                </Col>
                <Col span={8}>
                  <Checkbox name="classonly" onChange={handleCheckBox}> Class Only </Checkbox>
                </Col>
                <Col span={8}>
                  <Checkbox name="skip-index-detail" onChange={handleCheckBox}> Skip index detail </Checkbox>
                </Col>
                <Col span={8}>
                  <Checkbox name="delimit" onChange={handleCheckBox}> Use delimited identifier </Checkbox>
                </Col>
                <Col span={8}>
                  <Checkbox name="ref" disabled={disabledRef} onChange={handleCheckBox}>include referenced tables</Checkbox>
                </Col>
                <Divider/>
                <Col span={24}>
                  <Row>
                    <Col span={10}>
                      <Checkbox name={"ch_prefix"} onChange={handleCheckBox}>Prefix for output files</Checkbox>
                    </Col>
                    <Col span={14}>
                      <Form.Item name="prefix"
                                 rules={[{required:checkBox.ch_prefix, message: "required"}]}
                      >
                        <Input disabled={!checkBox.ch_prefix}/>
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>
                <Col span={24}>
                  <Row>
                    <Col span={10}>
                      <Checkbox name={"ch_hashfile"} onChange={handleCheckBox}> File for hash</Checkbox>
                    </Col>
                    <Col span={14}>
                      <Form.Item name="hashfile"
                                 rules={[{required:checkBox.ch_hashfile, message: "required"}]}
                      >
                        <Input disabled={!checkBox.ch_hashfile}/>
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>
                <Col span={24}>
                  <Row>
                    <Col span={10}>
                      <Checkbox name={"ch_numcach"} onChange={handleCheckBox}>Number of cached pages</Checkbox>
                    </Col>
                    <Col span={14}>
                      <Form.Item
                        rules={[{required:checkBox.ch_numcach, message: "required"}]}
                        name="numbcach">
                        <Input type={"number"} disabled={!checkBox.ch_numcach}/>
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>
                <Col span={24}>
                  <Row>
                    <Col span={10}>
                      <Checkbox name={"ch_numinstance"} onChange={handleCheckBox}>Estimate number of instances</Checkbox>
                    </Col>
                    <Col span={14}>
                      <Form.Item
                        rules={[{required:checkBox.ch_numinstance, message: "required"}]}
                        name="numinstance">
                        <Input type={"number"} disabled={!checkBox.ch_numinstance}/>
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>
                <Col span={24}>
                  <Row>
                    <Col span={10}>
                      <Checkbox name={"ch_lofile"} onChange={handleCheckBox}>Lo file for current directory</Checkbox>
                    </Col>
                    <Col span={14}>
                      <Form.Item name="lofile">
                        <Input type={"number"} disabled={!checkBox.ch_lofile}/>
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </div>
          </Form>
        </div>

      </Modal>
    </>

  )
}


export default UnloadDB
