const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';

test.describe('Feature: CUBRID Configuration Editor', () => {
  let hostUid;

  test.beforeEach(async ({ appPage: page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await hostTree.activateHost(hostUid);

    await page.getByText('Host Service Management').hover();
    await page.getByText('Config Param').hover();
    await page.getByRole('button', { name: 'Edit Cubrid Config' }).click();
  });

  test('Scenario: Opening config editor loads content, typing marks dirty, and undo restores original content', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Broker & Server',
      feature: 'Configuration Editors',
      story: 'Cubrid Config Undo',
    });

    let textarea;
    let originalContent;
    let saveBtn;
    let undoBtn;

    await Given('the cubrid.conf editor tab is loaded', async () => {
      const tab = page.getByTestId(`tab-edit_config:${hostUid}:cubridconf`);
      await expect(tab).toBeVisible({ timeout: 10000 });

      const editor = page.getByTestId('cubrid-config-editor');
      await expect(editor).toBeVisible();
      textarea = page.getByTestId('cubrid-config-textarea');
      await expect(textarea).toBeVisible({ timeout: 10000 });
      await expect(textarea).not.toHaveValue('', { timeout: 15000 });
      originalContent = await textarea.inputValue();

      saveBtn = page.getByTestId('cubrid-config-save-btn');
      undoBtn = page.getByTestId('cubrid-config-undo-btn');
      await expect(saveBtn).toBeDisabled();
      await expect(undoBtn).toBeDisabled();
    });

    await When('the user edits the configuration textarea', async () => {
      await textarea.click();
      await textarea.press('End');
      await page.keyboard.type('\n# e2e test comment');
    });

    await Then('Save and Undo buttons become enabled', async () => {
      await expect(saveBtn).toBeEnabled();
      await expect(undoBtn).toBeEnabled();
    });

    await And('clicking Undo reverts the content to original state', async () => {
      await undoBtn.click();
      await expect(textarea).toHaveValue(originalContent);
      await expect(saveBtn).toBeDisabled();
      await expect(undoBtn).toBeDisabled();
    });
  });
});
