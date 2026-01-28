import React, {useEffect, useState} from "react";
import {Modal, Form, Select, Button, Row, Input, Col, Checkbox, Radio, Space} from "antd";
import {useDispatch, useSelector} from "react-redux";
import styles from "@/features/sidenav/styles/Modal.module.css"
import { nanoid } from 'nanoid';
import { setCreateDB } from '../../../sideNavSlice';
import { isEmptyString } from '../../../../../lib/utils';
import * as Yup from "yup";
import EditableTable from '../../../../../components/common/table/EditableTable';
import { getHostVersionAPI } from '../../../../domain/host/hostAPI';
import AdditionalVolume from './AdditionalVolume';
import AutoVolumeExtension from './AutoVolumeExtension';
import UpdateDBPassword from './UpdateDBPassword';
import { setBuffering } from '../../../../../shared/slice/globalSlice';
import { checkFileAPI } from '../../../../domain/other/otherAPI';

const collations = [
  "en_US.iso88591",
  "ko_KR.utf8",
  "en_US.utf8",
  "User Defined",
  "ko_KR.euckr",
];

const validation = [
  Yup.object().shape({
    dbname: Yup.string().required("dbname required"),
  }),
  false,
  Yup.object().shape({
    data_warn_outofspace: Yup.number().required("required"),
    data_ext_page: Yup.number().required("required"),
    index_warn_outofspace: Yup.number().required("required"),
    index_ext_page: Yup.number().required("required"),
  })
]

function getNumPage(totalSize, pageSize){
  return (totalSize * 1048576) / pageSize

}

export default function (){

  // const {servers, databases} = useSelector(state => state);
  const {activeHost} = useSelector(state => state.host)
  const {createDB} = useSelector(state => state.sidenav);
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [pageId, setPageId] = useState(0);
  const [db, setDB] = useState({})
  const [dbname, setDBName] = useState("");
  const [autoStart, setAutoStart] = useState(false)
  const [exvol, setExvol] = useState([]);
  const [addVol, setAddVol] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [env, setEnv] = useState({})


  const [addVolCheck, setAddVolCheck] = useState({
    data: false,
    index: false
  })
  const handleOk = async () => {

  };
  const handleCreate = async () => {

    dispatch(setBuffering(true))
    // const checkDir = await checkFileAPI(activeHost)
    //   .finally(() => {
    //     dispatch(setBuffering(false))
    //   })
    // if(checkDir.result.noexist){
    //
    // }

    // dispatch(setLoading(true))
    // const server = servers.find(res => res.serverId === createDB.node.serverId);
    // const checkDir = await getCheckDir({...getAPIParam(server), dir: db.genvolpath});
    // if(checkDir.result.noexist){
    //   const file = exvol.map(res=>{
    //     return res.volume_path
    //   })
    //   const checkFile = await getCheckFile({...getAPIParam(server), file});
    //   if(checkFile.status){
    //     const data = {
    //       ...db,
    //       numpage: getNumPage(db.db_volume_size, db.pagesize),
    //       logsize: db.logsize * 64,
    //       dbname,
    //       exvol: exvol.map(res=>{
    //         return {
    //           [res.volume_name]: `${res.volume_type};${res.volume_size * 64};${res.volume_path}`
    //         }
    //       }),
    //       overwrite_config_file: "NO",
    //
    //     }
    //     const creatDBResponse =  await getCreateDB({...getAPIParam(server), ...data})
    //
    //     if(creatDBResponse.status){
    //       const addVolData = {
    //         ...addVol,
    //         dbname,
    //         data: addVolCheck.data ? "ON": "OFF",
    //         index: addVolCheck.index ? "ON" : "OFF"
    //       }
    //       const addVolResponse = await setAutoAddVol({...getAPIParam(server), ...addVolData})
    //
    //       if(addVolResponse.status){
    //         // const getParam = await getCubridConfig({...getAPIParam(server)})
    //         // const replaceLine = replaceConfig(getParam.result.conflist[0].confdata, {
    //         //     db_volume_size: `${db.db_volume_size}M`,
    //         //     log_volume_size: `${db.logsize}M`
    //         // })
    //         // const setParam = await setCubridConfig({...getAPIParam(server), confdata: replaceLine})
    //         await startDatabase({...getAPIParam(server), database: dbname})
    //         const updateUserResponse = await updateUserDB({...getAPIParam(server),
    //           dbname, username: "dba", userpass: form.getFieldValue("password"), authorization:[]
    //
    //         })
    //
    //
    //         if(updateUserResponse.status){
    //           await refreshDatabases(dispatch, databases, server, createDB.node)
    //           dispatch(setCreateDB({open: false}))
    //           Modal.info({
    //             title: 'Success',
    //             content: `Create Database Successfully`,
    //             okText: 'Close',
    //           })
    //         }
    //
    //       }
    //     }
    //
    //
    //   }
    //   dispatch(setLoading(false))
    //
    // }else{
    //   dispatch(setLoading(false))
    //   Modal.error({
    //     title: 'Error',
    //     content: `${db.genvolpath} is already exist`,
    //     okText: 'Close',
    //   })
    // }
  }


  useEffect(()=>{

    if(createDB.node){
      getHostVersionAPI(activeHost).then(res=>{
        if(res.success){
          setEnv(res.result)
          form.setFieldsValue({
            genvolpath: res.result["CUBRID_DATABASES"],
            logvolpath: res.result["CUBRID_DATABASES"],
          })
          const shortVersion = res.result["CUBRIDVER"].match(/\d+\.\d+/)[0]
          if(parseFloat(shortVersion) >= 10.2){
            setNewVersion(true)
          }
        }
      })
    }

  },[createDB.node])

  useEffect(() => {
  const {CUBRID_DATABASES} = env;
    if(pageId === 0){
      form.setFieldsValue({
        genvolpath: `${CUBRID_DATABASES}/${dbname}`,
        logvolpath: `${CUBRID_DATABASES}/${dbname}`,
        charset: "en_US.iso88591",
        numpage:512,
        pagesize:16384,
        logsize:512,
        logpagesize:16384,
        db_volume_size: 512
      })
    }

  },[dbname, pageId])

  const handleClose = () => {
    dispatch(setCreateDB({open: false}));
  }

  const getPages = ()=>{
    if(pageId === 0){
      return <Row gutter={[0, 0]}>

        <div className={styles.db__layout}>
          <div className="border__text">General</div>
          <Col span={24}>
            <Form.Item label="Database" name="dbname" labelCol={{span: 5}}
                       onChange={(e)=>{setDBName(e.target.value)}}>
              <Input/>
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Page Size" name="pagesize" labelCol={{span: 5}}>
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
            <Form.Item label="Generic Volume Size" name="db_volume_size" labelCol={{span: 8}}>
              <Input type={"number"}/>
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Generic Volume Path" name="genvolpath" labelCol={{span: 8}}>
              <Input/>
            </Form.Item>
          </Col>
        </div>

        <div className={styles.db__layout}>
          <div className="border__text">Log Volume Information</div>
          <Col span={24}>
            <Form.Item label="Log page size (btye): " name="logpagesize" labelCol={{span: 8}}>
              <Select>
                <Select.Option value={4096}>4096</Select.Option>
                <Select.Option value={8192}>8192</Select.Option>
                <Select.Option value={16384}>16384</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Volume size (Mbtye): " name="logsize" labelCol={{span: 8}}>
              <Input type={"number"}/>
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Log volume path: " name="logvolpath" labelCol={{span: 8}}>
              <Input/>
            </Form.Item>
          </Col>
        </div>
        <div className={styles.db__layout}>
          <div className="border__text">Attribute</div>
          <Checkbox name="autoStart" value={autoStart} onChange={e => setAutoStart(e.target.checked)}>
            Auto start database when start cubrid service
          </Checkbox>
          <br/> Set the current database to start automatically when start cubrid service
        </div>
      </Row>
    }
    else if(pageId === 1){
      return <AdditionalVolume form={form} env={env} dbname={dbname}/>
    }
    else if(pageId === 2){
      return <AutoVolumeExtension form={form}/>
    }else if(pageId === 3){
      return <UpdateDBPassword/>
    }
  }

  const updateNextPage = async (counter) => {

    const index = pageId + counter
    if (index > -1 && index < 5) {
      if(counter === -1){
        setPageId(index)
      }else{
        const validate = validation[pageId]
        if (index === 1) {
          validate.validate({...form.getFieldsValue()}).then(res => {
            setDB(form.getFieldsValue())
            setPageId(index);
          })
        } else if (index === 3) {
          setAddVol(form.getFieldsValue())
          setPageId(index)
        } else if (index === 4) {
          const {password, confirm_password} = form.getFieldsValue()
          if (password === confirm_password) {
            await handleCreate()
          }
        } else {
          setPageId(index)
        }
      }


    }
  }

  const isNext = ()=>{
    if(pageId === 0){
      setIsValid(!isEmptyString(form.getFieldValue("dbname")))
    }else if(pageId === 3){
      const {password, confirm_password} = form.getFieldsValue()
      setIsValid(password === confirm_password)
    }else{
      setIsValid(true)
    }

  }

  return (
    <Modal
      width={800}
      title="Create DB"
      open={createDB.open}
      footer={() => {
        return (
          <>
            <Button type="primary" disabled={pageId === 0} onClick={()=>updateNextPage(-1)} >
              Back
            </Button>
            <Button type="primary" disabled={!isValid || pageId === 3} onClick={()=>updateNextPage(1)} >
              Next
            </Button>
            <Button type="primary" disabled={pageId !== 3} onClick={handleOk}>
              Finish
            </Button>
            <Button type={"primary"} variant={"filled"} className={"button button__small"}
                    onClick={() => handleClose()}>
              Cancel
            </Button>
          </>
        )
      }}
    >
      <Form form={form} autoComplete="off" onFieldsChange={isNext} layout="horizontal">
        {getPages()}
      </Form>
    </Modal>
  );
};

