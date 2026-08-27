const { expect } = require('@playwright/test');
const { dismissJobResultModal } = require('./dismissJobResultModal');

// The app's login screen (and everything downstream of it) defaults to
// Korean, with an EN/KO LanguageToggle the user can still switch. These
// specs were ported from an English-only fixture, so "Manage Database"
// submenu item labels (Rename/Copy/Restore/Delete/Load/... Database) must be
// matched in both languages. Source of truth: cmLabels.js / cmLabels.ko.js
// (apps/web-manager/src/constants) `manageDatabaseMenu` key, verbatim.
const MANAGE_DATABASE_MENU_KO = {
  'Unload Database': '데이터베이스 언로드',
  'Load Database': '데이터베이스 로드',
  'Create Database': '데이터베이스 생성',
  'Check Database': '데이터베이스 검사',
  'Compact Database': '데이터베이스 공간 정리',
  'Optimize Database': '데이터베이스 최적화',
  'Copy Database': '데이터베이스 복사',
  'Rename Database': '데이터베이스 이름 변경',
  'Restore Database': '데이터베이스 복구',
  'Backup Database': '데이터베이스 백업',
  'Delete Database': '데이터베이스 삭제',
};

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
    const tab = this.page.getByTestId(`tab-db:${hostUid}:${dbname}`);
    // isVisible() is an immediate snapshot, not a wait. Saved-profile login
    // also shares the CMS queue with monitoring reads, so allow the app's
    // 60s API deadline before declaring that neither login outcome appeared.
    await expect(tab.or(loginModal).first(),
      `Database "${dbname}" activation did not finish: waiting for saved-profile login or the credential dialog (check CMS queue timings).`,
    ).toBeVisible({ timeout: 65000 });
    if (await loginModal.isVisible()) {
      await loginModal.locator('input').nth(1).fill(username);
      if (password) await loginModal.locator('input[type="password"]').fill(password);
      const [response] = await Promise.all([
        this.page.waitForResponse(response => response.request().method() === 'POST'
          && response.url().endsWith(`/${hostUid}/database/users/login/${encodeURIComponent(dbname)}`),
        { timeout: 65000 }),
        this.page.getByTestId('login-database-submit-btn').click(),
      ]);
      expect(response.ok(), `Database "${dbname}" login returned HTTP ${response.status()}`).toBe(true);
      // The form disappears as soon as loading begins. Wait for the successful
      // login dialog to auto-close, not merely for the form to disappear.
      await expect(this.page.getByRole('dialog').filter({
        has: this.page.getByRole('heading', { name: /^(Login Database|데이터베이스 로그인)$/i }),
      }))
        .not.toBeVisible({ timeout: 10000 });
      await this.activateDatabase(dbname);
    }

    await expect(tab).toBeVisible({ timeout: 15000 });
  }

  async openContextMenu(dbname, { timeout = 30000 } = {}) {
    await dismissJobResultModal(this.page);
    const overlay = this.page.getByTestId('loading-overlay');
    if (await overlay.isVisible({ timeout: 100 }).catch(() => false)) {
      await overlay.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => undefined);
    }
    await this.page.keyboard.press('Escape').catch(() => undefined);
    await this.page.mouse.click(2, 2).catch(() => undefined);

    const db = this.dbNode(dbname);
    await expect(db).toBeVisible({ timeout: 15000 });
    await db.locator('> summary').click({ button: 'right', timeout });
  }

  /** Waits until a database context action reflects the completed CMS state. */
  async waitForContextAction(dbname, actionName, { timeout = 60000 } = {}) {
    const deadline = Date.now() + timeout;
    let lastError;

    // Allow in-flight state/overlay to trigger and resolve
    await this.page.waitForTimeout(500);
    const overlay = this.page.getByTestId('loading-overlay');
    if (await overlay.isVisible({ timeout: 200 }).catch(() => false)) {
      await overlay.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => undefined);
    }

    while (Date.now() < deadline) {
      try {
        await dismissJobResultModal(this.page);
        await this.openContextMenu(dbname, { timeout: 8000 });
        const action = this.page.getByRole('button', { name: actionName });
        if (await action.isVisible().catch(() => false)) {
          await this.page.keyboard.press('Escape').catch(() => undefined);
          await this.page.mouse.click(2, 2).catch(() => undefined);
          return;
        }
        const refreshItem = this.page.getByRole('button', { name: /Refresh|새로고침/i });
        if (await refreshItem.isVisible().catch(() => false)) {
          await refreshItem.click().catch(() => undefined);
        } else {
          await this.page.keyboard.press('Escape').catch(() => undefined);
          await this.page.mouse.click(2, 2).catch(() => undefined);
        }
      } catch (error) {
        lastError = error;
        await this.page.keyboard.press('Escape').catch(() => undefined);
        await this.page.mouse.click(2, 2).catch(() => undefined);
      }

      await this.page.waitForTimeout(2000);
    }

    throw lastError || new Error(`Database action did not become available: ${String(actionName)}`);
  }

  async ensureDatabaseStarted(dbname) {
    await this.openContextMenu(dbname);
    const startBtn = this.page.getByRole('button', { name: /Start Database|데이터베이스 시작/i });
    if (await startBtn.isVisible().catch(() => false)) {
      await startBtn.click();
      await this.page.waitForTimeout(1000);
      const overlay = this.page.getByTestId('loading-overlay');
      if (await overlay.isVisible({ timeout: 200 }).catch(() => false)) {
        await overlay.waitFor({ state: 'hidden', timeout: 45000 }).catch(() => undefined);
      }
      await this.waitForContextAction(dbname, /Stop Database|데이터베이스 정지|데이터베이스 중지/i);
    } else {
      await this.page.mouse.click(2, 2).catch(() => undefined);
    }
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
    // The UI defaults to Korean, so also match the localized label
    // (cmLabels.ko.js's manageDatabaseMenu) when one is known.
    const koName = MANAGE_DATABASE_MENU_KO[itemName];
    const namePattern = koName
      ? new RegExp(`(?:^|\\s)(?:${itemName}|${koName})`, 'i')
      : new RegExp(`(?:^|\\s)${itemName}`, 'i');
    const item = this.page.getByRole('button', { name: namePattern });
    let lastErr;
    for (let i = 0; i < 5; i++) {
      try {
        await this.openContextMenu(dbname, { timeout: 5000 });
        await this.page.getByRole('button', { name: /Manage Database|데이터베이스 관리/i }).hover();
        await item.waitFor({ state: 'visible', timeout: 5000 });
        await item.click({ timeout: 5000 });
        return;
      } catch (err) {
        lastErr = err;
        // This app's context menus only close on a mousedown outside
        // `.context-menu-container` (see Sidebar.jsx's handleOutsideAction) —
        // Escape is a no-op here. A leftover open menu physically overlaps
        // and intercepts pointer events for the next attempt's right-click,
        // which otherwise retries forever and eventually times out looking
        // like a browser crash. Click a guaranteed-blank corner to dismiss it.
        await this.page.mouse.click(2, 2).catch(() => undefined);
      }
    }
    throw lastErr;
  }
}

module.exports = { DatabaseTreePage };
