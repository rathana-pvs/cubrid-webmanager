const { test, expect } = require('@playwright/test');

/**
 * Host Management Test Suite
 * Verifies adding, validating, and removing host connections.
 */
test.describe('Host Management', () => {

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/');
    await page.getByPlaceholder(/Enter username/i).fill(process.env.E2E_USERNAME);
    await page.getByPlaceholder(/••••••••/).fill(process.env.E2E_PASSWORD);
    await page.getByRole('button', { name: /Authorize Access/i }).click();
    await expect(page.getByTitle(/Logout/i)).toBeVisible();
  });

  test('should show validation errors in Add Host modal', async ({ page }) => {
    // Open modal
    await page.getByRole('button', { name: /Add/i }).click();
    await expect(page.getByText('New connection', { exact: true })).toBeVisible();

    // Click Connect without filling anything
    const connectBtn = page.getByRole('button', { name: 'Connect', exact: true });
    await connectBtn.click();

    // Check for inline validation errors
    await expect(page.getByText('Host Name is required')).toBeVisible();
    await expect(page.getByText('Address is required')).toBeVisible();
    await expect(page.getByText('User is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: 'Discard' }).click();
    await expect(page.getByText('New connection')).not.toBeVisible();
  });

  test('should successfully add and then remove a host connection', async ({ page }) => {
    const testHostName = `TestHost_${Date.now().toString().slice(-4)}`;
    
    // 1. Add Host
    await page.getByRole('button', { name: /Add/i }).click();
    
    await page.locator('input[name="alias"]').fill(testHostName);
    await page.locator('input[name="address"]').fill('127.0.0.1');
    await page.locator('input[name="port"]').fill('8001');
    await page.locator('input[name="id"]').fill('admin');
    await page.locator('input[name="password"]').fill('admin_pass');

    await page.getByRole('button', { name: 'Connect', exact: true }).click();

    // 2. Verify Host appears in the list
    const hostItem = page.locator('#host-section').getByText(testHostName);
    await expect(hostItem).toBeVisible();

    // 3. Remove the Host (Cleanup)
    // Right click to open context menu
    await hostItem.click({ button: 'right' });
    
    const deleteMenuItem = page.getByRole('button', { name: /Delete Host/i });
    await expect(deleteMenuItem).toBeVisible();
    await deleteMenuItem.click();

    // 4. Confirm Deletion in Modal
    await expect(page.getByText('Remove Host Connection')).toBeVisible();
    await page.getByRole('button', { name: 'Confirm Removal' }).click();

    // 5. Verify it is gone
    await expect(hostItem).not.toBeVisible();
  });

});
