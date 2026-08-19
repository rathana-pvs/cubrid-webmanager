const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');

test.describe('Delete Host', () => {
  test.beforeEach(async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);
  });

  test('호스트를 삭제하면 목록에서 사라진다', async ({ page }) => {
    // Fixture host, independent of the fixed E2E host used elsewhere.
    const alias = `E2E_ToDelete_${Date.now().toString().slice(-6)}`;
    const address = `10.2.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

    await page.getByTestId('add-host-toolbar-btn').click();
    const addModal = page.getByTestId('add-host-modal');
    await addModal.locator('[name="alias"]').fill(alias);
    await addModal.locator('[name="address"]').fill(address);
    await addModal.locator('[name="port"]').fill('8001');
    await addModal.locator('[name="id"]').fill('admin');
    await addModal.locator('[name="password"]').fill('placeholder_pw');
    await page.getByTestId('add-host-save-btn').click();
    await expect(addModal).not.toBeVisible({ timeout: 10000 });

    const hostItem = page.locator('#host-section').getByText(alias).first();
    await expect(hostItem).toBeVisible({ timeout: 10000 });
    await hostItem.click({ button: 'right' });
    await page.getByRole('button', { name: /Delete Host/i }).click();

    const modal = page.getByTestId('delete-host-modal');
    await expect(modal).toBeVisible();
    await page.getByTestId('delete-host-confirm-btn').click();

    await expect(modal).not.toBeVisible({ timeout: 10000 });
    await expect(hostItem).not.toBeVisible({ timeout: 5000 });
  });

  test('삭제 취소를 누르면 호스트가 유지된다', async ({ page }) => {
    const alias = `E2E_KeepHost_${Date.now().toString().slice(-6)}`;
    const address = `10.3.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

    await page.getByTestId('add-host-toolbar-btn').click();
    const addModal = page.getByTestId('add-host-modal');
    await addModal.locator('[name="alias"]').fill(alias);
    await addModal.locator('[name="address"]').fill(address);
    await addModal.locator('[name="port"]').fill('8001');
    await addModal.locator('[name="id"]').fill('admin');
    await addModal.locator('[name="password"]').fill('placeholder_pw');
    await page.getByTestId('add-host-save-btn').click();
    await expect(addModal).not.toBeVisible({ timeout: 10000 });

    const hostItem = page.locator('#host-section').getByText(alias).first();
    await expect(hostItem).toBeVisible({ timeout: 10000 });
    await hostItem.click({ button: 'right' });
    await page.getByRole('button', { name: /Delete Host/i }).click();

    const modal = page.getByTestId('delete-host-modal');
    await page.getByTestId('delete-host-cancel-btn').click();
    await expect(modal).not.toBeVisible();
    await expect(hostItem).toBeVisible();
  });
});
