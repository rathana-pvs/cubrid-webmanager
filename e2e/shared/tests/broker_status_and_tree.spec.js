const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { BrokerTreePage } = require('../pages/BrokerTreePage');
const { Given, When, Then, And, bddMeta, action } = require('../bdd');

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
      await action('Locate broker node in tree', () => expect(broker).toBeVisible({ timeout: 10000 }), 'Broker node did not appear in the tree.');
      brokerName = (await broker.getAttribute('data-testid')).replace('tree-node-', '');
    });

    await When('the user double-clicks the broker summary item', async () => {
      await action(`Double-click broker summary for "${brokerName}"`, () => broker.locator('> summary').dblclick(), `Could not double-click broker summary for "${brokerName}".`);
    });

    await Then('the broker status tab is rendered', async () => {
      await action(`Verify broker status tab is open for "${brokerName}"`, () => expect(page.getByTestId(`tab-broker_status:${hostUid}:${brokerName}`)).toBeVisible({ timeout: 15000 }), `Broker status tab for "${brokerName}" failed to open.`);
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
      await action('Locate broker node in tree', () => expect(broker).toBeVisible({ timeout: 10000 }), 'Broker node did not appear in the tree.');
      brokerName = (await broker.getAttribute('data-testid')).replace('tree-node-', '');
    });

    await When('the user opens the broker context menu', async () => {
      await action(`Open context menu for broker "${brokerName}"`, () => brokerTree.openContextMenu(brokerName), `Could not open context menu for broker "${brokerName}".`);
    });

    await Then('exactly one of Start or Stop Broker is visible', async () => {
      await action('Verify mutually exclusive Start or Stop Broker action is available', async () => {
        const stopBtn = page.getByRole('button', { name: /Stop Broker|브로커 정지/i });
        const startBtn = page.getByRole('button', { name: /Start Broker|브로커 시작/i });
        const stopVisible = await stopBtn.isVisible().catch(() => false);
        const startVisible = await startBtn.isVisible().catch(() => false);
        expect(stopVisible || startVisible).toBe(true);
        expect(stopVisible && startVisible).toBe(false);
      }, 'Expected exactly one of Start Broker or Stop Broker buttons to be visible.');
    });

    await And('clicking Show Status opens the status tab', async () => {
      await action('Click Show Status in context menu', () => page.getByRole('button', { name: /Show Status|상태 보기/i }).click(), 'Could not click Show Status button.');
      await action(`Verify broker status tab is open for "${brokerName}"`, () => expect(page.getByTestId(`tab-broker_status:${hostUid}:${brokerName}`)).toBeVisible({ timeout: 15000 }), `Broker status tab for "${brokerName}" failed to open after clicking Show Status.`);
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
      await action('Locate broker node in tree', () => expect(broker).toBeVisible({ timeout: 10000 }), 'Broker node did not appear in the tree.');
      brokerName = (await broker.getAttribute('data-testid')).replace('tree-node-', '');

      await action(`Open context menu for broker "${brokerName}"`, () => brokerTree.openContextMenu(brokerName), `Could not open context menu for broker "${brokerName}".`);
      await action('Click Properties from context menu', () => page.locator('.context-menu-container').getByRole('button', { name: /Properties|속성/i }).click(), 'Could not click Properties menu item.');
      dialog = page.getByTestId('broker-properties-modal');
      await action('Verify Broker Properties dialog is visible', () => expect(dialog).toBeVisible({ timeout: 10000 }), 'Broker Properties dialog failed to display.');
    });

    await When('the properties modal displays the broker port parameter', async () => {
      await action('Verify dialog title indicates Broker Properties', () => expect(dialog.getByText(/Broker Properties|브로커 속성/i)).toBeVisible(), 'Dialog title does not display "Broker Properties".');
      await action(`Verify dialog displays broker name "${brokerName}"`, () => expect(dialog.getByText(brokerName, { exact: true })).toBeVisible(), `Broker name "${brokerName}" was not displayed in the dialog.`);
      await action('Verify BROKER_PORT parameter is visible', () => expect(dialog.getByText('BROKER_PORT', { exact: true })).toBeVisible({ timeout: 15000 }), 'BROKER_PORT parameter did not load in the properties dialog.');
    });

    await Then('switching to Advanced displays LONG_QUERY_TIME and can be closed', async () => {
      await action('Switch to Advanced tab in dialog', () => dialog.getByRole('button', { name: /Advanced|고급/i }).click(), 'Could not switch to Advanced tab.');
      await action('Verify LONG_QUERY_TIME parameter is visible', () => expect(dialog.getByText('LONG_QUERY_TIME', { exact: true })).toBeVisible(), 'LONG_QUERY_TIME parameter was not visible in Advanced tab.');
      await action('Click Discard button to close dialog', () => dialog.getByRole('button', { name: /Cancel|Discard|취소/i }).click(), 'Could not click Discard button.');
      await action('Verify Broker Properties dialog is closed', () => expect(dialog).not.toBeVisible(), 'Broker Properties dialog remained visible after clicking Discard.');
    });
  });
});
