const { test, expect } = require('@playwright/test');

/**
 * Navigation & Resource Tree Test Suite
 * Verifies that hosts can be expanded and database resources are correctly browsed.
 */
test.describe('Navigation Tree', () => {
  
  test.beforeEach(async ({ page }) => {
    // 1. Login required for all navigation tests
    await page.goto('/');
    await page.getByPlaceholder(/Enter username/i).fill(process.env.E2E_USERNAME);
    await page.getByPlaceholder(/••••••••/).fill(process.env.E2E_PASSWORD);
    await page.getByRole('button', { name: /Authorize Access/i }).click();

    // 2. Wait for landing on dashboard
    await expect(page.getByTitle(/Logout/i)).toBeVisible();
  });

  test('should show host list and select a host', async ({ page }) => {
    // Check if the "Server List" section is visible using a more specific locator to avoid duplicates
    const serverHeader = page.getByText('Server List', { exact: true });
    await expect(serverHeader).toBeVisible();

    // Look for any host item
    const hostList = page.locator('#host-section');
    await expect(hostList).toBeVisible();

    // Check if we have at least one host or the "Add your first host" CTA
    const hosts = hostList.locator('div[title*=":"]');
    const addHostBtn = page.getByRole('button', { name: /Add your first host/i });

    if (await hosts.count() > 0) {
      // Select the first host
      const firstHost = hosts.first();
      await firstHost.click();

      // Verify resource tree updates
      await expect(page.locator('#tree-section-container')).toBeVisible();
      await expect(page.getByText('Resources', { exact: true })).toBeVisible();
    } else {
      await expect(addHostBtn).toBeVisible();
    }
  });

  test('should expand database and browse folders', async ({ page }) => {
    const hosts = page.locator('#host-section div[title*=":"]');
    if (await hosts.count() > 0) {
      await hosts.first().click();
      
      const dbTree = page.locator('#db-tree-container');
      await expect(dbTree).toBeVisible();

      // Find standard DB node
      const dbNode = dbTree.locator('div').filter({ hasText: /^demodb$/ }).first();
      if (await dbNode.isVisible()) {
        await dbNode.click(); 
        
        const expandBtn = dbNode.locator('span.material-symbols-outlined:has-text("chevron_right")');
        if (await expandBtn.isVisible()) {
          await expandBtn.click();
          
          await expect(page.getByText('Users', { exact: true })).toBeVisible();
          await expect(page.getByText('Job automation', { exact: true })).toBeVisible();
          await expect(page.getByText('Space', { exact: true })).toBeVisible();
        }
      }
    }
  });

  test('should switch between DB, Broker, and Log tabs', async ({ page }) => {
    const hosts = page.locator('#host-section div[title*=":"]');
    if (await hosts.count() > 0) {
      await hosts.first().click();

      // Scope to the resource tree container to avoid global conflicts (like "Logout")
      const treeSection = page.locator('#tree-section-container');
      
      const dbTab = treeSection.getByRole('button', { name: /Database/i });
      const brokerTab = treeSection.getByRole('button', { name: /Broker/i });
      const logTab = treeSection.getByRole('button', { name: /Log/i });

      // 1. Check Broker Tab
      await brokerTab.click();
      // Look for the header label "Brokers" exactly within the tree area
      await expect(page.locator('#db-tree-container').getByText('Brokers', { exact: true })).toBeVisible();
      
      // 2. Check Log Tab
      await logTab.click();
      await expect(page.locator('#db-tree-container').getByText('Logs', { exact: true })).toBeVisible();

      // 3. Back to DB Tab
      await dbTab.click();
      await expect(page.locator('#db-tree-container').getByText('Databases', { exact: true })).toBeVisible();
    }
  });

});
