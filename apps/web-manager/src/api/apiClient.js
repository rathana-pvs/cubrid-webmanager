import axios from 'axios';

const isDesktopRuntime = () =>
  typeof window !== 'undefined' &&
  (Boolean(window.desktopConfig?.apiBaseUrl) || window.location.protocol === 'app:');

const resolveApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return import.meta.env.VITE_API_BASE_URL || 'https://localhost:8080';
  }

  const configured =
    window.desktopConfig?.apiBaseUrl || import.meta.env.VITE_API_BASE_URL;
  if (configured) {
    return configured;
  }

  if (window.location.protocol === 'app:') {
    return '/api';
  }

  if (
    window.location.protocol === 'https:' ||
    window.location.protocol === 'http:'
  ) {
    return '/api';
  }

  return 'https://localhost:8080';
};

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  ...(isDesktopRuntime() ? { adapter: 'fetch' } : {}),
});

apiClient.interceptors.request.use((config) => {
  config.baseURL = resolveApiBaseUrl();
  if (typeof window !== 'undefined' && window.location.protocol === 'app:') {
    config.adapter = 'fetch';
  }
  return config;
});

export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

const initialToken = localStorage.getItem('token');
if (initialToken) {
  setAuthToken(initialToken);
}

const refreshingHosts = new Map();
let isHandlingSystemSessionExpiry = false;
let isRefreshingAccessToken = false;
/** @type {Array<{ resolve: (token: string) => void, reject: (err: Error) => void }>} */
let accessTokenRefreshWaiters = [];

function unwrapAuthTokens(raw) {
  const payload = raw?.data && typeof raw.data === 'object' ? raw.data : raw;
  if (!payload?.token) return null;
  return {
    token: payload.token,
    refreshToken: payload.refreshToken,
  };
}

function notifyAccessTokenRefreshed(token) {
  accessTokenRefreshWaiters.forEach(({ resolve }) => resolve(token));
  accessTokenRefreshWaiters = [];
}

function notifyAccessTokenRefreshFailed(err) {
  accessTokenRefreshWaiters.forEach(({ reject }) => reject(err));
  accessTokenRefreshWaiters = [];
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  const response = await axios.post(
    `${resolveApiBaseUrl()}/auth/refresh`,
    { refreshToken },
    {
      headers: { 'Content-Type': 'application/json' },
      ...(isDesktopRuntime() ? { adapter: 'fetch' } : {}),
    }
  );

  const tokens = unwrapAuthTokens(response.data);
  if (!tokens?.token) {
    throw new Error('Refresh response missing access token');
  }

  localStorage.setItem('token', tokens.token);
  if (tokens.refreshToken) {
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }
  setAuthToken(tokens.token);

  const { store } = await import('../app/store');
  const { sessionRefreshed } = await import('../features/auth/authSlice');
  store.dispatch(sessionRefreshed(tokens));

  return tokens.token;
}

async function handleSystemSessionExpired() {
  if (isHandlingSystemSessionExpiry) {
    return;
  }

  const path = window.location.pathname;
  if (path === '/login' || path === '/register') {
    return;
  }

  isHandlingSystemSessionExpiry = true;
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    const { store } = await import('../app/store');
    const { logout } = await import('../features/auth/authSlice');
    store.dispatch(logout());
  } finally {
    isHandlingSystemSessionExpiry = false;
  }
}

const getHostUidFromUrl = (url) => {
  if (!url) return null;
  const cleanUrl = url.replace(/^\//, '');
  const segments = cleanUrl.split('/');
  let hostUid = segments[0];

  if (hostUid === 'host' && segments[1]) {
    hostUid = segments[1];
  }

  return (hostUid && hostUid.length > 15) ? hostUid : null;
};

apiClient.interceptors.response.use(
  (response) => {
    const rawData = response.data;
    if (rawData && typeof rawData === 'object' && Object.prototype.hasOwnProperty.call(rawData, 'data')) {
      if (rawData.data === false || rawData.data === null || rawData.data === 0) {
        return rawData;
      }
      const payload = rawData.data;
      if (payload && typeof payload === 'object') {
        if (rawData.note) payload.note = rawData.note;
        if (rawData.status !== undefined) {
          payload.httpStatus = rawData.status;
          const isJobPayload = Object.prototype.hasOwnProperty.call(payload, 'jobId');
          if (!isJobPayload && !Object.prototype.hasOwnProperty.call(payload, 'status')) {
            payload.status = rawData.status;
          }
        }
      }
      return payload;
    }
    return rawData;
  },
  async (error) => {
    const originalRequest = error.config;
    const apiData = error.response?.data;
    const statusCode = error.response?.status;
    const requestUrl = originalRequest?.url ?? '';

    // Normalize the error message before any early returns so every rejection
    // path exposes a meaningful message via err.response.data.message.
    // Priority: our StandardResponse.note → nested data.message → data.detail
    // → data.title → existing message (e.g. NestJS default "Internal Server Error")
    if (apiData && typeof apiData === 'object' && !Array.isArray(apiData)) {
      apiData.message = apiData.note
        || apiData.data?.message
        || apiData.data?.detail
        || apiData.data?.title
        || apiData.message
        || 'An unexpected error occurred';
    }

    if (statusCode === 401 && !originalRequest._retry) {
      const hostUid = getHostUidFromUrl(requestUrl);
      const isHostLoginRequest = requestUrl.includes('/cms-auth/login');
      const isAuthRefreshRequest = requestUrl.includes('/auth/refresh');
      const isAuthLoginRequest = requestUrl.includes('/auth/login');
      const isAuthLogoutRequest = requestUrl.includes('/auth/logout');

      if (hostUid) {
        if (isHostLoginRequest) {
          return Promise.reject(error);
        }

        console.warn(`Host session for ${hostUid} expired. Initiating revocation and re-login...`);

        try {
          const { store } = await import('../app/store');
          const { revokeHostLogin, loginToHost } = await import('../features/host/hostSlice');

          store.dispatch(revokeHostLogin(hostUid));

          if (!refreshingHosts.has(hostUid)) {
            const refreshPromise = store.dispatch(loginToHost(hostUid)).unwrap();
            refreshingHosts.set(hostUid, refreshPromise);
          }

          await refreshingHosts.get(hostUid);
          refreshingHosts.delete(hostUid);

          originalRequest._retry = true;
          return apiClient(originalRequest);
        } catch (refreshError) {
          refreshingHosts.delete(hostUid);
          return Promise.reject(error);
        }
      }

      if (!isAuthRefreshRequest && !isAuthLoginRequest && !isAuthLogoutRequest) {
        originalRequest._retry = true;

        if (isRefreshingAccessToken) {
          try {
            const token = await new Promise((resolve, reject) => {
              accessTokenRefreshWaiters.push({ resolve, reject });
            });
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          } catch {
            return Promise.reject(error);
          }
        }

        isRefreshingAccessToken = true;
        try {
          const token = await refreshAccessToken();
          notifyAccessTokenRefreshed(token);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        } catch (refreshErr) {
          notifyAccessTokenRefreshFailed(refreshErr);
          await handleSystemSessionExpired();
          return Promise.reject(error);
        } finally {
          isRefreshingAccessToken = false;
        }
      }

      // auth/login and auth/logout 401 = credential failure, not session expiry.
      // Don't trigger session expiry for these — just surface the error.
      if (isAuthLoginRequest || isAuthLogoutRequest) {
        return Promise.reject(error);
      }

      await handleSystemSessionExpired();
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
