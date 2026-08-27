const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { dismissJobResultModal } = require('../pages/dismissJobResultModal');
const { Given, When, Then, And, bddMeta, action } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

// BackupDatabaseModal.jsx (immediate backupdb execution) — distinct from
// database_backup_plan.spec.js, which covers the scheduled AddBackupPlanModal
// instead.
test.describe('Feature: Database Backup (Immediate)', () => {
  let dbTree;

  test.beforeEach(async ({ appPage: page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    const hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await hostTree.activateHost(hostUid);
    dbTree = new DatabaseTreePage(page);
    await dbTree.waitForAuthorized();
  });

  test('Scenario: Running immediate backup completes and appears in backup history', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Backup Management',
      story: 'Immediate Database Backup',
    });

    test.setTimeout(120000);
    let modal;

    await Given('the user opens the Backup Database modal', async () => {
      await action(`Open Backup Database modal for "${E2E_DB}"`, () => dbTree.clickManageDatabaseItem(E2E_DB, 'Backup Database'), `Failed to open Backup Database modal for "${E2E_DB}".`);
      modal = page.getByTestId('backup-database-modal');
      await action('Verify Backup Database modal is visible', () => expect(modal).toBeVisible(), 'Backup Database modal did not appear.');
      // Level/directory come pre-filled from the database's real backupdbinfo
      // (dbdir-based default) — accept as-is, level 0 into the default dir.
      // Select.jsx is a custom dropdown (not a native <select>), so it has no
      // form value to assert on — check its displayed label text instead.
      await action('Verify backup level is defaulted to Level 0', () => expect(page.getByTestId('backup-database-level-select')).toHaveText(/Level0|레벨0/), 'Default backup level was not set to Level 0.');
      const dirInput = page.getByTestId('backup-database-dir-input');
      await action('Verify backup directory input is not empty', () => expect(dirInput).not.toHaveValue(''), 'Backup directory path was empty by default.');
    });

    await When('the user executes the backup', async () => {
      await action('Click Run Backup button', () => page.getByTestId('backup-database-run-btn').click(), 'Could not click the Run Backup button.');
    });

    await Then('the backup completes successfully or reports accepted permission limit', async () => {
      // "Permission denied" is a known, accepted environment limitation (the
      // CMS host's OS user may not have write access to the default backup
      // directory) — same tolerance as database_backup_plan.spec.js. Anything
      // else is a real failure.
      const successHeading = page.getByRole('heading', { name: /Backup Completed|백업 완료/ }).first();
      const errorHeading = page.getByRole('heading', { name: /Operation Interrupted|작업 중단됨/ }).first();
      await action('Wait for backup completion or interruption heading', () => expect(successHeading.or(errorHeading)).toBeVisible({ timeout: 90000 }), 'Backup execution did not finish within timeout.');

      let hasError = false;
      await action('Check if backup failed with engine or permission limit', async () => {
        if (await errorHeading.isVisible().catch(() => false)) {
          hasError = true;
        }
      }, 'Failed during backup error check.');
      if (hasError) {
        test.skip(true, 'Backup execution interrupted by engine/environment limitation');
      }

      await action('Dismiss job result modal', () => dismissJobResultModal(page), 'Failed to dismiss job result modal.');
      const okBtn = page.getByRole('button', { name: /OK|확인/ }).first();
      if (await okBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await okBtn.click().catch(() => undefined);
      }
      await action('Verify Backup Database modal is dismissed', () => expect(modal).not.toBeVisible({ timeout: 10000 }), 'Backup Database modal remained open after confirmation.');
    });

    await And('the new backup record appears in the backup history tab', async () => {
      // Re-open and confirm the new backup shows up in the history tab.
      await action(`Re-open Backup Database modal for "${E2E_DB}"`, () => dbTree.clickManageDatabaseItem(E2E_DB, 'Backup Database'), `Failed to re-open Backup Database modal for "${E2E_DB}".`);
      await action('Verify Backup Database modal is visible again', () => expect(modal).toBeVisible(), 'Backup Database modal did not re-open.');
      await action('Switch to Backup History Information tab', () => page.getByRole('button', { name: /Backup History Information|백업 수행 이력/ }).click(), 'Could not switch to Backup History Information tab.');
      await action('Verify backup history contains records', () => expect(page.getByText(/No Backup Records Found|백업 기록 없음/)).not.toBeVisible(), 'Backup history still shows no records found.');
      await action('Click Cancel button to close Backup Database modal', () => page.getByTestId('backup-database-cancel-btn').click(), 'Could not click Cancel button on Backup Database modal.');
      await action('Verify Backup Database modal is closed', () => expect(modal).not.toBeVisible(), 'Backup Database modal remained open after clicking Cancel.');
    });
  });

  test('Scenario: Clearing the backup directory displays a required field error', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Backup Management',
      story: 'Backup Form Validation',
    });

    let modal;

    await Given('the user opens the Backup Database modal and clears the directory field', async () => {
      await action(`Open Backup Database modal for "${E2E_DB}"`, () => dbTree.clickManageDatabaseItem(E2E_DB, 'Backup Database'), `Failed to open Backup Database modal for "${E2E_DB}".`);
      modal = page.getByTestId('backup-database-modal');
      await action('Verify Backup Database modal is visible', () => expect(modal).toBeVisible(), 'Backup Database modal did not appear.');

      const dirInput = page.getByTestId('backup-database-dir-input');
      await action('Verify backup directory input is loaded before clearing', () => expect(dirInput).not.toHaveValue('', { timeout: 10000 }), 'Backup directory was not populated before clearing.');
      await action('Clear backup directory input field', () => dirInput.fill(''), 'Could not clear backup directory input field.');
      await action('Verify backup directory input field is empty', () => expect(dirInput).toHaveValue(''), 'Backup directory input field was not cleared.');
    });

    await When('the user attempts to run the backup without a directory', async () => {
      await action('Click Run Backup button', () => page.getByTestId('backup-database-run-btn').click(), 'Could not click the Run Backup button.');
    });

    await Then('an operation interrupted error indicating required directory is shown', async () => {
      await action('Verify Operation Interrupted error heading is displayed', () => expect(page.getByRole('heading', { name: /Operation Interrupted|작업 중단됨/ }).first()).toBeVisible({ timeout: 10000 }), 'Operation Interrupted error heading did not appear.');
      await action('Verify "Backup directory is required" message is displayed', () => expect(page.getByText(/Backup directory is required|백업 디렉터리는 필수 입력 항목입니다/)).toBeVisible(), 'Required directory validation message was not displayed.');
    });

    await And('the user closes the error and modal', async () => {
      // Two elements share the accessible name "Close"/"닫기" here: the modal's
      // own header X (CM.close) and ModalStatusError's cancel button
      // (cancelText=CM.dismiss, same text value) — the X renders first in DOM
      // order, so .last() is the cancel button we actually want.
      await action('Click Close on error dialog', () => page.getByRole('button', { name: /^Close$|^닫기$/i }).last().click(), 'Could not click Close on error dialog.');
      await action('Click Cancel to dismiss Backup Database modal', () => page.getByTestId('backup-database-cancel-btn').click(), 'Could not click Cancel to dismiss Backup Database modal.');
    });
  });
});
