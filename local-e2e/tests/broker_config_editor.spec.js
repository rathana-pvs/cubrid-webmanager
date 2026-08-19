const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';

// Save writes straight to the host's real cubrid_broker.conf with no
// diff/preview step — never click it for real. Only open, edit, and undo.
test.describe('Broker Config Editor', () => {
  let hostUid;

  test.beforeEach(async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await host.dblclick();
    const dbTree = new DatabaseTreePage(page);
    await dbTree.waitForAuthorized();
  });

  test('Edit Broker Config를 열면 설정 내용이 표시되고, 수정하면 dirty 표시가 되며, Undo로 되돌릴 수 있다', async ({ page }) => {
    await page.mouse.click(2, 2).catch(() => {});
    await page.getByTestId('tree-tab-broker').click({ button: 'right' });
    await page.getByRole('button', { name: 'Edit Broker Config' }).click();

    const tab = page.getByTestId(`tab-broker_config:${hostUid}`);
    await expect(tab).toBeVisible({ timeout: 10000 });

    const editor = page.getByTestId('broker-config-editor');
    await expect(editor).toBeVisible();
    const textarea = page.getByTestId('broker-config-textarea');
    await expect(textarea).toBeVisible({ timeout: 10000 });
    // The initial fetch can be slow against the real host — wait for actual
    // content rather than reading inputValue() the instant the field mounts.
    await expect(textarea).not.toHaveValue('', { timeout: 15000 });
    const originalContent = await textarea.inputValue();

    const saveBtn = page.getByTestId('broker-config-save-btn');
    const undoBtn = page.getByTestId('broker-config-undo-btn');
    await expect(saveBtn).toBeDisabled();
    await expect(undoBtn).toBeDisabled();

    await textarea.click();
    await textarea.press('End');
    await page.keyboard.type('\n# e2e test comment');

    await expect(saveBtn).toBeEnabled();
    await expect(undoBtn).toBeEnabled();

    await undoBtn.click();
    await expect(textarea).toHaveValue(originalContent);
    await expect(saveBtn).toBeDisabled();
    await expect(undoBtn).toBeDisabled();
  });
});
