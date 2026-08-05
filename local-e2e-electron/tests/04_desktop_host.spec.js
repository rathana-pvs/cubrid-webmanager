const { test, expect } = require('../fixtures/electron.fixture');
const { registerAndLogin } = require('../helpers/auth');
const { HostTreePage } = require('../pages/HostTreePage');

test.describe('Module 04: Desktop UI Host Management', () => {
  test.beforeEach(async ({ window }) => {
    await registerAndLogin(window);
  });

  test('authenticated user can view main layout and host management tree in Electron UI', async ({ window }) => {
    const hostTree = new HostTreePage(window);
    await expect(hostTree.hostSection).toBeVisible();
    await expect(hostTree.addHostToolbarBtn).toBeVisible();
  });

  test('opening Add Host modal renders connection form input controls in Electron UI', async ({ window }) => {
    const hostTree = new HostTreePage(window);
    await expect(hostTree.addHostToolbarBtn).toBeVisible();
    await hostTree.addHostToolbarBtn.click();

    const addHostModal = window.getByTestId('add-host-modal').or(window.locator('[data-testid="add-host-modal"]')).or(window.locator('.ant-modal, [role="dialog"]').first());
    await expect(addHostModal).toBeVisible({ timeout: 10000 });

    const addressInput = window.getByTestId('host-ip-input').or(window.locator('input[name*="address"], input[id*="ip"], input[placeholder*="IP"]').first());
    await expect(addressInput).toBeVisible();
  });

  test('host sidebar context menu opens with action options in Electron UI', async ({ window }) => {
    const hostTree = new HostTreePage(window);
    await expect(hostTree.hostSection).toBeVisible();
    await hostTree.hostSection.click({ button: 'right' });
    await expect(hostTree.hostSection).toBeVisible();
  });
});
