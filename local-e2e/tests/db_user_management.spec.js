const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

test.describe('Database User Management', () => {
  let dbTree;

  test.beforeEach(async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    const hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await host.dblclick();
    dbTree = new DatabaseTreePage(page);
    await dbTree.waitForAuthorized();

    // add_user/edit_user/drop_user require a DBA-level per-database login
    // (not just the host CMS connection) — activate the dashboard first so
    // the CMS task is authorized as dba.
    await dbTree.openDashboardTab(E2E_DB, hostUid);
  });

  test('DB 유저를 생성하면 트리에 나타나고, 수정 후 삭제하면 사라진다', async ({ page }) => {
    const usersFolder = await dbTree.expandSubNode(E2E_DB, 'Users');
    await usersFolder.locator('> summary').click({ button: 'right' });
    await page.getByRole('button', { name: 'Add User' }).click();

    const createModal = page.getByTestId('create-user-modal');
    await expect(createModal).toBeVisible();
    // Wait for the user list fetch to resolve (PUBLIC always exists) before
    // filling — a prior app bug made this race and clobber the typed value;
    // fixed in CreateUserModal.jsx, but still worth waiting for readiness.
    await expect(createModal.getByText('PUBLIC').first()).toBeVisible({ timeout: 15000 });
    const userName = `e2e_user_${Date.now().toString().slice(-6)}`;
    await page.getByTestId('create-user-username-input').fill(userName);
    await page.getByTestId('create-user-save-btn').click();

    await expect(page.getByText('User Created').first()).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /OK/ }).click();

    const isOpen = await usersFolder.evaluate((el) => el.open).catch(() => false);
    if (!isOpen) await usersFolder.locator('> summary').click();
    // CUBRID case-folds unquoted user identifiers to uppercase.
    const userNode = dbTree.subNode(E2E_DB, userName.toUpperCase());
    await expect(userNode).toBeVisible({ timeout: 10000 });

    // Edit: reopen its context menu and save without changes.
    await page.mouse.click(2, 2).catch(() => {});
    await userNode.click({ button: 'right' });
    await page.getByRole('button', { name: 'Edit user' }).click();
    const editModal = page.getByTestId('create-user-modal');
    await expect(editModal).toBeVisible();
    await page.getByTestId('create-user-save-btn').click();
    await expect(page.getByText('User Updated').first()).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /OK/ }).click();

    // Cleanup
    await page.mouse.click(2, 2).catch(() => {});
    await userNode.click({ button: 'right' });
    await page.getByRole('button', { name: 'Delete user' }).click();
    const dropModal = page.getByTestId('drop-user-modal');
    await expect(dropModal).toBeVisible();
    await page.getByTestId('drop-user-confirm-btn').click();
    await expect(page.getByText('Deletion Success').first()).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /OK/ }).click();

    await expect(userNode).not.toBeVisible({ timeout: 10000 });
  });

  test('이미 존재하는 사용자명으로 생성하면 오류가 표시된다', async ({ page }) => {
    const usersFolder = await dbTree.expandSubNode(E2E_DB, 'Users');
    await usersFolder.locator('> summary').click({ button: 'right' });
    await page.getByRole('button', { name: 'Add User' }).click();

    const createModal = page.getByTestId('create-user-modal');
    await expect(createModal).toBeVisible();
    await expect(createModal.getByText('PUBLIC').first()).toBeVisible({ timeout: 15000 });
    // PUBLIC always exists — a real, guaranteed duplicate.
    await page.getByTestId('create-user-username-input').fill('PUBLIC');
    await page.getByTestId('create-user-save-btn').click();

    await expect(page.getByText('Operation Failed')).toBeVisible({ timeout: 15000 });
    // Dismiss only clears the error and returns to the form (resetAction) —
    // it does not close the modal. Its label is CM.dismiss ("Close"), not
    // the modal header's own icon-only close button.
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(createModal).toBeVisible();
    await expect(page.getByTestId('create-user-username-input')).toBeVisible();

    await page.getByTestId('create-user-modal-close').click();
    await expect(createModal).not.toBeVisible();
  });
});
