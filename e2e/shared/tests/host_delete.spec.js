const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

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
      await page.getByTestId('add-host-toolbar-btn').click();
      const addModal = page.getByTestId('add-host-modal');
      await addModal.locator('[name="alias"]').fill(alias);
      await addModal.locator('[name="address"]').fill(address);
      await addModal.locator('[name="port"]').fill('8001');
      await addModal.locator('[name="id"]').fill('admin');
      await addModal.locator('[name="password"]').fill('placeholder_pw');
      await page.getByTestId('add-host-save-btn').click();
      await expect(addModal).not.toBeVisible({ timeout: 10000 });

      hostItem = page.locator('#host-section').getByText(alias).first();
      await expect(hostItem).toBeVisible({ timeout: 10000 });
    });

    await When('the user right-clicks the host and confirms Delete Host', async () => {
      await hostItem.click({ button: 'right' });
      await page.getByRole('button', { name: /Delete Host/i }).click();

      const modal = page.getByTestId('delete-host-modal');
      await expect(modal).toBeVisible();
      await page.getByTestId('delete-host-confirm-btn').click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });
    });

    await Then('the host is permanently removed from the host tree', async () => {
      await expect(hostItem).not.toBeVisible({ timeout: 5000 });
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
      await page.getByTestId('add-host-toolbar-btn').click();
      const addModal = page.getByTestId('add-host-modal');
      await addModal.locator('[name="alias"]').fill(alias);
      await addModal.locator('[name="address"]').fill(address);
      await addModal.locator('[name="port"]').fill('8001');
      await addModal.locator('[name="id"]').fill('admin');
      await addModal.locator('[name="password"]').fill('placeholder_pw');
      await page.getByTestId('add-host-save-btn').click();
      await expect(addModal).not.toBeVisible({ timeout: 10000 });

      hostItem = page.locator('#host-section').getByText(alias).first();
      await expect(hostItem).toBeVisible({ timeout: 10000 });
    });

    await When('the user opens Delete Host dialog and clicks Cancel', async () => {
      await hostItem.click({ button: 'right' });
      await page.getByRole('button', { name: /Delete Host/i }).click();

      const modal = page.getByTestId('delete-host-modal');
      await page.getByTestId('delete-host-cancel-btn').click();
      await expect(modal).not.toBeVisible();
    });

    await Then('the host remains intact in the list', async () => {
      await expect(hostItem).toBeVisible();
    });
  });
});
