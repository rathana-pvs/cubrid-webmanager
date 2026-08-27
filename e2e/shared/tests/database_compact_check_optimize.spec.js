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

test.describe('Feature: Database Maintenance (Check / Compact / Optimize)', () => {
  let dbTree;
  let hostUid;
  let restartOfflineDatabase;

  async function changeOfflineDatabaseState(page, operation) {
    await dbTree.openContextMenu(E2E_OFFLINE_DB);
    const name = operation === 'stop'
      ? /Stop Database|데이터베이스 정지|데이터베이스 중지/i
      : /Start Database|데이터베이스 시작/i;
    const [response] = await Promise.all([
      page.waitForResponse(response => response.request().method() === 'POST'
        && response.url().endsWith(`/${hostUid}/database/${operation}/${encodeURIComponent(E2E_OFFLINE_DB)}`),
      { timeout: 65000 }),
      page.getByRole('button', { name }).click(),
    ]);
    const body = await response.json();
    const data = body.data || body;
    if (!response.ok()) {
      return false;
    }
    await expect(dbTree.dbNode(E2E_OFFLINE_DB)).toHaveAttribute('data-status', operation === 'stop' ? 'off' : 'on', { timeout: 10000 });
    await dismissJobResultModal(page);
    return true;
  }

  test.beforeEach(async ({ appPage: page }) => {
    restartOfflineDatabase = false;
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await hostTree.activateHost(hostUid);
    dbTree = new DatabaseTreePage(page);
    await dbTree.waitForAuthorized();
  });

  test.afterEach(async ({ appPage: page }) => {
    if (!restartOfflineDatabase) return;
    test.setTimeout(180000);
    await action(`Restore "${E2E_OFFLINE_DB}" to its original running state`, async () => {
      // A timed-out stop may still have changed CMS state. Refresh before
      // deciding whether cleanup needs to restart the database.
      await dbTree.openContextMenu(E2E_OFFLINE_DB);
      const [response] = await Promise.all([
        page.waitForResponse(response => response.request().method() === 'GET'
          && response.url().endsWith(`/${hostUid}/database/start-info`), { timeout: 65000 }),
        page.locator('.context-menu-container').getByRole('button', { name: /Refresh|새로고침/i }).click(),
      ]);
      expect(response.ok(), 'Could not refresh database state during cleanup').toBe(true);
      const body = await response.json();
      const active = (body.data || body).activelist?.active;
      expect(Array.isArray(active), 'Cleanup requires an authoritative active database list').toBe(true);
      const running = active.some(db => (typeof db === 'string' ? db : db.dbname) === E2E_OFFLINE_DB);
      const db = dbTree.dbNode(E2E_OFFLINE_DB);
      await expect(db).toHaveAttribute('data-status', running ? 'on' : 'off');
      if (!running) {
        await changeOfflineDatabaseState(page, 'start');
      }
      await expect(db).toHaveAttribute('data-status', 'on');
    });
  });

  test('Scenario: Running Check Database starts background diagnostic job', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Maintenance',
      story: 'Check Database Diagnostic',
    });

    let modal;

    await Given('the user opens the Check Database dialog from management menu', async () => {
      await action(`Open Check Database dialog for "${E2E_DB}"`, () => dbTree.clickManageDatabaseItem(E2E_DB, 'Check Database'), `Failed to open Check Database dialog for "${E2E_DB}".`);
      modal = page.getByTestId('check-database-modal');
      await action('Verify Check Database modal is visible', () => expect(modal).toBeVisible(), 'Check Database modal did not appear.');
    });

    await When('the user confirms running check database', async () => {
      await action('Click Run button on Check Database modal', () => page.getByTestId('check-database-run-btn').click(), 'Could not click Run button on Check Database modal.');
    });

    await Then('the diagnostic job launches and opens progress dialog', async () => {
      await action('Verify Check Database modal is dismissed', () => expect(modal).not.toBeVisible({ timeout: 10000 }), 'Check Database modal remained open.');
      await action('Verify diagnostic progress dialog is visible', () => expect(page.locator('div[role="dialog"]')).toBeVisible(), 'Diagnostic progress dialog did not appear.');
    });
  });

  test('Scenario: Running Compact Database initiates space reclamation job', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Maintenance',
      story: 'Compact Database Job',
    });

    let modal;

    await Given('the user opens Compact Database dialog', async () => {
      await action(`Open Compact Database dialog for "${E2E_DB}"`, () => dbTree.clickManageDatabaseItem(E2E_DB, 'Compact Database'), `Failed to open Compact Database dialog for "${E2E_DB}".`);
      modal = page.getByTestId('compact-database-modal');
      await action('Verify Compact Database modal is visible', () => expect(modal).toBeVisible(), 'Compact Database modal did not appear.');
    });

    await When('the user clicks Run Compact', async () => {
      await action('Click Run Compact button', () => page.getByTestId('compact-database-run-btn').click(), 'Could not click Run button on Compact Database modal.');
    });

    await Then('the compaction process starts', async () => {
      await action('Verify Compact Database modal is dismissed', () => expect(modal).not.toBeVisible({ timeout: 10000 }), 'Compact Database modal remained open.');
      await action('Verify compaction progress dialog is visible', () => expect(page.locator('div[role="dialog"]')).toBeVisible(), 'Compaction progress dialog did not appear.');
    });
  });

  test('Scenario: Running Optimize Database triggers index and statistics optimization', async ({ appPage: page }) => {
    test.setTimeout(180000);
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Maintenance',
      story: 'Optimize Database Job',
    });

    let modal;

    await Given('the optimization target database is stopped', async () => {
      // Optimize is a stopped-only action. Keep the shared online database
      // running for the other scenarios and use the dedicated offline target.
      const db = dbTree.dbNode(E2E_OFFLINE_DB);
      await expect(db).toHaveAttribute('data-status', /^(on|off)$/, { timeout: 15000 });
      restartOfflineDatabase = await db.getAttribute('data-status') === 'on';
      if (restartOfflineDatabase) {
        const stopped = await changeOfflineDatabaseState(page, 'stop');
        if (!stopped) {
          restartOfflineDatabase = false;
          test.skip(true, `Database "${E2E_OFFLINE_DB}" stop timed out on server; skipping offline optimization test.`);
        }
      }
      await expect(dbTree.dbNode(E2E_OFFLINE_DB),
        `Optimize Database requires "${E2E_OFFLINE_DB}" to be stopped before opening the dialog.`,
      ).toHaveAttribute('data-status', 'off', { timeout: 15000 });
    });

    await Given('the user opens Optimize Database dialog', async () => {
      await action(`Open Optimize Database dialog for "${E2E_OFFLINE_DB}"`, () => dbTree.clickManageDatabaseItem(E2E_OFFLINE_DB, 'Optimize Database'), `Failed to open Optimize Database dialog for "${E2E_OFFLINE_DB}".`);
      modal = page.getByTestId('optimize-database-modal');
      await action('Verify Optimize Database modal is visible', () => expect(modal).toBeVisible(), 'Optimize Database modal did not appear.');
    });

    await When('the user confirms running optimization', async () => {
      await action('Click Run Optimize button', () => page.getByTestId('optimize-database-run-btn').click(), 'Could not click Run button on Optimize Database modal.');
    });

    await Then('the database optimization job launches', async () => {
      await action('Verify Optimize Database modal is dismissed', () => expect(modal).not.toBeVisible({ timeout: 10000 }), 'Optimize Database modal remained open.');
      await action('Verify optimization progress dialog is visible', () => expect(page.locator('div[role="dialog"]')).toBeVisible(), 'Optimization progress dialog did not appear.');
    });

    await And('optimization completes before restoring the database state', async () => {
      await expect(page.getByRole('heading', { name: /Optimization Complete|최적화 완료/i }))
        .toBeVisible({ timeout: 65000 });
      await dismissJobResultModal(page);
    });
  });
});
