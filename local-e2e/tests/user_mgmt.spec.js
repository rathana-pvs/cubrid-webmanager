const { test, expect } = require('@playwright/test');

/**
 * Database User Management Test Suite
 * Covers viewing and adding users to an active database.
 */
test.describe('Database User Management', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder(/Enter username/i).fill(process.env.E2E_USERNAME);
    await page.getByPlaceholder(/••••••••/).fill(process.env.E2E_PASSWORD);
    await page.getByRole('button', { name: /Authorize Access/i }).click();

    // Select host
    await page.locator('#host-section div[title*=":"]').first().click();

    // Wait for Database Tree
    await expect(page.locator('#db-tree-container')).toBeVisible();
  });

  test('should view database users list', async ({ page }) => {
    // 1. Expand Database (demodb)
    const dbNode = page.locator('#db-tree-container').locator('div').filter({ hasText: /^demodb$/ }).first();
    const expandBtn = dbNode.locator('span.material-symbols-outlined:has-text("chevron_right")');
    await expandBtn.click();

    // 2. Expand Users folder
    const usersFolder = page.getByText('Users', { exact: true });
    await expect(usersFolder).toBeVisible();
    await usersFolder.click(); // This usually fetches users via API

    // 3. Verify a standard user like 'DBA' or 'PUBLIC' appears
    // Wait for the indicator 'On' or Person icon if children appear
    const dbaUser = page.locator('#db-tree-container').getByText('dba', { exact: true }).or(page.getByText('PUBLIC', { exact: true }));
    await expect(dbaUser.first()).toBeVisible({ timeout: 10000 });
  });

  test('should open Add Database User modal', async ({ page }) => {
    const dbNode = page.locator('#db-tree-container').locator('div').filter({ hasText: /^demodb$/ }).first();
    const expandBtn = dbNode.locator('span.material-symbols-outlined:has-text("chevron_right")');
    await expandBtn.click();

    // Right-click "Users" folder inside demodb
    const usersFolder = page.getByText('Users', { exact: true });
    await usersFolder.click({ button: 'right' });

    // Open Add User
    await page.getByRole('button', { name: /Add database User/i }).or(page.getByRole('button', { name: /Create User/i })).click();
    
    // Assuming modal with following fields
    await expect(page.getByText(/Create New User/i).or(page.getByText(/User name/i))).toBeVisible();
    await expect(page.getByPlaceholder(/Enter user name/i).or(page.getByText(/Name/i))).toBeVisible();
  });

});
