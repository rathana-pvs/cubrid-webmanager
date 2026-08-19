const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

test.describe('Feature: Global Navigation, Tabs & Breadcrumbs', () => {
  let dbTree;
  let hostUid;

  test.beforeEach(async ({ appPage: page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await hostTree.activateHost(hostUid);
    dbTree = new DatabaseTreePage(page);
  });

  test('Scenario: Switching between multiple open tabs renders the corresponding content for each tab', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Navigation & Workspace',
      feature: 'Multi-Tab Management',
      story: 'Switch Between Open Tabs',
      severity: 'critical',
    });

    let hostTab;
    let dbTab;

    await Given('the server host dashboard tab is open', async () => {
      hostTab = page.getByTestId(`tab-host:${hostUid}`);
      await expect(hostTab).toBeVisible({ timeout: 10000 });
      await expect(page.getByTestId('server-dashboard')).toBeVisible();
    });

    await When('the user opens a database dashboard tab', async () => {
      await dbTree.openDashboardTab(E2E_DB, hostUid);
      dbTab = page.getByTestId(`tab-db:${hostUid}:${E2E_DB}`);
      await expect(dbTab).toBeVisible({ timeout: 10000 });
    });

    await Then('the database dashboard content is displayed', async () => {
      await expect(page.getByTestId('database-dashboard')).toBeVisible();
    });

    await When('the user switches back to the server host tab', async () => {
      await hostTab.click();
    });

    await Then('the server dashboard content is restored', async () => {
      await expect(page.getByTestId('server-dashboard')).toBeVisible();
    });

    await When('the user switches back to the database dashboard tab', async () => {
      await dbTab.click();
    });

    await Then('the database dashboard view is displayed again', async () => {
      await expect(page.getByTestId('database-dashboard')).toBeVisible();
    });
  });

  test('Scenario: Closing a tab removes it and automatically activates the remaining tab', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Navigation & Workspace',
      feature: 'Multi-Tab Management',
      story: 'Close Tab and Fallback Activation',
      severity: 'normal',
    });

    let hostTab;
    let dbTab;

    await Given('both server dashboard and database dashboard tabs are open', async () => {
      hostTab = page.getByTestId(`tab-host:${hostUid}`);
      await expect(hostTab).toBeVisible({ timeout: 10000 });

      await dbTree.openDashboardTab(E2E_DB, hostUid);
      dbTab = page.getByTestId(`tab-db:${hostUid}:${E2E_DB}`);
      await expect(dbTab).toBeVisible({ timeout: 10000 });
    });

    await When('the user clicks close on the database tab', async () => {
      await page.getByTestId(`tab-db:${hostUid}:${E2E_DB}-close`).click();
    });

    await Then('the closed tab is removed and the server host tab becomes active', async () => {
      await expect(dbTab).not.toBeVisible();
      await expect(hostTab).toBeVisible();
      await expect(page.getByTestId('server-dashboard')).toBeVisible();
    });
  });

  test('Scenario: Closing a dirty tab prompts unsaved changes dialog with cancel and confirm discard options', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Navigation & Workspace',
      feature: 'Multi-Tab Management',
      story: 'Dirty Tab Unsaved Changes Guard',
      severity: 'critical',
    });

    let configTab;
    let confirmDialog;

    await Given('a configuration editor tab is opened with modified unsaved content', async () => {
      await page.mouse.click(2, 2).catch(() => undefined);
      await page.getByTestId('tree-tab-broker').click({ button: 'right' });
      await page.getByRole('button', { name: 'Edit Broker Config' }).click();

      configTab = page.getByTestId(`tab-broker_config:${hostUid}`);
      await expect(configTab).toBeVisible({ timeout: 10000 });
      const textarea = page.getByTestId('broker-config-textarea');
      await expect(textarea).not.toHaveValue('', { timeout: 15000 });
      await textarea.click();
      await textarea.press('End');
      await page.keyboard.type('\n# e2e dirty-tab test');
      await expect(page.getByTestId('broker-config-save-btn')).toBeEnabled();
    });

    await When('the user attempts to close the modified tab', async () => {
      await page.getByTestId(`tab-broker_config:${hostUid}-close`).click();
    });

    await Then('an unsaved changes warning dialog is displayed', async () => {
      confirmDialog = page.getByTestId('close-dirty-tab-modal');
      await expect(confirmDialog).toBeVisible({ timeout: 5000 });
      await expect(confirmDialog.getByText('Discard Changes')).toBeVisible();
      await expect(confirmDialog.getByText(/unsaved changes/i)).toBeVisible();
    });

    await When('the user cancels the discard action', async () => {
      await page.getByTestId('close-dirty-tab-cancel-btn').click();
    });

    await Then('the modal closes and the modified tab remains open', async () => {
      await expect(confirmDialog).not.toBeVisible();
      await expect(configTab).toBeVisible();
    });

    await When('the user attempts to close the tab again and confirms discard', async () => {
      await page.getByTestId(`tab-broker_config:${hostUid}-close`).click();
      await expect(confirmDialog).toBeVisible({ timeout: 5000 });
      await page.getByTestId('close-dirty-tab-confirm-btn').click();
    });

    await Then('the tab is closed and discarded cleanly', async () => {
      await expect(configTab).not.toBeVisible();
    });
  });
});
