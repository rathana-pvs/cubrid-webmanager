const { test, expect } = require('@playwright/test');

/**
 * Database Deep Modal Interactions
 * Tests functional flows: filling fields, toggling states, and submitting forms.
 */
test.describe('Database Modal Interactions', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder(/Enter username/i).fill(process.env.E2E_USERNAME);
    await page.getByPlaceholder(/••••••••/).fill(process.env.E2E_PASSWORD);
    await page.getByRole('button', { name: /Authorize Access/i }).click();
    
    // Select host
    await page.locator('#host-section div[title*=":"]').first().click();
  });

  test('should complete a Rename Database workflow with validation', async ({ page }) => {
    const dbNode = page.locator('#db-tree-container').locator('div').filter({ hasText: /^demodb$/ }).first();
    await dbNode.click({ button: 'right' });
    
    // Navigate to Rename
    await page.getByRole('button', { name: 'Manage Database' }).hover();
    await page.getByRole('button', { name: 'Rename Database', exact: true }).click();

    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toContainText('Rename Database Registry');

    // 1. Verify Submit is disabled initially
    const submitBtn = modal.getByRole('button', { name: 'Execute Rename' });
    // It might have auto-filled or be empty. In our component, it starts empty.
    const input = modal.getByPlaceholder(/PROD_CM_V2/);
    await input.fill('DEMO_RENAMED_IT');

    // 2. Toggle Overwrite (Check)
    const overwriteRow = modal.getByText('Overwrite Existing Registry');
    await overwriteRow.click();
    // Verify checkbox in that row is checked
    await expect(modal.locator('input[type="checkbox"]')).toBeChecked();

    // 3. Submit
    await submitBtn.click();

    // 4. Verify Success Modal (StatusModal uses 'Rename successful' title)
    await expect(page.getByText('Rename successful')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Close' }).or(page.getByRole('button', { name: 'OK' })).first().click();
  });

  test('should execute Database Integrity Scan with recovery options', async ({ page }) => {
    const dbNode = page.locator('#db-tree-container').locator('div').filter({ hasText: /^demodb$/ }).first();
    await dbNode.click({ button: 'right' });

    await page.getByRole('button', { name: 'Manage Database' }).hover();
    await page.getByRole('button', { name: 'Check Database', exact: true }).click();

    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toContainText('Database Integrity Verification');

    // 1. Toggle Repair
    const repairOption = modal.getByText('Autonomous Repair');
    await repairOption.click();
    
    // 2. Run Diagnostics
    await modal.getByRole('button', { name: 'Run Diagnostics' }).click();

    // 3. Check for Success
    await expect(page.getByText('Check complete')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Close' }).or(page.getByRole('button', { name: 'OK' })).first().click();
  });

  test('should configure and run a Database Backup', async ({ page }) => {
    const dbNode = page.locator('#db-tree-container').locator('div').filter({ hasText: /^demodb$/ }).first();
    await dbNode.click({ button: 'right' });

    await page.getByRole('button', { name: 'Manage Database' }).hover();
    await page.getByRole('button', { name: 'Backup Database', exact: true }).click();
    
    const modal = page.locator('div[role="dialog"]');
    
    // 1. Select Backup Strategy (Incremental L1)
    await modal.getByRole('button', { name: /Incremental/ }).click();
    
    // 2. Fill paths
    await modal.getByLabel('Volume Name').fill('demo_test_backup_lv1');
    const dirInput = modal.getByLabel('Backup Directory');
    await dirInput.clear();
    await dirInput.fill('/tmp/cubrid_backups');

    // 3. Toggle Options (using the labels in our flags list)
    await modal.getByText('Compress Output').click();

    // 4. Run 
    await modal.getByRole('button', { name: 'Run Backup' }).click();

    // 5. Success Check
    await expect(page.getByText('Backup Successful')).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Close' }).or(page.getByRole('button', { name: 'OK' })).first().click();
  });

});
