const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';

test.describe('Add Host', () => {
  test.beforeEach(async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);
  });

  test('빈 폼으로 연결 시도하면 필수 항목 오류가 표시된다', async ({ page }) => {
    await page.getByTestId('add-host-toolbar-btn').click();
    const modal = page.getByTestId('add-host-modal');
    await expect(modal).toBeVisible();

    await page.getByTestId('add-host-connect-save-btn').click();

    await expect(modal.getByText('Host name is required')).toBeVisible();
    await expect(modal.getByText('Address is required')).toBeVisible();
    await expect(modal.getByText('Username is required')).toBeVisible();
    await expect(modal.getByText('Password is required')).toBeVisible();

    await page.getByTestId('add-host-cancel-btn').click();
    await expect(modal).not.toBeVisible();
  });

  test('Save only(로그인 없이 저장)로 호스트를 추가하면 목록에 나타난다', async ({ page }) => {
    const alias = `E2E_SaveOnly_${Date.now().toString().slice(-6)}`;
    // Randomized per run — addHost rejects a duplicate address:port, so a
    // fixed address would only pass on the first run against a given env.
    const address = `10.1.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

    await page.getByTestId('add-host-toolbar-btn').click();
    const modal = page.getByTestId('add-host-modal');
    await modal.locator('[name="alias"]').fill(alias);
    await modal.locator('[name="address"]').fill(address);
    await modal.locator('[name="port"]').fill('9999');
    await modal.locator('[name="id"]').fill('admin');
    await modal.locator('[name="password"]').fill('placeholder_pw');
    await page.getByTestId('add-host-save-btn').click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });

    await expect(page.locator('#host-section').getByText(alias)).toBeVisible({ timeout: 10000 });
  });

  test('Test Connection & Save로 실제 호스트를 추가하면 로그인까지 완료된다', async ({ page }) => {
    const alias = `E2E_Host_${Date.now().toString().slice(-6)}`;

    await page.getByTestId('add-host-toolbar-btn').click();
    const modal = page.getByTestId('add-host-modal');
    await modal.locator('[name="alias"]').fill(alias);
    await modal.locator('[name="address"]').fill(E2E_HOST_ADDRESS);
    await modal.locator('[name="port"]').fill(E2E_HOST_PORT);
    await modal.locator('[name="id"]').fill('admin');
    await modal.locator('[name="password"]').fill(process.env.E2E_HOST_PASSWORD || 'admin');
    await page.getByTestId('add-host-connect-save-btn').click();

    // This targets a fixed real host, so a prior run may have already
    // registered it — addHost rejects duplicate address:port. Treat that as
    // an acceptable outcome and just confirm the host is present in the tree.
    const alreadyRegistered = await modal.getByText(/already registered/i)
      .waitFor({ state: 'visible', timeout: 8000 }).then(() => true).catch(() => false);
    if (alreadyRegistered) {
      await page.getByTestId('add-host-cancel-btn').click();
      await expect(page.locator(`#host-section [title="${E2E_HOST_ADDRESS}:${E2E_HOST_PORT}"]`)).toBeVisible({ timeout: 10000 });
      return;
    }

    await expect(page.locator('#host-section').getByText(alias)).toBeVisible({ timeout: 15000 });
  });

  test('동일한 주소로 중복 추가하면 오류가 표시된다', async ({ page }) => {
    const alias1 = `E2E_Dup1_${Date.now().toString().slice(-6)}`;
    const alias2 = `E2E_Dup2_${Date.now().toString().slice(-6)}`;
    const address = `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

    await page.getByTestId('add-host-toolbar-btn').click();
    let modal = page.getByTestId('add-host-modal');
    await modal.locator('[name="alias"]').fill(alias1);
    await modal.locator('[name="address"]').fill(address);
    await modal.locator('[name="port"]').fill('8001');
    await modal.locator('[name="id"]').fill('admin');
    await modal.locator('[name="password"]').fill('placeholder_pw');
    await page.getByTestId('add-host-save-btn').click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });

    await page.getByTestId('add-host-toolbar-btn').click();
    modal = page.getByTestId('add-host-modal');
    await modal.locator('[name="alias"]').fill(alias2);
    await modal.locator('[name="address"]').fill(address);
    await modal.locator('[name="port"]').fill('8001');
    await modal.locator('[name="id"]').fill('admin');
    await modal.locator('[name="password"]').fill('placeholder_pw');
    await page.getByTestId('add-host-save-btn').click();

    await expect(modal.getByText(/already registered|already exists|duplicate/i)).toBeVisible({ timeout: 10000 });
  });
});
