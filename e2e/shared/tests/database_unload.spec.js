const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

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
    await host.dblclick();
    dbTree = new DatabaseTreePage(page);
    await dbTree.waitForAuthorized();
  });

  test('Scenario: Triggering Unload Database initiates backend dump job', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Migration',
      story: 'Unload Database Execution',
    });

    let modal;

    await Given('the user opens the Unload Database dialog from management menu', async () => {
      await dbTree.clickManageDatabaseItem(E2E_DB, 'Unload Database');
      modal = page.getByTestId('unload-database-modal');
      await expect(modal).toBeVisible();
    });

    await When('the user clicks Run Unload', async () => {
      await page.getByTestId('unload-database-run-btn').click();
    });

    await Then('the background unload job starts and displays execution modal', async () => {
      await expect(modal).not.toBeVisible({ timeout: 10000 });
      await expect(page.locator('div[role="dialog"]')).toBeVisible();
    });
  });
});
