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

test.describe('Feature: Database Rename & Copy', () => {
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

  test('Scenario: Rename Database modal enforces name changes and validates execution actionability', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Lifecycle',
      story: 'Rename Database Validation',
    });

    let modal;

    await Given('the user checks database active state', async () => {
      await action('Open context menu for database ' + E2E_DB, () => dbTree.openContextMenu(E2E_DB), 'Could not open database context menu.');
      const isActive = await page.getByRole('button', { name: /Stop Database/i }).isVisible().catch(() => false);
      if (isActive) {
        await action('Hover Manage Database menu item', () => page.getByRole('button', { name: 'Manage Database' }).hover(), 'Could not hover Manage Database menu item.');
        await action('Verify Rename Database option is disabled when database is running', () => expect(page.getByRole('button', { name: /Rename Database/i })).toBeDisabled(), 'Rename Database option was not disabled for running database.');
        await action('Dismiss context menu', () => page.keyboard.press('Escape'), 'Could not dismiss context menu.');
        return;
      }
      await action('Select Rename Database from manage menu', () => dbTree.clickManageDatabaseItem(E2E_DB, 'Rename Database'), 'Could not select Rename Database from menu.');
      modal = page.getByTestId('rename-database-modal');
      await action('Verify Rename Database modal is visible', () => expect(modal).toBeVisible(), 'Rename Database modal did not appear.');
    });

    await When('the user opens the rename modal and enters a new name', async () => {
      if (!modal) return;
      await action('Verify execute button is initially disabled in rename modal', () => expect(page.getByTestId('rename-database-execute-btn')).toBeDisabled(), 'Rename execute button was unexpectedly enabled.');
      await action('Fill new database name with: ' + E2E_DB + '_v2', () => page.getByTestId('rename-database-new-name-input').fill(`${E2E_DB}_v2`), 'Could not fill new database name.');
    });

    await Then('the execute button is enabled and changes can be discarded', async () => {
      if (!modal) return;
      await action('Verify execute button is enabled after entering new name', () => expect(page.getByTestId('rename-database-execute-btn')).toBeEnabled(), 'Rename execute button was not enabled.');
      await action('Click Cancel button on rename database modal', () => page.getByTestId('rename-database-cancel-btn').click(), 'Could not click Cancel button on rename database modal.');
      await action('Verify Rename Database modal is closed', () => expect(modal).not.toBeVisible(), 'Rename Database modal did not close after clicking cancel.');
    });
  });

  test('Scenario: Copy Database initiates an asynchronous database replication background task', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Lifecycle',
      story: 'Copy Database Replication',
    });

    test.setTimeout(120000);
    const cloneName = `e2e_clone_${Date.now().toString().slice(-6)}`;
    let copyModal;

    await Given('the source database is stopped to prepare for replication', async () => {
      const dbNode = dbTree.dbNode(E2E_OFFLINE_DB);
      await expect(dbNode).toBeVisible({ timeout: 15000 });
      const currentStatus = await dbNode.getAttribute('data-status');
      if (currentStatus === 'on') {
        await action('Open context menu for database ' + E2E_OFFLINE_DB, () => dbTree.openContextMenu(E2E_OFFLINE_DB), 'Could not open database context menu.');
        const stopBtn = page.getByRole('button', { name: /Stop Database|데이터베이스 정지|데이터베이스 중지/i });
        if (await stopBtn.isVisible().catch(() => false)) {
          await action('Click Stop Database button', () => stopBtn.click(), 'Could not click Stop Database button.');
          await page.waitForTimeout(1000);
          await page.getByTestId('loading-overlay').waitFor({ state: 'hidden', timeout: 45000 }).catch(() => undefined);
          await dismissJobResultModal(page);
        }
      }
      await action('Verify source database is stopped', () => expect(dbTree.dbNode(E2E_OFFLINE_DB)).toHaveAttribute('data-status', 'off', { timeout: 30000 }), 'Database was not stopped.');
    });

    await When('the user opens Copy Database and fills destination name', async () => {
      await action('Select Copy Database from manage menu', () => dbTree.clickManageDatabaseItem(E2E_OFFLINE_DB, 'Copy Database'), 'Could not select Copy Database from menu.');
      copyModal = page.getByTestId('copy-database-modal');
      await action('Verify Copy Database modal is visible', () => expect(copyModal).toBeVisible(), 'Copy Database modal did not appear.');
      await action('Fill destination database name with: ' + cloneName, () => page.getByTestId('copy-database-dest-name-input').fill(cloneName), 'Could not fill destination database name.');
      await action('Click execute button to start database copy', () => page.getByTestId('copy-database-execute-btn').click(), 'Could not click execute button on Copy Database modal.');
    });

    await Then('the replication task begins displaying progress banner', async () => {
      await action('Verify Copying Database progress banner is visible', () => expect(page.getByText(/Copying Database|데이터베이스 복사 중/i)).toBeVisible({ timeout: 15000 }), 'Copying Database progress banner did not appear.');
      await action('Verify destination database name ' + cloneName + ' is visible in progress banner', () => expect(page.getByText(cloneName).first()).toBeVisible(), 'Destination database name was not displayed in replication banner.');
      await dismissJobResultModal(page);
    });
  });
});
