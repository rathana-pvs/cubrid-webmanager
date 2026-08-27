const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { Given, When, Then, And, bddMeta, action } = require('../bdd');

test.describe('Feature: Delete Host', () => {
  test.beforeEach(async ({ appPage: page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);
  });

  test('Scenario: Confirming host deletion removes it from the host tree', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Host Management',
      feature: 'Delete Host',
      story: 'Delete Host Success',
    });

    const alias = `E2E_ToDelete_${Date.now().toString().slice(-6)}`;
    const address = `10.2.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    let hostItem;

    await Given('a host exists in the host list', async () => {
      await action('Click Add Host toolbar button', () => page.getByTestId('add-host-toolbar-btn').click(), 'Add Host toolbar button was not clickable.');
      const addModal = page.getByTestId('add-host-modal');
      await action('Fill host alias: ' + alias, () => addModal.locator('[name="alias"]').fill(alias), 'Could not type host alias.');
      await action('Fill host address: ' + address, () => addModal.locator('[name="address"]').fill(address), 'Could not type host address.');
      await action('Fill host port: 8001', () => addModal.locator('[name="port"]').fill('8001'), 'Could not type host port.');
      await action('Fill host username: admin', () => addModal.locator('[name="id"]').fill('admin'), 'Could not type host username.');
      await action('Fill host password: ••••••••', () => addModal.locator('[name="password"]').fill('placeholder_pw'), 'Could not type host password.');
      await action('Click Save Only button', () => page.getByTestId('add-host-save-btn').click(), 'Save button was not clickable.');
      await action('Verify Add Host modal is closed', () => expect(addModal).not.toBeVisible({ timeout: 10000 }), 'Add Host modal did not close.');

      hostItem = page.locator('#host-section').getByText(alias).first();
      await action('Verify created host is visible in host tree: ' + alias, () => expect(hostItem).toBeVisible({ timeout: 10000 }), 'Created host was not found in host tree.');
    });

    await When('the user right-clicks the host and confirms Delete Host', async () => {
      await action('Right-click host item: ' + alias, () => hostItem.click({ button: 'right' }), 'Could not right-click host item.');
      await action('Click Delete Host context menu item', () => page.getByRole('button', { name: /Delete Host/i }).click(), 'Delete Host context menu item was not clickable.');

      const modal = page.getByTestId('delete-host-modal');
      await action('Verify Delete Host confirmation modal is visible', () => expect(modal).toBeVisible(), 'Delete Host modal did not open.');
      await action('Click Confirm Delete button', () => page.getByTestId('delete-host-confirm-btn').click(), 'Confirm Delete button was not clickable.');
      await action('Verify Delete Host modal is closed', () => expect(modal).not.toBeVisible({ timeout: 10000 }), 'Delete Host modal did not close.');
    });

    await Then('the host is permanently removed from the host tree', async () => {
      await action('Verify host is removed from host tree: ' + alias, () => expect(hostItem).not.toBeVisible({ timeout: 5000 }), 'Host remained visible in host tree after deletion.');
    });
  });

  test('Scenario: Cancelling host deletion preserves the host in the tree', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Host Management',
      feature: 'Delete Host',
      story: 'Cancel Host Deletion',
    });

    const alias = `E2E_KeepHost_${Date.now().toString().slice(-6)}`;
    const address = `10.3.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    let hostItem;

    await Given('a host is displayed in the list', async () => {
      await action('Click Add Host toolbar button', () => page.getByTestId('add-host-toolbar-btn').click(), 'Add Host toolbar button was not clickable.');
      const addModal = page.getByTestId('add-host-modal');
      await action('Fill host alias: ' + alias, () => addModal.locator('[name="alias"]').fill(alias), 'Could not type host alias.');
      await action('Fill host address: ' + address, () => addModal.locator('[name="address"]').fill(address), 'Could not type host address.');
      await action('Fill host port: 8001', () => addModal.locator('[name="port"]').fill('8001'), 'Could not type host port.');
      await action('Fill host username: admin', () => addModal.locator('[name="id"]').fill('admin'), 'Could not type host username.');
      await action('Fill host password: ••••••••', () => addModal.locator('[name="password"]').fill('placeholder_pw'), 'Could not type host password.');
      await action('Click Save Only button', () => page.getByTestId('add-host-save-btn').click(), 'Save button was not clickable.');
      await action('Verify Add Host modal is closed', () => expect(addModal).not.toBeVisible({ timeout: 10000 }), 'Add Host modal did not close.');

      hostItem = page.locator('#host-section').getByText(alias).first();
      await action('Verify created host is visible in host tree: ' + alias, () => expect(hostItem).toBeVisible({ timeout: 10000 }), 'Created host was not found in host tree.');
    });

    await When('the user opens Delete Host dialog and clicks Cancel', async () => {
      await action('Right-click host item: ' + alias, () => hostItem.click({ button: 'right' }), 'Could not right-click host item.');
      await action('Click Delete Host context menu item', () => page.getByRole('button', { name: /Delete Host/i }).click(), 'Delete Host context menu item was not clickable.');

      const modal = page.getByTestId('delete-host-modal');
      await action('Click Cancel button on delete modal', () => page.getByTestId('delete-host-cancel-btn').click(), 'Cancel button was not clickable.');
      await action('Verify Delete Host modal is closed', () => expect(modal).not.toBeVisible(), 'Delete Host modal did not close after clicking Cancel.');
    });

    await Then('the host remains intact in the list', async () => {
      await action('Verify host remains visible in host tree: ' + alias, () => expect(hostItem).toBeVisible(), 'Host was unexpectedly removed from host tree after cancelling deletion.');
    });
  });
});
