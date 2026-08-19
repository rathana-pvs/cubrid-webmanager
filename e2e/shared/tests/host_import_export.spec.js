const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';

test.describe('Feature: Host Import and Export', () => {
  test.beforeEach(async ({ appPage: page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
  });

  test('Scenario: Exporting host configuration and importing the same file flags all entries as duplicate', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Host Management',
      feature: 'Import & Export',
      story: 'Duplicate Detection on Import',
    });

    let modal;
    let filePath;

    await Given('the user exports existing registered hosts to a file', async () => {
      await page.getByText('File', { exact: true }).hover();
      await page.getByRole('button', { name: 'Export Host' }).click();

      modal = page.getByTestId('import-export-host-modal');
      await expect(modal).toBeVisible({ timeout: 10000 });

      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByTestId('import-export-host-action-btn').click(),
      ]);
      filePath = await download.path();
      expect(filePath).toBeTruthy();
      await expect(modal).not.toBeVisible({ timeout: 10000 });
    });

    await When('the user opens Import Host and uploads the exported file', async () => {
      await page.getByText('File', { exact: true }).hover();
      await page.getByRole('button', { name: 'Import Host' }).click();
      await expect(modal).toBeVisible({ timeout: 10000 });

      await modal.locator('input[type="file"]').setInputFiles(filePath);
    });

    await Then('every existing host row is tagged with a DUPLICATE badge and import action is disabled', async () => {
      const duplicateBadges = modal.getByText('DUPLICATE', { exact: true });
      await expect(duplicateBadges.first()).toBeVisible({ timeout: 10000 });

      const actionBtn = page.getByTestId('import-export-host-action-btn');
      await expect(actionBtn).toBeDisabled();
    });

    await And('the user can safely discard the import modal', async () => {
      await page.getByTestId('import-export-host-discard-btn').click();
      await expect(modal).not.toBeVisible();
    });
  });
});
