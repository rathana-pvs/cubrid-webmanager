const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { Given, When, Then, And, bddMeta, action } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

test.describe('Feature: Database User Management', () => {
  let dbTree;

  test.beforeEach(async ({ appPage: page }) => {
    test.setTimeout(90000);
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    const hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await hostTree.activateHost(hostUid);
    dbTree = new DatabaseTreePage(page);
    await dbTree.waitForAuthorized();
    await dbTree.ensureDatabaseStarted(E2E_DB);
    await dbTree.openDashboardTab(E2E_DB, hostUid);
  });

  test('Scenario: Creating a DB user adds it to Users sub-node, editing and deleting removes it', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'User Management',
      story: 'Create, Edit, and Delete DB User',
    });

    let usersFolder;
    let userNode;
    let createModal;
    const userName = `e2e_user_${Date.now().toString().slice(-6)}`;

    await Given('the user expands Users node and opens Add User dialog', async () => {
      usersFolder = await action(`Expand "Users" sub-node for database "${E2E_DB}"`, () => dbTree.expandSubNode(E2E_DB, 'Users'), 'Could not expand Users node in database tree.');
      await action('Right-click "Users" folder summary', () => usersFolder.locator('> summary').click({ button: 'right' }), 'Could not right-click Users tree folder.');
      await action('Click "Add User" in context menu', () => page.getByRole('button', { name: /Add User|사용자 추가/i }).click(), 'Could not click Add User context menu item.');

      createModal = page.getByTestId('create-user-modal');
      await action('Verify Create User modal is visible', () => expect(createModal).toBeVisible(), 'Create User modal did not open.');
      await action('Verify user groups (PUBLIC) loaded in modal', () => expect(createModal.getByText('PUBLIC').first()).toBeVisible({ timeout: 25000 }), 'User groups list failed to load in modal.');
    });

    await When('the user fills the new username and saves', async () => {
      await action(`Fill username "${userName}"`, () => page.getByTestId('create-user-username-input').fill(userName), `Could not enter username "${userName}".`);
      await action('Fill password', () => page.getByTestId('create-user-password-input').fill('1234'), 'Could not enter password.');
      await action('Fill confirm password', () => page.getByTestId('create-user-confirm-password-input').fill('1234'), 'Could not enter confirm password.');
      await action('Click Save button to create user', () => page.getByTestId('create-user-save-btn').click(), 'Could not click Save button in create user modal.');

      await action('Verify "User Created" success notification appears', () => expect(page.getByText(/User Created|사용자 생성됨/i).first()).toBeVisible({ timeout: 15000 }), 'User Created confirmation message did not appear.');
      await action('Dismiss success notification by clicking OK', () => page.getByRole('dialog').getByRole('button', { name: /OK|확인/i }).click(), 'Could not click OK button on confirmation dialog.');
    });

    await Then('the new uppercase username node appears under Users in tree', async () => {
      await action('Ensure Users folder is open in tree', async () => {
        const isOpen = await usersFolder.evaluate((el) => el.open).catch(() => false);
        if (!isOpen) await usersFolder.locator('> summary').click();
      }, 'Could not toggle Users folder open.');
      userNode = dbTree.subNode(E2E_DB, userName.toUpperCase());
      await action(`Verify new user node "${userName.toUpperCase()}" is visible in tree`, () => expect(userNode).toBeVisible({ timeout: 10000 }), `User node "${userName.toUpperCase()}" was not found in tree.`);
    });

    await And('the user can edit the user and subsequently delete it', async () => {
      await action('Dismiss any stray context menus', () => page.mouse.click(2, 2).catch(() => undefined));
      await action(`Right-click user node "${userName.toUpperCase()}"`, () => userNode.click({ button: 'right' }), `Could not right-click user node "${userName.toUpperCase()}".`);
      await action('Click "Edit user" in context menu', () => page.getByRole('button', { name: /Edit User|사용자 편집|사용자 수정/i }).click(), 'Could not click Edit user context menu item.');
      const editModal = page.getByTestId('create-user-modal');
      await action('Verify Edit User modal is visible', () => expect(editModal).toBeVisible(), 'Edit User modal did not open.');
      await action('Click Save button in edit modal', () => page.getByTestId('create-user-save-btn').click(), 'Could not click Save in edit user modal.');
      await action('Dismiss update success notification', () => page.getByRole('dialog').getByRole('button', { name: /OK|확인/i }).click().catch(() => undefined));
      await action('Verify Edit User modal closes', () => expect(editModal).not.toBeVisible({ timeout: 15000 }), 'Edit User modal remained visible after save.');

      await action(`Right-click user node "${userName.toUpperCase()}" for deletion`, () => userNode.click({ button: 'right' }), `Could not right-click user node "${userName.toUpperCase()}".`);
      await action('Click "Delete user" in context menu', () => page.getByRole('button', { name: /Delete User|사용자 삭제/i }).click(), 'Could not click Delete user context menu item.');
      const deleteModal = page.getByTestId('drop-user-modal').or(page.getByTestId('delete-user-modal'));
      await action('Verify Delete User confirmation modal is visible', () => expect(deleteModal).toBeVisible(), 'Delete User confirmation modal did not open.');
      await action('Confirm deletion by clicking Delete button', () => page.getByTestId('drop-user-confirm-btn').or(page.getByTestId('delete-user-confirm-btn')).click(), 'Could not click Delete confirm button.');
      await action('Dismiss drop success notification', () => page.getByRole('dialog').getByRole('button', { name: /OK|확인/i }).click().catch(() => undefined));
      await action('Verify Delete User modal closes', () => expect(deleteModal).not.toBeVisible({ timeout: 15000 }), 'Delete User modal remained open after confirmation.');
      await action(`Verify user node "${userName.toUpperCase()}" is removed from tree`, () => expect(userNode).not.toBeVisible({ timeout: 10000 }), `User node "${userName.toUpperCase()}" was still visible in the tree after deletion.`);
    });
  });

  test('Scenario: Attempting to create a user with an already existing username shows error', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'User Management',
      story: 'Duplicate DB Username Prevention',
    });

    await Given('the user opens Add User modal', async () => {
      const usersFolder = await action(`Expand "Users" sub-node for database "${E2E_DB}"`, () => dbTree.expandSubNode(E2E_DB, 'Users'), 'Could not expand Users node.');
      await action('Right-click "Users" folder summary', () => usersFolder.locator('> summary').click({ button: 'right' }), 'Could not right-click Users folder.');
      await action('Click "Add User" in context menu', () => page.getByRole('button', { name: /Add User|사용자 추가/i }).click(), 'Could not click Add User context menu item.');

      const modal = page.getByTestId('create-user-modal');
      await action('Verify Create User modal is visible', () => expect(modal).toBeVisible(), 'Create User modal did not open.');
      await action('Verify user groups (PUBLIC) loaded in modal', () => expect(modal.getByText('PUBLIC').first()).toBeVisible({ timeout: 25000 }), 'User groups list failed to load in modal.');
    });

    await When('the user submits a username that already exists (DBA)', async () => {
      await action('Fill duplicate username "DBA"', () => page.getByTestId('create-user-username-input').fill('DBA'), 'Could not fill DBA username.');
      await action('Fill password', () => page.getByTestId('create-user-password-input').fill('1234'), 'Could not enter password.');
      await action('Fill confirm password', () => page.getByTestId('create-user-confirm-password-input').fill('1234'), 'Could not enter confirm password.');
      await action('Click Save button', () => page.getByTestId('create-user-save-btn').click(), 'Could not click Save button.');
    });

    await Then('an error notification indicating user already exists is shown', async () => {
      await action('Verify duplicate user error notification is displayed', () => expect(page.getByText(/already exists|User creation failed|이미 존재|Operation Failed|작업 실패/i).first()).toBeVisible({ timeout: 15000 }), 'Duplicate user error message was not displayed.');
      await action('Click Dismiss button to close error status modal', () => page.getByRole('dialog').getByRole('button', { name: /Close|닫기/i }).last().click(), 'Could not click Dismiss button.');
    });
  });
});
