const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

// Restoring requires a real backup file to restore from. Backups can't be
// created in this environment (CMS host has no write access to the default
// backup directory — see database_backup_plan.spec.js), so this only
// verifies the modal opens (DB stopped first, as restore requires) — not an
// actual restore run, which would need a genuine backup on disk.
test.describe('Database Restore', () => {
  let dbTree;

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
    dbTree = new DatabaseTreePage(page);
  });

  test('DB가 중지된 상태에서 Restore Database 모달이 열리고 닫힌다', async ({ page }) => {
    await dbTree.openContextMenu(E2E_DB);
    const stopBtn = page.getByRole('button', { name: /Stop Database/i });
    if (await stopBtn.isVisible().catch(() => false)) {
      await stopBtn.click();
      await page.getByText(/Stopping database/i).waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    } else {
      await page.keyboard.press('Escape');
    }

    await dbTree.clickManageDatabaseItem(E2E_DB, 'Restore Database');
    const modal = page.getByTestId('restore-database-modal');
    await expect(modal).toBeVisible();
    await expect(page.getByTestId('restore-database-execute-btn')).toBeVisible();

    await page.getByTestId('restore-database-cancel-btn').click();
    await expect(modal).not.toBeVisible();
  });

  // Client-side validation runs before any CMS call, so this is fully testable
  // without a real backup file on disk.
  test('사용자 지정 복구 경로를 비워두면 검증 오류가 표시되고 실행 버튼이 비활성화된다', async ({ page }) => {
    await dbTree.openContextMenu(E2E_DB);
    const stopBtn = page.getByRole('button', { name: /Stop Database/i });
    if (await stopBtn.isVisible().catch(() => false)) {
      await stopBtn.click();
      await page.getByText(/Stopping database/i).waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    } else {
      await page.keyboard.press('Escape');
    }

    await dbTree.clickManageDatabaseItem(E2E_DB, 'Restore Database');
    const modal = page.getByTestId('restore-database-modal');
    await expect(modal).toBeVisible();

    const executeBtn = page.getByTestId('restore-database-execute-btn');
    await expect(executeBtn).toBeEnabled();

    await modal.getByText('Recovery path:').click();
    await modal.getByPlaceholder('Default: original location').fill('');

    await expect(modal.getByText('The user-defined recovery path is not valid.')).toBeVisible();
    await expect(executeBtn).toBeDisabled();

    await page.getByTestId('restore-database-cancel-btn').click();
    await expect(modal).not.toBeVisible();
  });
});
