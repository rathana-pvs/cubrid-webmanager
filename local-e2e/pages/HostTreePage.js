const { expect } = require('@playwright/test');
const { dismissJobResultModal } = require('./dismissJobResultModal');

/**
 * Page Object for the host/group tree in the sidebar (Server List panel).
 *
 * Current click semantics (see ServerListItem.jsx / HostGroupTree.jsx):
 * - Group: single click both selects AND toggles expand/collapse.
 * - Host: single click only selects (setSelectedHost). Double-click logs in
 *   (if needed) and opens the dashboard. Never assume a single click on a
 *   host activates it — that behavior was removed.
 *
 * Selectors: group/host rows carry data-testid via TreeNode
 * (`tree-node-{groupId}`) and ServerListItem (`host-item-{hostUid}`).
 */
class HostTreePage {
  constructor(page) {
    this.page = page;
    this.hostSection = page.locator('#host-section');
  }

  groupRow(groupId) {
    return this.page.getByTestId(`tree-node-${groupId}`);
  }

  hostRow(hostUid) {
    return this.page.getByTestId(`host-item-${hostUid}`);
  }

  /** Finds a host row by its address:port title (used when the uid isn't known upfront). */
  hostRowByConnection(address, port) {
    return this.hostSection.locator(`[title="${address}:${port}"]`);
  }

  /** Reads the host's uid out of its own data-testid (host-item-{uid}). */
  async getUidByConnection(address, port) {
    const testId = await this.hostRowByConnection(address, port).getAttribute('data-testid');
    return testId.replace('host-item-', '');
  }

  async expandGroup(groupId) {
    const group = this.groupRow(groupId);
    await expect(group).toBeVisible({ timeout: 10000 });
    const isOpen = await group.evaluate((el) => el.open).catch(() => true);
    if (!isOpen) {
      await group.locator('> summary').click();
    }
  }

  /** Expands every group <details> currently rendered in the host section. */
  async expandAllGroups() {
    await expect(this.hostSection).toBeVisible({ timeout: 10000 });
    const groups = this.hostSection.locator('details');
    await groups.first().waitFor({ state: 'attached', timeout: 15000 }).catch(() => {});
    const count = await groups.count();
    for (let i = 0; i < count; i++) {
      const isOpen = await groups.nth(i).evaluate((el) => el.open);
      if (!isOpen) {
        await groups.nth(i).locator('> summary').click();
      }
    }
  }

  /** Selects a host (single click) without logging in / opening its dashboard. */
  async selectHost(hostUid) {
    const host = this.hostRow(hostUid);
    await expect(host).toBeVisible({ timeout: 10000 });
    await host.click();
  }

  /**
   * Double-clicks a host: logs in if needed, then opens its dashboard tab.
   * The real CMS host can transiently refuse a login (Edit Host modal's
   * generic "Failed to login" banner, not a password error) — e.g. right
   * after another spec submitted a real background job against it. Retry a
   * few times via "Test Connection & Save" (same stored credential).
   *
   * NOTE: this does NOT fully absorb database_rename_copy.spec.js's copy
   * job — that job can leave the real host unable to accept a new login for
   * a couple of minutes (see that file's comment), well beyond what a test
   * suite should block on. database_restore.spec.js and
   * database_start_stop_delete.spec.js (the two specs alphabetically right
   * after it) may still occasionally flake for this reason; that's a real
   * CMS-host limitation, not a bug in this retry loop.
   */
  async activateHost(hostUid) {
    await dismissJobResultModal(this.page);
    const host = this.hostRow(hostUid);
    await expect(host).toBeVisible({ timeout: 10000 });
    await host.dblclick();

    const editModal = this.page.getByTestId('edit-host-modal');
    for (let attempt = 0; attempt < 5; attempt++) {
      const authorized = await Promise.race([
        this.page.locator('#db-tree-container[data-authorized="true"]').waitFor({ timeout: 8000 }).then(() => true).catch(() => false),
        editModal.waitFor({ state: 'visible', timeout: 8000 }).then(() => false).catch(() => false),
      ]);
      if (authorized) return;
      if (!(await editModal.isVisible().catch(() => false))) break;
      await this.page.waitForTimeout(2000);
      await this.page.getByTestId('edit-host-connect-save-btn').click().catch(() => {});
    }

    await expect(this.page.locator('#db-tree-container')).toHaveAttribute('data-authorized', 'true', { timeout: 15000 });
  }

  // Context menus (Sidebar.jsx's ContextMenuWrapper) only close on a mousedown
  // outside `.context-menu-container` — Escape is a no-op. A leftover menu
  // from a previous action can physically overlap and block the next
  // right-click ("intercepts pointer events"), retrying forever until the
  // test times out looking like a browser crash. Dismiss defensively first.
  async _dismissAnyOpenMenu() {
    await dismissJobResultModal(this.page);
    await this.page.mouse.click(2, 2).catch(() => {});
  }

  async openHostContextMenu(hostUid) {
    await this._dismissAnyOpenMenu();
    const host = this.hostRow(hostUid);
    await expect(host).toBeVisible({ timeout: 10000 });
    await host.click({ button: 'right' });
  }

  async openGroupContextMenu(groupId) {
    await this._dismissAnyOpenMenu();
    const group = this.groupRow(groupId);
    await expect(group).toBeVisible({ timeout: 10000 });
    await group.locator('> summary').click({ button: 'right' });
  }
}

module.exports = { HostTreePage };
