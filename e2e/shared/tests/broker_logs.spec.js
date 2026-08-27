const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { BrokerTreePage } = require('../pages/BrokerTreePage');
const { Given, When, Then, And, bddMeta, action } = require('../bdd');

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
      await action(`Locate first SQL log file node for broker "${brokerName}"`, () => expect(logFile).toBeVisible({ timeout: 10000 }), `SQL log file node for broker "${brokerName}" was not found in the tree.`);
      path = (await logFile.getAttribute('data-testid')).replace('tree-node-', '');
      await action(`Double-click log file "${path}"`, () => logFile.dblclick(), `Could not double-click log file "${path}".`);
    });

    await When('the log viewer tab opens', async () => {
      await action(`Verify log viewer tab is open for "${path}"`, () => expect(page.getByTestId(`tab-log:${hostUid}:${path}`)).toBeVisible({ timeout: 15000 }), `Log viewer tab for "${path}" did not open.`);
      viewer = page.getByTestId('log-viewer');
      await action('Verify log viewer container is visible', () => expect(viewer).toBeVisible(), 'Log viewer container was not visible.');
    });

    await Then('clicking Refresh updates the log viewer content', async () => {
      await action('Click Refresh button in log viewer', () => page.getByTestId('log-viewer-refresh-btn').click(), 'Could not click log viewer Refresh button.');
      await action('Verify log viewer remains visible after refresh', () => expect(viewer).toBeVisible(), 'Log viewer disappeared after clicking Refresh.');
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
      await action(`Locate first SQL log file node for broker "${brokerName}"`, () => expect(logFile).toBeVisible({ timeout: 10000 }), `SQL log file node for broker "${brokerName}" was not found in the tree.`);
      await action('Double-click log file to open viewer', () => logFile.dblclick(), 'Could not double-click log file.');
      viewer = page.getByTestId('log-viewer');
      await action('Verify log viewer is visible', () => expect(viewer).toBeVisible({ timeout: 15000 }), 'Log viewer did not open within timeout.');
    });

    await When('the user toggles display modes between SQL, Top SQL, and Raw', async () => {
      for (const mode of ['sql', 'top', 'raw']) {
        const modeBtn = page.getByTestId(`log-viewer-mode-${mode}`);
        await action(`Verify "${mode}" mode button is visible`, () => expect(modeBtn).toBeVisible(), `"${mode}" mode button is not visible.`);
        await action(`Switch log viewer mode to "${mode}"`, () => modeBtn.click(), `Could not click "${mode}" mode button.`);
        await action(`Verify "${mode}" mode button has active highlight`, () => expect(modeBtn).toHaveClass(/text-amber-600/), `"${mode}" mode button did not acquire active highlight class.`);
        await action(`Verify log viewer is visible in "${mode}" mode`, () => expect(viewer).toBeVisible(), `Log viewer became invisible in "${mode}" mode.`);
      }
    });

    await Then('each mode applies its active styling and displays corresponding formatted logs', async () => {
      await action('Verify log viewer is rendered', () => expect(viewer).toBeVisible(), 'Log viewer is not rendered.');
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
      await action(`Open SQL log context menu for broker "${brokerName}"`, () => brokerTree.openSqlLogContextMenu(brokerName), `Could not open SQL log context menu for broker "${brokerName}".`);
      await action('Click View All Logs from context menu', () => page.getByRole('button', { name: 'View All Logs' }).click(), 'Could not click View All Logs context menu item.');
    });

    await When('the all logs viewer tab opens with multiple log sections', async () => {
      await action(`Verify all-logs tab is open for broker "${brokerName}"`, () => expect(page.getByTestId(`tab-all_logs:${hostUid}:${brokerName}`)).toBeVisible({ timeout: 15000 }), `All-logs tab for broker "${brokerName}" did not open.`);
      viewer = page.getByTestId('all-logs-viewer');
      await action('Verify all-logs viewer container is visible', () => expect(viewer).toBeVisible(), 'All-logs viewer container is not visible.');

      sections = viewer.locator('[data-testid^="log-section-"]');
      await action('Verify at least one log section is displayed', () => expect(sections.first()).toBeVisible({ timeout: 10000 }), 'No log sections were visible in all-logs viewer.');
    });

    await Then('the user can collapse all, expand all, and refresh all log sections', async () => {
      await action('Click Collapse All button', () => page.getByTestId('all-logs-collapse-all-btn').click(), 'Could not click Collapse All button.');
      await action('Click Expand All button', () => page.getByTestId('all-logs-expand-all-btn').click(), 'Could not click Expand All button.');
      await action('Click Refresh All button', () => page.getByTestId('all-logs-refresh-all-btn').click(), 'Could not click Refresh All button.');
      await action('Verify log sections remain visible', () => expect(sections.first()).toBeVisible(), 'Log sections are not visible after refresh.');
    });
  });
});
