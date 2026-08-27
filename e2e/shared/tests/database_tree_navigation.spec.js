const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { Given, When, Then, And, bddMeta, action } = require('../bdd');

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
      await action('Verify database tree container is authorized', () => expect(page.locator('#db-tree-container')).toHaveAttribute('data-authorized', 'true'), 'Database tree container was not authorized.');
    });

    await When('the user single clicks a database item', async () => {
      await action('Select database ' + E2E_DB + ' in tree', () => dbTree.selectDatabase(E2E_DB), 'Could not select database in tree.');
    });

    await Then('the dashboard tab is not automatically opened', async () => {
      await action('Verify dashboard tab is not opened', () => expect(page.getByTestId(`tab-db:${hostUid}:${E2E_DB}`)).not.toBeVisible(), 'Database dashboard tab was unexpectedly opened.');
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
      await action('Verify database tree container is authorized', () => expect(page.locator('#db-tree-container')).toHaveAttribute('data-authorized', 'true'), 'Database tree container was not authorized.');
    });

    await When('the user expands the database node', async () => {
      await action('Expand database ' + E2E_DB + ' node', () => dbTree.expandDatabase(E2E_DB), 'Could not expand database node in tree.');
    });

    await Then('Users, Job automation, and Space categories are visible', async () => {
      await action('Verify Users sub-node is visible', () => expect(dbTree.subNode(E2E_DB, 'Users')).toBeVisible({ timeout: 10000 }), 'Users sub-node was not visible.');
      await action('Verify Job automation sub-node is visible', () => expect(dbTree.subNode(E2E_DB, 'Job automation')).toBeVisible({ timeout: 10000 }), 'Job automation sub-node was not visible.');
      await action('Verify Space sub-node is visible', () => expect(dbTree.subNode(E2E_DB, 'Space')).toBeVisible({ timeout: 10000 }), 'Space sub-node was not visible.');
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
      await action('Verify database tree container is authorized', () => expect(page.locator('#db-tree-container')).toHaveAttribute('data-authorized', 'true'), 'Database tree container was not authorized.');
    });

    await When('the user double-clicks the database item', async () => {
      await action('Double-click database ' + E2E_DB + ' to open dashboard tab', () => dbTree.openDashboardTab(E2E_DB, hostUid), 'Could not double-click database to open dashboard tab.');
    });

    await Then('the database dashboard tab is opened and rendered', async () => {
      await action('Verify database dashboard tab is opened', () => expect(page.getByTestId(`tab-db:${hostUid}:${E2E_DB}`)).toBeVisible({ timeout: 10000 }), 'Database dashboard tab did not open.');
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
      await action('Verify database tree container is authorized', () => expect(page.locator('#db-tree-container')).toHaveAttribute('data-authorized', 'true'), 'Database tree container was not authorized.');
    });

    await When('the user right-clicks the database', async () => {
      await action('Right-click database ' + E2E_DB + ' to open context menu', () => dbTree.openContextMenu(E2E_DB), 'Could not open context menu for database.');
    });

    await Then('the context menu options are displayed', async () => {
      await action('Verify context menu options are displayed', () => expect(page.getByRole('button', { name: /Database Info|Property/i }).first()).toBeVisible({ timeout: 5000 }), 'Database context menu options were not visible.');
      await action('Dismiss context menu', () => page.keyboard.press('Escape'), 'Could not dismiss context menu.');
    });
  });
});
