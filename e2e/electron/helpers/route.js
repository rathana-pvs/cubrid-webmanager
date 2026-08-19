/**
  Helper for hash-based router navigation waiting in Electron app:// protocol.
  URLs in the desktop app follow: app://./index.html#/<route>
 */
async function waitForRoute(window, routeFragment, options = {}) {
  const normalized = routeFragment.replace(/^\/+/, '');
  const pattern = new RegExp(`#\\/${normalized}`);
  await window.waitForURL(pattern, { timeout: 45000, ...options });
}

module.exports = { waitForRoute };
