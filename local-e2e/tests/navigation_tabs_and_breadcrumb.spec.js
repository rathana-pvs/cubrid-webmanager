const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

test.describe('Navigation Tabs and Breadcrumb', () => {
  let dbTree;
  let hostUid;

  test.beforeEach(async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await hostTree.activateHost(hostUid);
    dbTree = new DatabaseTreePage(page);
  });

  test('여러 탭을 열고 전환하면 각 탭의 내용이 올바르게 표시된다', async ({ page }) => {
    const hostTab = page.getByTestId(`tab-host:${hostUid}`);
    await expect(hostTab).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('server-dashboard')).toBeVisible();

    await dbTree.openDashboardTab(E2E_DB, hostUid);
    const dbTab = page.getByTestId(`tab-db:${hostUid}:${E2E_DB}`);
    await expect(dbTab).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('database-dashboard')).toBeVisible();

    await hostTab.click();
    await expect(page.getByTestId('server-dashboard')).toBeVisible();

    await dbTab.click();
    await expect(page.getByTestId('database-dashboard')).toBeVisible();
  });

  test('탭을 닫으면 사라지고, 남은 탭이 활성화된다', async ({ page }) => {
    const hostTab = page.getByTestId(`tab-host:${hostUid}`);
    await expect(hostTab).toBeVisible({ timeout: 10000 });

    await dbTree.openDashboardTab(E2E_DB, hostUid);
    const dbTab = page.getByTestId(`tab-db:${hostUid}:${E2E_DB}`);
    await expect(dbTab).toBeVisible({ timeout: 10000 });

    await page.getByTestId(`tab-db:${hostUid}:${E2E_DB}-close`).click();
    await expect(dbTab).not.toBeVisible();
    await expect(hostTab).toBeVisible();
    await expect(page.getByTestId('server-dashboard')).toBeVisible();
  });

  test('수정 중인 탭을 닫으려 하면 확인 다이얼로그가 뜨고, 취소하면 유지되며 확정하면 닫힌다', async ({ page }) => {
    await page.mouse.click(2, 2).catch(() => {});
    await page.getByTestId('tree-tab-broker').click({ button: 'right' });
    await page.getByRole('button', { name: 'Edit Broker Config' }).click();

    const configTab = page.getByTestId(`tab-broker_config:${hostUid}`);
    await expect(configTab).toBeVisible({ timeout: 10000 });
    const textarea = page.getByTestId('broker-config-textarea');
    await expect(textarea).not.toHaveValue('', { timeout: 15000 });
    await textarea.click();
    await textarea.press('End');
    await page.keyboard.type('\n# e2e dirty-tab test');
    await expect(page.getByTestId('broker-config-save-btn')).toBeEnabled();

    await page.getByTestId(`tab-broker_config:${hostUid}-close`).click();

    const confirmDialog = page.getByTestId('close-dirty-tab-modal');
    await expect(confirmDialog).toBeVisible({ timeout: 5000 });
    await expect(confirmDialog.getByText('Discard Changes')).toBeVisible();
    await expect(confirmDialog.getByText(/unsaved changes/i)).toBeVisible();

    await page.getByTestId('close-dirty-tab-cancel-btn').click();
    await expect(confirmDialog).not.toBeVisible();
    await expect(configTab).toBeVisible();

    await page.getByTestId(`tab-broker_config:${hostUid}-close`).click();
    await expect(confirmDialog).toBeVisible({ timeout: 5000 });
    await page.getByTestId('close-dirty-tab-confirm-btn').click();
    await expect(configTab).not.toBeVisible();
  });
});
