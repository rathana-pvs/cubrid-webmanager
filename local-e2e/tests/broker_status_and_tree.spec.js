const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { BrokerTreePage } = require('../pages/BrokerTreePage');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';

test.describe('Broker Status and Tree', () => {
  let brokerTree;
  let hostUid;

  test.beforeEach(async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await host.dblclick();
    const dbTree = new DatabaseTreePage(page);
    await dbTree.waitForAuthorized();

    brokerTree = new BrokerTreePage(page);
    await brokerTree.switchToBrokerTab();
  });

  test('브로커를 더블 클릭하면 상태 탭이 열린다', async ({ page }) => {
    const broker = brokerTree.firstBrokerNode();
    await expect(broker).toBeVisible({ timeout: 10000 });
    const brokerName = (await broker.getAttribute('data-testid')).replace('tree-node-', '');

    await broker.locator('> summary').dblclick();

    await expect(page.getByTestId(`tab-broker_status:${hostUid}:${brokerName}`)).toBeVisible({ timeout: 15000 });
  });

  test('브로커 우클릭하면 Start Broker/Stop Broker 중 하나만 보이고, Show Status로 상태 탭이 열린다', async ({ page }) => {
    const broker = brokerTree.firstBrokerNode();
    await expect(broker).toBeVisible({ timeout: 10000 });
    const brokerName = (await broker.getAttribute('data-testid')).replace('tree-node-', '');

    await brokerTree.openContextMenu(brokerName);
    const stopBtn = page.getByRole('button', { name: 'Stop Broker' });
    const startBtn = page.getByRole('button', { name: 'Start Broker' });
    const stopVisible = await stopBtn.isVisible().catch(() => false);
    const startVisible = await startBtn.isVisible().catch(() => false);
    expect(stopVisible || startVisible).toBe(true);
    expect(stopVisible && startVisible).toBe(false);

    await page.getByRole('button', { name: 'Show Status' }).click();
    await expect(page.getByTestId(`tab-broker_status:${hostUid}:${brokerName}`)).toBeVisible({ timeout: 15000 });
  });

  test('Stop Broker 후 Start Broker로 되돌리면 상태가 원래대로 복구된다', async ({ page }) => {
    const broker = brokerTree.firstBrokerNode();
    await expect(broker).toBeVisible({ timeout: 10000 });
    const brokerName = (await broker.getAttribute('data-testid')).replace('tree-node-', '');

    await brokerTree.openContextMenu(brokerName);
    const wasRunning = await page.getByRole('button', { name: 'Stop Broker' }).isVisible().catch(() => false);

    if (wasRunning) {
      await page.getByRole('button', { name: 'Stop Broker' }).click();
      await expect(page.getByText(`Stopping Broker: ${brokerName}`)).toBeHidden({ timeout: 30000 });

      await brokerTree.openContextMenu(brokerName);
      await expect(page.getByRole('button', { name: 'Start Broker' })).toBeVisible({ timeout: 5000 });

      // Restore original (running) state.
      await page.getByRole('button', { name: 'Start Broker' }).click();
      await expect(page.getByText(`Starting Broker: ${brokerName}`)).toBeHidden({ timeout: 30000 });
    } else {
      await page.getByRole('button', { name: 'Start Broker' }).click();
      await expect(page.getByText(`Starting Broker: ${brokerName}`)).toBeHidden({ timeout: 30000 });

      await brokerTree.openContextMenu(brokerName);
      await expect(page.getByRole('button', { name: 'Stop Broker' })).toBeVisible({ timeout: 5000 });

      // Restore original (stopped) state.
      await page.getByRole('button', { name: 'Stop Broker' }).click();
      await expect(page.getByText(`Stopping Broker: ${brokerName}`)).toBeHidden({ timeout: 30000 });
    }

    await page.mouse.click(2, 2).catch(() => {});
  });
});
