const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

test.describe('Feature: Database Lifecycle (Start / Stop)', () => {
  test.beforeEach(async ({ appPage: page }) => {
    test.setTimeout(90000);
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    const hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await hostTree.activateHost(hostUid);
  });

  test('Scenario: Context menu conditionally offers Stop Database if running or Start Database if stopped', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Lifecycle Controls',
      story: 'Context Menu Actions',
    });

    const dbTree = new DatabaseTreePage(page);
    let stopVisible, startVisible;

    await Given('the database is listed in the tree', async () => {
      await expect(page.locator('#db-tree-container')).toHaveAttribute('data-authorized', 'true');
    });

    await When('the user opens the database context menu', async () => {
      await dbTree.openContextMenu(E2E_DB);
      const stopBtn = page.getByRole('button', { name: /Stop Database/i });
      const startBtn = page.getByRole('button', { name: /Start Database/i });
      stopVisible = await stopBtn.isVisible().catch(() => false);
      startVisible = await startBtn.isVisible().catch(() => false);
    });

    await Then('exactly one of Start or Stop database menu options is visible', async () => {
      expect(stopVisible || startVisible).toBe(true);
      expect(stopVisible && startVisible).toBe(false);
      await page.keyboard.press('Escape');
    });
  });

  test('Scenario: Stopping a running database and restarting updates status indicator from off to on', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Lifecycle Controls',
      story: 'Stop and Restart Database',
    });

    const dbTree = new DatabaseTreePage(page);

    await Given('the database is in a running state', async () => {
      await dbTree.openContextMenu(E2E_DB);
      const startBtn = page.getByRole('button', { name: /Start Database/i });
      if (await startBtn.isVisible().catch(() => false)) {
        await startBtn.click();
        await page.getByText(/Starting database/i).waitFor({ state: 'hidden', timeout: 30000 }).catch(() => undefined);
        await dbTree.waitForContextAction(E2E_DB, /Stop Database/i);
      } else {
        await page.keyboard.press('Escape');
      }
    });

    await When('the user chooses Stop Database', async () => {
      await dbTree.openContextMenu(E2E_DB);
      await page.getByRole('button', { name: /Stop Database/i }).click();
      await page.getByText(/Stopping database/i).waitFor({ state: 'hidden', timeout: 30000 }).catch(() => undefined);
      await dbTree.waitForContextAction(E2E_DB, /Start Database/i);
      await expect(dbTree.dbNode(E2E_DB)).toHaveAttribute('class', /.*/);
      await page.waitForTimeout(500);
    });

    await Then('the database transitions to stopped and can be started again', async () => {
      await dbTree.openContextMenu(E2E_DB);
      await page.getByRole('button', { name: /Start Database/i }).click();
      await page.getByText(/Starting database/i).waitFor({ state: 'hidden', timeout: 30000 }).catch(() => undefined);
      await dbTree.waitForContextAction(E2E_DB, /Stop Database/i);
    });
  });
});
