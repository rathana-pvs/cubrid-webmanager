const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { dismissJobResultModal } = require('../pages/dismissJobResultModal');
const { Given, When, Then, And, bddMeta, action } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';
const E2E_OFFLINE_DB = process.env.E2E_OFFLINE_DB || 'db1';

test.describe('Feature: Database Backup & Restore', () => {
  let dbTree;

  test.beforeEach(async ({ appPage: page }) => {
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

  test('Scenario: Backup Database opens with live backup level, directory, and option controls', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Backup & Restore',
      story: 'Backup Dialog Controls',
    });

    let dialog;

    await Given('the user triggers Backup Database from management menu', async () => {
      await action(`Open Backup Database menu item for "${E2E_DB}"`, () => dbTree.clickManageDatabaseItem(E2E_DB, 'Backup Database'), `Failed to open Backup Database dialog for "${E2E_DB}".`);
      dialog = page.getByRole('dialog');
      await action('Verify Backup Database dialog is visible', () => expect(dialog).toBeVisible(), 'Backup Database dialog did not appear.');
    });

    await When('the user inspects the backup parameters', async () => {
      await action('Verify Backup Database dialog title is visible', () => expect(dialog.getByText(/Backup Database|데이터베이스 백업/i)).toBeVisible(), 'Backup Database title was not visible.');
      await action('Verify Backup Level label is visible', () => expect(dialog.getByText(/Backup Level|백업 레벨/i)).toBeVisible(), 'Backup Level label was not visible.');
      await action('Verify Backup Directory label is visible', () => expect(dialog.getByText(/Backup Directory|백업 디렉터리|백업 경로/i)).toBeVisible(), 'Backup Directory label was not visible.');
      await action('Verify Check Database Consistency option is visible', () => expect(dialog.getByText(/Check (?:the )?database consistency|일관성 검사/i)).toBeVisible(), 'Check Database Consistency option was not visible.');
      await action('Verify Compress Backup Volume option is visible', () => expect(dialog.getByText(/Compress backup volume|백업 볼륨 압축/i)).toBeVisible(), 'Compress option was not visible.');
    });

    await Then('the user can close the backup modal without executing', async () => {
      await action('Click Cancel button on Backup Database modal', () => dialog.getByRole('button', { name: /Cancel|취소/i }).click(), 'Could not click Cancel button on Backup Database modal.');
      await action('Verify Backup Database dialog is dismissed', () => expect(dialog).not.toBeVisible(), 'Backup Database dialog remained open after clicking Cancel.');
    });
  });

  test('Scenario: Opening Restore Database modal when database is stopped', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Backup & Restore',
      story: 'Restore Database Dialog',
    });

    let modal;

    await Given('the database is stopped', async () => {
      await action(`Open context menu for database "${E2E_OFFLINE_DB}"`, () => dbTree.openContextMenu(E2E_OFFLINE_DB), `Could not open context menu for "${E2E_OFFLINE_DB}".`);
      const stopBtn = page.getByRole('button', { name: /Stop Database|데이터베이스 정지|데이터베이스 중지/i });
      await action('Stop database if currently running', async () => {
        if (await stopBtn.isVisible().catch(() => false)) {
          await stopBtn.click();
          await page.waitForTimeout(1000);
          await page.getByTestId('loading-overlay').waitFor({ state: 'hidden', timeout: 45000 }).catch(() => undefined);
          await dismissJobResultModal(page);
          await dbTree.waitForContextAction(E2E_OFFLINE_DB, /Start Database|데이터베이스 시작/i);
        } else {
          await page.mouse.click(2, 2).catch(() => undefined);
        }
      }, 'Failed while stopping database.');
    });

    await When('the user opens Restore Database modal', async () => {
      await action(`Open Restore Database modal for "${E2E_OFFLINE_DB}"`, () => dbTree.clickManageDatabaseItem(E2E_OFFLINE_DB, 'Restore Database'), `Failed to open Restore Database modal for "${E2E_OFFLINE_DB}".`);
      modal = page.getByTestId('restore-database-modal');
      await action('Verify Restore Database modal is visible', () => expect(modal).toBeVisible(), 'Restore Database modal did not appear.');
    });

    await Then('the execute button is visible and modal can be closed', async () => {
      await action('Verify restore execute button is visible', () => expect(page.getByTestId('restore-database-execute-btn')).toBeVisible(), 'Restore execute button was not visible.');
      await action('Click Cancel button on Restore Database modal', () => page.getByTestId('restore-database-cancel-btn').click(), 'Could not click Cancel button on Restore Database modal.');
      await action('Verify Restore Database modal is dismissed', () => expect(modal).not.toBeVisible(), 'Restore Database modal remained open after clicking Cancel.');
    });
  });

  test('Scenario: Invalid recovery path displays validation error and disables execution', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Backup & Restore',
      story: 'Recovery Path Validation',
    });

    let modal;
    let executeBtn;

    await Given('the Restore Database modal is active', async () => {
      await action(`Open context menu for database "${E2E_OFFLINE_DB}"`, () => dbTree.openContextMenu(E2E_OFFLINE_DB), `Could not open context menu for "${E2E_OFFLINE_DB}".`);
      const stopBtn = page.getByRole('button', { name: /Stop Database|데이터베이스 정지|데이터베이스 중지/i });
      await action('Stop database if currently running', async () => {
        if (await stopBtn.isVisible().catch(() => false)) {
          await stopBtn.click();
          await page.waitForTimeout(1000);
          await page.getByTestId('loading-overlay').waitFor({ state: 'hidden', timeout: 45000 }).catch(() => undefined);
          await dismissJobResultModal(page);
          await dbTree.waitForContextAction(E2E_OFFLINE_DB, /Start Database|데이터베이스 시작/i);
        } else {
          await page.mouse.click(2, 2).catch(() => undefined);
        }
      }, 'Failed while stopping database.');

      await action(`Open Restore Database modal for "${E2E_OFFLINE_DB}"`, () => dbTree.clickManageDatabaseItem(E2E_OFFLINE_DB, 'Restore Database'), `Failed to open Restore Database modal for "${E2E_OFFLINE_DB}".`);
      modal = page.getByTestId('restore-database-modal');
      await action('Verify Restore Database modal is visible', () => expect(modal).toBeVisible(), 'Restore Database modal did not appear.');
      executeBtn = page.getByTestId('restore-database-execute-btn');
      await action('Verify restore execute button is initially enabled', () => expect(executeBtn).toBeEnabled(), 'Restore execute button was not enabled.');
    });

    await When('the user selects user-defined recovery path and clears the value', async () => {
      await action('Click Recovery path radio option', () => modal.getByText(/Recovery path:|복구 경로:/i).click(), 'Could not select Recovery path option.');
      await action('Clear recovery path input field', () => modal.getByPlaceholder(/Default: original location|기본: 원래 위치/i).fill('').catch(() => modal.locator('input[type="text"]').last().fill('')), 'Could not clear recovery path input field.');
    });

    await Then('a path invalid validation message is displayed and execution is blocked', async () => {
      await action('Verify invalid recovery path validation message is visible', () => expect(modal.getByText(/The user-defined recovery path is not valid|유효하지 않습니다/i)).toBeVisible(), 'Invalid recovery path validation message was not displayed.');
      await action('Verify restore execute button is disabled', () => expect(executeBtn).toBeDisabled(), 'Restore execute button was not disabled with invalid recovery path.');
      await action('Click Cancel button on Restore Database modal', () => page.getByTestId('restore-database-cancel-btn').click(), 'Could not click Cancel on Restore Database modal.');
      await action('Verify Restore Database modal is dismissed', () => expect(modal).not.toBeVisible(), 'Restore Database modal remained open after clicking Cancel.');
    });
  });
});
