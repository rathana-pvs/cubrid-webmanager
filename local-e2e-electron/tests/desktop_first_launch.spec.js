const { test, expect } = require('../fixtures/electron.fixture');
const { WorkspaceSetupPage } = require('../pages/WorkspaceSetupPage');
const { waitForRoute } = require('../helpers/route');

test.describe('First Launch & Workspace Setup Wizard', () => {
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

    // Complete workspace setup
    await setupPage.clickContinue();

    // After setup completes, API boots and app routes to login
    await waitForRoute(window, 'login', { timeout: 60000 });
    await expect(window.getByTestId('login-username-input')).toBeVisible();
  });
});
