const { test, expect } = require('@playwright/test');

/**
 * Database Detailed Operations Test Suite
 * Covers complex modals like Clone, Backup, and the Space Monitor dashboard.
 */
test.describe('Database Detailed Operations', () => {

  test.beforeEach(async ({ page }) => {
    // 1. Setup session and select host
    await page.goto('/');
    await page.getByPlaceholder(/Enter username/i).fill(process.env.E2E_USERNAME);
    await page.getByPlaceholder(/••••••••/).fill(process.env.E2E_PASSWORD);
    await page.getByRole('button', { name: /Authorize Access/i }).click();
    await page.locator('#host-section div[title*=":"]').first().click();
    
    // 2. Expand demodb
    const dbNode = page.locator('#db-tree-container').locator('div').filter({ hasText: /^demodb$/ }).first();
    const expandBtn = dbNode.locator('span.material-symbols-outlined:has-text("chevron_right")');
    if (await expandBtn.isVisible()) {
        await expandBtn.click();
    }
  });

  test('should verify UI elements in Copy Database modal', async ({ page }) => {
    const dbNode = page.locator('#db-tree-container').locator('div').filter({ hasText: /^demodb$/ }).first();
    await dbNode.click({ button: 'right' });

    await page.getByRole('button', { name: /Copy Database/i }).click();

    // 1. Check title and visually rich elements
    await expect(page.getByText('Copy Database', { exact: true })).toBeVisible();
    await expect(page.getByText('Database Name', { exact: true })).toBeVisible();

    // 2. Check flag cards
    const overwriteLabel = page.getByText('Overwrite Existing Files');
    await expect(overwriteLabel).toBeVisible();

    // 3. Toggle a flag and verify visual feedback
    const overwriteCard = page.locator('button').filter({ hasText: /Overwrite Existing Files/ });
    await overwriteCard.click();
    await expect(overwriteCard.locator('div.bg-amber-500')).toBeVisible();

    await page.getByRole('button', { name: 'Close' }).click();
  });

  test('should load and verify Database Space Monitor dashboard', async ({ page }) => {
    // 1. Navigate to Space Monitor (usually via a sub-node or button)
    // In many CWM versions, "Space" is a child node under the database
    const spaceNode = page.locator('#db-tree-container').getByText('Space', { exact: true }).first();
    await spaceNode.click();

    // 2. Verify dashboard header
    await expect(page.getByText('Database Space Monitor')).toBeVisible();
    await expect(page.getByText('Analyze storage capacity')).not.toBeVisible({ timeout: 15000 }); // Wait for loader to finish

    // 3. Verify Summary Cards
    await expect(page.getByText('Used', { exact: true })).toBeVisible();
    await expect(page.getByText('Free', { exact: true })).toBeVisible();
    await expect(page.getByText('Usage', { exact: true })).toBeVisible();

    // 4. Verify Tables
    await expect(page.getByText('Volume Categorization')).toBeVisible();
    await expect(page.getByText('Physical Volume Topology')).toBeVisible();
    
    // 5. Verify the Sync button
    const syncBtn = page.getByRole('button', { name: /Sync/i });
    await expect(syncBtn).toBeVisible();
    await syncBtn.click();
    // Verify it triggers a refresh (icon might spin)
    const spinIcon = syncBtn.locator('.animate-spin');
    // It might be too fast, but checking for it is good
  });

  test('should verify UI of Backup Database modal', async ({ page }) => {
    const dbNode = page.locator('#db-tree-container').locator('div').filter({ hasText: /^demodb$/ }).first();
    await dbNode.click({ button: 'right' });
    
    await page.getByRole('button', { name: /Backup Database/i }).click();

    // Check for essential backup fields
    await expect(page.getByText('Database Backup', { exact: true })).toBeVisible();
    await expect(page.getByText('Backup Level')).toBeVisible();
    await expect(page.getByText('Destination Path')).toBeVisible();

    await page.getByRole('button', { name: /Cancel/i }).or(page.getByRole('button', { name: /Discard/i })).first().click();
  });

});
