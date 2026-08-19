const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

test.describe('Feature: Host Group Deletion', () => {
  test.beforeEach(async ({ appPage: page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);
  });

  async function createGroup(page, groupName) {
    await page.getByTestId('new-group-toolbar-btn').click();
    const modal = page.getByTestId('group-name-modal');
    await modal.locator('input[name="groupName"]').fill(groupName);
    await page.getByTestId('group-name-submit-btn').click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });
  }

  test('Scenario: Deleting an empty group removes it permanently from the list', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Host Management',
      feature: 'Host Groups',
      story: 'Delete Empty Group',
    });

    const groupName = `E2E_GroupDel_${Date.now().toString().slice(-6)}`;
    let group;

    await Given('an empty host group exists in the list', async () => {
      await createGroup(page, groupName);
      group = page.locator('#host-section').locator('details').filter({ hasText: groupName }).first();
      await expect(group).toBeVisible({ timeout: 10000 });
    });

    await When('the user right-clicks the group and confirms Delete Group', async () => {
      await group.locator('> summary').click({ button: 'right' });
      await page.getByRole('button', { name: /Delete Group/i }).click();

      const modal = page.getByTestId('delete-group-modal');
      await expect(modal).toBeVisible();
      await page.getByTestId('delete-group-confirm-btn').click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });
    });

    await Then('the deleted group is no longer visible in the host tree', async () => {
      await expect(page.locator('#host-section').getByText(groupName)).not.toBeVisible({ timeout: 5000 });
    });
  });

  test('Scenario: Cancelling group deletion preserves the group in the tree', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Host Management',
      feature: 'Host Groups',
      story: 'Cancel Group Deletion',
    });

    const groupName = `E2E_GroupKeep_${Date.now().toString().slice(-6)}`;
    let group;

    await Given('a host group is present in the list', async () => {
      await createGroup(page, groupName);
      group = page.locator('#host-section').locator('details').filter({ hasText: groupName }).first();
      await expect(group).toBeVisible({ timeout: 10000 });
    });

    await When('the user opens the delete confirmation modal but clicks Cancel', async () => {
      await group.locator('> summary').click({ button: 'right' });
      await page.getByRole('button', { name: /Delete Group/i }).click();

      const modal = page.getByTestId('delete-group-modal');
      await expect(modal).toBeVisible();
      await page.getByTestId('delete-group-cancel-btn').click();
      await expect(modal).not.toBeVisible();
    });

    await Then('the group remains visible in the host section', async () => {
      await expect(page.locator('#host-section').getByText(groupName)).toBeVisible();
    });
  });

  test('Scenario: Deleting a group with assigned hosts warns about permanent host deletion', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Host Management',
      feature: 'Host Groups',
      story: 'Delete Group With Hosts Cascade',
    });

    const groupName = `E2E_GroupWithHost_${Date.now().toString().slice(-6)}`;
    const alias = `E2E_HostInGroup_${Date.now().toString().slice(-6)}`;
    const address = `10.9.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    let groupAfterMove;

    await Given('a group exists with an assigned host', async () => {
      await createGroup(page, groupName);

      await page.getByTestId('add-host-toolbar-btn').click();
      const addModal = page.getByTestId('add-host-modal');
      await expect(addModal).toBeVisible();
      await addModal.locator('[name="alias"]').fill(alias);
      await addModal.locator('[name="address"]').fill(address);
      await addModal.locator('[name="port"]').fill('8001');
      await addModal.locator('[name="id"]').fill('admin');
      await addModal.locator('[name="password"]').fill('placeholder_pw');
      await page.getByTestId('add-host-save-btn').click();
      await expect(addModal).not.toBeVisible({ timeout: 10000 });

      const group = page.locator('#host-section').locator('details').filter({ hasText: groupName }).first();
      await expect(group).toBeVisible({ timeout: 10000 });
      const groupTestId = await group.getAttribute('data-testid');
      const groupId = groupTestId.replace('tree-node-', '');

      const hostRow = page.locator('#host-section').locator(`[title="${address}:8001"]`);
      await expect(hostRow).toBeVisible({ timeout: 10000 });
      const hostTestId = await hostRow.getAttribute('data-testid');
      const token = await page.evaluate(() => localStorage.getItem('token'));
      const hostUid = hostTestId.replace('host-item-', '');

      const moveResult = await page.evaluate(async ({ hostUid, groupId, token }) => {
        const res = await fetch(`/api/host/${hostUid}/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ targetGroupId: groupId }),
        });
        return { status: res.status, body: await res.text() };
      }, { hostUid, groupId, token });
      expect(moveResult.status).toBeLessThan(300);

      await page.reload();
      await page.waitForLoadState('networkidle').catch(() => undefined);
      groupAfterMove = page.locator('#host-section').locator('details').filter({ hasText: groupName }).first();
      await expect(groupAfterMove).toBeVisible({ timeout: 10000 });
      const isOpen = await groupAfterMove.evaluate((el) => el.open).catch(() => false);
      if (!isOpen) await groupAfterMove.locator('> summary').click();
      await expect(groupAfterMove.getByText(alias)).toBeVisible({ timeout: 10000 });
    });

    await When('the user opens Delete Group and verifies the cascade deletion warning', async () => {
      await groupAfterMove.locator('> summary').click({ button: 'right' });
      await page.getByRole('button', { name: /Delete Group/i }).click();

      const modal = page.getByTestId('delete-group-modal');
      await expect(modal).toBeVisible();
      await expect(modal.getByText('This will also permanently delete 1 host registered in this group')).toBeVisible();
      await expect(modal.getByText(alias)).toBeVisible();

      await page.getByTestId('delete-group-confirm-btn').click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });
    });

    await Then('both the group and its assigned hosts are removed permanently', async () => {
      await expect(page.locator('#host-section').getByText(groupName)).not.toBeVisible({ timeout: 5000 });
      await expect(page.locator('#host-section').getByText(alias)).not.toBeVisible({ timeout: 5000 });
    });
  });
});
