import { getResponse } from '../../../api/endPoint';

export const getTransactionInfoAPI = async (host, data) => {
  const payload = {
    task: 'gettransactioninfo',
    ...data,
  };

  const response = await getResponse(host, payload);
  return { result: response, success: true };
};

export const killTransactionAPI = async (host, data) => {
  const payload = {
    task: 'killtransaction',
    ...data,
  };

  const response = await getResponse(host, payload);
  return { result: response, success: true };
};
