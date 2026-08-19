const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

// Adding a volume is a one-way operation for a real database — there is no
// UI action anywhere in the app to remove a volume afterwards. So this only
// verifies the modal opens with sane defaults and the form responds to
// input, then discards — it never actually submits a real Add Volume.
test.describe('Database Volume Management', () => {
  let dbTree;

  test.beforeEach(async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    await host.dblclick();
    dbTree = new DatabaseTreePage(page);
    await dbTree.waitForAuthorized();
  });

  test('Add Volume 모달이 기본값과 함께 열리고, 입력에 반응하며, 취소하면 닫힌다', async ({ page }) => {
    const spaceFolder = await dbTree.expandSubNode(E2E_DB, 'Space');
    await spaceFolder.locator('> summary').click({ button: 'right' });
    await page.getByRole('button', { name: 'Add Volume' }).click();

    const modal = page.getByTestId('add-volume-modal');
    await expect(modal).toBeVisible();

    // Path is prefetched from the host and the 512 MB preset is the default
    // ("512 MB" appears both as the preset button and the size visualizer).
    await expect(modal.getByText('512 MB').first()).toBeVisible();
    const saveBtn = page.getByTestId('add-volume-save-btn');
    await expect(saveBtn).toBeEnabled();

    // Switching the size preset updates the visualized size.
    await modal.getByRole('button', { name: '1 GB', exact: true }).click();
    await expect(modal.getByText('1.0 GB')).toBeVisible();

    // Clearing the volume path disables submission (no real path to write to).
    const dirInput = modal.getByPlaceholder('/var/lib/cubrid/volumes');
    await dirInput.fill('');
    await expect(saveBtn).toBeDisabled();

    await page.getByTestId('add-volume-cancel-btn').click();
    await expect(modal).not.toBeVisible();
  });
});
