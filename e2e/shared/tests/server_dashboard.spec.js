const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { Given, When, Then, And, bddMeta, action } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

test.describe('Feature: Server Status & Resource Dashboard', () => {
  let hostTree;
  let hostUid;

  test.beforeEach(async ({ appPage: page }) => {
    test.setTimeout(90000);
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await hostTree.activateHost(hostUid);
    await expect(page.getByTestId(`tab-host:${hostUid}`)).toBeVisible({ timeout: 15000 });
  });

  test('Scenario: Activating host opens Server Dashboard rendering all primary resource sections', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Broker & Service Management',
      feature: 'Server Dashboard',
      story: 'Dashboard Layout & Overview',
    });

    let dashboard;

    await Given('the server host tab is active', async () => {
      await action('Verify server host tab is visible', () => expect(page.getByTestId(`tab-host:${hostUid}`)).toBeVisible({ timeout: 10000 }), 'Server host tab was not visible.');
      dashboard = page.getByTestId('server-dashboard');
      await action('Verify server dashboard is visible', () => expect(dashboard).toBeVisible(), 'Server dashboard was not visible.');
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
        await action(`Verify section "${testId}" is visible`, () => expect(dashboard.getByTestId(testId)).toBeVisible({ timeout: 15000 }), `Dashboard section "${testId}" failed to render.`);
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
      await action('Verify server dashboard is visible', () => expect(dashboard).toBeVisible(), 'Server dashboard is not visible.');
    });

    await When('the user clicks the dashboard refresh button', async () => {
      const syncedAt = dashboard.getByText(/^Synced |^동기화: /);
      await action('Verify sync timestamp indicator is visible', () => expect(syncedAt).toBeVisible(), 'Sync timestamp indicator is not visible.');
      const before = await syncedAt.textContent();

      const refreshBtn = page.getByTestId('server-dashboard-refresh-btn');
      await action('Click dashboard refresh button', () => refreshBtn.click(), 'Could not click dashboard refresh button.');
      await action('Verify refresh button returns to enabled state', () => expect(refreshBtn).toBeEnabled({ timeout: 15000 }), 'Refresh button did not re-enable after refresh.');
      await action('Verify sync timestamp updates after refresh', () => expect(syncedAt).not.toHaveText(before, { timeout: 15000 }), 'Sync timestamp was not updated after clicking refresh.');
    });

    await Then('the server status metrics are refreshed cleanly', async () => {
      await action('Verify Broker Status section is visible after refresh', () => expect(dashboard.getByTestId('server-dashboard-broker-status')).toBeVisible(), 'Broker status section was not visible after refresh.');
    });
  });

  test('Scenario: Toggling Auto Startup switch updates state and can be reverted', async ({ appPage: page }) => {
    test.setTimeout(180000);
    await bddMeta({
      epic: 'Broker & Service Management',
      feature: 'Server Dashboard',
      story: 'Database Auto Startup Toggle',
    });

    let dashboard;
    let toggle;
    let initialChecked;
    let restoreNeeded = false;

    const changeAutoStartup = async (checked) => {
      await expect(toggle).toBeEnabled({ timeout: 65000 });
      const operation = checked === 'true' ? 'set' : 'remove';
      const [response] = await Promise.all([
        page.waitForResponse(response => response.request().method() === 'POST'
          && response.url().endsWith(`/${hostUid}/database/auto-start/${operation}`)
          && response.request().postDataJSON()?.dbname === E2E_DB, { timeout: 65000 }),
        toggle.click(),
      ]);
      expect(response.ok(), `Auto Startup ${operation} returned HTTP ${response.status()}`).toBe(true);
      // Busy covers both the write and the authoritative config read-back.
      await expect(toggle).toBeEnabled({ timeout: 65000 });
      await expect(toggle).toHaveAttribute('aria-checked', checked);
    };

    await Given('the database list section in server dashboard is visible', async () => {
      dashboard = page.getByTestId('server-dashboard');
      await action('Verify server dashboard is visible', () => expect(dashboard).toBeVisible(), 'Server dashboard is not visible.');
      const dbList = dashboard.getByTestId('server-dashboard-database-list');
      await action('Verify database list section is visible', () => expect(dbList).toBeVisible({ timeout: 15000 }), 'Database list section is not visible.');

      const row = dbList.getByRole('row').filter({ has: page.getByText(E2E_DB, { exact: true }) });
      await action(`Locate row for database "${E2E_DB}"`, () => expect(row).toBeVisible({ timeout: 10000 }), `Database row for "${E2E_DB}" was not found in table.`);
      toggle = row.getByRole('switch');
      await action('Verify auto startup toggle switch is visible', () => expect(toggle).toBeVisible(), 'Auto startup switch was not visible in row.');
      await action('Wait for the actual Auto Startup configuration to load', () => expect(toggle).toBeEnabled({ timeout: 65000 }));
      initialChecked = await toggle.getAttribute('aria-checked');
    });

    try {
      await When('the user clicks the Auto Startup toggle switch', async () => {
        restoreNeeded = true;
        await action('Toggle Auto Startup and verify the API result', () => changeAutoStartup(initialChecked === 'true' ? 'false' : 'true'));
      });

      await Then('the toggle reflects the inverted state and toggling back restores initial state', async () => {
        const invertedChecked = initialChecked === 'true' ? 'false' : 'true';
        await action(`Verify toggle switch reflects inverted state (${invertedChecked})`, () => expect(toggle).toHaveAttribute('aria-checked', invertedChecked, { timeout: 15000 }), 'Toggle switch state did not invert.');
        await expect(toggle).toBeEnabled({ timeout: 65000 });
        await action('Revert Auto Startup and verify the API result', () => changeAutoStartup(initialChecked));
        await action(`Verify toggle switch restores initial state (${initialChecked})`, () => expect(toggle).toHaveAttribute('aria-checked', initialChecked, { timeout: 15000 }), 'Toggle switch failed to revert to initial state.');
        restoreNeeded = false;
      });
    } finally {
      if (restoreNeeded) {
        await action('Restore the original Auto Startup setting after failure', async () => {
          // Reload to read persisted state, including a write that succeeded
          // on CMS even if its client-side response failed.
          await page.reload();
          await hostTree.activateHost(hostUid);
          await expect(toggle).toBeEnabled({ timeout: 65000 });
          if (await toggle.getAttribute('aria-checked') !== initialChecked) {
            await changeAutoStartup(initialChecked);
          }
          await expect(toggle).toHaveAttribute('aria-checked', initialChecked);
        });
      }
    }
  });
});
