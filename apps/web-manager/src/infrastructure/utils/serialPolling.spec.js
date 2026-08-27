import { afterEach, describe, expect, it, vi } from 'vitest';
import { startSerialPolling } from './serialPolling';

describe('completion-based polling', () => {
  afterEach(() => vi.useRealTimers());

  it('does not overlap slow reads and delays from completion', async () => {
    vi.useFakeTimers();
    let resolve;
    const run = vi.fn(() => new Promise(r => { resolve = r; }));
    const stop = startSerialPolling(run, () => 1000);
    await vi.advanceTimersByTimeAsync(15000);
    expect(run).toHaveBeenCalledTimes(1);
    resolve();
    await vi.advanceTimersByTimeAsync(999);
    expect(run).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(run).toHaveBeenCalledTimes(2);
    stop();
    resolve();
  });

  it('does not restart after cancellation while a read is pending', async () => {
    vi.useFakeTimers();
    let resolve;
    const run = vi.fn(() => new Promise(r => { resolve = r; }));
    const stop = startSerialPolling(run, () => 1000);
    stop();
    resolve();
    await vi.advanceTimersByTimeAsync(60000);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('continues after a failed read and stops at the configured limit', async () => {
    vi.useFakeTimers();
    const run = vi.fn().mockRejectedValueOnce(new Error('read failed')).mockResolvedValue(null);
    const onStopped = vi.fn();
    startSerialPolling(run, count => count === 2 ? null : 1000, onStopped);
    await vi.advanceTimersByTimeAsync(60000);
    expect(run).toHaveBeenCalledTimes(2);
    expect(onStopped).toHaveBeenCalledTimes(1);
  });
});
