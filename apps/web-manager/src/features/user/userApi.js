import apiClient from '../../api/apiClient';

export const userApi = {
  getPreferences: () => {
    return apiClient.get('/user/preferences');
  },
  updatePreferences: (preferences) => {
    return apiClient.put('/user/preferences', preferences);
  },
  getDatabaseUsers: (hostUid, dbname) => {
    return apiClient.get(`/${hostUid}/database/users/info/${dbname}`);
  },
  createDatabaseUser: (hostUid, dbname, payload) => {
    return apiClient.post(`/${hostUid}/database/users`, { ...payload, dbname });
  },
  updateDatabaseUser: (hostUid, dbname, userName, payload) => {
    return apiClient.put(`/${hostUid}/database/users/${dbname}/${userName}`, payload);
  },
  dropDatabaseUser: (hostUid, dbname, userName) => {
    return apiClient.delete(`/${hostUid}/database/users/${dbname}/${userName}`);
  },
};
