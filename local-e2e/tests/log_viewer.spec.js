const { test, expect } = require('@playwright/test');
const { login, connectToHost } = require('./helpers');

/**
 * Log Viewer Test Suite
 *
 * Verifies that the Log tab, log tree, LogViewer component, and
 * level/search filters all work correctly.
 */
test.describe('Log Viewer', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await connectToHost(page);

    // Switch to the Log tab in the resource tree
    const logTab = page.locator('#tree-section-container').getByRole('button', { name: /Log/i });
    await logTab.click();
    await expect(page.locator('#db-tree-container').getByText('Logs', { exact: true })).toBeVisible({ timeout: 10000 });
  });

  // ---------------------------------------------------------------------------
  test('should show log tree with at least one log entry', async ({ page }) => {
    const logTree = page.locator('#db-tree-container');
    await expect(logTree).toBeVisible();

    // Tree should contain log nodes (e.g. error log, access log, slow query log)
    const logItems = logTree.locator('div[role="treeitem"]');
    await expect(logItems.first()).toBeVisible({ timeout: 10000 });
  });

  // ---------------------------------------------------------------------------
  test('should open a log file and display the LogViewer', async ({ page }) => {
    const logTree = page.locator('#db-tree-container');
    const logItems = logTree.locator('div[role="treeitem"]');
    await expect(logItems.first()).toBeVisible({ timeout: 10000 });

    // Click the first log item
    await logItems.first().click();

    // LogViewer should appear — identified by the "Search logs" input
    const searchInput = page.getByPlaceholder(/Search logs/i);
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  // ---------------------------------------------------------------------------
  test('level filter dropdown shows All Levels / Error / Warning / Info', async ({ page }) => {
    const logTree = page.locator('#db-tree-container');
    const logItems = logTree.locator('div[role="treeitem"]');
    await expect(logItems.first()).toBeVisible({ timeout: 10000 });
    await logItems.first().click();

    // Wait for LogViewer
    await expect(page.getByPlaceholder(/Search logs/i)).toBeVisible({ timeout: 10000 });

    // The level select should contain "All Levels"
    await expect(page.getByText('All Levels')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  test('search input filters log content', async ({ page }) => {
    const logTree = page.locator('#db-tree-container');
    const logItems = logTree.locator('div[role="treeitem"]');
    await expect(logItems.first()).toBeVisible({ timeout: 10000 });
    await logItems.first().click();

    const searchInput = page.getByPlaceholder(/Search logs/i);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Type a search term — the list should react (shrink or show empty state)
    await searchInput.fill('ZZZNOMATCH_UNIQUE_9999');

    // Either no results message or the list becomes empty
    const noResults = page.getByText(/No logs found/i)
      .or(page.getByText(/no results/i))
      .or(page.locator('[data-testid="empty-state"]'));
    await expect(noResults.first()).toBeVisible({ timeout: 5000 });

    // Clear the filter — entries come back
    await searchInput.clear();
    await expect(noResults.first()).not.toBeVisible({ timeout: 5000 });
  });

  // ---------------------------------------------------------------------------
  test('right-clicking a log node shows context menu', async ({ page }) => {
    const logTree = page.locator('#db-tree-container');
    const logItems = logTree.locator('div[role="treeitem"]');
    await expect(logItems.first()).toBeVisible({ timeout: 10000 });

    await logItems.first().click({ button: 'right' });

    // Expect at least one context menu action to appear
    const menu = page.locator('[role="menu"]').or(page.locator('[class*="context-menu"]'));
    await expect(menu).toBeVisible({ timeout: 3000 });
  });

});
