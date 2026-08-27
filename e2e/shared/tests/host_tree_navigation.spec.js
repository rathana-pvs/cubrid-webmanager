const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { Given, When, Then, And, bddMeta, action } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';

test.describe('Feature: Host Tree Navigation', () => {
  test.beforeEach(async ({ appPage: page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);
  });

  test('Scenario: Single clicking a host selects it without logging in', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Host Management',
      feature: 'Tree Navigation',
      story: 'Single Click Host Selection',
    });

    const hostTree = new HostTreePage(page);
    let host;

    await Given('a registered host is visible in the tree', async () => {
      host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
      await action('Verify host is visible in tree: ' + E2E_HOST_ADDRESS + ':' + E2E_HOST_PORT, () => expect(host).toBeVisible({ timeout: 10000 }), 'Host was not found in host tree.');
    });

    await When('the user performs a single click on the host item', async () => {
      await action('Single click host item', () => host.click(), 'Host item was not clickable.');
    });

    await Then('the host is selected but the database tree remains unauthorized', async () => {
      await action('Verify database tree remains unauthorized', () => expect(page.locator('#db-tree-container')).not.toHaveAttribute('data-authorized', 'true'), 'Database tree was unexpectedly authorized on single click.');
    });
  });

  test('Scenario: Clicking a group header expands and collapses the group accordion', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Host Management',
      feature: 'Tree Navigation',
      story: 'Group Accordion Toggle',
    });

    const groupName = `E2E_NavGroup_${Date.now().toString().slice(-6)}`;
    let group;

    await Given('a host group is created in the tree', async () => {
      await action('Click New Group toolbar button', () => page.getByTestId('new-group-toolbar-btn').click(), 'New Group button was not clickable.');
      await action('Fill group name: ' + groupName, () => page.locator('input[name="groupName"]').fill(groupName), 'Could not type into group name input field.');
      await action('Click Create Group button', () => page.getByRole('button', { name: /Create Group/i }).click(), 'Create Group button was not clickable.');
      await action('Verify Create Group dialog is closed', () => expect(page.locator('div[role="dialog"]')).not.toBeVisible({ timeout: 10000 }), 'Create Group dialog did not close.');

      group = page.locator('#host-section').locator('details').filter({ hasText: groupName }).first();
      await action('Verify created group is visible in host tree: ' + groupName, () => expect(group).toBeVisible({ timeout: 10000 }), 'Created group was not found in host tree.');
    });

    await When('the user clicks the group summary accordion', async () => {
      await action('Click group accordion summary', () => group.locator('> summary').click(), 'Group accordion summary was not clickable.');
    });

    await Then('the group expands to show its contents', async () => {
      await action('Verify group accordion expands (open=true)', () => expect(group).toHaveJSProperty('open', true), 'Group accordion did not expand.');
    });
  });

  test('Scenario: Right clicking a host opens the host context menu with Edit and Delete options', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Host Management',
      feature: 'Tree Navigation',
      story: 'Host Context Menu',
    });

    const hostTree = new HostTreePage(page);
    let host;

    await Given('a host item is displayed in the tree', async () => {
      host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
      await action('Verify host is visible in tree: ' + E2E_HOST_ADDRESS + ':' + E2E_HOST_PORT, () => expect(host).toBeVisible({ timeout: 10000 }), 'Host was not found in host tree.');
    });

    await When('the user right-clicks the host item', async () => {
      await action('Right-click host item', () => host.click({ button: 'right' }), 'Could not right-click host item.');
    });

    await Then('the context menu options for Edit Host and Delete Host are displayed', async () => {
      await action('Verify Edit Host option is visible in context menu', () => expect(page.getByRole('button', { name: /Edit Host/i })).toBeVisible(), 'Edit Host menu option was not visible.');
      await action('Verify Delete Host option is visible in context menu', () => expect(page.getByRole('button', { name: /Delete Host/i })).toBeVisible(), 'Delete Host menu option was not visible.');
      await action('Close context menu with Escape key', () => page.keyboard.press('Escape'), 'Could not send Escape key to close context menu.');
    });
  });
});
