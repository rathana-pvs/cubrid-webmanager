const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

test.describe('Database Start/Stop', () => {
  test.beforeEach(async ({ page }) => {
    // activateHost() retries the real host's login on transient connection
    // failures (e.g. it's busy with another spec's background job) — give
    // that room beyond the 60s default.
    test.setTimeout(90000);
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    const hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await hostTree.activateHost(hostUid);
    const dbTree = new DatabaseTreePage(page);
  });

  test('DB가 실행 중이면 Stop Database 메뉴가, 중지 상태면 Start Database 메뉴가 보인다', async ({ page }) => {
    const dbTree = new DatabaseTreePage(page);
    await dbTree.openContextMenu(E2E_DB);

    const stopBtn = page.getByRole('button', { name: /Stop Database/i });
    const startBtn = page.getByRole('button', { name: /Start Database/i });
    const stopVisible = await stopBtn.isVisible().catch(() => false);
    const startVisible = await startBtn.isVisible().catch(() => false);
    expect(stopVisible || startVisible).toBe(true);
    expect(stopVisible && startVisible).toBe(false);

    await page.keyboard.press('Escape');
  });

  test('DB를 중지했다 다시 시작하면 상태 아이콘이 off→on으로 바뀐다', async ({ page }) => {
    const dbTree = new DatabaseTreePage(page);

    // Ensure running first (start if currently stopped), for a deterministic starting point.
    await dbTree.openContextMenu(E2E_DB);
    const startBtn = page.getByRole('button', { name: /Start Database/i });
    if (await startBtn.isVisible().catch(() => false)) {
      await startBtn.click();
      await page.getByText(/Starting database/i).waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    } else {
      await page.keyboard.press('Escape');
    }

    // Stop it.
    await dbTree.openContextMenu(E2E_DB);
    await page.getByRole('button', { name: /Stop Database/i }).click();
    await page.getByText(/Stopping database/i).waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    await expect(dbTree.dbNode(E2E_DB)).toHaveAttribute('class', /.*/); // settle
    await page.waitForTimeout(500);
    await dbTree.openContextMenu(E2E_DB);
    await expect(page.getByRole('button', { name: /Start Database/i })).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Escape');

    // Start it again.
    await dbTree.openContextMenu(E2E_DB);
    await page.getByRole('button', { name: /Start Database/i }).click();
    await page.getByText(/Starting database/i).waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(500);
    await dbTree.openContextMenu(E2E_DB);
    await expect(page.getByRole('button', { name: /Stop Database/i })).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Escape');
  });
});
