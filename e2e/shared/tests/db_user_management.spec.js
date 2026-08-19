const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

test.describe('Feature: Database User Management', () => {
  let dbTree;

  test.beforeEach(async ({ appPage: page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    const hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await host.dblclick();
    dbTree = new DatabaseTreePage(page);
    await dbTree.waitForAuthorized();
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
    const userName = `e2e_user_${Date.now().toString().slice(-6)}`;

    await Given('the user expands Users node and opens Add User dialog', async () => {
      usersFolder = await dbTree.expandSubNode(E2E_DB, 'Users');
      await usersFolder.locator('> summary').click({ button: 'right' });
      await page.getByRole('button', { name: 'Add User' }).click();

      const createModal = page.getByTestId('create-user-modal');
      await expect(createModal).toBeVisible();
      await expect(createModal.getByText('PUBLIC').first()).toBeVisible({ timeout: 15000 });
    });

    await When('the user fills the new username and saves', async () => {
      await page.getByTestId('create-user-username-input').fill(userName);
      await page.getByTestId('create-user-save-btn').click();

      await expect(page.getByText('User Created').first()).toBeVisible({ timeout: 15000 });
      await page.getByRole('button', { name: /OK/ }).click();
    });

    await Then('the new uppercase username node appears under Users in tree', async () => {
      const isOpen = await usersFolder.evaluate((el) => el.open).catch(() => false);
      if (!isOpen) await usersFolder.locator('> summary').click();
      userNode = dbTree.subNode(E2E_DB, userName.toUpperCase());
      await expect(userNode).toBeVisible({ timeout: 10000 });
    });

    await And('the user can edit the user and subsequently delete it', async () => {
      await page.mouse.click(2, 2).catch(() => undefined);
      await userNode.click({ button: 'right' });
      await page.getByRole('button', { name: 'Edit user' }).click();
      const editModal = page.getByTestId('create-user-modal');
      await expect(editModal).toBeVisible();
      await page.getByTestId('create-user-save-btn').click();
      await expect(editModal).not.toBeVisible({ timeout: 15000 });

      await userNode.click({ button: 'right' });
      await page.getByRole('button', { name: 'Delete user' }).click();
      const deleteModal = page.getByTestId('delete-user-modal');
      await expect(deleteModal).toBeVisible();
      await page.getByTestId('delete-user-confirm-btn').click();
      await expect(deleteModal).not.toBeVisible({ timeout: 15000 });
      await expect(userNode).not.toBeVisible({ timeout: 5000 });
    });
  });

  test('Scenario: Attempting to create a user with an already existing username shows error', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'User Management',
      story: 'Duplicate DB Username Prevention',
    });

    await Given('the user opens Add User modal', async () => {
      const usersFolder = await dbTree.expandSubNode(E2E_DB, 'Users');
      await usersFolder.locator('> summary').click({ button: 'right' });
      await page.getByRole('button', { name: 'Add User' }).click();

      const modal = page.getByTestId('create-user-modal');
      await expect(modal).toBeVisible();
      await expect(modal.getByText('PUBLIC').first()).toBeVisible({ timeout: 15000 });
    });

    await When('the user submits a username that already exists (DBA)', async () => {
      await page.getByTestId('create-user-username-input').fill('DBA');
      await page.getByTestId('create-user-save-btn').click();
    });

    await Then('an error notification indicating user already exists is shown', async () => {
      await expect(page.getByText(/already exists|User creation failed/i).first()).toBeVisible({ timeout: 15000 });
      await page.getByTestId('create-user-cancel-btn').click();
    });
  });
});
