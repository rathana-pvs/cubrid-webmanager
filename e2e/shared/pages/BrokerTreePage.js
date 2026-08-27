const { expect } = require('@playwright/test');

/**
 * Page Object for the broker tree in the sidebar (see BrokerTree.jsx).
 *
 * The top-level broker node and individual log-file leaves both carry a
 * stable `id` (broker.name / log.path), so `tree-node-{id}` works for both —
 * log-file testids are full filesystem paths, distinguishable from broker
 * names by containing a "/". The "SQL Log" folder itself has no `id` (it's
 * not a real entity, just a grouping node), so it's still reached by label.
 */
class BrokerTreePage {
  constructor(page) {
    this.page = page;
    this.container = page.locator('#broker-tree-container');
  }

  /** The sidebar's Database/Broker/Log tree-tab switcher (TreeTabHeader.jsx) defaults to Database. */
  async switchToBrokerTab() {
    await this.page.getByTestId('tree-tab-broker').click();
    await expect(this.container).toBeVisible();
  }

  brokerNode(brokerName) {
    return this.container.getByTestId(`tree-node-${brokerName}`);
  }

  /** First broker row in the tree, regardless of name — useful when no fixed broker name is assumed. */
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

  // Context menus only close on a mousedown outside `.context-menu-container`
  // (Sidebar.jsx's handleOutsideAction) — Escape is a no-op. A leftover menu
  // can overlap and block the next right-click, retrying forever until the
  // test times out looking like a browser crash. Dismiss defensively first.
  async openContextMenu(brokerName) {
    await this.page.mouse.click(2, 2).catch(() => undefined);
    const broker = this.brokerNode(brokerName);
    await expect(broker).toBeVisible({ timeout: 10000 });
    await broker.locator('> summary').click({ button: 'right' });
  }

  /** Brokers are <details> — SQL Log/children stay hidden until the broker itself is expanded. */
  async expandBroker(brokerName) {
    const broker = this.brokerNode(brokerName);
    await expect(broker).toBeVisible({ timeout: 10000 });
    const isOpen = await broker.evaluate((el) => el.open);
    if (!isOpen) {
      await broker.locator('> summary').click();
    }
  }

  async expandSqlLogFolder(brokerName) {
    await this.expandBroker(brokerName);
    const broker = this.brokerNode(brokerName);
    const sqlLogSummary = broker.getByText(/SQL Log|SQL 로그/i).first();
    await expect(sqlLogSummary).toBeVisible({ timeout: 10000 });
    const sqlLogDetails = sqlLogSummary.locator('..');
    const isOpen = await sqlLogDetails.evaluate((el) => el.tagName === 'DETAILS' ? el.open : false).catch(() => false);
    if (!isOpen) {
      await sqlLogSummary.click();
    }
  }

  async openSqlLogContextMenu(brokerName) {
    await this.page.mouse.click(2, 2).catch(() => undefined);
    await this.expandBroker(brokerName);
    const broker = this.brokerNode(brokerName);
    const sqlLogSummary = broker.getByText(/SQL Log|SQL 로그/i).first();
    await expect(sqlLogSummary).toBeVisible({ timeout: 10000 });
    await sqlLogSummary.click({ button: 'right' });
  }

  /** First log-file leaf under a broker's (already-expanded) SQL Log folder. */
  firstLogFileNode(brokerName) {
    return this.brokerNode(brokerName).locator('[data-testid*="/"]').first();
  }
}

module.exports = { BrokerTreePage };
