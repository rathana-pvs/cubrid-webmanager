const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { Given, When, Then, And, bddMeta, action } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';

test.describe('Feature: Add Host', () => {
  test.beforeEach(async ({ appPage: page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);
  });

  test('Scenario: Attempting to connect with empty form displays required field errors', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Host Management',
      feature: 'Add Host',
      story: 'Form Validation',
    });

    let modal;

    await Given('the user opens the Add Host dialog', async () => {
      await action('Click Add Host toolbar button', () => page.getByTestId('add-host-toolbar-btn').click(), 'Add Host toolbar button was not clickable.');
      modal = page.getByTestId('add-host-modal');
      await action('Verify Add Host modal is visible', () => expect(modal).toBeVisible(), 'Add Host modal did not open.');
    });

    await When('the user clicks Test Connection & Save without filling inputs', async () => {
      await action('Click Test Connection & Save button with empty inputs', () => page.getByTestId('add-host-connect-save-btn').click(), 'Test Connection & Save button was not clickable.');
    });

    await Then('required validation errors for name, address, username, and password appear', async () => {
      await action('Verify "Host name is required" error is displayed', () => expect(modal.getByText('Host name is required')).toBeVisible(), 'Host name required error was not displayed.');
      await action('Verify "Address is required" error is displayed', () => expect(modal.getByText('Address is required')).toBeVisible(), 'Address required error was not displayed.');
      await action('Verify "Username is required" error is displayed', () => expect(modal.getByText('Username is required')).toBeVisible(), 'Username required error was not displayed.');
      await action('Verify "Password is required" error is displayed', () => expect(modal.getByText('Password is required')).toBeVisible(), 'Password required error was not displayed.');
    });

    await And('the user discards and closes the modal', async () => {
      await action('Click Cancel button to discard modal', () => page.getByTestId('add-host-cancel-btn').click(), 'Cancel button was not clickable.');
      await action('Verify Add Host modal is closed', () => expect(modal).not.toBeVisible(), 'Add Host modal did not close after clicking Cancel.');
    });
  });

  test('Scenario: Saving a host with Save Only registers it without immediate login', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Host Management',
      feature: 'Add Host',
      story: 'Save Only Host',
    });

    const alias = `E2E_SaveOnly_${Date.now().toString().slice(-6)}`;
    const address = `10.1.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

    await Given('the user opens the Add Host dialog', async () => {
      await action('Click Add Host toolbar button', () => page.getByTestId('add-host-toolbar-btn').click(), 'Add Host toolbar button was not clickable.');
    });

    await When('the user fills valid host information and clicks Save Only', async () => {
      const modal = page.getByTestId('add-host-modal');
      await action('Fill host alias: ' + alias, () => modal.locator('[name="alias"]').fill(alias), 'Could not type into host alias input field.');
      await action('Fill host address: ' + address, () => modal.locator('[name="address"]').fill(address), 'Could not type into host address input field.');
      await action('Fill host port: 9999', () => modal.locator('[name="port"]').fill('9999'), 'Could not type into host port input field.');
      await action('Fill host username: admin', () => modal.locator('[name="id"]').fill('admin'), 'Could not type into host username input field.');
      await action('Fill host password: ••••••••', () => modal.locator('[name="password"]').fill('placeholder_pw'), 'Could not type into host password input field.');
      await action('Click Save Only button', () => page.getByTestId('add-host-save-btn').click(), 'Save Only button was not clickable.');
      await action('Verify Add Host modal is closed', () => expect(modal).not.toBeVisible({ timeout: 10000 }), 'Add Host modal did not close after saving.');
    });

    await Then('the newly saved host appears in the host list', async () => {
      await action('Verify newly saved host appears in host list: ' + alias, () => expect(page.locator('#host-section').getByText(alias)).toBeVisible({ timeout: 10000 }), 'Saved host ' + alias + ' was not found in host list.');
    });
  });

  test('Scenario: Adding a duplicate host address displays duplicate error message', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Host Management',
      feature: 'Add Host',
      story: 'Duplicate Host Prevention',
    });

    const alias1 = `E2E_Dup1_${Date.now().toString().slice(-6)}`;
    const alias2 = `E2E_Dup2_${Date.now().toString().slice(-6)}`;
    const address = `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

    await Given('a host with a specific address already exists in the system', async () => {
      await action('Click Add Host toolbar button', () => page.getByTestId('add-host-toolbar-btn').click(), 'Add Host toolbar button was not clickable.');
      const modal = page.getByTestId('add-host-modal');
      await action('Fill host alias: ' + alias1, () => modal.locator('[name="alias"]').fill(alias1), 'Could not type into host alias input field.');
      await action('Fill host address: ' + address, () => modal.locator('[name="address"]').fill(address), 'Could not type into host address input field.');
      await action('Fill host port: 8001', () => modal.locator('[name="port"]').fill('8001'), 'Could not type into host port input field.');
      await action('Fill host username: admin', () => modal.locator('[name="id"]').fill('admin'), 'Could not type into host username input field.');
      await action('Fill host password: ••••••••', () => modal.locator('[name="password"]').fill('placeholder_pw'), 'Could not type into host password input field.');
      await action('Click Save Only button', () => page.getByTestId('add-host-save-btn').click(), 'Save Only button was not clickable.');
      await action('Verify Add Host modal is closed', () => expect(modal).not.toBeVisible({ timeout: 10000 }), 'Add Host modal did not close after saving.');
    });

    await When('the user tries to add another host with the exact same address and port', async () => {
      await action('Click Add Host toolbar button for duplicate host', () => page.getByTestId('add-host-toolbar-btn').click(), 'Add Host toolbar button was not clickable.');
      const modal = page.getByTestId('add-host-modal');
      await action('Fill duplicate host alias: ' + alias2, () => modal.locator('[name="alias"]').fill(alias2), 'Could not type into host alias input field.');
      await action('Fill same address: ' + address, () => modal.locator('[name="address"]').fill(address), 'Could not type into host address input field.');
      await action('Fill same port: 8001', () => modal.locator('[name="port"]').fill('8001'), 'Could not type into host port input field.');
      await action('Fill host username: admin', () => modal.locator('[name="id"]').fill('admin'), 'Could not type into host username input field.');
      await action('Fill host password: ••••••••', () => modal.locator('[name="password"]').fill('placeholder_pw'), 'Could not type into host password input field.');
      await action('Click Save Only button', () => page.getByTestId('add-host-save-btn').click(), 'Save Only button was not clickable.');
    });

    await Then('a duplicate host error message is displayed and modal stays open', async () => {
      const modal = page.getByTestId('add-host-modal');
      await action('Verify duplicate host error message is displayed', () => expect(modal.getByText(/already registered|already exists|duplicate/i)).toBeVisible({ timeout: 10000 }), 'Duplicate host error message was not displayed.');
    });
  });
});
