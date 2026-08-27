// Schedule from completion, not from dispatch: slow reads must not build a backlog.
export function startSerialPolling(run, nextDelay, onStopped = () => undefined) {
  let cancelled = false;
  let timer;
  let count = 0;
  const tick = async () => {
    try {
      await run();
    } finally {
      if (!cancelled) {
        const delay = nextDelay(++count);
        if (delay == null) onStopped();
        else timer = setTimeout(() => { void tick().catch(() => undefined); }, delay);
      }
    }
  };
  void tick().catch(() => undefined); // Redux thunks expose errors through their state.
  return () => {
    cancelled = true;
    clearTimeout(timer);
  };
}
