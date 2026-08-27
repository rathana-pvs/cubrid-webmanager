const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { Given, When, Then, And, bddMeta, action } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';

test.describe('Feature: Edit Host', () => {
  test.beforeEach(async ({ appPage: page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);
  });

  test('Scenario: Clearing host alias displays required field validation error', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Host Management',
      feature: 'Edit Host',
      story: 'Alias Validation',
    });

    let modal;
    let host;

    await Given('the user opens Edit Host modal for an existing host', async () => {
      host = page.locator(`#host-section [title="${E2E_HOST_ADDRESS}:${E2E_HOST_PORT}"]`);
      await action('Verify host row is visible: ' + E2E_HOST_ADDRESS + ':' + E2E_HOST_PORT, () => expect(host).toBeVisible({ timeout: 10000 }), 'Host row was not found in host tree.');
      await action('Right-click host row', () => host.click({ button: 'right' }), 'Could not right-click host row.');
      await action('Click Edit Host context menu item', () => page.getByRole('button', { name: /Edit Host/i }).click(), 'Edit Host menu item was not clickable.');

      modal = page.getByTestId('edit-host-modal');
      await action('Verify Edit Host modal is visible', () => expect(modal).toBeVisible(), 'Edit Host modal did not open.');
      await action('Wait for modal animation', () => page.waitForTimeout(500), 'Failed waiting for modal animation.');
    });

    await When('the user clears the host alias and clicks Save', async () => {
      await action('Clear host alias input', () => modal.locator('[name="alias"]').fill(''), 'Could not clear host alias input field.');
      await action('Click Save button', () => page.getByTestId('edit-host-save-btn').click(), 'Save button was not clickable.');
    });

    await Then('a host name required error is displayed', async () => {
      await action('Verify "Host name is required" validation error is displayed', () => expect(modal.getByText('Host name is required')).toBeVisible(), 'Host name required error was not displayed.');
    });

    await And('the user can discard changes and close modal', async () => {
      await action('Click Cancel button to discard changes', () => page.getByTestId('edit-host-cancel-btn').click(), 'Cancel button was not clickable.');
      await action('Verify Edit Host modal is closed', () => expect(modal).not.toBeVisible(), 'Edit Host modal did not close after clicking Cancel.');
    });
  });

  test('Scenario: Modifying host alias updates the display name in the tree', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Host Management',
      feature: 'Edit Host',
      story: 'Update Alias',
    });

    const newAlias = `E2E_Host_Renamed_${Date.now().toString().slice(-6)}`;
    let host;

    await Given('the user opens the Edit Host modal', async () => {
      host = page.locator(`#host-section [title="${E2E_HOST_ADDRESS}:${E2E_HOST_PORT}"]`);
      await action('Verify host row is visible: ' + E2E_HOST_ADDRESS + ':' + E2E_HOST_PORT, () => expect(host).toBeVisible({ timeout: 10000 }), 'Host row was not found in host tree.');
      await action('Right-click host row', () => host.click({ button: 'right' }), 'Could not right-click host row.');
      await action('Click Edit Host context menu item', () => page.getByRole('button', { name: /Edit Host/i }).click(), 'Edit Host menu item was not clickable.');
    });

    await When('the user enters a new alias and saves changes', async () => {
      const modal = page.getByTestId('edit-host-modal');
      await action('Fill new host alias: ' + newAlias, () => modal.locator('[name="alias"]').fill(newAlias), 'Could not type new alias into host alias field.');
      await action('Click Save button', () => page.getByTestId('edit-host-save-btn').click(), 'Save button was not clickable.');
      await action('Verify Edit Host modal is closed', () => expect(modal).not.toBeVisible({ timeout: 10000 }), 'Edit Host modal did not close after saving.');
    });

    await Then('the host tree displays the updated alias', async () => {
      await action('Verify updated host alias appears in host tree: ' + newAlias, () => expect(page.locator('#host-section').getByText(newAlias)).toBeVisible({ timeout: 10000 }), 'Updated host alias was not found in host tree.');
    });
  });
});
