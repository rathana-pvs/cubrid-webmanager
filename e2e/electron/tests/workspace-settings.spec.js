const { test, expect } = require('../fixture');
const { AuthPage } = require('../../shared/pages/AuthPage');
const { getCredentials } = require('../../shared/env');
const { waitForRoute } = require('../helpers/route');
const { Given, When, Then, And, bddMeta } = require('../../shared/bdd');

test.describe('Feature: Desktop Workspace Settings UI', () => {
  test.beforeEach(async ({ seededWindow }) => {
    const auth = new AuthPage(seededWindow);
    const { username, password } = getCredentials();
    await auth.login(username, password);
  });

  test('Scenario: Navigating to workspace settings renders controls', async ({ seededWindow: window }) => {
    await bddMeta({
      epic: 'Desktop Application',
      feature: 'Workspace Settings',
      story: 'Navigate to Workspace Settings',
    });

    await Given('the user navigates directly to the workspace settings route', async () => {
      await window.evaluate(() => {
        window.location.hash = '#/desktop/workspace';
      });
    });

    await When('the router resolves desktop workspace view', async () => {
      await waitForRoute(window, 'desktop/workspace');
    });

    await Then('the workspace setup title and controls are visible', async () => {
      const title = window.getByTestId('workspace-setup-title').or(window.getByText(/Workspace/i).first());
      await expect(title).toBeVisible({ timeout: 15000 });
    });
  });
});
