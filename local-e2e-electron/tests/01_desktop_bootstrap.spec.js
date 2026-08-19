const { test, expect } = require('../fixtures/electron.fixture');
const { WorkspaceSetupPage } = require('../pages/WorkspaceSetupPage');
const { waitForRoute } = require('../helpers/route');

test.describe('Module 01: Desktop App Bootstrap & Protocol Proxy', () => {
  test('first launch routes to workspace setup wizard', async ({ freshElectronApp }) => {
    const window = await freshElectronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    const setupPage = new WorkspaceSetupPage(window);
    await setupPage.waitForPage();

    expect(window.url()).toMatch(/#\/desktop\/workspace$/);
    await expect(setupPage.title).toBeVisible();
  });

  test('completing workspace setup boots API and navigates to login', async ({ freshElectronApp }) => {
    const window = await freshElectronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    const setupPage = new WorkspaceSetupPage(window);
    await setupPage.waitForPage();

    await setupPage.clickContinue();

    await waitForRoute(window, 'login', { timeout: 60000 });
    await expect(window.getByTestId('login-username-input')).toBeVisible();
  });

  test('app boots and displays login page after API starts', async ({ window }) => {
    await waitForRoute(window, 'login');

    expect(window.url()).toMatch(/^app:\/\/\./);

    const usernameInput = window.getByTestId('login-username-input');
    await expect(usernameInput).toBeVisible({ timeout: 30000 });
  });

  test('app:// protocol proxies API requests through Unix socket', async ({ window }) => {
    await waitForRoute(window, 'login');

    const resStatus = await window.evaluate(async () => {
      try {
        const res = await fetch('/api/health');
        return res.status;
      } catch (err) {
        return err.message;
      }
    });

    expect([200, 401, 404]).toContain(resStatus);
  });
});
