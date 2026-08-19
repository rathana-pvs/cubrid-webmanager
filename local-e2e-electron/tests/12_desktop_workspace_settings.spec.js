const { test, expect } = require('../fixtures/electron.fixture');
const { registerAndLogin } = require('../helpers/auth');
const { waitForRoute } = require('../helpers/route');

test.describe('Module 12: Desktop Workspace Settings UI', () => {
  test.beforeEach(async ({ window }) => {
    await registerAndLogin(window);
  });

  test('navigating to workspace settings renders controls', async ({ window }) => {
    await window.evaluate(() => {
      window.location.hash = '#/desktop/workspace';
    });

    await waitForRoute(window, 'desktop/workspace');
    const title = window.getByTestId('workspace-setup-title').or(window.getByText(/Workspace/i).first());
    await expect(title).toBeVisible({ timeout: 15000 });
  });
});
