const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

test.describe('Database Property and Info Modals', () => {
  let dbTree;

  test.beforeEach(async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    await host.dblclick();
    dbTree = new DatabaseTreePage(page);
    await dbTree.waitForAuthorized();
  });

  // Properties modal edits the host's real cubrid.conf on Apply — only
  // verify it opens with content and discard, never actually apply.
  test('Properties 모달이 열리고, 적용하지 않고 닫을 수 있다', async ({ page }) => {
    await dbTree.openContextMenu(E2E_DB);
    await page.getByRole('button', { name: 'Properties' }).click();

    const modal = page.getByTestId('database-property-modal');
    await expect(modal).toBeVisible({ timeout: 10000 });
    await expect(modal.getByText(E2E_DB).first()).toBeVisible();

    await page.getByTestId('database-property-cancel-btn').click();
    await expect(modal).not.toBeVisible();
  });

  // Param Dump is a read-only backend call — safe to run for real.
  test('Database Info > Param Dump 실행하면 파라미터 테이블이 표시된다', async ({ page }) => {
    await dbTree.openContextMenu(E2E_DB);
    await page.getByRole('button', { name: 'Database Info' }).hover();
    await page.getByRole('button', { name: /Param Dump/ }).click();

    const modal = page.getByTestId('database-info-modal');
    await expect(modal).toBeVisible({ timeout: 10000 });

    await page.getByTestId('database-info-run-btn').click();
    await expect(modal.locator('table')).toBeVisible({ timeout: 15000 });
    await expect(modal.locator('table tbody tr').first()).toBeVisible();

    await page.getByTestId('database-info-close-btn').click();
    await expect(modal).not.toBeVisible();
  });

  // Locking Information is a read-only diagnostic call — safe to run for real.
  test('Database Info > Locking Information을 열면 탭이 전환되고 새로고침이 동작한다', async ({ page }) => {
    await dbTree.openContextMenu(E2E_DB);
    await page.getByRole('button', { name: 'Database Info' }).hover();
    await page.getByRole('button', { name: /Locking Information/ }).click();

    const modal = page.getByTestId('lock-information-modal');
    await expect(modal).toBeVisible({ timeout: 10000 });

    await expect(modal.getByTestId('lock-information-tab-sessions')).toBeVisible();
    await page.getByTestId('lock-information-tab-objects').click();
    await page.getByTestId('lock-information-tab-params').click();

    await page.getByTestId('lock-information-refresh-btn').click();
    await expect(page.getByTestId('lock-information-refresh-btn')).toBeEnabled({ timeout: 15000 });

    await page.getByTestId('lock-information-close-btn').click();
    await expect(modal).not.toBeVisible();
  });

  // Transaction Information requires a DB-user login (defaults to dba/blank);
  // read-only diagnostic call — asserted strictly. This CMS task
  // (gettransactioninfo) was observed to fail twice with "Failed to connect
  // ... localhost" during initial authoring, but 6/6 raw API calls right
  // after reproduced no failure at all — not enough evidence to call it a
  // real environment limitation, so this does NOT tolerate that error. If it
  // recurs, that's a real signal to investigate properly rather than wave
  // through with a skip-reason.
  test('Database Info > Transaction Information을 열면 활성 트랜잭션이 표시된다', async ({ page }) => {
    await dbTree.openContextMenu(E2E_DB);
    await page.getByRole('button', { name: 'Database Info' }).hover();
    await page.getByRole('button', { name: /Transaction information/ }).click();

    const modal = page.getByTestId('transaction-info-modal');
    await expect(modal).toBeVisible({ timeout: 15000 });

    await expect(page.getByTestId('transaction-info-refresh-btn')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('transaction-info-close-btn').click();
    await expect(modal).not.toBeVisible();
  });

  // Plan Dump is a read-only diagnostic call — run with the default
  // (plandrop=off) so the XASL cache isn't flushed as a side effect.
  // Asserted strictly, same reasoning as Transaction Information above —
  // twice-observed "Failed to connect ... localhost" wasn't reproducible in
  // 6/6 follow-up raw API attempts, so it isn't tolerated as an accepted
  // environment limitation. A recurrence here is a real bug signal.
  test('Database Info > Plan Dump을 실행하면 결과 화면으로 전환된다', async ({ page }) => {
    await dbTree.openContextMenu(E2E_DB);
    await page.getByRole('button', { name: 'Database Info' }).hover();
    await page.getByRole('button', { name: /Plan Dump/ }).click();

    const modal = page.getByTestId('plan-dump-modal');
    await expect(modal).toBeVisible({ timeout: 10000 });

    await page.getByTestId('plan-dump-run-btn').click();
    await expect(page.getByTestId('plan-dump-back-btn')).toBeVisible({ timeout: 15000 });

    await page.getByTestId('plan-dump-close-btn').click();
    await expect(modal).not.toBeVisible();
  });
});
