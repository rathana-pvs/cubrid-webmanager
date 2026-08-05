const { expect } = require('@playwright/test');
const { dismissJobResultModal } = require('../helpers/dismiss');

class HostTreePage {
  constructor(window) {
    this.window = window;
    this.hostSection = window.locator('#host-section');
    this.addHostToolbarBtn = window.getByTestId('add-host-toolbar-btn');
    this.newGroupToolbarBtn = window.getByTestId('new-group-toolbar-btn');
  }

  groupRow(groupId) {
    return this.window.getByTestId(`tree-node-${groupId}`);
  }

  hostRow(hostUid) {
    return this.window.getByTestId(`host-item-${hostUid}`);
  }

  hostRowByConnection(address, port) {
    return this.hostSection.locator(`[title="${address}:${port}"]`);
  }

  firstHostNode() {
    return this.hostSection.locator('[data-testid^="host-item-"], [data-testid^="tree-node-"], [title*=":"]').first();
  }

  async selectHost(hostUid) {
    const host = this.hostRow(hostUid);
    await expect(host).toBeVisible({ timeout: 10000 });
    await host.click();
  }

  async activateHost(hostUid) {
    await dismissJobResultModal(this.window);
    const host = this.hostRow(hostUid);
    await expect(host).toBeVisible({ timeout: 10000 });
    await host.dblclick();

    await expect(this.window.locator('#db-tree-container')).toHaveAttribute('data-authorized', 'true', { timeout: 15000 });
  }

  async openHostContextMenu(hostUid) {
    await dismissJobResultModal(this.window);
    await this.window.mouse.click(2, 2).catch(() => {});
    const host = this.hostRow(hostUid);
    await expect(host).toBeVisible({ timeout: 10000 });
    await host.click({ button: 'right' });
  }
}

module.exports = { HostTreePage };
