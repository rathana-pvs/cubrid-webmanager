import apiClient from '../../api/apiClient';

export const hostApi = {
  getHosts: () => {
    return apiClient.get('/host');
  },
  addHost: (payload) => {
    return apiClient.post('/host', payload);
  },
  loginToHost: (hostUid) => {
    return apiClient.post(`/${hostUid}/cms-auth/login`);
  },
  getHostEnv: (hostUid) => {
    return apiClient.get(`/${hostUid}/cms-config/env`);
  },
  deleteHost: (hostUid) => {
    return apiClient.delete(`/host/${hostUid}`);
  },
  editHost: (hostUid, payload) => {
    return apiClient.put(`/host/${hostUid}`, payload);
  },
  getHostConfig: (hostUid, confname) => {
    return apiClient.get(`/${hostUid}/cms-config/all-sys-param?confname=${confname}`);
  },
  setHostConfig: (hostUid, payload) => {
    return apiClient.post(`/${hostUid}/cms-config/set-sys-param`, payload);
  },
  setHostPassword: (hostUid, payload) => {
    return apiClient.put(`/${hostUid}/cms-user/set-password`, payload);
  },
  getCmsUsers: (hostUid) => {
    return apiClient.get(`/${hostUid}/cms-user`);
  },
  addCmsUser: (hostUid, payload) => {
    return apiClient.post(`/${hostUid}/cms-user`, payload);
  },
  updateCmsUser: (hostUid, payload) => {
    return apiClient.put(`/${hostUid}/cms-user`, payload);
  },
  deleteCmsUser: (hostUid, targetid) => {
    return apiClient.delete(`/${hostUid}/cms-user/${targetid}`);
  },
};
