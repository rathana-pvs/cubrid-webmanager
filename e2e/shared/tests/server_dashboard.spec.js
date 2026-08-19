const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

test.describe('Feature: Server Status & Resource Dashboard', () => {
  let hostTree;
  let hostUid;

  test.beforeEach(async ({ appPage: page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await hostTree.activateHost(hostUid);
  });

  test('Scenario: Activating host opens Server Dashboard rendering all primary resource sections', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Broker & Service Management',
      feature: 'Server Dashboard',
      story: 'Dashboard Layout & Overview',
    });

    let dashboard;

    await Given('the server host tab is active', async () => {
      await expect(page.getByTestId(`tab-host:${hostUid}`)).toBeVisible({ timeout: 10000 });
      dashboard = page.getByTestId('server-dashboard');
      await expect(dashboard).toBeVisible();
    });

    await Then('Storage Volumes, Broker Status, System Status, Database List, and System Info are rendered', async () => {
      const sections = [
        'server-dashboard-storage-volumes',
        'server-dashboard-broker-status',
        'server-dashboard-system-status',
        'server-dashboard-database-list',
        'server-dashboard-system-info',
      ];
      for (const testId of sections) {
        await expect(dashboard.getByTestId(testId)).toBeVisible({ timeout: 15000 });
      }
    });
  });

  test('Scenario: Refresh button reloads server dashboard status metrics', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Broker & Service Management',
      feature: 'Server Dashboard',
      story: 'Refresh Dashboard Metrics',
    });

    let dashboard;

    await Given('the server dashboard is open', async () => {
      dashboard = page.getByTestId('server-dashboard');
      await expect(dashboard).toBeVisible();
    });

    await When('the user clicks the dashboard refresh button', async () => {
      const refreshBtn = page.getByTestId('server-dashboard-refresh-btn');
      await refreshBtn.click();
      await expect(refreshBtn).toBeEnabled({ timeout: 15000 });
    });

    await Then('the server status metrics are refreshed cleanly', async () => {
      await expect(dashboard.getByTestId('server-dashboard-broker-status')).toBeVisible();
    });
  });

  test('Scenario: Monitoring sync settings opens with interval configuration controls', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Broker & Service Management',
      feature: 'Server Dashboard',
      story: 'Monitoring Sync Configuration',
    });

    let dashboard;

    await Given('the server dashboard view is active', async () => {
      dashboard = page.getByTestId('server-dashboard');
      await expect(dashboard).toBeVisible();
    });

    await When('the user opens Monitoring Sync settings', async () => {
      await dashboard.getByTitle(/Monitoring Sync/i).click();
    });

    await Then('Heartbeat, Resource Dashboard, and Broker Infrastructure sync options are visible', async () => {
      await expect(page.getByText(/Global Heartbeat/i)).toBeVisible();
      await expect(page.getByText(/Resource Dashboard/i)).toBeVisible();
      await expect(page.getByText(/Broker Infrastructure/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Apply/i })).toBeVisible();
    });
  });

  test('Scenario: Toggling Auto Startup switch updates state and can be reverted', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Broker & Service Management',
      feature: 'Server Dashboard',
      story: 'Database Auto Startup Toggle',
    });

    let dashboard;
    let toggle;
    let initialChecked;

    await Given('the database list section in server dashboard is visible', async () => {
      dashboard = page.getByTestId('server-dashboard');
      await expect(dashboard).toBeVisible();
      const dbList = dashboard.getByTestId('server-dashboard-database-list');
      await expect(dbList).toBeVisible({ timeout: 15000 });

      const row = dbList.locator('tr', { hasText: E2E_DB });
      await expect(row).toBeVisible({ timeout: 10000 });
      toggle = row.getByRole('switch');
      await expect(toggle).toBeVisible();
      initialChecked = await toggle.getAttribute('aria-checked');
    });

    await When('the user clicks the Auto Startup toggle switch', async () => {
      await toggle.click();
    });

    await Then('the toggle reflects the inverted state and toggling back restores initial state', async () => {
      await expect(toggle).toHaveAttribute('aria-checked', initialChecked === 'true' ? 'false' : 'true', { timeout: 15000 });
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-checked', initialChecked, { timeout: 15000 });
    });
  });
});
