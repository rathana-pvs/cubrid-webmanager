const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';

// "CMS user" here is a CUBRID Manager Server admin/monitor account — distinct
// from both CUBRID DB users (db_user_management.spec.js) and web-manager
// login accounts (auth_*.spec.js).
test.describe('Host CMS User Management', () => {
  let hostTree;
  let hostUid;

  test.beforeEach(async ({ page }) => {
    // Delete goes through a native window.confirm() — always accept it.
    page.on('dialog', (dialog) => dialog.accept());

    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await host.dblclick();
    const dbTree = new DatabaseTreePage(page);
    await dbTree.waitForAuthorized();
  });

  test('CMS 사용자를 생성하고, 권한을 수정한 뒤, 삭제하면 사라진다', async ({ page }) => {
    test.setTimeout(120000);

    await hostTree.openHostContextMenu(hostUid);
    await page.getByRole('button', { name: 'User Management' }).click();

    const listModal = page.getByTestId('cms-user-management-modal');
    await expect(listModal).toBeVisible({ timeout: 10000 });
    await expect(listModal.getByTestId('cms-user-admin')).toBeVisible({ timeout: 10000 });

    // Create
    await page.getByTestId('cms-user-management-add-btn').click();
    const editModal = page.getByTestId('edit-cms-user-modal');
    await expect(editModal).toBeVisible();

    const username = `e2e_cms_${Date.now().toString().slice(-6)}`;
    await page.getByTestId('edit-cms-user-targetid-input').fill(username);
    await page.getByTestId('edit-cms-user-password-input').fill('E2eCmsPass123');
    await page.getByTestId('edit-cms-user-confirm-password-input').fill('E2eCmsPass123');
    await page.getByTestId('edit-cms-user-save-btn').click();

    await expect(page.getByRole('button', { name: /OK/ })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /OK/ }).click();
    await expect(editModal).not.toBeVisible();

    const userRow = listModal.getByTestId(`cms-user-${username}`);
    await expect(userRow).toBeVisible({ timeout: 10000 });

    // Edit: grant db-create permission. Select is a custom button+portal
    // dropdown, not a native <select> — open it, then click the option
    // label rendered into document.body.
    await page.getByTestId(`cms-user-${username}-edit-btn`).click();
    await expect(editModal).toBeVisible();
    await page.getByTestId('edit-cms-user-dbcreate-select').click();
    await page.getByTestId('edit-cms-user-dbcreate-select-option-admin').click();
    await page.getByTestId('edit-cms-user-save-btn').click();
    await expect(page.getByRole('button', { name: /OK/ })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /OK/ }).click();
    await expect(editModal).not.toBeVisible();

    // Cleanup. The delete button only appears on row hover (group-hover) —
    // hover the row first, then force the click rather than depending on
    // Playwright's default actionability re-deriving that CSS hover state.
    const deleteBtn = page.getByTestId(`cms-user-${username}-delete-btn`);
    await deleteBtn.hover();
    await deleteBtn.click({ force: true });

    // The delete CMS task can take a while to actually take effect on this
    // real host, and its own response doesn't reliably reflect completion —
    // reopening the modal (which re-fetches the user list fresh each time)
    // is more reliable than waiting on one static render to update.
    let deleted = false;
    for (let i = 0; i < 6; i++) {
      if (await userRow.isHidden().catch(() => false)) { deleted = true; break; }
      await page.waitForTimeout(10000);
      await page.getByTestId('cms-user-management-modal-close').click().catch(() => {});
      await hostTree.openHostContextMenu(hostUid);
      await page.getByRole('button', { name: 'User Management' }).click();
      await expect(listModal).toBeVisible({ timeout: 10000 });
    }
    expect(deleted).toBe(true);
  });

  test('비밀번호와 확인이 일치하지 않으면 오류가 표시되고 저장 버튼이 비활성화된다', async ({ page }) => {
    // Pure client-side validation (EditCMSUserModal.jsx: canSave requires
    // !passwordMismatch) — no CMS round trip needed, so no cleanup either.
    await hostTree.openHostContextMenu(hostUid);
    await page.getByRole('button', { name: 'User Management' }).click();

    const listModal = page.getByTestId('cms-user-management-modal');
    await expect(listModal).toBeVisible({ timeout: 10000 });

    await page.getByTestId('cms-user-management-add-btn').click();
    const editModal = page.getByTestId('edit-cms-user-modal');
    await expect(editModal).toBeVisible();

    const username = `e2e_cms_mismatch_${Date.now().toString().slice(-6)}`;
    const saveBtn = page.getByTestId('edit-cms-user-save-btn');
    await page.getByTestId('edit-cms-user-targetid-input').fill(username);
    await page.getByTestId('edit-cms-user-password-input').fill('E2eCmsPass123');
    await page.getByTestId('edit-cms-user-confirm-password-input').fill('DifferentPass456');

    await expect(editModal.getByText('Passwords do not match').first()).toBeVisible();
    await expect(saveBtn).toBeDisabled();

    await page.getByTestId('edit-cms-user-cancel-btn').click();
    await expect(editModal).not.toBeVisible();
  });
});
