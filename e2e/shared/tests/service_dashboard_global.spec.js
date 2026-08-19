const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';

test.describe('Feature: Service Dashboard (Global)', () => {
  let hostUid;

  test.beforeEach(async ({ appPage: page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await hostTree.activateHost(hostUid);

    await page.getByText('Host Service Management').hover();
    await page.getByRole('button', { name: 'Service Dashboard' }).click();
  });

  test('Scenario: Service Dashboard tab renders all registered hosts and supports refresh', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Broker & Server',
      feature: 'Global Dashboard',
      story: 'Host Service Summary & Refresh',
    });

    let table;

    await Given('the global Service Dashboard tab is open', async () => {
      await expect(page.getByTestId('tab-service_dashboard')).toBeVisible({ timeout: 10000 });
      const dashboard = page.getByTestId('service-dashboard');
      await expect(dashboard).toBeVisible();
    });

    await When('the user views the service dashboard table', async () => {
      table = page.getByTestId('service-dashboard-table');
      await expect(table).toBeVisible();
      await expect(table.getByText(E2E_HOST_ADDRESS).first()).toBeVisible({ timeout: 10000 });
    });

    await Then('clicking the refresh button refreshes host service metrics', async () => {
      const refreshBtn = page.getByTestId('service-dashboard-refresh-btn');
      await refreshBtn.click();
      await expect(refreshBtn).toBeEnabled({ timeout: 15000 });
    });
  });

  test('Scenario: Clicking a host row in the table navigates to that server dashboard', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Broker & Server',
      feature: 'Global Dashboard',
      story: 'Navigate to Host Dashboard',
    });

    let table;

    await Given('the service dashboard host list is populated', async () => {
      table = page.getByTestId('service-dashboard-table');
      await expect(table).toBeVisible();
    });

    await When('the user clicks on a host row in the table', async () => {
      const hostRow = table.locator('tr', { hasText: E2E_HOST_ADDRESS }).first();
      await expect(hostRow).toBeVisible({ timeout: 10000 });
      await hostRow.click();
    });

    await Then('the host dashboard tab is activated and displayed', async () => {
      await expect(page.getByTestId(`tab-host:${hostUid}`)).toBeVisible({ timeout: 10000 });
      await expect(page.locator('[data-testid="server-dashboard"]').first()).toBeVisible({ timeout: 10000 });
    });
  });

  test('Scenario: Toggling HA Role filter buttons filters visible hosts in table', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Broker & Server',
      feature: 'Global Dashboard',
      story: 'Filter by HA Role',
    });

    let table;

    await Given('the service dashboard table is loaded', async () => {
      table = page.getByTestId('service-dashboard-table');
      await expect(table).toBeVisible();
      const hostRow = table.getByText(E2E_HOST_ADDRESS).first();
      await expect(hostRow).toBeVisible({ timeout: 10000 });
    });

    await When('the user selects the Master role filter', async () => {
      await page.getByRole('button', { name: 'Master', exact: true }).click();
    });

    await Then('non-matching hosts are hidden', async () => {
      await expect(table.getByText(E2E_HOST_ADDRESS)).not.toBeVisible();
    });

    await And('switching filter back to All restores the full host list', async () => {
      await page.getByRole('button', { name: 'All', exact: true }).click();
      await expect(table.getByText(E2E_HOST_ADDRESS).first()).toBeVisible({ timeout: 10000 });
    });
  });
});
