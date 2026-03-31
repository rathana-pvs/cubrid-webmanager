import { configureStore, combineReducers } from '@reduxjs/toolkit';
import layoutReducer from '../features/layout/layoutSlice';
import serverReducer from '../features/server/serverSlice';
import databaseCoreReducer from '../features/database/databaseCoreSlice';
import databaseMonitoringReducer from '../features/database/databaseMonitoringSlice';
import databaseOperationReducer from '../features/database/databaseOperationSlice';
import databaseUIReducer from '../features/database/databaseUISlice';
import databaseConfigurationReducer from '../features/database/databaseConfigurationSlice';
import brokerReducer from '../features/broker/brokerSlice';
import hostReducer from '../features/host/hostSlice';
import userReducer from '../features/user/userSlice';
import authReducer from '../features/auth/authSlice';

import appBarReducer from '../features/layout/appBarSlice';

import monitoringReducer from '../features/server/monitoringSlice';
import globalMonitoringReducer from '../features/server/globalMonitoringSlice';

const combinedReducer = combineReducers({
  auth: authReducer,
  layout: layoutReducer,
  appBar: appBarReducer,
  server: serverReducer,
  monitoring: monitoringReducer,
  globalMonitoring: globalMonitoringReducer,
  database: databaseCoreReducer,
  databaseMonitoring: databaseMonitoringReducer,
  databaseOperation: databaseOperationReducer,
  databaseUI: databaseUIReducer,
  databaseConfiguration: databaseConfigurationReducer,
  broker: brokerReducer,
  host: hostReducer,
  user: userReducer,
});

const rootReducer = (state, action) => {
  if (action.type === 'auth/logout') {
    // TOTAL RESET: For full system logout, clear everything
    state = undefined;
  } else if (action.type === 'host/revokeHostLogin') {
    // SELECTIVE RESET: When disconnecting from a server, clear resource data 
    // but preserve the host list, UI layout, and system session.
    if (state) {
      const { auth, host, layout, appBar } = state;
      // All other resource slices (database, broker, user, monitoring, etc.) will be reset
      state = { auth, host, layout, appBar };
    }
  }
  return combinedReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});
