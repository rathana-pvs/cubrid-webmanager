import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import monitoringApi from './monitoringApi';

// Thunk to fetch all monitoring data in parallel
export const fetchMonitoringData = createAsyncThunk(
  'monitoring/fetchAll',
  async (hostUid, { rejectWithValue }) => {
    try {
      const [hostStat, brokers] = await Promise.all([
        monitoringApi.getHostStat(hostUid),
        monitoringApi.getBrokerList(hostUid)
      ]);
      return { hostStat, brokers };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  currentStatus: {
    cpu: 0,
    memory: 0,
    tps: 0,
    qps: 0,
    memUsed: 0,
    memTotal: 0,
  },
  averages: {
    cpu: 0,
    memory: 0,
    tps: 0,
    qps: 0,
  },
  history: [], // [{ timestamp, cpu, memory, tps, qps }]
  prevHostStat: null,
  loading: false,
  error: null,
};

const MAX_HISTORY_MS = 5 * 60 * 1000; // 5 minutes

const monitoringSlice = createSlice({
  name: 'monitoring',
  initialState,
  reducers: {
    clearMonitoring: (state) => {
      state.history = [];
      state.prevHostStat = null;
      state.currentStatus = initialState.currentStatus;
      state.averages = initialState.averages;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMonitoringData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMonitoringData.fulfilled, (state, action) => {
        state.loading = false;
        const { hostStat, brokers } = action.payload;
        const now = Date.now();

        // 1. Calculate TPS/QPS from brokers
        let totalTps = 0;
        let totalQps = 0;
        if (brokers && Array.isArray(brokers)) {
          brokers.forEach(broker => {
            totalTps += parseFloat(broker.tran || 0);
            totalQps += parseFloat(broker.query || 0);
          });
        }

        // 2. Calculate CPU % if we have previous data (Match d-cms: only use User Percent)
        let cpuUsage = 0;
        if (state.prevHostStat) {
          const prev = state.prevHostStat;
          const curr = hostStat;

          const cpuUserDelta = parseFloat(curr.cpu_user) - parseFloat(prev.cpu_user);
          const cpuKernelDelta = parseFloat(curr.cpu_kernel) - parseFloat(prev.cpu_kernel);
          const cpuIdleDelta = parseFloat(curr.cpu_idle) - parseFloat(prev.cpu_idle);
          const cpuIowaitDelta = parseFloat(curr.cpu_iowait) - parseFloat(prev.cpu_iowait);

          const totalDelta = cpuUserDelta + cpuKernelDelta + cpuIdleDelta + cpuIowaitDelta;
          
          if (totalDelta > 0) {
            // d-cms HostStatDataProxy.java uses (cpuUserDelta / totalDelta) * 100
            cpuUsage = (cpuUserDelta / totalDelta) * 100;
          }
        }
        state.prevHostStat = hostStat;

        // 3. Calculate Memory % (Values from API are in Bytes)
        const memTotalBytes = parseFloat(hostStat.mem_phy_total || 0);
        const memFreeBytes = parseFloat(hostStat.mem_phy_free || 0);
        const memUsedBytes = memTotalBytes - memFreeBytes;
        const memUsage = memTotalBytes > 0 ? (memUsedBytes / memTotalBytes) * 100 : 0;

        // 4. Update Current Status
        state.currentStatus = {
          cpu: cpuUsage,
          memory: memUsage,
          tps: totalTps,
          qps: totalQps,
          memUsed: memUsedBytes,
          memTotal: memTotalBytes
        };

        // 5. Update History
        state.history.push({
          timestamp: now,
          cpu: cpuUsage,
          memory: memUsage,
          tps: totalTps,
          qps: totalQps
        });

        // 6. Prune old history (older than 5 mins)
        state.history = state.history.filter(item => now - item.timestamp <= MAX_HISTORY_MS);

        // 7. Calculate Averages
        if (state.history.length > 0) {
          const sum = state.history.reduce((acc, item) => ({
            cpu: acc.cpu + item.cpu,
            memory: acc.memory + item.memory,
            tps: acc.tps + item.tps,
            qps: acc.qps + item.qps
          }), { cpu: 0, memory: 0, tps: 0, qps: 0 });

          state.averages = {
            cpu: sum.cpu / state.history.length,
            memory: sum.memory / state.history.length,
            tps: sum.tps / state.history.length,
            qps: sum.qps / state.history.length
          };
        }

        state.error = null;
      })
      .addCase(fetchMonitoringData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearMonitoring } = monitoringSlice.actions;
export default monitoringSlice.reducer;
