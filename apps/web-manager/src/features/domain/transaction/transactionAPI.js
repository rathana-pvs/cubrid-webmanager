import { getResponse } from '../../../api/endPoint';
import axios from '@/api/axiosInstant.js';

export const getTransactionInfoAPI = async (host, payload) => {
  const fakeCredentials = {
    dbuser: "",
    dbpasswd: ""
  }
  const url = `/${host.uid}/database/transaction-info/${payload.dbname}`;
  const { data } = await axios.post(url, fakeCredentials);

  return { result: data, success: true };
};

export const killTransactionAPI = async (host, data) => {
  const payload = {
    task: 'killtransaction',
    ...data,
  };

  const response = await getResponse(host, payload);
  return { result: response, success: true };
};
