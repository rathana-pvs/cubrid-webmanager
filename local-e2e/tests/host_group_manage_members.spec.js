const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';

test.describe('Manage Group Members', () => {
  test.beforeEach(async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);
  });

  test('체크된 호스트를 그룹에 추가하고, 체크 해제하면 미분류로 이동한다', async ({ page }) => {
    const groupName = `E2E_GroupMembers_${Date.now().toString().slice(-6)}`;

    await page.getByTestId('new-group-toolbar-btn').click();
    let modal = page.getByTestId('group-name-modal');
    await modal.locator('input[name="groupName"]').fill(groupName);
    await page.getByTestId('group-name-submit-btn').click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });

    const group = page.locator('#host-section').locator('details').filter({ hasText: groupName }).first();
    await expect(group).toBeVisible({ timeout: 10000 });
    await group.locator('> summary').click({ button: 'right' });
    await page.getByRole('button', { name: /Manage Group/i }).click();

    modal = page.getByTestId('manage-group-members-modal');
    await expect(modal).toBeVisible();
    await modal.locator(`tr:has-text("${E2E_HOST_ADDRESS}")`).locator('[data-testid^="manage-group-members-checkbox-"]').click();
    await page.getByTestId('manage-group-members-save-btn').click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });

    // Moving a host into a group doesn't auto-expand it — open it to check membership.
    const isOpenAfterMove = await group.evaluate((el) => el.open);
    if (!isOpenAfterMove) await group.locator('> summary').click();
    await expect(group.locator(`[title="${E2E_HOST_ADDRESS}:${E2E_HOST_PORT}"]`)).toBeVisible({ timeout: 10000 });

    // Uncheck it again — should move back to Ungrouped.
    await group.locator('> summary').click({ button: 'right' });
    await page.getByRole('button', { name: /Manage Group/i }).click();
    modal = page.getByTestId('manage-group-members-modal');
    await modal.locator(`tr:has-text("${E2E_HOST_ADDRESS}")`).locator('[data-testid^="manage-group-members-checkbox-"]').click();
    await page.getByTestId('manage-group-members-save-btn').click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });

    await expect(group.locator(`[title="${E2E_HOST_ADDRESS}:${E2E_HOST_PORT}"]`)).not.toBeVisible({ timeout: 5000 });
  });

  test('다른 그룹에 속한 호스트를 체크하면 그 그룹에서 빠지고 새 그룹으로 이동한다', async ({ page }) => {
    const groupAName = `E2E_GroupA_${Date.now().toString().slice(-6)}`;
    const groupBName = `E2E_GroupB_${Date.now().toString().slice(-6)}`;
    const alias = `E2E_MoveMember_${Date.now().toString().slice(-6)}`;
    const address = `10.5.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

    async function createGroup(name) {
      await page.getByTestId('new-group-toolbar-btn').click();
      const m = page.getByTestId('group-name-modal');
      await m.locator('input[name="groupName"]').fill(name);
      await page.getByTestId('group-name-submit-btn').click();
      await expect(m).not.toBeVisible({ timeout: 10000 });
    }
    await createGroup(groupAName);
    await createGroup(groupBName);

    await page.getByTestId('add-host-toolbar-btn').click();
    const addModal = page.getByTestId('add-host-modal');
    await addModal.locator('[name="alias"]').fill(alias);
    await addModal.locator('[name="address"]').fill(address);
    await addModal.locator('[name="port"]').fill('8001');
    await addModal.locator('[name="id"]').fill('admin');
    await addModal.locator('[name="password"]').fill('placeholder_pw');
    await page.getByTestId('add-host-save-btn').click();
    await expect(addModal).not.toBeVisible({ timeout: 10000 });

    // Put the host in Group A first.
    const groupA = page.locator('#host-section').locator('details').filter({ hasText: groupAName }).first();
    await expect(groupA).toBeVisible({ timeout: 10000 });
    await groupA.locator('> summary').click({ button: 'right' });
    await page.getByRole('button', { name: /Manage Group/i }).click();
    let modal = page.getByTestId('manage-group-members-modal');
    await expect(modal).toBeVisible();
    await modal.locator(`tr:has-text("${address}")`).locator('[data-testid^="manage-group-members-checkbox-"]').click();
    await page.getByTestId('manage-group-members-save-btn').click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });

    const isOpenA = await groupA.evaluate((el) => el.open);
    if (!isOpenA) await groupA.locator('> summary').click();
    await expect(groupA.locator(`[title="${address}:8001"]`)).toBeVisible({ timeout: 10000 });

    // Now manage Group B's members — this host should show as already
    // belonging to Group A in the "Group" column, and checking it here
    // should move it out of A and into B, not add it to both.
    const groupB = page.locator('#host-section').locator('details').filter({ hasText: groupBName }).first();
    await groupB.locator('> summary').click({ button: 'right' });
    await page.getByRole('button', { name: /Manage Group/i }).click();
    modal = page.getByTestId('manage-group-members-modal');
    await expect(modal).toBeVisible();
    const row = modal.locator(`tr:has-text("${address}")`);
    await expect(row.getByText(groupAName)).toBeVisible();
    await row.locator('[data-testid^="manage-group-members-checkbox-"]').click();
    await page.getByTestId('manage-group-members-save-btn').click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });

    const isOpenB = await groupB.evaluate((el) => el.open);
    if (!isOpenB) await groupB.locator('> summary').click();
    await expect(groupB.locator(`[title="${address}:8001"]`)).toBeVisible({ timeout: 10000 });
    // Must be gone from Group A — a host belongs to exactly one group.
    await expect(groupA.locator(`[title="${address}:8001"]`)).not.toBeVisible({ timeout: 5000 });
  });
});
