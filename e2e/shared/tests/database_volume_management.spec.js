const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

test.describe('Feature: Database Volume Management', () => {
  let dbTree;

  test.beforeEach(async ({ appPage: page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    await host.dblclick();
    dbTree = new DatabaseTreePage(page);
    await dbTree.waitForAuthorized();
  });

  test('Scenario: Add Volume modal opens with defaults, responds to input, and discards on cancel', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Volume Management',
      story: 'Add Volume Form & Presets',
    });

    let modal;
    let saveBtn;

    await Given('the user expands Space sub-node and opens Add Volume dialog', async () => {
      const spaceFolder = await dbTree.expandSubNode(E2E_DB, 'Space');
      await spaceFolder.locator('> summary').click({ button: 'right' });
      await page.getByRole('button', { name: 'Add Volume' }).click();

      modal = page.getByTestId('add-volume-modal');
      await expect(modal).toBeVisible();
    });

    await When('the user inspects defaults and changes size preset to 1 GB', async () => {
      await expect(modal.getByText('512 MB').first()).toBeVisible();
      saveBtn = page.getByTestId('add-volume-save-btn');
      await expect(saveBtn).toBeEnabled();

      await modal.getByRole('button', { name: '1 GB', exact: true }).click();
      await expect(modal.getByText('1.0 GB')).toBeVisible();
    });

    await Then('clearing the directory disables the save button', async () => {
      const dirInput = modal.getByPlaceholder('/var/lib/cubrid/volumes');
      await dirInput.fill('');
      await expect(saveBtn).toBeDisabled();
    });

    await And('clicking Cancel closes the modal cleanly', async () => {
      await page.getByTestId('add-volume-cancel-btn').click();
      await expect(modal).not.toBeVisible();
    });
  });
});
