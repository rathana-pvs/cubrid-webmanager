const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

// These run as CMS background jobs against the real fixture DB — like copy,
// a full run can take minutes. Each test only verifies the job starts
// (the form view transitions to the loading/result view), not full
// completion — the loading/success/error views are separate <Modal>
// instances without the form's testId, so we just confirm the form testid
// disappears while a dialog is still open.
test.describe('Database Check/Compact/Optimize', () => {
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

  test('Check Database를 실행하면 작업이 시작된다', async ({ page }) => {
    await dbTree.clickManageDatabaseItem(E2E_DB, 'Check Database');
    const modal = page.getByTestId('check-database-modal');
    await expect(modal).toBeVisible();
    await page.getByTestId('check-database-run-btn').click();

    await expect(modal).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
  });

  test('Compact Database를 실행하면 작업이 시작된다', async ({ page }) => {
    await dbTree.clickManageDatabaseItem(E2E_DB, 'Compact Database');
    const modal = page.getByTestId('compact-database-modal');
    await expect(modal).toBeVisible();
    await page.getByTestId('compact-database-run-btn').click();

    await expect(modal).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
  });

  test('Optimize Database를 실행하면 작업이 시작된다', async ({ page }) => {
    await dbTree.clickManageDatabaseItem(E2E_DB, 'Optimize Database');
    const modal = page.getByTestId('optimize-database-modal');
    await expect(modal).toBeVisible();
    await page.getByTestId('optimize-database-run-btn').click();

    await expect(modal).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('div[role="dialog"]')).toBeVisible();
  });
});
