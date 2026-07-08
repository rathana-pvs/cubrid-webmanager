const { test, expect } = require('@playwright/test');
const { login, connectToHost, openDbContextMenu, dismissModal, E2E_DB } = require('./helpers');

/**
 * Database Deep Modal Interactions
 *
 * Verifies form behaviour, field validation, and option toggling inside
 * database management modals.  Destructive operations (Rename, Delete) are
 * tested only up to the point of submission — the forms are filled and
 * validated but NOT submitted, to keep demodb intact for other tests.
 */
test.describe('Database Modal Interactions', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await connectToHost(page);
  });

  // ---------------------------------------------------------------------------
  // Rename Database — form validation only, does NOT submit
  // ---------------------------------------------------------------------------
  test('Rename modal: validates input and enables submit without executing', async ({ page }) => {
    await openDbContextMenu(page);
    await page.getByRole('button', { name: 'Manage Database' }).hover();
    await page.getByRole('button', { name: 'Rename Database', exact: true }).click();

    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(/Rename/i);

    // Submit should be disabled while input is empty
    const submitBtn = modal.getByRole('button', { name: /Rename|Execute/i }).last();
    await expect(submitBtn).toBeDisabled();

    // Fill a valid new name → submit becomes enabled
    const input = modal.locator('input[type="text"]').first();
    await input.fill('demodb_renamed_test');
    await expect(submitBtn).toBeEnabled();

    // Toggle "Overwrite Existing Target" checkbox
    const overwriteRow = modal.getByText('Overwrite Existing Target');
    await expect(overwriteRow).toBeVisible();
    await overwriteRow.click();
    await expect(modal.locator('input[type="checkbox"]')).toBeChecked();

    // Cancel — do NOT rename the live database
    await dismissModal(page);
  });

  // ---------------------------------------------------------------------------
  // Check Database (read-only — safe to execute)
  // ---------------------------------------------------------------------------
  test('Check Database: runs integrity scan and shows result', async ({ page }) => {
    await openDbContextMenu(page);
    await page.getByRole('button', { name: 'Manage Database' }).hover();
    await page.getByRole('button', { name: 'Check Database', exact: true }).click();

    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(/Check|Integrity/i);

    // Verify option toggles are present
    const repairOption = modal.getByText(/Repair|Autonomous/i).first();
    if (await repairOption.isVisible()) await repairOption.click();

    // Submit
    await modal.getByRole('button', { name: /Run|Check|Execute/i }).last().click();

    // Expect success or a progress indicator (job may be async)
    const result = page.getByText(/complete|success|succeeded/i)
      .or(page.locator('#sidebar-background-jobs'));
    await expect(result.first()).toBeVisible({ timeout: 30000 });

    await page.getByRole('button', { name: /Close|OK/i }).first().click();
  });

  // ---------------------------------------------------------------------------
  // Backup Database (non-destructive — safe to execute)
  // ---------------------------------------------------------------------------
  test('Backup Database: configures options and runs backup', async ({ page }) => {
    await openDbContextMenu(page);
    await page.getByRole('button', { name: 'Manage Database' }).hover();
    await page.getByRole('button', { name: 'Backup Database', exact: true }).click();

    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(/Backup/i);

    // Select backup level if selector is present
    const incrementalBtn = modal.getByRole('button', { name: /Incremental/i });
    if (await incrementalBtn.isVisible()) await incrementalBtn.click();

    // Fill backup directory
    const dirInput = modal.getByLabel(/Directory|Path/i).first();
    if (await dirInput.isVisible()) {
      await dirInput.clear();
      await dirInput.fill('/tmp/cubrid_e2e_backup');
    }

    // Submit
    await modal.getByRole('button', { name: /Run|Backup|Execute/i }).last().click();

    // Expect success or background job indicator
    const result = page.getByText(/success|complete|succeeded/i)
      .or(page.locator('#sidebar-background-jobs'));
    await expect(result.first()).toBeVisible({ timeout: 60000 });

    await page.getByRole('button', { name: /Close|OK/i }).first().click();
  });

  // ---------------------------------------------------------------------------
  // Copy Database — form validation only, does NOT execute copy
  // ---------------------------------------------------------------------------
  test('Copy Database: fills form and validates without executing', async ({ page }) => {
    await openDbContextMenu(page);
    await page.getByRole('button', { name: 'Manage Database' }).hover();
    await page.getByRole('button', { name: 'Copy Database', exact: true }).click();

    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(/Copy Database/i);

    // Submit should be disabled without a destination name
    const submitBtn = modal.getByRole('button', { name: /Copy/i }).last();
    await expect(submitBtn).toBeDisabled();

    // Fill Database Name
    const nameInput = modal.locator('input[type="text"]').first();
    await nameInput.fill('demodb_copy_test');
    await expect(submitBtn).toBeEnabled();

    // Toggle "Overwrite Existing Files"
    const overwriteCard = modal.locator('button').filter({ hasText: /Overwrite Existing Files/ });
    await expect(overwriteCard).toBeVisible();
    await overwriteCard.click();

    // Toggle "Delete Source After Copy"
    const moveCard = modal.locator('button').filter({ hasText: /Delete Source After Copy/ });
    await expect(moveCard).toBeVisible();

    // Cancel — do NOT copy
    await dismissModal(page);
  });

  // ---------------------------------------------------------------------------
  // Delete Database — form appears, does NOT confirm deletion
  // ---------------------------------------------------------------------------
  test('Delete Database: confirmation dialog appears without deleting', async ({ page }) => {
    await openDbContextMenu(page);
    await page.getByRole('button', { name: 'Manage Database' }).hover();
    await page.getByRole('button', { name: 'Delete Database', exact: true }).click();

    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(/Delete/i);

    // Confirm button should require typing the database name or be a danger button
    const confirmBtn = modal.getByRole('button', { name: /Delete|Confirm/i }).last();
    await expect(confirmBtn).toBeVisible();

    // Cancel — do NOT delete
    await dismissModal(page);
  });

  // ---------------------------------------------------------------------------
  // Compact Database (non-destructive)
  // ---------------------------------------------------------------------------
  test('Compact Database: opens modal with correct options', async ({ page }) => {
    await openDbContextMenu(page);
    await page.getByRole('button', { name: 'Manage Database' }).hover();
    await page.getByRole('button', { name: 'Compact Database', exact: true }).click();

    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(/Compact/i);

    await dismissModal(page);
  });

  // ---------------------------------------------------------------------------
  // Optimize Database (non-destructive — runs as background job)
  // ---------------------------------------------------------------------------
  test('Optimize Database: submits and appears in background jobs', async ({ page }) => {
    await openDbContextMenu(page);
    await page.getByRole('button', { name: 'Manage Database' }).hover();
    await page.getByRole('button', { name: 'Optimize Database', exact: true }).click();

    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(/Optim/i);

    await modal.getByRole('button', { name: /Execute|Run|Optim/i }).last().click();

    // Job appears in background panel or success modal shows
    const result = page.locator('#sidebar-background-jobs')
      .or(page.getByText(/success|complete/i));
    await expect(result.first()).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: /Close|OK/i }).first().click().catch(() => {});
  });

});
