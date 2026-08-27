const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { dismissJobResultModal } = require('../pages/dismissJobResultModal');
const { Given, When, Then, And, bddMeta, action } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_OFFLINE_DB || 'db1';

test.describe('Feature: Database Load', () => {
  let dbTree;

  test.beforeEach(async ({ appPage: page }) => {
    test.setTimeout(180000);
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    const hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await hostTree.activateHost(hostUid);
    dbTree = new DatabaseTreePage(page);
    await dbTree.waitForAuthorized();
    await dbTree.openDashboardTab(E2E_DB, hostUid, { username: 'dba', password: 'admin123' });
  });

  const ensureStopped = async (page) => {
    const dbNode = dbTree.dbNode(E2E_DB);
    await expect(dbNode).toBeVisible({ timeout: 15000 });
    const currentStatus = await dbNode.getAttribute('data-status');
    if (currentStatus === 'on') {
      await action(`Open context menu for database "${E2E_DB}"`, () => dbTree.openContextMenu(E2E_DB), `Could not open context menu for "${E2E_DB}".`);
      const stopBtn = page.getByRole('button', { name: /Stop Database|데이터베이스 정지|데이터베이스 중지/i });
      if (await stopBtn.isVisible().catch(() => false)) {
        await action('Stop database if currently running', async () => {
          await stopBtn.click();
          await page.waitForTimeout(1000);
          await page.getByTestId('loading-overlay').waitFor({ state: 'hidden', timeout: 60000 }).catch(() => undefined);
          await dismissJobResultModal(page);
          await dbTree.waitForContextAction(E2E_DB, /Start Database|데이터베이스 시작/i, { timeout: 90000 });
        }, 'Failed while stopping database.');
      } else {
        await page.mouse.click(2, 2).catch(() => undefined);
      }
    }
  };

  test('Scenario: Load Database modal opens with controls and can be cancelled', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Migration',
      story: 'Load Database Modal Lifecycle',
    });

    let modal;

    await Given('the user triggers Load Database from management menu', async () => {
      await ensureStopped(page);
      await action(`Open Load Database modal for "${E2E_DB}"`, () => dbTree.clickManageDatabaseItem(E2E_DB, 'Load Database'), `Failed to open Load Database modal for "${E2E_DB}".`);
      modal = page.getByTestId('load-database-modal');
      await action('Verify Load Database modal is visible', () => expect(modal).toBeVisible(), 'Load Database modal did not appear.');
    });

    await When('the user views the load options and run button', async () => {
      await action('Verify Load Database run button is visible', () => expect(page.getByTestId('load-database-run-btn')).toBeVisible(), 'Load Database run button was not visible.');
    });

    await Then('clicking Cancel dismisses the dialog', async () => {
      await action('Click Cancel button on Load Database modal', () => page.getByTestId('load-database-cancel-btn').click(), 'Could not click Cancel button on Load Database modal.');
      await action('Verify Load Database modal is dismissed', () => expect(modal).not.toBeVisible(), 'Load Database modal remained open after clicking Cancel.');
    });
  });

  test('Scenario: Unselected unload file disables execution with validation message', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Migration',
      story: 'Load File Selection Validation',
    });

    let modal;

    await Given('the user opens the Load Database modal', async () => {
      await ensureStopped(page);
      await action(`Open Load Database modal for "${E2E_DB}"`, () => dbTree.clickManageDatabaseItem(E2E_DB, 'Load Database'), `Failed to open Load Database modal for "${E2E_DB}".`);
      modal = page.getByTestId('load-database-modal');
      await action('Verify Load Database modal is visible', () => expect(modal).toBeVisible(), 'Load Database modal did not appear.');
    });

    await When('no unloaded file is selected in the list', async () => {
      await action('Verify unloaded file selection validation prompt is visible', () => expect(
        modal.getByText(/Please select the unloaded file|Please check the unloaded files|언로드된 파일을 선택|언로드 파일을 선택/i)
      ).toBeVisible(), 'Selection prompt message was not visible in Load Database modal.');
    });

    await Then('the execute run button remains disabled', async () => {
      await action('Verify Load Database run button is disabled', () => expect(page.getByTestId('load-database-run-btn')).toBeDisabled(), 'Load Database run button was not disabled.');
      await action('Click Cancel button on Load Database modal', () => page.getByTestId('load-database-cancel-btn').click(), 'Could not click Cancel button on Load Database modal.');
      await action('Verify Load Database modal is dismissed', () => expect(modal).not.toBeVisible(), 'Load Database modal remained open after clicking Cancel.');
    });
  });
});
