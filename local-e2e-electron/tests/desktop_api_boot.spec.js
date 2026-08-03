const { test, expect } = require('../fixtures/electron.fixture');
const { waitForRoute } = require('../helpers/route');

test.describe('Desktop Embedded API & App Boot', () => {
  test('app boots and displays login page after API starts', async ({ window }) => {
    // Wait for router navigation to login page
    await waitForRoute(window, 'login');

    // Verify custom protocol app:// is serving the UI
    expect(window.url()).toMatch(/^app:\/\/\./);

    // Verify login form is rendered
    const usernameInput = window.getByTestId('login-username-input');
    await expect(usernameInput).toBeVisible({ timeout: 30000 });
  });

  test('app:// protocol proxies API requests through Unix socket', async ({ window }) => {
    await waitForRoute(window, 'login');

    // Test a fetch through app://./api to verify proxy connection to backend
    const resStatus = await window.evaluate(async () => {
      try {
        const res = await fetch('/api/health');
        return res.status;
      } catch (err) {
        return err.message;
      }
    });

    // 200, 401, or 404 indicates the proxy reached the backend
    expect([200, 401, 404]).toContain(resStatus);
  });
});
