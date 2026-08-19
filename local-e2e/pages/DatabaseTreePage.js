const { expect } = require('@playwright/test');
const { dismissJobResultModal } = require('./dismissJobResultModal');

/**
 * Page Object for the database tree in the sidebar (see DatabaseTree.jsx).
 *
 * Sub-nodes (Users/Job automation/Backup Plan/Query Plan/Space/Log) reuse
 * static ids across every database ("Users", "Backup Plan", ...), so their
 * data-testid is NOT globally unique — always scope queries inside the
 * owning database's subtree via `dbNode(dbname)`.
 *
 * Toggling (expand) a database only lazy-loads read-only data; it never
 * logs in. Double-click activates: logs in (or opens LoginDatabaseModal if
 * no saved profile) and opens the dashboard tab.
 */
class DatabaseTreePage {
  constructor(page) {
    this.page = page;
    this.container = page.locator('#db-tree-container');
  }

  async waitForAuthorized() {
    await expect(this.container).toHaveAttribute('data-authorized', 'true', { timeout: 30000 });
  }

  dbNode(dbname) {
    return this.page.getByTestId(`tree-node-${dbname}`);
  }

  async expandDatabase(dbname) {
    const db = this.dbNode(dbname);
    await expect(db).toBeVisible({ timeout: 15000 });
    const isOpen = await db.evaluate((el) => el.open);
    if (!isOpen) {
      await db.locator('> summary').click();
    }
    return db;
  }

  async selectDatabase(dbname) {
    const db = this.dbNode(dbname);
    await expect(db).toBeVisible({ timeout: 15000 });
    await db.locator('> summary').click();
  }

  /** Double-click: logs in if needed, then opens the DB dashboard tab. */
  async activateDatabase(dbname) {
    await dismissJobResultModal(this.page);
    const db = this.dbNode(dbname);
    await expect(db).toBeVisible({ timeout: 15000 });
    await db.locator('> summary').dblclick();
  }

  /**
   * Double-click a database to open its dashboard tab, handling the
   * one-time credential prompt (see DatabaseTree.jsx's handleDbActivate):
   * with no saved login profile, the first double-click only opens
   * LoginDatabaseModal and does NOT open the dashboard tab — a second
   * double-click (now that isLoggedIn is true) is what actually opens it.
   * Ticking "Save Password" (on by default) persists the profile
   * server-side, so subsequent runs skip the modal entirely.
   */
  async openDashboardTab(dbname, hostUid, { username = 'dba', password = '' } = {}) {
    await this.activateDatabase(dbname);

    const loginModal = this.page.getByTestId('login-database-modal');
    if (await loginModal.isVisible({ timeout: 3000 }).catch(() => false)) {
      await loginModal.locator('input').nth(1).fill(username);
      if (password) await loginModal.locator('input[type="password"]').fill(password);
      await this.page.getByTestId('login-database-submit-btn').click();
      await expect(loginModal).not.toBeVisible({ timeout: 15000 });
      await this.activateDatabase(dbname);
    }

    await expect(this.page.getByTestId(`tab-db:${hostUid}:${dbname}`)).toBeVisible({ timeout: 15000 });
  }

  async openContextMenu(dbname) {
    // Defensively dismiss any menu left open from a previous action first.
    // This app's context menus (Sidebar.jsx's handleOutsideAction) only close
    // on a mousedown outside `.context-menu-container` — Escape is a no-op.
    // A leftover menu can physically overlap the tree row and make Playwright
    // refuse the right-click below ("intercepts pointer events"), retrying
    // forever until the whole test times out looking like a browser crash.
    await dismissJobResultModal(this.page);
    await this.page.mouse.click(2, 2).catch(() => {});

    const db = this.dbNode(dbname);
    await expect(db).toBeVisible({ timeout: 15000 });
    await db.locator('> summary').click({ button: 'right' });
  }

  /** Sub-node scoped within a specific database's subtree, e.g. subNode('demodb', 'Users'). */
  subNode(dbname, subId) {
    return this.dbNode(dbname).getByTestId(`tree-node-${subId}`);
  }

  async expandSubNode(dbname, subId) {
    await this.expandDatabase(dbname);
    const node = this.subNode(dbname, subId);
    await expect(node).toBeVisible({ timeout: 10000 });
    const isOpen = await node.evaluate((el) => el.open).catch(() => false);
    if (!isOpen) {
      await node.locator('> summary').click();
    }
    return node;
  }

  /** Backup Plan / Query Plan leaf items, keyed by backupid / query_id (also scoped per-db). */
  planItem(dbname, planId) {
    return this.dbNode(dbname).getByTestId(`tree-node-${planId}`);
  }

  /**
   * Clicks an item inside the "Manage Database" hover flyout submenu
   * (Rename/Copy/Delete/Compact/Check/Optimize/Backup/Restore/Unload/Load).
   * The background monitoring poll can re-render the tree while this flyout
   * is open, detaching it mid-hover, so each retry fully reopens the
   * right-click context menu from scratch rather than re-hovering a menu
   * that may already be gone.
   */
  async clickManageDatabaseItem(dbname, itemName) {
    // Anchor to a preceding start/whitespace so "Load Database" doesn't also
    // match "Unload Database" as a substring (the icon ligature text plus
    // label makes the accessible name e.g. "download Load Database...").
    const item = this.page.getByRole('button', { name: new RegExp(`(?:^|\\s)${itemName}`, 'i') });
    let lastErr;
    for (let i = 0; i < 5; i++) {
      try {
        await this.openContextMenu(dbname);
        await this.page.getByRole('button', { name: 'Manage Database' }).hover();
        await item.waitFor({ state: 'visible', timeout: 3000 });
        await item.click({ timeout: 3000 });
        return;
      } catch (err) {
        lastErr = err;
        // This app's context menus only close on a mousedown outside
        // `.context-menu-container` (see Sidebar.jsx's handleOutsideAction) —
        // Escape is a no-op here. A leftover open menu physically overlaps
        // and intercepts pointer events for the next attempt's right-click,
        // which otherwise retries forever and eventually times out looking
        // like a browser crash. Click a guaranteed-blank corner to dismiss it.
        await this.page.mouse.click(2, 2).catch(() => {});
      }
    }
    throw lastErr;
  }
}

module.exports = { DatabaseTreePage };
