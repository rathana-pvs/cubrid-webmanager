const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { BrokerTreePage } = require('../pages/BrokerTreePage');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';

test.describe('Broker Logs', () => {
  let brokerTree;
  let hostUid;
  let brokerName;

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

    brokerTree = new BrokerTreePage(page);
    await brokerTree.switchToBrokerTab();

    const broker = brokerTree.firstBrokerNode();
    await expect(broker).toBeVisible({ timeout: 10000 });
    brokerName = (await broker.getAttribute('data-testid')).replace('tree-node-', '');
    await brokerTree.expandSqlLogFolder(brokerName);
  });

  test('로그 파일을 더블 클릭하면 뷰어 탭이 열리고 내용이 표시된다', async ({ page }) => {
    const logFile = brokerTree.firstLogFileNode(brokerName);
    await expect(logFile).toBeVisible({ timeout: 10000 });
    const path = (await logFile.getAttribute('data-testid')).replace('tree-node-', '');

    await logFile.dblclick();

    await expect(page.getByTestId(`tab-log:${hostUid}:${path}`)).toBeVisible({ timeout: 15000 });
    const viewer = page.getByTestId('log-viewer');
    await expect(viewer).toBeVisible();

    await page.getByTestId('log-viewer-refresh-btn').click();
    await expect(viewer).toBeVisible();
  });

  test('로그 뷰어의 보기 모드(Raw/Parsed SQL/Top SQL)를 전환할 수 있다', async ({ page }) => {
    const logFile = brokerTree.firstLogFileNode(brokerName);
    await expect(logFile).toBeVisible({ timeout: 10000 });
    await logFile.dblclick();

    const viewer = page.getByTestId('log-viewer');
    await expect(viewer).toBeVisible({ timeout: 15000 });

    for (const mode of ['sql', 'top', 'raw']) {
      const modeBtn = page.getByTestId(`log-viewer-mode-${mode}`);
      await expect(modeBtn).toBeVisible();
      await modeBtn.click();
      // Active mode gets the amber highlight class — confirms the click
      // actually switched modes, not just that the viewer stayed mounted.
      await expect(modeBtn).toHaveClass(/text-amber-600/);
      await expect(viewer).toBeVisible();
    }
  });

  test('View All Logs를 열면 로그 아코디언이 표시되고, 접기/펼치기와 전체 새로고침이 동작한다', async ({ page }) => {
    await brokerTree.openSqlLogContextMenu(brokerName);
    await page.getByRole('button', { name: 'View All Logs' }).click();

    await expect(page.getByTestId(`tab-all_logs:${hostUid}:${brokerName}`)).toBeVisible({ timeout: 15000 });
    const viewer = page.getByTestId('all-logs-viewer');
    await expect(viewer).toBeVisible();

    const sections = viewer.locator('[data-testid^="log-section-"]');
    await expect(sections.first()).toBeVisible({ timeout: 10000 });

    await page.getByTestId('all-logs-collapse-all-btn').click();
    await page.getByTestId('all-logs-expand-all-btn').click();
    await page.getByTestId('all-logs-refresh-all-btn').click();
    await expect(sections.first()).toBeVisible();
  });
});
