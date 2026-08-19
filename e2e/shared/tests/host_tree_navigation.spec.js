const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

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
      await expect(host).toBeVisible({ timeout: 10000 });
    });

    await When('the user performs a single click on the host item', async () => {
      await host.click();
    });

    await Then('the host is selected but the database tree remains unauthorized', async () => {
      await expect(page.locator('#db-tree-container')).not.toHaveAttribute('data-authorized', 'true');
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
      await page.getByTestId('new-group-toolbar-btn').click();
      await page.locator('input[name="groupName"]').fill(groupName);
      await page.getByRole('button', { name: /Create Group/i }).click();
      await expect(page.locator('div[role="dialog"]')).not.toBeVisible({ timeout: 10000 });

      group = page.locator('#host-section').locator('details').filter({ hasText: groupName }).first();
      await expect(group).toBeVisible({ timeout: 10000 });
    });

    await When('the user clicks the group summary accordion', async () => {
      await group.locator('> summary').click();
    });

    await Then('the group expands to show its contents', async () => {
      await expect(group).toHaveJSProperty('open', true);
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
      await expect(host).toBeVisible({ timeout: 10000 });
    });

    await When('the user right-clicks the host item', async () => {
      await host.click({ button: 'right' });
    });

    await Then('the context menu options for Edit Host and Delete Host are displayed', async () => {
      await expect(page.getByRole('button', { name: /Edit Host/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Delete Host/i })).toBeVisible();
      await page.keyboard.press('Escape');
    });
  });
});
