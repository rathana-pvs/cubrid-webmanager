const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

test.describe('Feature: Database Properties & Diagnostic Info', () => {
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

  test('Scenario: Database Properties modal opens with configuration and can be discarded', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Diagnostics',
      story: 'View Database Properties',
    });

    let modal;

    await Given('the user opens Properties from database context menu', async () => {
      await dbTree.openContextMenu(E2E_DB);
      await page.getByRole('button', { name: 'Properties' }).click();
      modal = page.getByTestId('database-property-modal');
      await expect(modal).toBeVisible({ timeout: 10000 });
    });

    await When('the modal loads property details for the database', async () => {
      await expect(modal.getByText(E2E_DB).first()).toBeVisible();
    });

    await Then('clicking Discard closes the modal without applying changes', async () => {
      await page.getByTestId('database-property-discard-btn').click();
      await expect(modal).not.toBeVisible();
    });
  });

  test('Scenario: Database Param Dump renders database parameter table', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Diagnostics',
      story: 'Database Parameter Dump',
    });

    let modal;

    await Given('the user navigates to Database Info and selects Param Dump', async () => {
      await dbTree.openContextMenu(E2E_DB);
      await page.getByRole('button', { name: 'Database Info' }).hover();
      await page.getByRole('button', { name: /Param Dump/ }).click();
      modal = page.getByTestId('database-info-modal');
      await expect(modal).toBeVisible({ timeout: 10000 });
    });

    await When('the user executes the param dump query', async () => {
      await page.getByTestId('database-info-run-btn').click();
    });

    await Then('the system parameters table renders with data rows', async () => {
      await expect(modal.locator('table')).toBeVisible({ timeout: 15000 });
      await expect(modal.locator('table tbody tr').first()).toBeVisible();
      await page.getByTestId('database-info-close-btn').click();
      await expect(modal).not.toBeVisible();
    });
  });

  test('Scenario: Database Locking Information allows switching tabs and refreshing lock stats', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Diagnostics',
      story: 'Locking Information Monitor',
    });

    let modal;

    await Given('the user opens Locking Information dialog', async () => {
      await dbTree.openContextMenu(E2E_DB);
      await page.getByRole('button', { name: 'Database Info' }).hover();
      await page.getByRole('button', { name: /Locking Information/ }).click();
      modal = page.getByTestId('lock-information-modal');
      await expect(modal).toBeVisible({ timeout: 10000 });
    });

    await When('the user switches between Sessions, Objects, and Parameters tabs', async () => {
      await expect(modal.getByTestId('lock-information-tab-sessions')).toBeVisible();
      await page.getByTestId('lock-information-tab-objects').click();
      await page.getByTestId('lock-information-tab-params').click();
    });

    await Then('clicking Refresh updates the lock statistics cleanly', async () => {
      await page.getByTestId('lock-information-refresh-btn').click();
      await expect(page.getByTestId('lock-information-refresh-btn')).toBeEnabled({ timeout: 15000 });
      await page.getByTestId('lock-information-close-btn').click();
      await expect(modal).not.toBeVisible();
    });
  });

  test('Scenario: Database Transaction Information renders active transactions view', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Diagnostics',
      story: 'Transaction Information Monitor',
    });

    let modal;

    await Given('the user navigates to Database Info and selects Transaction Information', async () => {
      await dbTree.openContextMenu(E2E_DB);
      await page.getByRole('button', { name: 'Database Info' }).hover();
      await page.getByRole('button', { name: /Transaction information/ }).click();
      modal = page.getByTestId('transaction-info-modal');
      await expect(modal).toBeVisible({ timeout: 15000 });
    });

    await When('the active transactions panel loads', async () => {
      await expect(page.getByTestId('transaction-info-refresh-btn')).toBeVisible({ timeout: 10000 });
    });

    await Then('the user can close the transaction information view', async () => {
      await page.getByTestId('transaction-info-close-btn').click();
      await expect(modal).not.toBeVisible();
    });
  });

  test('Scenario: Database Plan Dump executes and switches to execution results view', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Diagnostics',
      story: 'Database Plan Dump',
    });

    let modal;

    await Given('the user opens the Plan Dump dialog', async () => {
      await dbTree.openContextMenu(E2E_DB);
      await page.getByRole('button', { name: 'Database Info' }).hover();
      await page.getByRole('button', { name: /Plan Dump/ }).click();
      modal = page.getByTestId('plan-dump-modal');
      await expect(modal).toBeVisible({ timeout: 10000 });
    });

    await When('the user clicks Run Plan Dump', async () => {
      await page.getByTestId('plan-dump-run-btn').click();
    });

    await Then('the view displays plan dump results with a Back navigation button', async () => {
      await expect(page.getByTestId('plan-dump-back-btn')).toBeVisible({ timeout: 15000 });
      await page.getByTestId('plan-dump-close-btn').click();
      await expect(modal).not.toBeVisible();
    });
  });
});
