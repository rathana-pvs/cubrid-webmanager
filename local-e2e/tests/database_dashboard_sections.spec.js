const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

test.describe('Database Dashboard Sections', () => {
  let dbTree;
  let hostUid;

  test.beforeEach(async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await host.dblclick();
    dbTree = new DatabaseTreePage(page);
    await dbTree.waitForAuthorized();
  });

  test('DB를 활성화하면 대시보드 탭이 열리고 6개 섹션이 모두 렌더링된다', async ({ page }) => {
    await dbTree.openDashboardTab(E2E_DB, hostUid);

    const dashboard = page.getByTestId('database-dashboard');
    await expect(dashboard).toBeVisible();

    for (const testId of [
      'db-dashboard-performance',
      'db-dashboard-volumes',
      'db-dashboard-space-info',
      'db-dashboard-cas',
      'db-dashboard-lock-transaction',
      'db-dashboard-job-automation',
    ]) {
      await expect(dashboard.getByTestId(testId)).toBeVisible({ timeout: 15000 });
    }
  });

  test('섹션 헤더를 클릭하면 접히고, 다시 클릭하면 펼쳐진다', async ({ page }) => {
    await dbTree.openDashboardTab(E2E_DB, hostUid);

    const section = page.getByTestId('database-dashboard').getByTestId('db-dashboard-performance');
    await expect(section).toBeVisible({ timeout: 15000 });
    const header = section.locator('> div').first();
    const table = section.locator('table');
    await expect(table).toBeVisible();

    await header.click();
    await expect(table).not.toBeVisible();

    await header.click();
    await expect(table).toBeVisible();
  });

  test('새로고침 버튼을 누르면 대시보드가 다시 로드된다', async ({ page }) => {
    await dbTree.openDashboardTab(E2E_DB, hostUid);

    const dashboard = page.getByTestId('database-dashboard');
    await expect(dashboard).toBeVisible();

    const refreshBtn = page.getByTestId('database-dashboard-refresh-btn');
    await refreshBtn.click();
    await expect(refreshBtn).toBeEnabled({ timeout: 15000 });
    await expect(dashboard.getByTestId('db-dashboard-performance')).toBeVisible();
  });
});
