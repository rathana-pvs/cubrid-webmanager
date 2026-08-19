const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';

test.describe('Edit Host', () => {
  test.beforeEach(async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);
  });

  test('별칭을 비우고 저장하면 필수 항목 오류가 표시된다', async ({ page }) => {
    const host = page.locator(`#host-section [title="${E2E_HOST_ADDRESS}:${E2E_HOST_PORT}"]`);
    await expect(host).toBeVisible({ timeout: 10000 });
    await host.click({ button: 'right' });
    await page.getByRole('button', { name: /Edit Host/i }).click();

    const modal = page.getByTestId('edit-host-modal');
    await expect(modal).toBeVisible();
    // Small settle wait: filling immediately after open can race a background
    // re-render that repopulates the form from the host list, clobbering the
    // just-typed value before Save is clicked.
    await page.waitForTimeout(500);
    await modal.locator('[name="alias"]').fill('');
    await page.getByTestId('edit-host-save-btn').click();

    await expect(modal.getByText('Host name is required')).toBeVisible();
    await page.getByTestId('edit-host-cancel-btn').click();
  });

  test('별칭을 수정하고 저장하면 트리에 새 이름이 표시된다', async ({ page }) => {
    const host = page.locator(`#host-section [title="${E2E_HOST_ADDRESS}:${E2E_HOST_PORT}"]`);
    await expect(host).toBeVisible({ timeout: 10000 });
    await host.click({ button: 'right' });
    await page.getByRole('button', { name: /Edit Host/i }).click();

    const modal = page.getByTestId('edit-host-modal');
    const newAlias = `E2E_Host_Renamed_${Date.now().toString().slice(-6)}`;
    await modal.locator('[name="alias"]').fill(newAlias);
    await page.getByTestId('edit-host-save-btn').click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });

    await expect(page.locator('#host-section').getByText(newAlias)).toBeVisible({ timeout: 10000 });
  });

  test('올바른 비밀번호로 Test Connection & Save 하면 로그인에 성공한다', async ({ page }) => {
    const host = page.locator(`#host-section [title="${E2E_HOST_ADDRESS}:${E2E_HOST_PORT}"]`);
    await expect(host).toBeVisible({ timeout: 10000 });
    await host.click({ button: 'right' });
    await page.getByRole('button', { name: /Edit Host/i }).click();

    const modal = page.getByTestId('edit-host-modal');
    await modal.locator('[name="password"]').fill(process.env.E2E_HOST_PASSWORD);
    await page.getByTestId('edit-host-connect-save-btn').click();

    await expect(modal).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator('#db-tree-container')).toHaveAttribute('data-authorized', 'true', { timeout: 30000 });
  });

  test('잘못된 비밀번호로 Test Connection & Save 하면 오류가 표시되고 모달이 유지된다', async ({ page }) => {
    const host = page.locator(`#host-section [title="${E2E_HOST_ADDRESS}:${E2E_HOST_PORT}"]`);
    await expect(host).toBeVisible({ timeout: 10000 });
    await host.click({ button: 'right' });
    await page.getByRole('button', { name: /Edit Host/i }).click();

    const modal = page.getByTestId('edit-host-modal');
    await expect(modal).toBeVisible();
    await modal.locator('[name="password"]').fill('definitely_wrong_password');
    await page.getByTestId('edit-host-connect-save-btn').click();

    await expect(modal.getByText('Incorrect password')).toBeVisible({ timeout: 15000 });
    await expect(modal).toBeVisible();

    // IMPORTANT: handleTestConnectionAndSave() saves (editHost) BEFORE
    // attempting the CMS login, so the wrong password above is now the
    // host's stored credential — every other spec that relies on this fixed
    // host auto-logging in (dblclick without re-entering a password) would
    // break otherwise. Restore the real password before finishing.
    await modal.locator('[name="password"]').fill(process.env.E2E_HOST_PASSWORD);
    await page.getByTestId('edit-host-connect-save-btn').click();
    await expect(modal).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator('#db-tree-container')).toHaveAttribute('data-authorized', 'true', { timeout: 30000 });
  });
});
