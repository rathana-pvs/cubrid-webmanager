const { expect } = require('@playwright/test');

class BrokerTreePage {
  constructor(window) {
    this.window = window;
    this.container = window.locator('#broker-tree-container');
    this.brokerTabBtn = window.getByTestId('tree-tab-broker').or(window.locator('[data-testid*="broker"]').first());
  }

  async switchToBrokerTab() {
    if (await this.brokerTabBtn.isVisible().catch(() => false)) {
      await this.brokerTabBtn.click();
    }
    await expect(this.container).toBeVisible({ timeout: 15000 });
  }

  brokerNode(brokerName) {
    return this.container.getByTestId(`tree-node-${brokerName}`);
  }

  firstBrokerNode() {
    return this.container.locator('[data-testid^="tree-node-"]').first();
  }

  async selectBroker(brokerName) {
    const broker = this.brokerNode(brokerName);
    await expect(broker).toBeVisible({ timeout: 10000 });
    await broker.locator('> summary').click();
  }

  async activateBroker(brokerName) {
    const broker = this.brokerNode(brokerName);
    await expect(broker).toBeVisible({ timeout: 10000 });
    await broker.locator('> summary').dblclick();
  }

  async openContextMenu(brokerName) {
    await this.window.mouse.click(2, 2).catch(() => {});
    const broker = this.brokerNode(brokerName);
    await expect(broker).toBeVisible({ timeout: 10000 });
    await broker.locator('> summary').click({ button: 'right' });
  }

  async expandBroker(brokerName) {
    const broker = this.brokerNode(brokerName);
    await expect(broker).toBeVisible({ timeout: 10000 });
    const isOpen = await broker.evaluate((el) => el.open).catch(() => false);
    if (!isOpen) {
      await broker.locator('> summary').click();
    }
  }
}

module.exports = { BrokerTreePage };
