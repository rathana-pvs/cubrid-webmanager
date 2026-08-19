const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';

// "CMS user" here is a CUBRID Manager Server admin/monitor account — distinct
// from both CUBRID DB users (db_user_management.spec.js) and web-manager
// login accounts (auth_*.spec.js).
test.describe('Feature: Host CMS User Management', () => {
  let hostTree;
  let hostUid;

  test.beforeEach(async ({ appPage: page }) => {
    // Delete goes through a native window.confirm() — always accept it.
    page.on('dialog', (dialog) => dialog.accept());

    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await hostTree.activateHost(hostUid);
  });

  test('Scenario: Create a new CMS user, edit permissions, and delete user successfully', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Host Management',
      feature: 'CMS User Administration',
      story: 'Create, Edit and Delete CMS User',
      severity: 'critical',
    });

    test.setTimeout(120000);

    let listModal;
    let editModal;
    const username = `e2e_cms_${Date.now().toString().slice(-6)}`;
    let userRow;

    await Given('the user opens the CMS user management modal from host context menu', async () => {
      await hostTree.openHostContextMenu(hostUid);
      await page.getByRole('button', { name: 'User Management' }).click();

      listModal = page.getByTestId('cms-user-management-modal');
      await expect(listModal).toBeVisible({ timeout: 10000 });
      await expect(listModal.getByTestId('cms-user-admin')).toBeVisible({ timeout: 10000 });
    });

    await When('the user fills in new CMS user credentials and saves', async () => {
      await page.getByTestId('cms-user-management-add-btn').click();
      editModal = page.getByTestId('edit-cms-user-modal');
      await expect(editModal).toBeVisible();

      await page.getByTestId('edit-cms-user-targetid-input').fill(username);
      await page.getByTestId('edit-cms-user-password-input').fill('E2eCmsPass123');
      await page.getByTestId('edit-cms-user-confirm-password-input').fill('E2eCmsPass123');
      await page.getByTestId('edit-cms-user-save-btn').click();

      await expect(page.getByRole('button', { name: /OK/ })).toBeVisible({ timeout: 15000 });
      await page.getByRole('button', { name: /OK/ }).click();
      await expect(editModal).not.toBeVisible();
    });

    await Then('the created CMS user appears in the user list', async () => {
      userRow = listModal.getByTestId(`cms-user-${username}`);
      await expect(userRow).toBeVisible({ timeout: 10000 });
    });

    await When('the user edits the CMS user DB creation authorization', async () => {
      await page.getByTestId(`cms-user-${username}-edit-btn`).click();
      await expect(editModal).toBeVisible();
      await page.getByTestId('edit-cms-user-dbcreate-select').click();
      await page.getByTestId('edit-cms-user-dbcreate-select-option-admin').click();
      await page.getByTestId('edit-cms-user-save-btn').click();
      await expect(page.getByRole('button', { name: /OK/ })).toBeVisible({ timeout: 15000 });
      await page.getByRole('button', { name: /OK/ }).click();
      await expect(editModal).not.toBeVisible();
    });

    await Then('the CMS user can be deleted and removed from the list', async () => {
      const deleteBtn = page.getByTestId(`cms-user-${username}-delete-btn`);
      await deleteBtn.hover();
      await deleteBtn.click({ force: true });

      let deleted = false;
      for (let i = 0; i < 6; i++) {
        if (await userRow.isHidden().catch(() => false)) { deleted = true; break; }
        await page.waitForTimeout(10000);
        await page.getByTestId('cms-user-management-modal-close').click().catch(() => undefined);
        await hostTree.openHostContextMenu(hostUid);
        await page.getByRole('button', { name: 'User Management' }).click();
        await expect(listModal).toBeVisible({ timeout: 10000 });
      }
      expect(deleted).toBe(true);
    });
  });

  test('Scenario: Display validation error and disable save button when password confirmation mismatches', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Host Management',
      feature: 'CMS User Administration',
      story: 'CMS Password Mismatch Validation',
      severity: 'normal',
    });

    let listModal;
    let editModal;
    let saveBtn;
    const username = `e2e_cms_mismatch_${Date.now().toString().slice(-6)}`;

    await Given('the CMS user management dialog is opened', async () => {
      await hostTree.openHostContextMenu(hostUid);
      await page.getByRole('button', { name: 'User Management' }).click();

      listModal = page.getByTestId('cms-user-management-modal');
      await expect(listModal).toBeVisible({ timeout: 10000 });
    });

    await When('the user opens add user form and enters mismatched passwords', async () => {
      await page.getByTestId('cms-user-management-add-btn').click();
      editModal = page.getByTestId('edit-cms-user-modal');
      await expect(editModal).toBeVisible();

      saveBtn = page.getByTestId('edit-cms-user-save-btn');
      await page.getByTestId('edit-cms-user-targetid-input').fill(username);
      await page.getByTestId('edit-cms-user-password-input').fill('E2eCmsPass123');
      await page.getByTestId('edit-cms-user-confirm-password-input').fill('DifferentPass456');
    });

    await Then('a password mismatch error is displayed and save is disabled', async () => {
      await expect(editModal.getByText('Passwords do not match').first()).toBeVisible();
      await expect(saveBtn).toBeDisabled();
    });

    await And('cancelling the form closes the modal cleanly', async () => {
      await page.getByTestId('edit-cms-user-cancel-btn').click();
      await expect(editModal).not.toBeVisible();
    });
  });
});
