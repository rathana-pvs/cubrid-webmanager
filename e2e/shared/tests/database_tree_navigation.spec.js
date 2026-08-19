const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

test.describe('Feature: Database Tree Navigation', () => {
  let hostUid;

  test.beforeEach(async ({ appPage: page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await hostTree.activateHost(hostUid);
    const dbTree = new DatabaseTreePage(page);
  });

  test('Scenario: Single clicking a database selects it without opening a dashboard tab', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Tree',
      story: 'Database Selection',
    });

    const dbTree = new DatabaseTreePage(page);

    await Given('the database tree is authorized and visible', async () => {
      await expect(page.locator('#db-tree-container')).toHaveAttribute('data-authorized', 'true');
    });

    await When('the user single clicks a database item', async () => {
      await dbTree.selectDatabase(E2E_DB);
    });

    await Then('the dashboard tab is not automatically opened', async () => {
      await expect(page.getByTestId(`tab-db:${hostUid}:${E2E_DB}`)).not.toBeVisible();
    });
  });

  test('Scenario: Expanding a database node reveals Users, Job automation, and Space sub-nodes', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Tree',
      story: 'Database Sub-node Expansion',
    });

    const dbTree = new DatabaseTreePage(page);

    await Given('the database is listed in the tree', async () => {
      await expect(page.locator('#db-tree-container')).toHaveAttribute('data-authorized', 'true');
    });

    await When('the user expands the database node', async () => {
      await dbTree.expandDatabase(E2E_DB);
    });

    await Then('Users, Job automation, and Space categories are visible', async () => {
      await expect(dbTree.subNode(E2E_DB, 'Users')).toBeVisible({ timeout: 10000 });
      await expect(dbTree.subNode(E2E_DB, 'Job automation')).toBeVisible({ timeout: 10000 });
      await expect(dbTree.subNode(E2E_DB, 'Space')).toBeVisible({ timeout: 10000 });
    });
  });

  test('Scenario: Double clicking a database item opens its dashboard tab', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Tree',
      story: 'Open Database Dashboard',
    });

    const dbTree = new DatabaseTreePage(page);

    await Given('the database is present in the tree', async () => {
      await expect(page.locator('#db-tree-container')).toHaveAttribute('data-authorized', 'true');
    });

    await When('the user double-clicks the database item', async () => {
      await dbTree.openDashboardTab(E2E_DB, hostUid);
    });

    await Then('the database dashboard tab is opened and rendered', async () => {
      await expect(page.getByTestId(`tab-db:${hostUid}:${E2E_DB}`)).toBeVisible({ timeout: 10000 });
    });
  });

  test('Scenario: Right clicking a database opens the database context menu', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Tree',
      story: 'Database Context Menu',
    });

    const dbTree = new DatabaseTreePage(page);

    await Given('the database node is visible', async () => {
      await expect(page.locator('#db-tree-container')).toHaveAttribute('data-authorized', 'true');
    });

    await When('the user right-clicks the database', async () => {
      await dbTree.openContextMenu(E2E_DB);
    });

    await Then('the context menu options are displayed', async () => {
      await expect(page.getByRole('button', { name: /Database Info|Property/i }).first()).toBeVisible({ timeout: 5000 });
      await page.keyboard.press('Escape');
    });
  });
});
