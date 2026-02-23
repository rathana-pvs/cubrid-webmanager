import axios from './axiosInstant.js';
import { store } from '../store/store';
import { setErrorModal } from '../shared/slice/globalSlice';

export const requestCMAPI = (server, payload) => {
  const { uid } = server;
  return axios.post(`${uid}/cms-https-client/forward`, { ...payload });
};

export const revokeLogin = async (server) => {
  try {
    await axios.post('/cms-auth/login', { ...server, hostUid: server.uid }); // revoke session/token
    return true;
  } catch (retryError) {
    return false;
  }
};

// export const getResponse = async (server, payload) => {
//   try {
//     const { data } = await requestCMAPI(server, payload);
//     if (data.status === 'failure' && data.note?.includes('invalid token')) {
//       await revokeLogin(server);
//       const { data } = await requestCMAPI(server, payload);
//       return { ...data };
//     }
//     if (data.status === 'failure') {
//       store.dispatch(
//         setErrorModal({
//           open: true,
//           title: data.title || 'Error',
//           message: data.note || 'Something went wrong',
//         })
//       );
//     }
//
//     return { ...data, success: data.status === 'success' };
//   } catch (error) {
//     if (error.response.status === 401) {
//       window.location.reload();
//     }
//     return { success: false };
//   }
// };

export const getResponse = async (server, payload, retry = true) => {
  try {
    const response = await requestCMAPI(server, payload);
    const { data } = response;

    // 1. Handle Token Expiry / Re-authentication
    if (data.status !== 'success') {
      if (data.note?.includes('invalid token') && retry) {
        await revokeLogin(server);
        // Recursively call with retry set to false to prevent infinite loops
        return getResponse(server, payload, false);
      }
      store.dispatch(
        setErrorModal({
          open: true,
          title: data.title ?? 'Error',
          message: data.note ?? 'Something went wrong',
        })
      );
    }
    return { ...data, success: data.status === "success" };
  } catch (error) {
    // 3. Handle HTTP Auth Errors (401)
    if (error.response?.status === 401) {
      window.location.reload();
      return { success: false }; // Ensure we still return an object
    }

    console.error('API Error:', error);
    return { success: false, error };
  }
};
