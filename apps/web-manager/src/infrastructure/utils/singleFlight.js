// Share only in-flight reads. Never cache settled responses or coalesce writes.
export function createSingleFlight() {
  const pending = new Map();
  return (key, run) => {
    if (!pending.has(key)) {
      const promise = Promise.resolve().then(run).finally(() => pending.delete(key));
      pending.set(key, promise);
    }
    return pending.get(key);
  };
}
