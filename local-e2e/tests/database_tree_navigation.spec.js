const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

test.describe('Database Tree Navigation', () => {
  let hostUid;

  test.beforeEach(async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await host.dblclick();
    const dbTree = new DatabaseTreePage(page);
    await dbTree.waitForAuthorized();
  });

  test('DB를 클릭하면 선택되지만 로그인되지 않는다', async ({ page }) => {
    const dbTree = new DatabaseTreePage(page);
    await dbTree.selectDatabase(E2E_DB);

    // Selecting alone must not open a dashboard tab for the DB.
    await expect(page.getByTestId(`tab-db:${hostUid}:${E2E_DB}`)).not.toBeVisible();
  });

  test('DB를 펼치면 Users/Job automation/Space 하위 노드가 나타난다', async ({ page }) => {
    const dbTree = new DatabaseTreePage(page);
    await dbTree.expandDatabase(E2E_DB);

    await expect(dbTree.subNode(E2E_DB, 'Users')).toBeVisible({ timeout: 10000 });
    await expect(dbTree.subNode(E2E_DB, 'Job automation')).toBeVisible({ timeout: 10000 });
    await expect(dbTree.subNode(E2E_DB, 'Space')).toBeVisible({ timeout: 10000 });
  });

  test('DB를 더블 클릭하면 대시보드 탭이 열린다', async ({ page }) => {
    const dbTree = new DatabaseTreePage(page);
    await dbTree.openDashboardTab(E2E_DB, hostUid);
  });

  test('DB를 우클릭하면 컨텍스트 메뉴가 열린다', async ({ page }) => {
    const dbTree = new DatabaseTreePage(page);
    await dbTree.openContextMenu(E2E_DB);

    await expect(page.getByRole('button', { name: /Database Info|Property/i }).first()).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Escape');
  });
});
