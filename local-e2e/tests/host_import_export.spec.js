const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';

test.describe('Host Import/Export', () => {
  test.beforeEach(async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
  });

  test('호스트 목록을 내보낸 뒤 같은 파일을 다시 가져오면 모두 중복으로 표시된다', async ({ page }) => {
    // Export: File > Export Host.
    await page.getByText('File', { exact: true }).hover();
    await page.getByRole('button', { name: 'Export Host' }).click();

    const modal = page.getByTestId('import-export-host-modal');
    await expect(modal).toBeVisible({ timeout: 10000 });

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('import-export-host-action-btn').click(),
    ]);
    const filePath = await download.path();
    expect(filePath).toBeTruthy();
    // Exporting closes the modal immediately (no confirmation step).
    await expect(modal).not.toBeVisible({ timeout: 10000 });

    // Import: File > Import Host, using the file we just exported.
    await page.getByText('File', { exact: true }).hover();
    await page.getByRole('button', { name: 'Import Host' }).click();
    await expect(modal).toBeVisible({ timeout: 10000 });

    await modal.locator('input[type="file"]').setInputFiles(filePath);

    // Every host in the file already exists (address+port match), so the
    // preview should mark all rows duplicate and nothing selectable.
    const duplicateBadges = modal.getByText('DUPLICATE', { exact: true });
    await expect(duplicateBadges.first()).toBeVisible({ timeout: 10000 });

    const actionBtn = page.getByTestId('import-export-host-action-btn');
    await expect(actionBtn).toBeDisabled();

    await page.getByTestId('import-export-host-cancel-btn').click();
    await expect(modal).not.toBeVisible();
  });
});
