const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';

test.describe('Host Tree Navigation', () => {
  test.beforeEach(async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);
  });

  test('호스트를 단일 클릭하면 선택만 되고 DB 트리는 열리지 않는다', async ({ page }) => {
    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    await host.click();

    // Selected accent shows immediately; DB tree stays unauthorized (not logged in via single click).
    await expect(page.locator('#db-tree-container')).not.toHaveAttribute('data-authorized', 'true');
  });

  test('호스트를 더블 클릭하면 로그인 후 DB 트리가 열린다', async ({ page }) => {
    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    await host.dblclick();

    await expect(page.locator('#db-tree-container')).toHaveAttribute('data-authorized', 'true', { timeout: 30000 });
  });

  test('그룹을 클릭하면 선택되고 펼쳐진다', async ({ page }) => {
    const hostTree = new HostTreePage(page);
    // Create a group via the toolbar so this test doesn't depend on fixture state.
    await page.getByTestId('new-group-toolbar-btn').click();
    const groupName = `E2E_NavGroup_${Date.now().toString().slice(-6)}`;
    await page.locator('input[name="groupName"]').fill(groupName);
    await page.getByRole('button', { name: /Create Group/i }).click();
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible({ timeout: 10000 });

    const group = page.locator('#host-section').locator('details').filter({ hasText: groupName }).first();
    await expect(group).toBeVisible({ timeout: 10000 });
    const wasOpen = await group.evaluate((el) => el.open);
    expect(wasOpen).toBe(false);

    await group.locator('> summary').click();
    await expect(group).toHaveJSProperty('open', true);
  });

  test('호스트를 우클릭하면 컨텍스트 메뉴가 열린다', async ({ page }) => {
    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    await host.click({ button: 'right' });

    await expect(page.getByRole('button', { name: /Edit Host/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Delete Host/i })).toBeVisible();
    await page.keyboard.press('Escape');
  });
});
