import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { hostApi } from './hostApi';
import { databaseApi } from '../database/databaseApi';
import { brokerApi } from '../broker/brokerApi';
import { fetchDatabaseStartInfo } from '../database/databaseSlice';
import { fetchBrokerList } from '../broker/brokerSlice';

// Async thunk to fetch hosts from API
export const fetchHosts = createAsyncThunk(
  'host/fetchHosts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await hostApi.getHosts();
      const hostMap = response.host_list || {};
      // Convert object map to array
      return Object.values(hostMap);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch hosts');
    }
  }
);

// Async thunk to add a new host
export const addHost = createAsyncThunk(
  'host/addHost',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await hostApi.addHost(payload);
      // Backend returns the updated host_list object map.
      // So we can extract the new host values and return them to update Redux.
      const hostMap = response.host_list || {};
      return Object.values(hostMap);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.response?.data?.error || 'Failed to add host');
    }
  }
);

// Async thunk to delete a host
export const deleteHost = createAsyncThunk(
  'host/deleteHost',
  async (hostUid, { rejectWithValue }) => {
    try {
      await hostApi.deleteHost(hostUid);
      return hostUid;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.response?.data?.error || 'Failed to delete host');
    }
  }
);

// Async thunk to edit a host
export const editHost = createAsyncThunk(
  'host/editHost',
  async ({ hostUid, payload }, { rejectWithValue }) => {
    try {
      const response = await hostApi.editHost(hostUid, payload);
      const hostMap = response.host_list || {};
      return Object.values(hostMap);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.response?.data?.error || 'Failed to edit host');
    }
  }
);

export const setHostPassword = createAsyncThunk(
  'host/setHostPassword',
  async ({ hostUid, payload }, { rejectWithValue }) => {
    try {
      await hostApi.setHostPassword(hostUid, payload);
      return hostUid;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.response?.data?.error || 'Failed to set password');
    }
  }
);

// Async thunk to start CUBRID service (Brokers + Auto-start Databases)
export const startService = createAsyncThunk(
  'host/startService',
  async (hostUid, { dispatch, rejectWithValue }) => {
    try {
      // 1. Start all Brokers
      dispatch(hostSlice.actions.setServiceProgressMessage('Starting brokers...'));
      const brokerResponse = await brokerApi.getBrokerList(hostUid);
      const brokerList = brokerResponse.result || (Array.isArray(brokerResponse) ? brokerResponse[0]?.broker : []);
      if (brokerList) {
        await Promise.all(brokerList.map(b => brokerApi.startBroker(hostUid, b.name).catch(() => {})));
      }

      // 2. Fetch cubrid.conf to find auto-start databases
      dispatch(hostSlice.actions.setServiceProgressMessage('Checking auto-start configuration...'));
      const configRes = await hostApi.getHostConfig(hostUid, 'cubridconf');
      const lines = configRes?.conflist?.[0]?.confdata || [];
      
      let serviceEnabled = false;
      let autoStartServers = [];
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || !trimmed) continue;
        if (trimmed.startsWith('service=')) {
          const val = trimmed.split('=')[1] || '';
          if (val.split(',').map(s => s.trim().toLowerCase()).includes('server')) serviceEnabled = true;
        }
        if (trimmed.startsWith('server=')) {
          const val = trimmed.split('=')[1] || '';
          autoStartServers = val.split(',').map(s => s.trim());
        }
      }

      // 3. Start auto-start databases if service is enabled
      if (serviceEnabled && autoStartServers.length > 0) {
        dispatch(hostSlice.actions.setServiceProgressMessage(`Starting databases (${autoStartServers.join(', ')})...`));
        await Promise.all(autoStartServers.map(dbname => databaseApi.startDatabase(hostUid, dbname).catch(() => {})));
      }

      // Refresh everything
      dispatch(hostSlice.actions.setServiceProgressMessage('Refreshing status...'));
      dispatch(fetchDatabaseStartInfo(hostUid));
      dispatch(fetchBrokerList(hostUid));
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to start service');
    }
  }
);

// Async thunk to stop CUBRID service (All Brokers + All Databases)
export const stopService = createAsyncThunk(
  'host/stopService',
  async (hostUid, { dispatch, getState, rejectWithValue }) => {
    try {
      // 1. Stop all Brokers
      dispatch(hostSlice.actions.setServiceProgressMessage('Stopping brokers...'));
      const brokerResponse = await brokerApi.getBrokerList(hostUid);
      const brokerList = brokerResponse.result || (Array.isArray(brokerResponse) ? brokerResponse[0]?.broker : []);
      if (brokerList) {
        await Promise.all(brokerList.map(b => brokerApi.stopBroker(hostUid, b.name).catch(() => {})));
      }

      // 2. Stop all Databases
      dispatch(hostSlice.actions.setServiceProgressMessage('Stopping databases...'));
      const { database } = getState();
      const dbList = database.databases || [];
      if (dbList.length > 0) {
        await Promise.all(dbList.map(db => databaseApi.stopDatabase(hostUid, db.dbname).catch(() => {})));
      }

      // Refresh everything
      dispatch(hostSlice.actions.setServiceProgressMessage('Refreshing status...'));
      dispatch(fetchDatabaseStartInfo(hostUid));
      dispatch(fetchBrokerList(hostUid));
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to stop service');
    }
  }
);

// Async thunk to explicitly login/forward to a specific host
export const loginToHost = createAsyncThunk(
  'host/loginToHost',
  async (hostUid, { rejectWithValue }) => {
    try {
      const response = await hostApi.loginToHost(hostUid);
      // The API returns { data: false } or just false on failure
      if (response === false || response?.data === false) {
        return rejectWithValue('Host login failed (bad credentials or unavailable)');
      }
      return hostUid;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.response?.data?.error || `Failed to login to host ${hostUid}`);
    }
  }
);

// Async thunk to fetch host environment (which contains the version)
export const fetchHostEnv = createAsyncThunk(
  'host/fetchHostEnv',
  async (hostUid, { rejectWithValue }) => {
    try {
      const response = await hostApi.getHostEnv(hostUid);
      return { hostUid, env: response };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || `Failed to fetch environment for ${hostUid}`);
    }
  }
);

const initialState = {
  isAddHostModalOpen: false,
  isDeleteHostModalOpen: false,
  isEditHostModalOpen: false,
  hostToDeleteUid: null,
  hostToDeleteAlias: null,
  hostToEditUid: null,
  isServerVersionModalOpen: false,
  serverVersionHostUid: null,
  hosts: [],
  authorizedHosts: [], // Array of hostUids that have active forwarded sessions
  hostEnvs: {}, // Cache of environment info (version, paths, etc) indexed by hostUid
  selectedHostUid: null,
  loading: false,
  isLoggingIntoHost: false,
  isServiceOperating: false,
  serviceOperationType: null, // 'start' or 'stop'
  serviceProgressMessage: '',
  hostAuthErrors: {}, // { [hostUid]: errorMessage }
  isImportExportModalOpen: false,
  importExportMode: 'export', // 'import' or 'export'
  isChangePasswordModalOpen: false,
  changePasswordHostUid: null,
  error: null,
};

const hostSlice = createSlice({
  name: 'host',
  initialState,
  reducers: {
    openAddHostModal: (state) => {
      state.isAddHostModalOpen = true;
    },
    closeAddHostModal: (state) => {
      state.isAddHostModalOpen = false;
    },
    setSelectedHost: (state, action) => {
      state.selectedHostUid = action.payload;
    },
    setServiceProgressMessage: (state, action) => {
      state.serviceProgressMessage = action.payload;
    },
    revokeHostLogin: (state, action) => {
      state.authorizedHosts = state.authorizedHosts.filter(uid => uid !== action.payload);
    },
    openDeleteHostModal: (state, action) => {
      state.isDeleteHostModalOpen = true;
      state.hostToDeleteUid = action.payload.hostUid;
      state.hostToDeleteAlias = action.payload.alias;
    },
    closeDeleteHostModal: (state) => {
      state.isDeleteHostModalOpen = false;
      state.hostToDeleteUid = null;
      state.hostToDeleteAlias = null;
    },
    openEditHostModal: (state, action) => {
      state.isEditHostModalOpen = true;
      state.hostToEditUid = action.payload; // Just need the hostUid, we can look up the rest
    },
    closeEditHostModal: (state) => {
      state.isEditHostModalOpen = false;
      state.hostToEditUid = null;
    },
    openServerVersionModal: (state, action) => {
      state.isServerVersionModalOpen = true;
      state.serverVersionHostUid = action.payload;
    },
    closeServerVersionModal: (state) => {
      state.isServerVersionModalOpen = false;
      state.serverVersionHostUid = null;
    },
    openImportExportModal: (state, action) => {
      state.isImportExportModalOpen = true;
      state.importExportMode = action.payload; // 'import' or 'export'
    },
    closeImportExportModal: (state) => {
      state.isImportExportModalOpen = false;
    },
    openChangePasswordModal: (state, action) => {
      state.isChangePasswordModalOpen = true;
      state.changePasswordHostUid = action.payload;
    },
    closeChangePasswordModal: (state) => {
      state.isChangePasswordModalOpen = false;
      state.changePasswordHostUid = null;
    },
    clearHostError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHosts.fulfilled, (state, action) => {
        state.loading = false;
        state.hosts = action.payload;
      })
      .addCase(fetchHosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addHost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addHost.fulfilled, (state, action) => {
        state.loading = false;
        state.hosts = action.payload; // Payload is the full updated host list array
        state.isAddHostModalOpen = false; // Auto close modal on success
      })
      .addCase(addHost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; // AddHostModal can also show this
      })
      .addCase(loginToHost.pending, (state, action) => {
        state.isLoggingIntoHost = true;
        // Clean up previous error for this host if any
        if (state.hostAuthErrors[action.meta.arg]) {
          delete state.hostAuthErrors[action.meta.arg];
        }
      })
      .addCase(loginToHost.fulfilled, (state, action) => {
        state.isLoggingIntoHost = false;
        if (!state.authorizedHosts.includes(action.payload)) {
          state.authorizedHosts.push(action.payload);
        }
      })
      .addCase(loginToHost.rejected, (state, action) => {
        state.isLoggingIntoHost = false;
        state.hostAuthErrors[action.meta.arg] = action.payload;
      })
      .addCase(deleteHost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteHost.fulfilled, (state, action) => {
        state.loading = false;
        state.hosts = state.hosts.filter(h => h.uid !== action.payload);
        if (state.selectedHostUid === action.payload) {
          state.selectedHostUid = null;
        }
        state.authorizedHosts = state.authorizedHosts.filter(uid => uid !== action.payload);
        state.isDeleteHostModalOpen = false;
        state.hostToDeleteUid = null;
      })
      .addCase(deleteHost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(editHost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editHost.fulfilled, (state, action) => {
        state.loading = false;
        state.hosts = action.payload; // Payload is the full updated host list array
        state.isEditHostModalOpen = false;
        state.isChangePasswordModalOpen = false;
        state.hostToEditUid = null;
        state.changePasswordHostUid = null;
      })
      .addCase(editHost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(setHostPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setHostPassword.fulfilled, (state) => {
        state.loading = false;
        state.isChangePasswordModalOpen = false;
        state.changePasswordHostUid = null;
      })
      .addCase(setHostPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(startService.pending, (state) => {
        state.isServiceOperating = true;
        state.serviceOperationType = 'start';
        state.error = null;
      })
      .addCase(startService.fulfilled, (state) => {
        state.isServiceOperating = false;
        state.serviceOperationType = null;
      })
      .addCase(startService.rejected, (state, action) => {
        state.isServiceOperating = false;
        state.serviceOperationType = null;
        state.error = action.payload;
      })
      .addCase(stopService.pending, (state) => {
        state.isServiceOperating = true;
        state.serviceOperationType = 'stop';
        state.error = null;
      })
      .addCase(stopService.fulfilled, (state) => {
        state.isServiceOperating = false;
        state.serviceOperationType = null;
      })
      .addCase(stopService.rejected, (state, action) => {
        state.isServiceOperating = false;
        state.serviceOperationType = null;
        state.error = action.payload;
      })
      .addCase(fetchHostEnv.fulfilled, (state, action) => {
        const { hostUid, env } = action.payload;
        state.hostEnvs[hostUid] = env;
      });
  },
});

export const {
  openAddHostModal,
  closeAddHostModal,
  setSelectedHost,
  revokeHostLogin,
  openDeleteHostModal,
  closeDeleteHostModal,
  openEditHostModal,
  closeEditHostModal,
  openServerVersionModal,
  closeServerVersionModal,
  openImportExportModal,
  closeImportExportModal,
  openChangePasswordModal,
  closeChangePasswordModal,
  clearHostError,
  setServiceProgressMessage,
} = hostSlice.actions;

export default hostSlice.reducer;
