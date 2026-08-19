const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

// Unload runs as a CMS background job against the real fixture DB — this
// only verifies the job starts (target dir defaults to the DB's own
// directory, which the CMS user can write to, unlike the backup dir), not
// full completion.
test.describe('Database Unload', () => {
  let dbTree;

  test.beforeEach(async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    await host.dblclick();
    dbTree = new DatabaseTreePage(page);
    await dbTree.waitForAuthorized();
  });

  test('Unload Database를 실행하면 작업이 시작된다', async ({ page }) => {
    await dbTree.clickManageDatabaseItem(E2E_DB, 'Unload Database');
    const modal = page.getByTestId('unload-database-modal');
    await expect(modal).toBeVisible();
    await page.getByTestId('unload-database-run-btn').click();

    await expect(modal).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
  });
});
