const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';

test.describe('Service Dashboard (Global)', () => {
  let hostUid;

  test.beforeEach(async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await hostTree.activateHost(hostUid);

    await page.getByText('Host Service Management').hover();
    await page.getByRole('button', { name: 'Service Dashboard' }).click();
  });

  test('Service Dashboard 탭이 열리고 전체 호스트 테이블과 새로고침이 표시된다', async ({ page }) => {
    await expect(page.getByTestId('tab-service_dashboard')).toBeVisible({ timeout: 10000 });
    const dashboard = page.getByTestId('service-dashboard');
    await expect(dashboard).toBeVisible();

    const table = page.getByTestId('service-dashboard-table');
    await expect(table).toBeVisible();
    await expect(table.getByText(E2E_HOST_ADDRESS).first()).toBeVisible({ timeout: 10000 });

    const refreshBtn = page.getByTestId('service-dashboard-refresh-btn');
    await refreshBtn.click();
    await expect(refreshBtn).toBeEnabled({ timeout: 15000 });
  });

  test('호스트 행을 클릭하면 해당 호스트의 서버 대시보드로 이동한다', async ({ page }) => {
    const table = page.getByTestId('service-dashboard-table');
    await expect(table).toBeVisible();

    const hostRow = table.getByText(E2E_HOST_ADDRESS).first();
    await expect(hostRow).toBeVisible({ timeout: 10000 });
    await hostRow.click();

    await expect(page.getByTestId(`tab-host:${hostUid}`)).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('server-dashboard')).toBeVisible();
  });

  // Pure client-side filtering, no CMS calls — the fixture host has no HA
  // role, so filtering to a specific role hides it and "All" brings it back.
  test('HA Role 필터를 전환하면 호스트 목록이 필터링된다', async ({ page }) => {
    const table = page.getByTestId('service-dashboard-table');
    await expect(table).toBeVisible();

    const hostRow = table.getByText(E2E_HOST_ADDRESS).first();
    await expect(hostRow).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: 'Master', exact: true }).click();
    await expect(table.getByText(E2E_HOST_ADDRESS)).not.toBeVisible();

    await page.getByRole('button', { name: 'All', exact: true }).click();
    await expect(table.getByText(E2E_HOST_ADDRESS).first()).toBeVisible({ timeout: 10000 });
  });
});
