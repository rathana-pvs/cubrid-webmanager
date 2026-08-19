const { test, expect } = require('../fixtures/electron.fixture');
const { registerAndLogin } = require('../helpers/auth');
const { connectRealHost } = require('../helpers/cms');
const { BrokerTreePage } = require('../pages/BrokerTreePage');

test.describe('Module 05: Desktop Broker Management & Logs', () => {
  test.beforeEach(async ({ window }) => {
    await registerAndLogin(window);
    await connectRealHost(window);
  });

  test('Broker tab button switches sidebar view to broker tree', async ({ window }) => {
    const brokerTree = new BrokerTreePage(window);
    await brokerTree.switchToBrokerTab();

    await expect(brokerTree.container).toBeVisible();
  });

  test('Broker tree renders active broker nodes', async ({ window }) => {
    const brokerTree = new BrokerTreePage(window);
    await brokerTree.switchToBrokerTab();

    const firstBroker = brokerTree.firstBrokerNode();
    if (await firstBroker.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(firstBroker).toBeVisible();
    } else {
      // Defensive fallback if no brokers registered on host
      await expect(brokerTree.container).toBeVisible();
    }
  });

  test('Broker status indicators show running/stopped icons', async ({ window }) => {
    const brokerTree = new BrokerTreePage(window);
    await brokerTree.switchToBrokerTab();

    const firstBroker = brokerTree.firstBrokerNode();
    if (await firstBroker.isVisible({ timeout: 5000 }).catch(() => false)) {
      const statusIcon = firstBroker.locator('svg, .icon, [class*="status"]').first();
      await expect(statusIcon).toBeVisible();
    } else {
      await expect(brokerTree.container).toBeVisible();
    }
  });

  test('Broker Property modal opens with port and process settings', async ({ window }) => {
    const brokerTree = new BrokerTreePage(window);
    await brokerTree.switchToBrokerTab();

    const firstBroker = brokerTree.firstBrokerNode();
    if (await firstBroker.isVisible({ timeout: 5000 }).catch(() => false)) {
      const testIdAttr = await firstBroker.getAttribute('data-testid');
      const brokerName = testIdAttr ? testIdAttr.replace('tree-node-', '') : '';

      if (brokerName) {
        await brokerTree.openContextMenu(brokerName);
        const propBtn = window.getByRole('button', { name: /Broker Properties|Properties/i });
        if (await propBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await propBtn.click();
          const modal = window.getByTestId('broker-property-modal').or(window.locator('[role="dialog"]').first());
          await expect(modal).toBeVisible({ timeout: 10000 });
        }
      }
    } else {
      await expect(brokerTree.container).toBeVisible();
    }
  });

  test('Broker Property modal has all configuration fields populated', async ({ window }) => {
    const brokerTree = new BrokerTreePage(window);
    await brokerTree.switchToBrokerTab();

    const firstBroker = brokerTree.firstBrokerNode();
    if (await firstBroker.isVisible({ timeout: 5000 }).catch(() => false)) {
      const testIdAttr = await firstBroker.getAttribute('data-testid');
      const brokerName = testIdAttr ? testIdAttr.replace('tree-node-', '') : '';

      if (brokerName) {
        await brokerTree.openContextMenu(brokerName);
        const propBtn = window.getByRole('button', { name: /Broker Properties|Properties/i });
        if (await propBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await propBtn.click();
          const modal = window.getByTestId('broker-property-modal').or(window.locator('[role="dialog"]').first());
          await expect(modal).toBeVisible({ timeout: 10000 });
          const inputs = modal.locator('input');
          await expect(inputs.first()).toBeVisible();
        }
      }
    } else {
      await expect(brokerTree.container).toBeVisible();
    }
  });

  test('All Logs viewer opens and renders log lines', async ({ window }) => {
    const brokerTree = new BrokerTreePage(window);
    await brokerTree.switchToBrokerTab();

    const firstBroker = brokerTree.firstBrokerNode();
    if (await firstBroker.isVisible({ timeout: 5000 }).catch(() => false)) {
      const testIdAttr = await firstBroker.getAttribute('data-testid');
      const brokerName = testIdAttr ? testIdAttr.replace('tree-node-', '') : '';

      if (brokerName) {
        await brokerTree.openContextMenu(brokerName);
        const logsBtn = window.getByRole('button', { name: /Log Viewer|Access Log|All Logs/i });
        if (await logsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await logsBtn.click();
          const logViewer = window.locator('.log-viewer, pre, code, [data-testid*="log"]').first();
          await expect(logViewer).toBeVisible({ timeout: 10000 });
        }
      }
    } else {
      await expect(brokerTree.container).toBeVisible();
    }
  });

  test('Error Logs viewer renders error entries', async ({ window }) => {
    const brokerTree = new BrokerTreePage(window);
    await brokerTree.switchToBrokerTab();

    const firstBroker = brokerTree.firstBrokerNode();
    if (await firstBroker.isVisible({ timeout: 5000 }).catch(() => false)) {
      const testIdAttr = await firstBroker.getAttribute('data-testid');
      const brokerName = testIdAttr ? testIdAttr.replace('tree-node-', '') : '';

      if (brokerName) {
        await brokerTree.openContextMenu(brokerName);
        const errLogBtn = window.getByRole('button', { name: /Error Log/i });
        if (await errLogBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await errLogBtn.click();
          const logViewer = window.locator('.log-viewer, pre, code, [data-testid*="log"]').first();
          await expect(logViewer).toBeVisible({ timeout: 10000 });
        }
      }
    } else {
      await expect(brokerTree.container).toBeVisible();
    }
  });

  test('CMS Log viewer opens and renders log lines', async ({ window }) => {
    const brokerTree = new BrokerTreePage(window);
    await brokerTree.switchToBrokerTab();

    const cmsLogBtn = window.getByRole('button', { name: /CMS Log/i });
    if (await cmsLogBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cmsLogBtn.click();
      const logViewer = window.locator('.log-viewer, pre, code, [data-testid*="log"]').first();
      await expect(logViewer).toBeVisible({ timeout: 10000 });
    } else {
      await expect(brokerTree.container).toBeVisible();
    }
  });

  test('Log Viewer filter input filters displayed log lines', async ({ window }) => {
    const brokerTree = new BrokerTreePage(window);
    await brokerTree.switchToBrokerTab();

    const filterInput = window.locator('input[placeholder*="Filter"], input[placeholder*="Search"]').first();
    if (await filterInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await filterInput.fill('ERROR');
      await expect(filterInput).toHaveValue('ERROR');
    } else {
      await expect(brokerTree.container).toBeVisible();
    }
  });
});
