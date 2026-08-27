import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('./databaseApi', () => ({ databaseApi: { stopDatabase: vi.fn(), getStartInfo: vi.fn() } }));
import { databaseApi } from './databaseApi';
import reducer, { stopDatabase } from './databaseCoreSlice';

beforeEach(() => vi.resetAllMocks());
const stop = () => configureStore({ reducer }).dispatch(stopDatabase({ hostUid: 'host', dbname: 'db1' }));
const failure = { response: { data: { message: 'CMS stop timeout' } } };

it.each([undefined, {}, { activelist: {} }, { activelist: { active: [null] } },
  { activelist: { active: [{}] } }, { activelist: { active: 'invalid' } },
  { activelist: { active: ['db1'] } }, { activelist: { active: [{ dbname: 'db1' }] } },
])('does not report a successful stop for unknown or still-active status %j', async info => {
  databaseApi.stopDatabase.mockRejectedValue(failure);
  databaseApi.getStartInfo.mockResolvedValue(info);
  const result = await stop();
  expect(result.type).toBe(stopDatabase.rejected.type);
  expect(result.payload).toBe('CMS stop timeout');
  expect(databaseApi.stopDatabase).toHaveBeenCalledTimes(1);
});

it('accepts a timed-out stop only when a valid status read confirms it stopped', async () => {
  const info = { activelist: { active: [{ dbname: 'other' }] } };
  databaseApi.stopDatabase.mockRejectedValue(failure);
  databaseApi.getStartInfo.mockResolvedValue(info);
  const result = await stop();
  expect(result.type).toBe(stopDatabase.fulfilled.type);
  expect(result.payload).toEqual(info);
});

it('preserves the stop error when the recovery read fails', async () => {
  databaseApi.stopDatabase.mockRejectedValue(failure);
  databaseApi.getStartInfo.mockRejectedValue(new Error('status unavailable'));
  expect((await stop()).payload).toBe('CMS stop timeout');
});
