const { test, expect } = require('@playwright/test');

/**
 * Universal Database Modals Test Suite
 * Iterates through every management action to verify UI consistency and modal rendering.
 */
test.describe('Database All Modals', () => {

  test.beforeEach(async ({ page }) => {
    // 1. Authentication
    await page.goto('/');
    await page.getByPlaceholder(/Enter username/i).fill(process.env.E2E_USERNAME);
    await page.getByPlaceholder(/••••••••/).fill(process.env.E2E_PASSWORD);
    await page.getByRole('button', { name: /Authorize Access/i }).click();
    
    // 2. Setup environment (Select first host)
    const firstHost = page.locator('#host-section div[title*=":"]').first();
    await firstHost.click();
    await expect(page.locator('#db-tree-container')).toBeVisible();
  });

  const dbActions = [
    // SubMenu: Manage Database
    { label: 'Database Unload', expected: /Extract Database Data/i, subMenu: 'Manage Database' },
    { label: 'Database Load', expected: /Database Load/i, subMenu: 'Manage Database' },
    { label: 'Check Database', expected: /Check Database/i, subMenu: 'Manage Database' },
    { label: 'Compact Database', expected: /Compact Database/i, subMenu: 'Manage Database' },
    { label: 'Optimize Database', expected: /Optimize Database/i, subMenu: 'Manage Database' },
    { label: 'Copy Database', expected: /Clone Database/i, subMenu: 'Manage Database' },
    { label: 'Restore Database', expected: /Restore Database/i, subMenu: 'Manage Database' },
    { label: 'Backup Database', expected: /Database Backup/i, subMenu: 'Manage Database' },
    { label: 'Delete Database', expected: /Delete Database/i, subMenu: 'Manage Database' },
    { label: 'Rename Database', expected: /Rename Database/i, subMenu: 'Manage Database' },
    
    // SubMenu: Database Info
    { label: 'Lock Information', expected: /Lock Information/i, subMenu: 'Database Info' },
    { label: 'Transaction Info', expected: /Transaction Info/i, subMenu: 'Database Info' },
    { label: 'Param Dump', expected: /Database Info/i, subMenu: 'Database Info' },
    { label: 'Plan Dump', expected: /Plan Dump/i, subMenu: 'Database Info' },
    
    // Direct Actions
    { label: 'Properties', expected: /Database Properties/i },
  ];

  for (const action of dbActions) {
    test(`should open ${action.label} modal`, async ({ page }) => {
        const dbNode = page.locator('#db-tree-container').locator('div').filter({ hasText: /^demodb$/ }).first();
        await dbNode.click({ button: 'right' });

        if (action.subMenu) {
            const subMenuTrigger = page.getByRole('button', { name: action.subMenu });
            await subMenuTrigger.hover(); 
            // Click the actual action inside sub-menu
            await page.getByRole('button', { name: action.label, exact: true }).click();
        } else {
            await page.getByRole('button', { name: action.label, exact: true }).click();
        }

        // Verify Modal matches expectation
        const modal = page.locator('div[role="dialog"]');
        await expect(modal).toBeVisible();
        await expect(modal).toContainText(action.expected);

        // Close Modal
        const closeBtn = modal.getByRole('button', { name: /Discard|Cancel|Close/i }).first();
        await closeBtn.click();
        await expect(modal).not.toBeVisible();
    });
  }

  test('should open Job Automation related modals', async ({ page }) => {
    // Expand demodb
    const dbNode = page.locator('#db-tree-container').locator('div').filter({ hasText: /^demodb$/ }).first();
    await dbNode.locator('span.material-symbols-outlined:has-text("chevron_right")').click();

    // 1. Backup Plan Context Menu
    const backupFolder = page.getByText('Backup Plan', { exact: true });
    await backupFolder.click({ button: 'right' });
    
    await page.getByRole('button', { name: 'Add Backup Plan' }).click();
    await expect(page.getByText(/New Backup Plan/i)).toBeVisible();
    await page.getByRole('button', { name: 'Discard' }).click();

    await backupFolder.click({ button: 'right' });
    await page.getByRole('button', { name: 'Auto Backup Log' }).click();
    await expect(page.getByText(/Auto Backup Log/i)).toBeVisible();
    await page.getByRole('button', { name: 'Discard' }).click();

    // 2. Query Plan Context Menu
    const queryFolder = page.getByText('Query Plan', { exact: true });
    await queryFolder.click({ button: 'right' });
    
    await page.getByRole('button', { name: 'Add Query Plan' }).click();
    await expect(page.getByText(/New Query Plan/i).or(page.getByText(/Query Plan/i))).toBeVisible();
    await page.getByRole('button', { name: 'Discard' }).click();
  });

  test('should open Space management modals', async ({ page }) => {
    // Expand demodb
    const dbNode = page.locator('#db-tree-container').locator('div').filter({ hasText: /^demodb$/ }).first();
    // Use the chevron
    await dbNode.locator('span.material-symbols-outlined:has-text("chevron_right")').click();

    const spaceFolder = page.getByText('Space', { exact: true });
    await spaceFolder.click({ button: 'right' });

    // Add Volume
    await page.getByRole('button', { name: 'Add Volume' }).click();
    await expect(page.getByText(/Add Volume/i)).toBeVisible();
    await page.getByRole('button', { name: 'Discard' }).click();

    // Set Automation Volume
    await spaceFolder.click({ button: 'right' });
    await page.getByRole('button', { name: 'Set Automation Volume' }).click();
    await expect(page.getByText(/Automation Volume/i)).toBeVisible();
    await page.getByRole('button', { name: 'Discard' }).click();
  });

});
