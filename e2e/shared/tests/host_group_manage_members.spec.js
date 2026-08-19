const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';

function memberRow(modal, address, port) {
  return modal.locator('tbody tr')
    .filter({ has: modal.page().getByRole('cell', { name: address, exact: true }) })
    .first();
}

test.describe('Feature: Manage Host Group Members', () => {
  test.beforeEach(async ({ appPage: page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);
  });

  test('Scenario: Checking a host adds it to the group and unchecking returns it to ungrouped', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Host Management',
      feature: 'Host Group Membership',
      story: 'Assign and Unassign Host',
    });

    const groupName = `E2E_GroupMembers_${Date.now().toString().slice(-6)}`;
    let group;

    await Given('a host group is created', async () => {
      await page.getByTestId('new-group-toolbar-btn').click();
      const modal = page.getByTestId('group-name-modal');
      await modal.locator('input[name="groupName"]').fill(groupName);
      await page.getByTestId('group-name-submit-btn').click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });

      group = page.locator('#host-section').locator('details').filter({ hasText: groupName }).first();
      await expect(group).toBeVisible({ timeout: 10000 });
    });

    await When('the user opens Manage Group and checks the target host', async () => {
      await group.locator('> summary').click({ button: 'right' });
      await page.getByRole('button', { name: /Manage Group/i }).click();

      const modal = page.getByTestId('manage-group-members-modal');
      await expect(modal).toBeVisible();
      await memberRow(modal, E2E_HOST_ADDRESS, E2E_HOST_PORT)
        .locator('[data-testid^="manage-group-members-checkbox-"]').click();
      await page.getByTestId('manage-group-members-save-btn').click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });
    });

    await Then('the host appears inside the group details in the tree', async () => {
      const isOpenAfterMove = await group.evaluate((el) => el.open);
      if (!isOpenAfterMove) await group.locator('> summary').click();
      await expect(group.locator(`[title="${E2E_HOST_ADDRESS}:${E2E_HOST_PORT}"]`)).toBeVisible({ timeout: 10000 });
    });

    await And('unchecking the host moves it out of the group', async () => {
      await group.locator('> summary').click({ button: 'right' });
      await page.getByRole('button', { name: /Manage Group/i }).click();
      const modal = page.getByTestId('manage-group-members-modal');
      await memberRow(modal, E2E_HOST_ADDRESS, E2E_HOST_PORT)
        .locator('[data-testid^="manage-group-members-checkbox-"]').click();
      await page.getByTestId('manage-group-members-save-btn').click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });

      await expect(group.locator(`[title="${E2E_HOST_ADDRESS}:${E2E_HOST_PORT}"]`)).not.toBeVisible({ timeout: 5000 });
    });
  });

  test('Scenario: Checking a host belonging to another group reassigns it to the new group', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Host Management',
      feature: 'Host Group Membership',
      story: 'Reassign Host Across Groups',
    });

    const groupAName = `E2E_GroupA_${Date.now().toString().slice(-6)}`;
    const groupBName = `E2E_GroupB_${Date.now().toString().slice(-6)}`;
    const alias = `E2E_MoveMember_${Date.now().toString().slice(-6)}`;
    const address = `10.5.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    let groupA, groupB;

    async function createGroup(name) {
      await page.getByTestId('new-group-toolbar-btn').click();
      const m = page.getByTestId('group-name-modal');
      await m.locator('input[name="groupName"]').fill(name);
      await page.getByTestId('group-name-submit-btn').click();
      await expect(m).not.toBeVisible({ timeout: 10000 });
    }

    await Given('two groups exist and a host is assigned to Group A', async () => {
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

      groupA = page.locator('#host-section').locator('details').filter({ hasText: groupAName }).first();
      await expect(groupA).toBeVisible({ timeout: 10000 });
      await groupA.locator('> summary').click({ button: 'right' });
      await page.getByRole('button', { name: /Manage Group/i }).click();
      let modal = page.getByTestId('manage-group-members-modal');
      await expect(modal).toBeVisible();
      await memberRow(modal, address, 8001)
        .locator('[data-testid^="manage-group-members-checkbox-"]').click();
      await page.getByTestId('manage-group-members-save-btn').click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });

      const isOpenA = await groupA.evaluate((el) => el.open);
      if (!isOpenA) await groupA.locator('> summary').click();
      await expect(groupA.locator(`[title="${address}:8001"]`)).toBeVisible({ timeout: 10000 });
    });

    await When('the user opens Manage Group for Group B and selects the host', async () => {
      groupB = page.locator('#host-section').locator('details').filter({ hasText: groupBName }).first();
      await groupB.locator('> summary').click({ button: 'right' });
      await page.getByRole('button', { name: /Manage Group/i }).click();
      const modal = page.getByTestId('manage-group-members-modal');
      await expect(modal).toBeVisible();
      const row = memberRow(modal, address, 8001);
      await expect(row.getByText(groupAName)).toBeVisible();
      await row.locator('[data-testid^="manage-group-members-checkbox-"]').click();
      await page.getByTestId('manage-group-members-save-btn').click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });
    });

    await Then('the host belongs to Group B and is removed from Group A', async () => {
      const isOpenB = await groupB.evaluate((el) => el.open);
      if (!isOpenB) await groupB.locator('> summary').click();
      await expect(groupB.locator(`[title="${address}:8001"]`)).toBeVisible({ timeout: 10000 });
      await expect(groupA.locator(`[title="${address}:8001"]`)).not.toBeVisible({ timeout: 5000 });
    });
  });
});
