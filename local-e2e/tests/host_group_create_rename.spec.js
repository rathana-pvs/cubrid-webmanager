const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');

test.describe('Group Create/Rename', () => {
  test.beforeEach(async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);
  });

  test('빈 이름으로 그룹 생성을 시도하면 오류가 표시된다', async ({ page }) => {
    await page.getByTestId('new-group-toolbar-btn').click();
    const modal = page.getByTestId('group-name-modal');
    await expect(modal).toBeVisible();
    await page.getByTestId('group-name-submit-btn').click();

    await expect(modal.getByText(/required|필수/i)).toBeVisible();
    await page.getByTestId('group-name-cancel-btn').click();
  });

  test('그룹을 생성하면 목록에 나타난다', async ({ page }) => {
    const groupName = `E2E_Group_${Date.now().toString().slice(-6)}`;
    await page.getByTestId('new-group-toolbar-btn').click();
    const modal = page.getByTestId('group-name-modal');
    await modal.locator('input[name="groupName"]').fill(groupName);
    await page.getByTestId('group-name-submit-btn').click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });

    await expect(page.locator('#host-section').getByText(groupName)).toBeVisible({ timeout: 10000 });
  });

  test('그룹 이름을 변경하면 트리에 반영된다', async ({ page }) => {
    const groupName = `E2E_Group_${Date.now().toString().slice(-6)}`;
    const renamedName = `${groupName}_Renamed`;

    await page.getByTestId('new-group-toolbar-btn').click();
    let modal = page.getByTestId('group-name-modal');
    await modal.locator('input[name="groupName"]').fill(groupName);
    await page.getByTestId('group-name-submit-btn').click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });

    const group = page.locator('#host-section').locator('details').filter({ hasText: groupName }).first();
    await expect(group).toBeVisible({ timeout: 10000 });
    await group.locator('> summary').click({ button: 'right' });
    await page.getByRole('button', { name: /Rename Group/i }).click();

    modal = page.getByTestId('group-name-modal');
    await modal.locator('input[name="groupName"]').fill(renamedName);
    await page.getByTestId('group-name-submit-btn').click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });

    await expect(page.locator('#host-section').getByText(renamedName)).toBeVisible({ timeout: 10000 });
  });
});
