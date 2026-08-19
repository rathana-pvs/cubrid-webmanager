const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

test.describe('Database Rename/Copy', () => {
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

  // Rename requires the DB name to actually change against a shared fixture
  // DB, so this only exercises validation (button disabled until changed),
  // never an actual rename — that would break every other DB-dependent spec.
  test('Rename Database 모달은 활성 DB에서는 비활성화, 이름 미변경시 실행 버튼이 비활성 상태다', async ({ page }) => {
    await dbTree.openContextMenu(E2E_DB);

    const isActive = await page.getByRole('button', { name: /Stop Database/i }).isVisible().catch(() => false);
    if (isActive) {
      await page.getByRole('button', { name: 'Manage Database' }).hover();
      await expect(page.getByRole('button', { name: /Rename Database/i })).toBeDisabled();
      await page.keyboard.press('Escape');
      return;
    }

    await dbTree.clickManageDatabaseItem(E2E_DB, 'Rename Database');
    const modal = page.getByTestId('rename-database-modal');
    await expect(modal).toBeVisible();
    await expect(page.getByTestId('rename-database-execute-btn')).toBeDisabled();

    await page.getByTestId('rename-database-new-name-input').fill(`${E2E_DB}_v2`);
    await expect(page.getByTestId('rename-database-execute-btn')).toBeEnabled();

    await page.getByTestId('rename-database-cancel-btn').click();
    await expect(modal).not.toBeVisible();
  });

  // A full copy of the real fixture DB takes minutes (CMS background job on
  // real data) and needs the source stopped first. Rather than eat that cost
  // (and the flakiness of a multi-minute wait) on every run, this only
  // verifies the job actually starts against the backend — not full
  // completion + cleanup.
  //
  // Known side effect: while this job runs, the real host can refuse new
  // logins for a couple of minutes (observed as the Edit Host modal's
  // generic "Failed to login" banner). HostTreePage.activateHost() retries a
  // few times, but that's not enough to fully absorb a multi-minute window —
  // database_restore.spec.js and database_start_stop_delete.spec.js (next
  // alphabetically) may occasionally flake for this reason. This is a real
  // CMS-host limitation, not a test bug; re-running the flaked spec alone
  // passes once the job has finished.
  test('DB 복사를 실행하면 백그라운드 작업이 시작된다', async ({ page }) => {
    const cloneName = `e2e_clone_${Date.now().toString().slice(-6)}`;

    // Copy requires the source DB to be stopped (CMS rejects "active state").
    await dbTree.openContextMenu(E2E_DB);
    const stopBtn = page.getByRole('button', { name: /Stop Database/i });
    if (await stopBtn.isVisible().catch(() => false)) {
      await stopBtn.click();
      await page.getByText(/Stopping database/i).waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    } else {
      await page.keyboard.press('Escape');
    }

    await dbTree.clickManageDatabaseItem(E2E_DB, 'Copy Database');

    const copyModal = page.getByTestId('copy-database-modal');
    await expect(copyModal).toBeVisible();
    await page.getByTestId('copy-database-dest-name-input').fill(cloneName);
    await page.getByTestId('copy-database-execute-btn').click();

    await expect(page.getByText(/Copying Database/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(cloneName)).toBeVisible();

    // Deliberately do NOT restart demodb here — it must stay stopped for the
    // copy job (still running in the background) to finish correctly.
    // Other specs already handle either running/stopped state defensively.
  });
});
