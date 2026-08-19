const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

test.describe('Feature: Database Load', () => {
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

  test('Scenario: Load Database modal opens with controls and can be cancelled', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Migration',
      story: 'Load Database Modal Lifecycle',
    });

    let modal;

    await Given('the user triggers Load Database from management menu', async () => {
      await dbTree.clickManageDatabaseItem(E2E_DB, 'Load Database');
      modal = page.getByTestId('load-database-modal');
      await expect(modal).toBeVisible();
    });

    await When('the user views the load options and run button', async () => {
      await expect(page.getByTestId('load-database-run-btn')).toBeVisible();
    });

    await Then('clicking Cancel dismisses the dialog', async () => {
      await page.getByTestId('load-database-cancel-btn').click();
      await expect(modal).not.toBeVisible();
    });
  });

  test('Scenario: Unselected unload file disables execution with validation message', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Migration',
      story: 'Load File Selection Validation',
    });

    let modal;

    await Given('the user opens the Load Database modal', async () => {
      await dbTree.clickManageDatabaseItem(E2E_DB, 'Load Database');
      modal = page.getByTestId('load-database-modal');
      await expect(modal).toBeVisible();
    });

    await When('no unloaded file is selected in the list', async () => {
      await expect(
        modal.getByText('Please select the unloaded file from the list.')
          .or(modal.getByText('Please check the unloaded files of the selected database from the following list.'))
      ).toBeVisible();
    });

    await Then('the execute run button remains disabled', async () => {
      await expect(page.getByTestId('load-database-run-btn')).toBeDisabled();
      await page.getByTestId('load-database-cancel-btn').click();
      await expect(modal).not.toBeVisible();
    });
  });
});
