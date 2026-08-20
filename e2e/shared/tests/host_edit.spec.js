const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

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
      await expect(host).toBeVisible({ timeout: 10000 });
      await host.click({ button: 'right' });
      await page.getByRole('button', { name: /Edit Host/i }).click();

      modal = page.getByTestId('edit-host-modal');
      await expect(modal).toBeVisible();
      await page.waitForTimeout(500);
    });

    await When('the user clears the host alias and clicks Save', async () => {
      await modal.locator('[name="alias"]').fill('');
      await page.getByTestId('edit-host-save-btn').click();
    });

    await Then('a host name required error is displayed', async () => {
      await expect(modal.getByText('Host name is required')).toBeVisible();
    });

    await And('the user can discard changes and close modal', async () => {
      await page.getByTestId('edit-host-cancel-btn').click();
      await expect(modal).not.toBeVisible();
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
      await expect(host).toBeVisible({ timeout: 10000 });
      await host.click({ button: 'right' });
      await page.getByRole('button', { name: /Edit Host/i }).click();
    });

    await When('the user enters a new alias and saves changes', async () => {
      const modal = page.getByTestId('edit-host-modal');
      await modal.locator('[name="alias"]').fill(newAlias);
      await page.getByTestId('edit-host-save-btn').click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });
    });

    await Then('the host tree displays the updated alias', async () => {
      await expect(page.locator('#host-section').getByText(newAlias)).toBeVisible({ timeout: 10000 });
    });
  });
});
