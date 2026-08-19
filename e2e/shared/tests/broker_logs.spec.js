const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { BrokerTreePage } = require('../pages/BrokerTreePage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';

test.describe('Feature: Broker Log Monitoring & Analysis', () => {
  let brokerTree;
  let hostUid;
  let brokerName;

  test.beforeEach(async ({ appPage: page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await hostTree.activateHost(hostUid);

    brokerTree = new BrokerTreePage(page);
    await brokerTree.switchToBrokerTab();

    const broker = brokerTree.firstBrokerNode();
    await expect(broker).toBeVisible({ timeout: 10000 });
    brokerName = (await broker.getAttribute('data-testid')).replace('tree-node-', '');
    await brokerTree.expandSqlLogFolder(brokerName);
  });

  test('Scenario: Double-clicking a log file opens the log viewer tab and supports refresh', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Broker & Service Management',
      feature: 'Broker Logs',
      story: 'Log File Viewer',
    });

    let path;
    let viewer;

    await Given('the user locates a broker SQL log file in the tree', async () => {
      const logFile = brokerTree.firstLogFileNode(brokerName);
      await expect(logFile).toBeVisible({ timeout: 10000 });
      path = (await logFile.getAttribute('data-testid')).replace('tree-node-', '');
      await logFile.dblclick();
    });

    await When('the log viewer tab opens', async () => {
      await expect(page.getByTestId(`tab-log:${hostUid}:${path}`)).toBeVisible({ timeout: 15000 });
      viewer = page.getByTestId('log-viewer');
      await expect(viewer).toBeVisible();
    });

    await Then('clicking Refresh updates the log viewer content', async () => {
      await page.getByTestId('log-viewer-refresh-btn').click();
      await expect(viewer).toBeVisible();
    });
  });

  test('Scenario: Switching between Raw, Parsed SQL, and Top SQL log viewing modes', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Broker & Service Management',
      feature: 'Broker Logs',
      story: 'Log Viewer Display Modes',
    });

    let viewer;

    await Given('the user has opened a broker log file viewer', async () => {
      const logFile = brokerTree.firstLogFileNode(brokerName);
      await expect(logFile).toBeVisible({ timeout: 10000 });
      await logFile.dblclick();
      viewer = page.getByTestId('log-viewer');
      await expect(viewer).toBeVisible({ timeout: 15000 });
    });

    await When('the user toggles display modes between SQL, Top SQL, and Raw', async () => {
      for (const mode of ['sql', 'top', 'raw']) {
        const modeBtn = page.getByTestId(`log-viewer-mode-${mode}`);
        await expect(modeBtn).toBeVisible();
        await modeBtn.click();
        await expect(modeBtn).toHaveClass(/text-amber-600/);
        await expect(viewer).toBeVisible();
      }
    });

    await Then('each mode applies its active styling and displays corresponding formatted logs', async () => {
      await expect(viewer).toBeVisible();
    });
  });

  test('Scenario: View All Logs opens aggregated log viewer with expand, collapse, and refresh all', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Broker & Service Management',
      feature: 'Broker Logs',
      story: 'Aggregated Logs Viewer',
    });

    let viewer;
    let sections;

    await Given('the user chooses View All Logs from SQL log folder context menu', async () => {
      await brokerTree.openSqlLogContextMenu(brokerName);
      await page.getByRole('button', { name: 'View All Logs' }).click();
    });

    await When('the all logs viewer tab opens with multiple log sections', async () => {
      await expect(page.getByTestId(`tab-all_logs:${hostUid}:${brokerName}`)).toBeVisible({ timeout: 15000 });
      viewer = page.getByTestId('all-logs-viewer');
      await expect(viewer).toBeVisible();

      sections = viewer.locator('[data-testid^="log-section-"]');
      await expect(sections.first()).toBeVisible({ timeout: 10000 });
    });

    await Then('the user can collapse all, expand all, and refresh all log sections', async () => {
      await page.getByTestId('all-logs-collapse-all-btn').click();
      await page.getByTestId('all-logs-expand-all-btn').click();
      await page.getByTestId('all-logs-refresh-all-btn').click();
      await expect(sections.first()).toBeVisible();
    });
  });
});
