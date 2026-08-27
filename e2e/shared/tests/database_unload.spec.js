const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { Given, When, Then, And, bddMeta, action } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

test.describe('Feature: Database Unload', () => {
  let dbTree;

  test.beforeEach(async ({ appPage: page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    const hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await hostTree.activateHost(hostUid);
    dbTree = new DatabaseTreePage(page);
    await dbTree.waitForAuthorized();
    await dbTree.openDashboardTab(E2E_DB, hostUid);
  });

  test('Scenario: Triggering Unload Database initiates backend dump job', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Migration',
      story: 'Unload Database Execution',
    });

    let modal;

    await Given('the user opens the Unload Database dialog from management menu', async () => {
      await action(`Open Unload Database dialog for "${E2E_DB}"`, () => dbTree.clickManageDatabaseItem(E2E_DB, 'Unload Database'), `Failed to open Unload Database dialog for "${E2E_DB}".`);
      modal = page.getByTestId('unload-database-modal');
      await action('Verify Unload Database modal is visible', () => expect(modal).toBeVisible(), 'Unload Database modal did not appear.');
    });

    await When('the user clicks Run Unload', async () => {
      await action('Click Run Unload button', () => page.getByTestId('unload-database-run-btn').click(), 'Could not click Run Unload button.');
    });

    await Then('the background unload job starts and displays execution modal', async () => {
      await action('Verify Unload Database modal is dismissed', () => expect(modal).not.toBeVisible({ timeout: 10000 }), 'Unload Database modal remained open.');
      await action('Verify unload execution progress dialog is visible', () => expect(page.locator('div[role="dialog"]')).toBeVisible(), 'Unload execution progress dialog did not appear.');
    });
  });
});
