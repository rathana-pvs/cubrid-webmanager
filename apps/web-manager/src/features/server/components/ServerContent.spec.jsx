import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

vi.mock('../../host/hostApi', () => ({ hostApi: { getHostConfig: vi.fn() } }));
vi.mock('../../database/databaseApi', () => ({ databaseApi: { setAutoStart: vi.fn(), removeAutoStart: vi.fn() } }));
vi.mock('../../database/databaseSlice', () => ({ fetchDatabaseStartInfo: () => () => ({ unwrap: async () => ({ dblist: { dbs: [{ dbname: 'demodb' }] }, activelist: { active: [] } }) }) }));
vi.mock('../../host/hostSlice', () => ({ fetchHostEnv: () => ({ type: 'noop' }) }));
vi.mock('../../broker/brokerSlice', () => ({ fetchBrokerList: () => ({ type: 'noop' }) }));
vi.mock('../../database/databaseMonitoringSlice', () => ({ fetchDatabaseVolumes: () => ({ type: 'noop' }) }));
vi.mock('../monitoringSlice', () => ({ fetchMonitoringData: () => ({ type: 'noop' }) }));
vi.mock('./DatabaseVolumes', () => ({ default: () => null }));
vi.mock('./Brokers', () => ({ default: () => null }));
vi.mock('./SystemInfo', () => ({ default: () => null }));
vi.mock('./server/SystemStatusSection', () => ({ default: () => null }));
vi.mock('./server/HaClusterStatusSection', () => ({ default: () => null }));
vi.mock('../../user/components/MonitoringSettingsPopover', () => ({ default: () => null }));
vi.mock('../../../infrastructure/hooks/usePollingRefresh', async () => {
  const { useEffect } = await import('react');
  const { useDispatch } = await import('react-redux');
  return { usePollingRefresh: ({ hostUid, onFetch }) => {
    const dispatch = useDispatch();
    useEffect(() => { void onFetch()(dispatch); }, [hostUid, dispatch]);
    return { isManualRefreshing: false, lastRefreshed: new Date(), handleRefresh: () => onFetch()(dispatch) };
  } };
});

import ServerContent from './ServerContent';
import { hostApi } from '../../host/hostApi';
import { databaseApi } from '../../database/databaseApi';

const config = enabled => ({ conflist: [{ confdata: ['[service]', 'service=server,broker,manager', `server=${enabled ? 'demodb' : ''}`] }] });
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
let root;
let container;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.resetAllMocks();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});
const render = async () => {
  const state = { host: { hosts: [{ uid: 'host', alias: 'Host' }], authorizedHosts: ['host'], haInfo: {} },
    user: { preferences: { uiLocale: 'en', dashboardInterval: 0 } },
    layout: { activeMainTab: 'host:host', refreshCounter: 0 }, monitoring: { hostsData: { host: {} } } };
  const store = configureStore({ reducer: () => state });
  await act(async () => root.render(<Provider store={store}><ServerContent hostUid="host" /></Provider>));
};
const toggle = () => container.querySelector('[role="switch"]');

it('waits for initial config and keeps the switch disabled through write and read-back, then allows revert', async () => {
  const initial = deferred();
  const write = deferred();
  const readBack = deferred();
  hostApi.getHostConfig.mockReturnValueOnce(initial.promise).mockReturnValueOnce(readBack.promise).mockResolvedValue(config(true));
  databaseApi.removeAutoStart.mockReturnValue(write.promise);
  databaseApi.setAutoStart.mockResolvedValue({});
  await render();
  expect(toggle().disabled).toBe(true);
  await act(async () => toggle().click());
  expect(databaseApi.setAutoStart).not.toHaveBeenCalled();
  await act(async () => initial.resolve(config(true)));
  expect(toggle().getAttribute('aria-checked')).toBe('true');
  expect(toggle().disabled).toBe(false);
  await act(async () => toggle().click());
  expect(toggle().disabled).toBe(true);
  await act(async () => toggle().click());
  expect(databaseApi.removeAutoStart).toHaveBeenCalledTimes(1);
  await act(async () => container.querySelector('[data-testid="server-dashboard-refresh-btn"]').click());
  expect(hostApi.getHostConfig).toHaveBeenCalledTimes(1);
  await act(async () => write.resolve({}));
  expect(toggle().disabled).toBe(true);
  await act(async () => readBack.resolve(config(false)));
  expect(toggle().getAttribute('aria-checked')).toBe('false');
  expect(toggle().disabled).toBe(false);
  await act(async () => toggle().click());
  expect(databaseApi.setAutoStart).toHaveBeenCalledTimes(1);
  expect(toggle().getAttribute('aria-checked')).toBe('true');
  expect(toggle().disabled).toBe(false);
});

it('does not expose a guessed off state as actionable when the initial config read fails', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  hostApi.getHostConfig.mockRejectedValue(new Error('CMS timeout'));
  await render();
  expect(toggle().disabled).toBe(true);
  await act(async () => toggle().click());
  expect(databaseApi.setAutoStart).not.toHaveBeenCalled();
});

it('ignores a stale background config response that arrives during a write', async () => {
  const stale = deferred();
  const write = deferred();
  hostApi.getHostConfig.mockResolvedValueOnce(config(true)).mockReturnValueOnce(stale.promise).mockResolvedValue(config(false));
  databaseApi.removeAutoStart.mockReturnValue(write.promise);
  await render();
  await act(async () => container.querySelector('[data-testid="server-dashboard-refresh-btn"]').click());
  await act(async () => toggle().click());
  await act(async () => write.resolve({}));
  expect(toggle().getAttribute('aria-checked')).toBe('false');
  await act(async () => stale.resolve(config(true)));
  expect(toggle().getAttribute('aria-checked')).toBe('false');
  expect(toggle().disabled).toBe(false);
});
