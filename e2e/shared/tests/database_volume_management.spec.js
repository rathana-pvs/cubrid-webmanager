const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { Given, When, Then, And, bddMeta, action } = require('../bdd');

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
    const hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await hostTree.activateHost(hostUid);
    dbTree = new DatabaseTreePage(page);
    await dbTree.waitForAuthorized();
    await dbTree.openDashboardTab(E2E_DB, hostUid);
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
      let spaceFolder;
      await action(`Expand "Space" node for database "${E2E_DB}"`, async () => {
        spaceFolder = await dbTree.expandSubNode(E2E_DB, 'Space');
      }, 'Failed to expand Space sub-node in tree.');
      await action('Right-click Space folder in tree', () => spaceFolder.locator('> summary').click({ button: 'right' }), 'Could not right-click Space folder.');
      await action('Click Add Volume menu item', () => page.getByRole('button', { name: /Add Volume|볼륨 추가/i }).click(), 'Could not click Add Volume context menu option.');

      modal = page.getByTestId('add-volume-modal');
      await action('Verify Add Volume modal is visible', () => expect(modal).toBeVisible(), 'Add Volume modal did not appear.');
    });

    await When('the user inspects defaults and changes size preset to 1 GB', async () => {
      await action('Verify default volume size "512 MB" is displayed', () => expect(modal.getByText('512 MB').first()).toBeVisible(), 'Default volume size "512 MB" was not visible.');
      saveBtn = page.getByTestId('add-volume-save-btn');
      await action('Verify Add Volume save button is enabled', () => expect(saveBtn).toBeEnabled(), 'Add Volume save button was not enabled.');

      await action('Click 1 GB volume size preset button', () => modal.getByRole('button', { name: '1 GB', exact: true }).click(), 'Could not click 1 GB preset button.');
      await action('Verify volume size is updated to "1.0 GB"', () => expect(modal.getByText('1.0 GB')).toBeVisible(), 'Volume size display was not updated to 1.0 GB.');
    });

    await Then('clearing the directory disables the save button', async () => {
      const dirInput = modal.getByPlaceholder('/var/lib/cubrid/volumes');
      await action('Clear volume directory input field', () => dirInput.fill(''), 'Could not clear volume directory input field.');
      await action('Verify Add Volume save button is disabled', () => expect(saveBtn).toBeDisabled(), 'Add Volume save button was not disabled when directory was cleared.');
    });

    await And('clicking Cancel closes the modal cleanly', async () => {
      await action('Click Cancel button on Add Volume modal', () => page.getByTestId('add-volume-cancel-btn').click(), 'Could not click Cancel button on Add Volume modal.');
      await action('Verify Add Volume modal is dismissed', () => expect(modal).not.toBeVisible(), 'Add Volume modal remained open after clicking Cancel.');
    });
  });
});
