import apiClient from '../../api/apiClient';

/**
 * Monitoring API for server resource and broker status
 */
export const monitoringApi = {
  /**
   * Get host statistics (raw counters)
   * @param {string} hostUid
   * @returns {Promise<any>}
   */
  getHostStat: (hostUid) => 
    apiClient.get(`/${hostUid}/resource-monitoring/get-host-stat`),

  /**
   * Get broker list (includes TPS/QPS)
   * @param {string} hostUid
   * @returns {Promise<any>}
   */
  getBrokerList: (hostUid) => 
    apiClient.get(`/${hostUid}/broker/list`),
};

export default monitoringApi;
