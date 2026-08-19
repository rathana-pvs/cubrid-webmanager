const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

test.describe('Feature: Database Backup & Restore', () => {
  let dbTree;

  test.beforeEach(async ({ appPage: page }) => {
    test.setTimeout(90000);
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    const hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await hostTree.activateHost(hostUid);
    dbTree = new DatabaseTreePage(page);
  });

  test('Scenario: Backup Database opens with live backup level, directory, and option controls', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Backup & Restore',
      story: 'Backup Dialog Controls',
    });

    let dialog;

    await Given('the user triggers Backup Database from management menu', async () => {
      await dbTree.clickManageDatabaseItem(E2E_DB, 'Backup Database');
      dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
    });

    await When('the user inspects the backup parameters', async () => {
      await expect(dialog.getByText('Backup Database')).toBeVisible();
      await expect(dialog.getByText(/Backup Level/i)).toBeVisible();
      await expect(dialog.getByText(/Backup Directory/i)).toBeVisible();
      await expect(dialog.getByText(/Check Database Consistency/i)).toBeVisible();
      await expect(dialog.getByRole('button', { name: /OK/i })).toBeVisible();
    });

    await Then('the dialog can be cancelled cleanly', async () => {
      await dialog.getByRole('button', { name: /Cancel/i }).click();
      await expect(dialog).not.toBeVisible();
    });
  });

  test('Scenario: Opening Restore Database modal when database is stopped', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Backup & Restore',
      story: 'Restore Database Dialog',
    });

    let modal;

    await Given('the database is stopped', async () => {
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

    await When('the user opens Restore Database modal', async () => {
      await dbTree.clickManageDatabaseItem(E2E_DB, 'Restore Database');
      modal = page.getByTestId('restore-database-modal');
      await expect(modal).toBeVisible();
    });

    await Then('the execute button is visible and modal can be closed', async () => {
      await expect(page.getByTestId('restore-database-execute-btn')).toBeVisible();
      await page.getByTestId('restore-database-discard-btn').click();
      await expect(modal).not.toBeVisible();
    });
  });

  test('Scenario: Invalid recovery path displays validation error and disables execution', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Backup & Restore',
      story: 'Recovery Path Validation',
    });

    let modal;
    let executeBtn;

    await Given('the Restore Database modal is active', async () => {
      await dbTree.openContextMenu(E2E_DB);
      const stopBtn = page.getByRole('button', { name: /Stop Database/i });
      if (await stopBtn.isVisible().catch(() => false)) {
        await stopBtn.click();
        await page.getByText(/Stopping database/i).waitFor({ state: 'hidden', timeout: 30000 }).catch(() => undefined);
        await dbTree.waitForContextAction(E2E_DB, /Start Database/i);
      } else {
        await page.keyboard.press('Escape');
      }

      await dbTree.clickManageDatabaseItem(E2E_DB, 'Restore Database');
      modal = page.getByTestId('restore-database-modal');
      await expect(modal).toBeVisible();
      executeBtn = page.getByTestId('restore-database-execute-btn');
      await expect(executeBtn).toBeEnabled();
    });

    await When('the user selects user-defined recovery path and clears the value', async () => {
      await modal.getByText('Recovery path:').click();
      await modal.getByPlaceholder('Default: original location').fill('');
    });

    await Then('a path invalid validation message is displayed and execution is blocked', async () => {
      await expect(modal.getByText('The user-defined recovery path is not valid.')).toBeVisible();
      await expect(executeBtn).toBeDisabled();
      await page.getByTestId('restore-database-discard-btn').click();
      await expect(modal).not.toBeVisible();
    });
  });
});
