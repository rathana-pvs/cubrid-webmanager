const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { Given, When, Then, And, bddMeta, action } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';

test.describe('Feature: Service Dashboard (Global)', () => {
  let hostUid;

  test.beforeEach(async ({ appPage: page }) => {
    test.setTimeout(90000);
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await hostTree.activateHost(hostUid);
    await expect(page.getByTestId(`tab-host:${hostUid}`)).toBeVisible({ timeout: 15000 });

    await page.getByText(/Host Service Management|호스트 서비스 관리/i).first().hover();
    await page.getByRole('button', { name: /Service Dashboard|서비스 대시보드/i }).click();
    await page.mouse.click(2, 2).catch(() => undefined);
  });

  test('Scenario: Service Dashboard tab renders all registered hosts and supports refresh', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Broker & Server',
      feature: 'Global Dashboard',
      story: 'Host Service Summary & Refresh',
    });

    let table;

    await Given('the global Service Dashboard tab is open', async () => {
      await action('Verify Service Dashboard tab is open', () => expect(page.getByTestId('tab-service_dashboard')).toBeVisible({ timeout: 10000 }), 'Service Dashboard tab was not visible.');
      const dashboard = page.getByTestId('service-dashboard');
      await action('Verify Service Dashboard content is visible', () => expect(dashboard).toBeVisible(), 'Service Dashboard content is not visible.');
    });

    await When('the user views the service dashboard table', async () => {
      table = page.getByTestId('service-dashboard-table');
      await action('Verify Service Dashboard table is visible', () => expect(table).toBeVisible(), 'Service Dashboard table is not visible.');
      await action(`Verify host "${E2E_HOST_ADDRESS}" appears in table`, () => expect(table.getByText(E2E_HOST_ADDRESS).first()).toBeVisible({ timeout: 15000 }), `Host "${E2E_HOST_ADDRESS}" was not found in Service Dashboard table.`);
    });

    await Then('clicking the refresh button refreshes host service metrics', async () => {
      const refreshBtn = page.getByTestId('service-dashboard-refresh-btn');
      await action('Click Service Dashboard refresh button', () => refreshBtn.click(), 'Could not click Service Dashboard refresh button.');
      await action('Verify refresh button returns to enabled state', () => expect(refreshBtn).toBeEnabled({ timeout: 25000 }), 'Refresh button did not re-enable after refresh.');
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
      await action('Verify Service Dashboard table is visible', () => expect(table).toBeVisible(), 'Service Dashboard table is not visible.');
    });

    await When('the user clicks on a host row in the table', async () => {
      const hostRow = table.locator('tr', { hasText: E2E_HOST_ADDRESS }).first();
      await action(`Verify row for host "${E2E_HOST_ADDRESS}" is visible`, () => expect(hostRow).toBeVisible({ timeout: 10000 }), `Row for host "${E2E_HOST_ADDRESS}" was not visible in table.`);
      await action(`Click host row for "${E2E_HOST_ADDRESS}"`, () => hostRow.click(), `Could not click host row for "${E2E_HOST_ADDRESS}".`);
    });

    await Then('the host dashboard tab is activated and displayed', async () => {
      await action(`Verify host tab is open for hostUid "${hostUid}"`, () => expect(page.getByTestId(`tab-host:${hostUid}`)).toBeVisible({ timeout: 10000 }), 'Host tab did not open.');
      await action('Verify server dashboard content is visible', () => expect(page.locator('[data-testid="server-dashboard"]').first()).toBeVisible({ timeout: 10000 }), 'Server dashboard content was not visible after selecting host.');
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
      await action('Verify Service Dashboard table is visible', () => expect(table).toBeVisible(), 'Service Dashboard table is not visible.');
      const hostRow = table.getByText(E2E_HOST_ADDRESS).first();
      await action(`Verify host "${E2E_HOST_ADDRESS}" is present in table`, () => expect(hostRow).toBeVisible({ timeout: 10000 }), `Host "${E2E_HOST_ADDRESS}" was not visible in table.`);
    });

    await When('the user selects the Master role filter', async () => {
      await action('Click "Master" HA role filter button', () => page.getByTestId('service-dashboard').getByRole('button', { name: /^(Master|마스터)$/i }).click(), 'Could not click "Master" filter button.');
    });

    await Then('non-matching hosts are hidden', async () => {
      await action(`Verify host "${E2E_HOST_ADDRESS}" is hidden under Master filter`, () => expect(table.getByText(E2E_HOST_ADDRESS)).not.toBeVisible(), `Host "${E2E_HOST_ADDRESS}" was unexpectedly visible under Master filter.`);
    });

    await And('switching filter back to All restores the full host list', async () => {
      await action('Click "All" HA role filter button', () => page.getByTestId('service-dashboard').getByRole('button', { name: /^(All|전체)$/i }).click(), 'Could not click "All" filter button.');
      await action(`Verify host "${E2E_HOST_ADDRESS}" is restored in table`, () => expect(table.getByText(E2E_HOST_ADDRESS).first()).toBeVisible({ timeout: 10000 }), `Host "${E2E_HOST_ADDRESS}" did not reappear when filter set to All.`);
    });
  });
});
