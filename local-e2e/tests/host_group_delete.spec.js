const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');

test.describe('Group Delete', () => {
  test.beforeEach(async ({ page }) => {
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

  test('그룹을 삭제하면 목록에서 사라진다', async ({ page }) => {
    const groupName = `E2E_GroupDel_${Date.now().toString().slice(-6)}`;
    await createGroup(page, groupName);

    const group = page.locator('#host-section').locator('details').filter({ hasText: groupName }).first();
    await expect(group).toBeVisible({ timeout: 10000 });
    await group.locator('> summary').click({ button: 'right' });
    await page.getByRole('button', { name: /Delete Group/i }).click();

    const modal = page.getByTestId('delete-group-modal');
    await expect(modal).toBeVisible();
    await page.getByTestId('delete-group-confirm-btn').click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });

    await expect(page.locator('#host-section').getByText(groupName)).not.toBeVisible({ timeout: 5000 });
  });

  test('삭제 취소를 누르면 그룹이 유지된다', async ({ page }) => {
    const groupName = `E2E_GroupKeep_${Date.now().toString().slice(-6)}`;
    await createGroup(page, groupName);

    const group = page.locator('#host-section').locator('details').filter({ hasText: groupName }).first();
    await group.locator('> summary').click({ button: 'right' });
    await page.getByRole('button', { name: /Delete Group/i }).click();

    const modal = page.getByTestId('delete-group-modal');
    await page.getByTestId('delete-group-cancel-btn').click();
    await expect(modal).not.toBeVisible();
    await expect(page.locator('#host-section').getByText(groupName)).toBeVisible();
  });

  test('호스트가 있는 그룹을 삭제하면 경고가 표시되고, 호스트도 함께 사라진다 (Ungrouped로 이동하지 않음)', async ({ page }) => {
    // Deleting a group is destructive to its hosts by design (see
    // DeleteHostGroupModal.jsx / cmLabels.deleteGroupHostsWarning — hosts are
    // NOT moved to Ungrouped, they're deleted along with the group). This
    // guards that documented, warned-about behavior against regression.
    const groupName = `E2E_GroupWithHost_${Date.now().toString().slice(-6)}`;
    await createGroup(page, groupName);

    const alias = `E2E_HostInGroup_${Date.now().toString().slice(-6)}`;
    const address = `10.9.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

    await page.getByTestId('add-host-toolbar-btn').click();
    const addModal = page.getByTestId('add-host-modal');
    await expect(addModal).toBeVisible();
    await addModal.locator('[name="alias"]').fill(alias);
    await addModal.locator('[name="address"]').fill(address);
    await addModal.locator('[name="port"]').fill('8001');
    await addModal.locator('[name="id"]').fill('admin');
    await addModal.locator('[name="password"]').fill('placeholder_pw');
    // Note: not exercising the modal's own group-select dropdown here — it's
    // a custom portal-rendered listbox that's flaky to drive from Playwright
    // and isn't what this test is about. Add ungrouped, then move it into the
    // group via the same API the app itself calls (PUT /host/:hostUid with
    // groupId), which is the real, already-covered mechanism for changing a
    // host's group (see host_group_manage_members.spec.js).
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
    await page.waitForLoadState('networkidle').catch(() => {});
    const groupAfterMove = page.locator('#host-section').locator('details').filter({ hasText: groupName }).first();
    await expect(groupAfterMove).toBeVisible({ timeout: 10000 });
    const isOpen = await groupAfterMove.evaluate((el) => el.open).catch(() => false);
    if (!isOpen) await groupAfterMove.locator('> summary').click();
    const hostItem = groupAfterMove.getByText(alias);
    await expect(hostItem).toBeVisible({ timeout: 10000 });

    await groupAfterMove.locator('> summary').click({ button: 'right' });
    await page.getByRole('button', { name: /Delete Group/i }).click();

    const modal = page.getByTestId('delete-group-modal');
    await expect(modal).toBeVisible();
    // Warns about exactly the one host that will be permanently deleted too.
    await expect(modal.getByText('This will also permanently delete 1 host registered in this group')).toBeVisible();
    await expect(modal.getByText(alias)).toBeVisible();

    await page.getByTestId('delete-group-confirm-btn').click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });

    await expect(page.locator('#host-section').getByText(groupName)).not.toBeVisible({ timeout: 5000 });
    // Not moved to Ungrouped — the host must be gone entirely.
    await expect(page.locator('#host-section').getByText(alias)).not.toBeVisible({ timeout: 5000 });
  });
});
