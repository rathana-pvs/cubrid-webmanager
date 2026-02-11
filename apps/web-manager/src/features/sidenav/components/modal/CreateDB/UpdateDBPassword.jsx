import React from 'react';
import styles from "@/features/sidenav/styles/Modal.module.css"
import { Form, Input, Row } from 'antd';



const UpdateDBPassword = ()=>{

  return (
    <Row gutter={[12, 4]}>
      <div className={styles.db__layout}>
        <div className={"border__text"}>Set password</div>
        <Form.Item
          label="Username"
          name="username"
          hasFeedback
          labelCol={{span: 6}}
          rules={[{require: true}]}
        >
          <Input/>
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          hasFeedback
          labelCol={{span: 6}}
          rules={[{require: true}]}
        >
          <Input.Password/>
        </Form.Item>
        <Form.Item
          label="Confirm password"
          name="confirm_password"
          labelCol={{span: 6}}
          dependencies={["password"]}
          rules={[
            {message: "Please confirm your password" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Passwords do not match"));
              }
            })
          ]}
        >
          <Input.Password/>
        </Form.Item>
      </div>
    </Row>
  )
}


export default UpdateDBPassword