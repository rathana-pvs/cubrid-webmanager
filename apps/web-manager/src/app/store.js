import { configureStore, combineReducers } from '@reduxjs/toolkit';
import layoutReducer from '../features/layout/layoutSlice';
import serverReducer from '../features/server/serverSlice';
import databaseReducer from '../features/database/databaseSlice';
import brokerReducer from '../features/broker/brokerSlice';
import hostReducer from '../features/host/hostSlice';
import userReducer from '../features/user/userSlice';
import authReducer from '../features/auth/authSlice';

import appBarReducer from '../features/layout/appBarSlice';

import monitoringReducer from '../features/server/monitoringSlice';

const combinedReducer = combineReducers({
  auth: authReducer,
  layout: layoutReducer,
  appBar: appBarReducer,
  server: serverReducer,
  monitoring: monitoringReducer,
  database: databaseReducer,
  broker: brokerReducer,
  host: hostReducer,
  user: userReducer,
});

const rootReducer = (state, action) => {
  if (action.type === 'auth/logout') {
    // Reset all state by passing undefined to the combined reducer
    state = undefined;
  }
  return combinedReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});
