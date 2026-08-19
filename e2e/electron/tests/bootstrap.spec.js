const { test, expect } = require('../fixture');
const { WorkspaceSetupPage } = require('../pages/WorkspaceSetupPage');
const { waitForRoute } = require('../helpers/route');
const { Given, When, Then, And, bddMeta } = require('../../shared/bdd');

test.describe('Feature: Desktop App Bootstrap & Protocol Proxy', () => {
  test('Scenario: First launch routes to workspace setup wizard', async ({ freshElectronApp }) => {
    await bddMeta({
      epic: 'Desktop Application',
      feature: 'Bootstrap',
      story: 'Initial Setup Wizard Navigation',
    });

    let window;
    let setupPage;

    await Given('the desktop app is launched on a clean profile', async () => {
      window = await freshElectronApp.firstWindow();
      await window.waitForLoadState('domcontentloaded');
      setupPage = new WorkspaceSetupPage(window);
    });

    await When('the application finishes initializing', async () => {
      await setupPage.waitForPage();
    });

    await Then('the url matches workspace setup and title is displayed', async () => {
      expect(window.url()).toMatch(/#\/desktop\/workspace$/);
      await expect(setupPage.title).toBeVisible();
    });
  });

  test('Scenario: Completing workspace setup boots backend API and redirects to login', async ({ freshElectronApp }) => {
    await bddMeta({
      epic: 'Desktop Application',
      feature: 'Bootstrap',
      story: 'Complete Workspace Setup',
    });

    let window;
    let setupPage;

    await Given('the setup wizard is active', async () => {
      window = await freshElectronApp.firstWindow();
      await window.waitForLoadState('domcontentloaded');
      setupPage = new WorkspaceSetupPage(window);
      await setupPage.waitForPage();
    });

    await When('the user confirms default workspace and clicks Continue', async () => {
      await setupPage.clickContinue();
    });

    await Then('the application boots internal API and redirects to login view', async () => {
      await waitForRoute(window, 'login', { timeout: 60000 });
      await expect(window.getByTestId('login-username-input')).toBeVisible();
    });
  });

  test('Scenario: App boots and renders login page with custom app scheme', async ({ window }) => {
    await bddMeta({
      epic: 'Desktop Application',
      feature: 'Protocol Proxy',
      story: 'Custom Scheme URL & Login Display',
    });

    await Given('the desktop application is running with initialized workspace', async () => {
      await waitForRoute(window, 'login');
    });

    await Then('the protocol is app:// and login form is interactive', async () => {
      expect(window.url()).toMatch(/^app:\/\/\./);
      const usernameInput = window.getByTestId('login-username-input');
      await expect(usernameInput).toBeVisible({ timeout: 30000 });
    });
  });

  test('Scenario: app:// protocol proxies backend API requests through internal IPC socket', async ({ window }) => {
    await bddMeta({
      epic: 'Desktop Application',
      feature: 'Protocol Proxy',
      story: 'Unix Socket IPC Proxying',
    });

    let response;

    await Given('the desktop window is ready at login', async () => {
      await waitForRoute(window, 'login');
    });

    await When('a frontend API request is dispatched to /api/auth/login with invalid user', async () => {
      response = await window.evaluate(async () => {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: 'missing-e2e-user', password: 'invalid-password' }),
        });
        return {
          status: res.status,
          contentType: res.headers.get('content-type'),
          body: await res.json(),
        };
      });
    });

    await Then('the internal API socket returns structured JSON 404 response', async () => {
      expect(response.status).toBe(404);
      expect(response.contentType).toContain('application/json');
      expect(response.body).toMatchObject({
        status: 404,
        data: { code: 'USER_NOT_FOUND' },
      });
    });
  });
});
