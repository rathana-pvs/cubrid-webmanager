const { test, expect } = require('@playwright/test');

/**
 * Database Lifecycle Test Suite
 * Covers starting, stopping, and opening management modals.
 */
test.describe('Database Lifecycle', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder(/Enter username/i).fill(process.env.E2E_USERNAME);
    await page.getByPlaceholder(/••••••••/).fill(process.env.E2E_PASSWORD);
    await page.getByRole('button', { name: /Authorize Access/i }).click();
    
    // Select the first host to populate the tree
    const firstHost = page.locator('#host-section div[title*=":"]').first();
    await firstHost.click();
  });

  test('should toggle database start/stop status', async ({ page }) => {
    // 1. Locate a database (demodb)
    const dbNode = page.locator('#db-tree-container').locator('div').filter({ hasText: /^demodb$/ }).first();
    await expect(dbNode).toBeVisible();

    // 2. Check initial status
    const statusText = await dbNode.locator('span.inline-flex').innerText();
    const isStarted = statusText.includes('On');

    // 3. Perform Toggle
    await dbNode.click({ button: 'right' });
    const actionLabel = isStarted ? /Stop Database/i : /Start Database/i;
    await page.getByRole('button', { name: actionLabel }).click();

    // 4. Verify status changed (wait for processing)
    // We expect the opposite text to appear
    const expectedStatus = isStarted ? 'Off' : 'On';
    await expect(dbNode.locator('span.inline-flex')).toContainText(expectedStatus, { timeout: 15000 });
  });

  test('should open major database management modals', async ({ page }) => {
    const dbNode = page.locator('#db-tree-container').locator('div').filter({ hasText: /^demodb$/ }).first();
    await dbNode.click({ button: 'right' });

    // Open Properties
    await page.getByRole('button', { name: /Properties/i }).click();
    await expect(page.getByText('Database Properties')).toBeVisible();
    await page.getByRole('button', { name: /Close/i }).or(page.locator('button:has-text("Discard")')).first().click();

    // Open Create Database (from root context)
    await page.locator('#db-tree-container').click({ button: 'right' });
    await page.getByRole('button', { name: /Create Database/i }).click();
    await expect(page.getByText('New database instance')).toBeVisible();
    await page.getByRole('button', { name: /Cancel/i }).or(page.getByRole('button', { name: /Discard/i })).first().click();
  });

});
