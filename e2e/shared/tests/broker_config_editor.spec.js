const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';

test.describe('Feature: Broker Configuration Editor', () => {
  let hostUid;

  test.beforeEach(async ({ appPage: page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await hostTree.activateHost(hostUid);
  });

  test('Scenario: Editing Broker Config loads content, marks dirty state on edit, and undoes changes', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Broker & Service Management',
      feature: 'Broker Configuration',
      story: 'Edit and Revert Broker Config',
    });

    let textarea;
    let originalContent;
    let saveBtn;
    let undoBtn;

    await Given('the user opens Edit Broker Config from the Broker tab context menu', async () => {
      await page.mouse.click(2, 2).catch(() => undefined);
      await page.getByTestId('tree-tab-broker').click({ button: 'right' });
      await page.getByRole('button', { name: 'Edit Broker Config' }).click();

      const tab = page.getByTestId(`tab-broker_config:${hostUid}`);
      await expect(tab).toBeVisible({ timeout: 10000 });

      const editor = page.getByTestId('broker-config-editor');
      await expect(editor).toBeVisible();
      textarea = page.getByTestId('broker-config-textarea');
      await expect(textarea).toBeVisible({ timeout: 10000 });
      await expect(textarea).not.toHaveValue('', { timeout: 15000 });
      originalContent = await textarea.inputValue();
    });

    await When('the user edits the configuration textarea content', async () => {
      saveBtn = page.getByTestId('broker-config-save-btn');
      undoBtn = page.getByTestId('broker-config-undo-btn');
      await expect(saveBtn).toBeDisabled();
      await expect(undoBtn).toBeDisabled();

      await textarea.click();
      await textarea.press('End');
      await page.keyboard.type('\n# e2e test comment');
    });

    await Then('Save and Undo buttons become enabled and Undo reverts to original content', async () => {
      await expect(saveBtn).toBeEnabled();
      await expect(undoBtn).toBeEnabled();

      await undoBtn.click();
      await expect(textarea).toHaveValue(originalContent);
      await expect(saveBtn).toBeDisabled();
      await expect(undoBtn).toBeDisabled();
    });
  });
});
