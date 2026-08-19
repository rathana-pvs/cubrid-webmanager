const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { BrokerTreePage } = require('../pages/BrokerTreePage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';

test.describe('Feature: Broker Status & Monitoring', () => {
  let brokerTree;
  let hostUid;

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
  });

  test('Scenario: Double clicking a broker opens its status monitoring tab', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Broker & Server',
      feature: 'Broker Monitoring',
      story: 'Open Broker Status Tab',
    });

    let broker;
    let brokerName;

    await Given('the broker list is displayed in the tree', async () => {
      broker = brokerTree.firstBrokerNode();
      await expect(broker).toBeVisible({ timeout: 10000 });
      brokerName = (await broker.getAttribute('data-testid')).replace('tree-node-', '');
    });

    await When('the user double-clicks the broker summary item', async () => {
      await broker.locator('> summary').dblclick();
    });

    await Then('the broker status tab is rendered', async () => {
      await expect(page.getByTestId(`tab-broker_status:${hostUid}:${brokerName}`)).toBeVisible({ timeout: 15000 });
    });
  });

  test('Scenario: Right clicking a broker offers lifecycle controls and Show Status action', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Broker & Server',
      feature: 'Broker Lifecycle',
      story: 'Context Menu Actions',
    });

    let broker;
    let brokerName;

    await Given('the broker item is present in the tree', async () => {
      broker = brokerTree.firstBrokerNode();
      await expect(broker).toBeVisible({ timeout: 10000 });
      brokerName = (await broker.getAttribute('data-testid')).replace('tree-node-', '');
    });

    await When('the user opens the broker context menu', async () => {
      await brokerTree.openContextMenu(brokerName);
    });

    await Then('exactly one of Start or Stop Broker is visible', async () => {
      const stopBtn = page.getByRole('button', { name: 'Stop Broker' });
      const startBtn = page.getByRole('button', { name: 'Start Broker' });
      const stopVisible = await stopBtn.isVisible().catch(() => false);
      const startVisible = await startBtn.isVisible().catch(() => false);
      expect(stopVisible || startVisible).toBe(true);
      expect(stopVisible && startVisible).toBe(false);
    });

    await And('clicking Show Status opens the status tab', async () => {
      await page.getByRole('button', { name: 'Show Status' }).click();
      await expect(page.getByTestId(`tab-broker_status:${hostUid}:${brokerName}`)).toBeVisible({ timeout: 15000 });
    });
  });

  test('Scenario: Broker Properties loads real common and advanced configuration fields', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Broker & Server',
      feature: 'Broker Configuration',
      story: 'View Broker Properties',
    });

    let broker;
    let brokerName;
    let dialog;

    await Given('the user opens Properties from the broker context menu', async () => {
      broker = brokerTree.firstBrokerNode();
      await expect(broker).toBeVisible({ timeout: 10000 });
      brokerName = (await broker.getAttribute('data-testid')).replace('tree-node-', '');

      await brokerTree.openContextMenu(brokerName);
      await page.getByRole('button', { name: /Properties/i }).click();
      dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
    });

    await When('the properties modal displays the broker port parameter', async () => {
      await expect(dialog.getByText('Broker Properties')).toBeVisible();
      await expect(dialog.getByText(brokerName, { exact: true })).toBeVisible();
      await expect(dialog.getByText('BROKER_PORT', { exact: true })).toBeVisible({ timeout: 15000 });
    });

    await Then('switching to Advanced displays LONG_QUERY_TIME and can be closed', async () => {
      await dialog.getByRole('button', { name: /Advanced/i }).click();
      await expect(dialog.getByText('LONG_QUERY_TIME', { exact: true })).toBeVisible();
      await dialog.getByRole('button', { name: /Discard/i }).click();
      await expect(dialog).not.toBeVisible();
    });
  });
});
