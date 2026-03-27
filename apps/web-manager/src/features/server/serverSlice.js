import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  servers: [
    { id: 1, name: 'Server', status: 'connected' },
    { id: 2, name: 'Server 1', status: 'disconnected' },
  ],
  selectedServer: null,
};

const serverSlice = createSlice({
  name: 'server',
  initialState,
  reducers: {
    setSelectedServer: (state, action) => {
      state.selectedServer = action.payload;
    },
    addServer: (state, action) => {
      state.servers.push(action.payload);
    },
    removeServer: (state, action) => {
      state.servers = state.servers.filter(s => s.id !== action.payload);
    },
    updateServerStatus: (state, action) => {
      const server = state.servers.find(s => s.id === action.payload.id);
      if (server) server.status = action.payload.status;
    },
  },
});

export const {
  setSelectedServer,
  addServer,
  removeServer,
  updateServerStatus,
} = serverSlice.actions;

export default serverSlice.reducer;
