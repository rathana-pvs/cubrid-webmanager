const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

test.describe('Feature: Database Rename & Copy', () => {
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

  test('Scenario: Rename Database modal enforces name changes and validates execution actionability', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Lifecycle',
      story: 'Rename Database Validation',
    });

    let modal;

    await Given('the user checks database active state', async () => {
      await dbTree.openContextMenu(E2E_DB);
      const isActive = await page.getByRole('button', { name: /Stop Database/i }).isVisible().catch(() => false);
      if (isActive) {
        await page.getByRole('button', { name: 'Manage Database' }).hover();
        await expect(page.getByRole('button', { name: /Rename Database/i })).toBeDisabled();
        await page.keyboard.press('Escape');
        return;
      }
      await dbTree.clickManageDatabaseItem(E2E_DB, 'Rename Database');
      modal = page.getByTestId('rename-database-modal');
      await expect(modal).toBeVisible();
    });

    await When('the user opens the rename modal and enters a new name', async () => {
      if (!modal) return;
      await expect(page.getByTestId('rename-database-execute-btn')).toBeDisabled();
      await page.getByTestId('rename-database-new-name-input').fill(`${E2E_DB}_v2`);
    });

    await Then('the execute button is enabled and changes can be discarded', async () => {
      if (!modal) return;
      await expect(page.getByTestId('rename-database-execute-btn')).toBeEnabled();
      await page.getByTestId('rename-database-discard-btn').click();
      await expect(modal).not.toBeVisible();
    });
  });

  test('Scenario: Copy Database initiates an asynchronous database replication background task', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Lifecycle',
      story: 'Copy Database Replication',
    });

    test.setTimeout(120000);
    const cloneName = `e2e_clone_${Date.now().toString().slice(-6)}`;
    let copyModal;

    await Given('the source database is stopped to prepare for replication', async () => {
      await dbTree.openContextMenu(E2E_DB);
      const stopBtn = page.getByRole('button', { name: /Stop Database/i });
      if (await stopBtn.isVisible().catch(() => false)) {
        await stopBtn.click();
        await page.getByText(/Stopping database/i).waitFor({ state: 'hidden', timeout: 30000 }).catch(() => undefined);
        await dbTree.waitForContextAction(E2E_DB, /Start Database/i);
      } else {
        await page.keyboard.press('Escape');
      }
    });

    await When('the user opens Copy Database and fills destination name', async () => {
      await dbTree.clickManageDatabaseItem(E2E_DB, 'Copy Database');
      copyModal = page.getByTestId('copy-database-modal');
      await expect(copyModal).toBeVisible();
      await page.getByTestId('copy-database-dest-name-input').fill(cloneName);
      await page.getByTestId('copy-database-execute-btn').click();
    });

    await Then('the replication task begins displaying progress banner', async () => {
      await expect(page.getByText(/Copying Database/i)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(cloneName)).toBeVisible();
    });
  });
});
