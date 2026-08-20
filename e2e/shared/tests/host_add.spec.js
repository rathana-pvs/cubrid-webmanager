const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

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
      await page.getByTestId('add-host-toolbar-btn').click();
      modal = page.getByTestId('add-host-modal');
      await expect(modal).toBeVisible();
    });

    await When('the user clicks Test Connection & Save without filling inputs', async () => {
      await page.getByTestId('add-host-connect-save-btn').click();
    });

    await Then('required validation errors for name, address, username, and password appear', async () => {
      await expect(modal.getByText('Host name is required')).toBeVisible();
      await expect(modal.getByText('Address is required')).toBeVisible();
      await expect(modal.getByText('Username is required')).toBeVisible();
      await expect(modal.getByText('Password is required')).toBeVisible();
    });

    await And('the user discards and closes the modal', async () => {
      await page.getByTestId('add-host-cancel-btn').click();
      await expect(modal).not.toBeVisible();
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
      await page.getByTestId('add-host-toolbar-btn').click();
    });

    await When('the user fills valid host information and clicks Save Only', async () => {
      const modal = page.getByTestId('add-host-modal');
      await modal.locator('[name="alias"]').fill(alias);
      await modal.locator('[name="address"]').fill(address);
      await modal.locator('[name="port"]').fill('9999');
      await modal.locator('[name="id"]').fill('admin');
      await modal.locator('[name="password"]').fill('placeholder_pw');
      await page.getByTestId('add-host-save-btn').click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });
    });

    await Then('the newly saved host appears in the host list', async () => {
      await expect(page.locator('#host-section').getByText(alias)).toBeVisible({ timeout: 10000 });
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
      await page.getByTestId('add-host-toolbar-btn').click();
      const modal = page.getByTestId('add-host-modal');
      await modal.locator('[name="alias"]').fill(alias1);
      await modal.locator('[name="address"]').fill(address);
      await modal.locator('[name="port"]').fill('8001');
      await modal.locator('[name="id"]').fill('admin');
      await modal.locator('[name="password"]').fill('placeholder_pw');
      await page.getByTestId('add-host-save-btn').click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });
    });

    await When('the user tries to add another host with the exact same address and port', async () => {
      await page.getByTestId('add-host-toolbar-btn').click();
      const modal = page.getByTestId('add-host-modal');
      await modal.locator('[name="alias"]').fill(alias2);
      await modal.locator('[name="address"]').fill(address);
      await modal.locator('[name="port"]').fill('8001');
      await modal.locator('[name="id"]').fill('admin');
      await modal.locator('[name="password"]').fill('placeholder_pw');
      await page.getByTestId('add-host-save-btn').click();
    });

    await Then('a duplicate host error message is displayed and modal stays open', async () => {
      const modal = page.getByTestId('add-host-modal');
      await expect(modal.getByText(/already registered|already exists|duplicate/i)).toBeVisible({ timeout: 10000 });
    });
  });
});
