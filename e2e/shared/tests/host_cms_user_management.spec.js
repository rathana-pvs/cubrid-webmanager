const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { Given, When, Then, And, bddMeta, action } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';

// "CMS user" here is a CUBRID Manager Server admin/monitor account — distinct
// from both CUBRID DB users (db_user_management.spec.js) and web-manager
// login accounts (auth_*.spec.js).
test.describe('Feature: Host CMS User Management', () => {
  let hostTree;
  let hostUid;

  test.beforeEach(async ({ appPage: page }) => {
    test.setTimeout(90000);
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
      await action('Open host context menu', () => hostTree.openHostContextMenu(hostUid), 'Could not open host context menu.');
      await action('Click User Management context menu item', () => page.getByRole('button', { name: 'User Management' }).click(), 'User Management menu item was not clickable.');

      listModal = page.getByTestId('cms-user-management-modal');
      await action('Verify CMS User Management modal is visible', () => expect(listModal).toBeVisible({ timeout: 15000 }), 'CMS User Management modal did not open.');
      await action('Verify default admin CMS user is displayed in list', () => expect(listModal.getByTestId('cms-user-admin')).toBeVisible({ timeout: 20000 }), 'Default admin user row was not found in CMS user list.');
    });

    await When('the user fills in new CMS user credentials and saves', async () => {
      await action('Click Add User button', () => page.getByTestId('cms-user-management-add-btn').click(), 'Add User button was not clickable.');
      editModal = page.getByTestId('edit-cms-user-modal');
      await action('Verify Edit CMS User modal is visible', () => expect(editModal).toBeVisible(), 'Edit CMS User modal did not open.');

      await action('Fill CMS username: ' + username, () => page.getByTestId('edit-cms-user-targetid-input').fill(username), 'Could not type into CMS username field.');
      await action('Fill CMS password: ••••••••', () => page.getByTestId('edit-cms-user-password-input').fill('E2eCmsPass123'), 'Could not type into CMS password field.');
      await action('Fill CMS confirm password: ••••••••', () => page.getByTestId('edit-cms-user-confirm-password-input').fill('E2eCmsPass123'), 'Could not type into CMS confirm password field.');
      await action('Click Save button to create CMS user', () => page.getByTestId('edit-cms-user-save-btn').click(), 'Save button was not clickable.');

      await action('Verify confirmation OK button appears', () => expect(page.getByRole('button', { name: /OK/ })).toBeVisible({ timeout: 15000 }), 'Confirmation modal with OK button did not appear.');
      await action('Click OK button to confirm user creation', () => page.getByRole('button', { name: /OK/ }).click(), 'Confirmation OK button was not clickable.');
      await action('Verify Edit CMS User modal is closed', () => expect(editModal).not.toBeVisible(), 'Edit CMS User modal did not close after saving.');
    });

    await Then('the created CMS user appears in the user list', async () => {
      userRow = listModal.getByTestId(`cms-user-${username}`);
      await action('Verify created CMS user appears in user list: ' + username, () => expect(userRow).toBeVisible({ timeout: 10000 }), 'Created CMS user was not found in user list.');
    });

    await When('the user edits the CMS user DB creation authorization', async () => {
      await action('Click Edit button for CMS user: ' + username, () => page.getByTestId(`cms-user-${username}-edit-btn`).click(), 'Edit button for CMS user was not clickable.');
      await action('Verify Edit CMS User modal is visible', () => expect(editModal).toBeVisible(), 'Edit CMS User modal did not open.');
      await action('Click DB creation authorization dropdown', () => page.getByTestId('edit-cms-user-dbcreate-select').click(), 'DB creation select dropdown was not clickable.');
      await action('Select "admin" DB creation option', () => page.getByTestId('edit-cms-user-dbcreate-select-option-admin').click(), 'Option "admin" was not clickable in DB creation dropdown.');
      await action('Click Save button to update CMS user permissions', () => page.getByTestId('edit-cms-user-save-btn').click(), 'Save button was not clickable.');
      await action('Verify confirmation OK button appears', () => expect(page.getByRole('button', { name: /OK/ })).toBeVisible({ timeout: 15000 }), 'Confirmation modal with OK button did not appear.');
      await action('Click OK button to confirm permission changes', () => page.getByRole('button', { name: /OK/ }).click(), 'Confirmation OK button was not clickable.');
      await action('Verify Edit CMS User modal is closed', () => expect(editModal).not.toBeVisible(), 'Edit CMS User modal did not close after saving.');
    });

    await Then('the CMS user can be deleted and removed from the list', async () => {
      const deleteBtn = page.getByTestId(`cms-user-${username}-delete-btn`);
      await action('Hover over Delete button for CMS user: ' + username, () => deleteBtn.hover(), 'Could not hover over Delete button.');
      await action('Click Delete button for CMS user: ' + username, () => deleteBtn.click({ force: true }), 'Could not click Delete button.');

      await action('Verify CMS user is removed from list: ' + username, async () => {
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
      }, 'CMS user ' + username + ' was not deleted from the list after multiple retries.');
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
      await action('Open host context menu', () => hostTree.openHostContextMenu(hostUid), 'Could not open host context menu.');
      await action('Click User Management context menu item', () => page.getByRole('button', { name: 'User Management' }).click(), 'User Management menu item was not clickable.');

      listModal = page.getByTestId('cms-user-management-modal');
      await action('Verify CMS User Management modal is visible', () => expect(listModal).toBeVisible({ timeout: 10000 }), 'CMS User Management modal did not open.');
    });

    await When('the user opens add user form and enters mismatched passwords', async () => {
      await action('Click Add User button', () => page.getByTestId('cms-user-management-add-btn').click(), 'Add User button was not clickable.');
      editModal = page.getByTestId('edit-cms-user-modal');
      await action('Verify Edit CMS User modal is visible', () => expect(editModal).toBeVisible(), 'Edit CMS User modal did not open.');

      saveBtn = page.getByTestId('edit-cms-user-save-btn');
      await action('Fill CMS username: ' + username, () => page.getByTestId('edit-cms-user-targetid-input').fill(username), 'Could not type into CMS username field.');
      await action('Fill CMS password: ••••••••', () => page.getByTestId('edit-cms-user-password-input').fill('E2eCmsPass123'), 'Could not type into CMS password field.');
      await action('Fill mismatched CMS confirm password: ••••••••', () => page.getByTestId('edit-cms-user-confirm-password-input').fill('DifferentPass456'), 'Could not type into CMS confirm password field.');
    });

    await Then('a password mismatch error is displayed and save is disabled', async () => {
      await action('Verify "Passwords do not match" validation error is displayed', () => expect(editModal.getByText('Passwords do not match').first()).toBeVisible(), 'Password mismatch validation error was not displayed.');
      await action('Verify Save button is disabled', () => expect(saveBtn).toBeDisabled(), 'Save button was not disabled despite password mismatch.');
    });

    await And('cancelling the form closes the modal cleanly', async () => {
      await action('Click Cancel button on Edit CMS User modal', () => page.getByTestId('edit-cms-user-cancel-btn').click(), 'Cancel button was not clickable.');
      await action('Verify Edit CMS User modal is closed', () => expect(editModal).not.toBeVisible(), 'Edit CMS User modal did not close after clicking Cancel.');
    });
  });
});
