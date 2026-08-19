const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

// Load defaults its target to the currently-selected (shared fixture) DB —
// actually running it risks overwriting demodb's schema/data with whatever
// unload output happens to be on disk. This only verifies the modal opens
// and closes cleanly, never triggers a real load.
test.describe('Database Load', () => {
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

  test('Load Database 모달이 열리고 취소하면 닫힌다', async ({ page }) => {
    await dbTree.clickManageDatabaseItem(E2E_DB, 'Load Database');
    const modal = page.getByTestId('load-database-modal');
    await expect(modal).toBeVisible();
    await expect(page.getByTestId('load-database-run-btn')).toBeVisible();

    await page.getByTestId('load-database-cancel-btn').click();
    await expect(modal).not.toBeVisible();
  });

  // Pure client-side validation (LoadDatabaseModal.jsx's getValidationError)
  // — no real CMS load call involved, so this is safe regardless of the
  // "don't actually load" constraint above.
  test('언로드 파일을 선택하지 않으면 실행 버튼이 비활성화된다', async ({ page }) => {
    await dbTree.clickManageDatabaseItem(E2E_DB, 'Load Database');
    const modal = page.getByTestId('load-database-modal');
    await expect(modal).toBeVisible();

    // Default mode is "select from list" with nothing selected/checked yet —
    // exact message depends on whether an unload file already exists for
    // this db in this environment (from database_unload.spec.js), but either
    // way the form must start invalid.
    await expect(
      modal.getByText('Please select the unloaded file from the list.')
        .or(modal.getByText('Please check the unloaded files of the selected database from the following list.'))
    ).toBeVisible();
    await expect(page.getByTestId('load-database-run-btn')).toBeDisabled();

    await page.getByTestId('load-database-cancel-btn').click();
    await expect(modal).not.toBeVisible();
  });
});
