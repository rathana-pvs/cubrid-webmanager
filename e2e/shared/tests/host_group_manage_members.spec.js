const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { Given, When, Then, And, bddMeta, action } = require('../bdd');

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
      await action('Click new group toolbar button', () => page.getByTestId('new-group-toolbar-btn').click(), 'Could not click new group toolbar button.');
      const modal = page.getByTestId('group-name-modal');
      await action('Fill group name with: ' + groupName, () => modal.locator('input[name="groupName"]').fill(groupName), 'Could not type group name into input.');
      await action('Click group name submit button', () => page.getByTestId('group-name-submit-btn').click(), 'Could not click group name submit button.');
      await action('Verify group name modal is closed', () => expect(modal).not.toBeVisible({ timeout: 10000 }), 'Group name modal did not close after creating group.');

      group = page.locator('#host-section').locator('details').filter({ hasText: groupName }).first();
      await action('Verify group ' + groupName + ' is visible in host tree', () => expect(group).toBeVisible({ timeout: 10000 }), 'Created group was not visible in the host tree.');
    });

    await When('the user opens Manage Group and checks the target host', async () => {
      await action('Right-click group ' + groupName + ' summary', () => group.locator('> summary').click({ button: 'right' }), 'Could not right-click on group summary.');
      await action('Click Manage Group context menu option', () => page.getByRole('button', { name: /Manage Group/i }).click(), 'Could not click Manage Group option in context menu.');

      const modal = page.getByTestId('manage-group-members-modal');
      await action('Verify manage group members modal is visible', () => expect(modal).toBeVisible(), 'Manage group members modal was not displayed.');
      await action('Check host ' + E2E_HOST_ADDRESS + ':' + E2E_HOST_PORT + ' checkbox in manage members modal', () => memberRow(modal, E2E_HOST_ADDRESS, E2E_HOST_PORT).locator('[data-testid^="manage-group-members-checkbox-"]').click(), 'Could not click host checkbox in manage members modal.');
      await action('Click save button in manage group members modal', () => page.getByTestId('manage-group-members-save-btn').click(), 'Could not click save button in manage group members modal.');
      await action('Verify manage group members modal is closed', () => expect(modal).not.toBeVisible({ timeout: 10000 }), 'Manage group members modal did not close after saving.');
    });

    await Then('the host appears inside the group details in the tree', async () => {
      const isOpenAfterMove = await group.evaluate((el) => el.open);
      if (!isOpenAfterMove) await action('Expand group ' + groupName, () => group.locator('> summary').click(), 'Could not expand group details.');
      await action('Verify host ' + E2E_HOST_ADDRESS + ':' + E2E_HOST_PORT + ' is visible inside group', () => expect(group.locator(`[title="${E2E_HOST_ADDRESS}:${E2E_HOST_PORT}"]`)).toBeVisible({ timeout: 10000 }), 'Host was not visible inside the group.');
    });

    await And('unchecking the host moves it out of the group', async () => {
      await action('Right-click group ' + groupName + ' summary', () => group.locator('> summary').click({ button: 'right' }), 'Could not right-click on group summary.');
      await action('Click Manage Group context menu option', () => page.getByRole('button', { name: /Manage Group/i }).click(), 'Could not click Manage Group option in context menu.');
      const modal = page.getByTestId('manage-group-members-modal');
      await action('Verify manage group members modal is visible', () => expect(modal).toBeVisible(), 'Manage group members modal was not displayed.');
      await action('Uncheck host ' + E2E_HOST_ADDRESS + ':' + E2E_HOST_PORT + ' checkbox in manage members modal', () => memberRow(modal, E2E_HOST_ADDRESS, E2E_HOST_PORT).locator('[data-testid^="manage-group-members-checkbox-"]').click(), 'Could not uncheck host checkbox in manage members modal.');
      await action('Click save button in manage group members modal', () => page.getByTestId('manage-group-members-save-btn').click(), 'Could not click save button in manage group members modal.');
      await action('Verify manage group members modal is closed', () => expect(modal).not.toBeVisible({ timeout: 10000 }), 'Manage group members modal did not close after saving.');

      await action('Verify host ' + E2E_HOST_ADDRESS + ':' + E2E_HOST_PORT + ' is no longer inside group', () => expect(group.locator(`[title="${E2E_HOST_ADDRESS}:${E2E_HOST_PORT}"]`)).not.toBeVisible({ timeout: 5000 }), 'Host was still visible inside group after unchecking.');
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
      await action('Click new group toolbar button', () => page.getByTestId('new-group-toolbar-btn').click(), 'Could not click new group toolbar button.');
      const m = page.getByTestId('group-name-modal');
      await action('Fill group name with: ' + name, () => m.locator('input[name="groupName"]').fill(name), 'Could not type group name into input.');
      await action('Click group name submit button', () => page.getByTestId('group-name-submit-btn').click(), 'Could not click group name submit button.');
      await action('Verify group name modal is closed', () => expect(m).not.toBeVisible({ timeout: 10000 }), 'Group name modal did not close after creating group.');
    }

    await Given('two groups exist and a host is assigned to Group A', async () => {
      await createGroup(groupAName);
      await createGroup(groupBName);

      await action('Click Add Host toolbar button', () => page.getByTestId('add-host-toolbar-btn').click(), 'Could not click Add Host toolbar button.');
      const addModal = page.getByTestId('add-host-modal');
      await action('Verify Add Host modal is visible', () => expect(addModal).toBeVisible(), 'Add Host modal was not displayed.');
      await action('Fill host alias with: ' + alias, () => addModal.locator('[name="alias"]').fill(alias), 'Could not fill host alias.');
      await action('Fill host address with: ' + address, () => addModal.locator('[name="address"]').fill(address), 'Could not fill host address.');
      await action('Fill host port with: 8001', () => addModal.locator('[name="port"]').fill('8001'), 'Could not fill host port.');
      await action('Fill host id with: admin', () => addModal.locator('[name="id"]').fill('admin'), 'Could not fill host username.');
      await action('Fill host password with: ••••••••', () => addModal.locator('[name="password"]').fill('placeholder_pw'), 'Could not fill host password.');
      await action('Click Add Host save button', () => page.getByTestId('add-host-save-btn').click(), 'Could not click Add Host save button.');
      await action('Verify Add Host modal is closed', () => expect(addModal).not.toBeVisible({ timeout: 10000 }), 'Add Host modal did not close after saving.');

      groupA = page.locator('#host-section').locator('details').filter({ hasText: groupAName }).first();
      await action('Verify Group A is visible in host tree', () => expect(groupA).toBeVisible({ timeout: 10000 }), 'Group A was not visible in tree.');
      await action('Right-click Group A summary', () => groupA.locator('> summary').click({ button: 'right' }), 'Could not right-click on Group A summary.');
      await action('Click Manage Group context menu option', () => page.getByRole('button', { name: /Manage Group/i }).click(), 'Could not click Manage Group option for Group A.');
      let modal = page.getByTestId('manage-group-members-modal');
      await action('Verify manage group members modal is visible', () => expect(modal).toBeVisible(), 'Manage group members modal was not displayed.');
      await action('Check host ' + address + ':8001 checkbox in manage members modal', () => memberRow(modal, address, 8001).locator('[data-testid^="manage-group-members-checkbox-"]').click(), 'Could not check host checkbox in manage members modal.');
      await action('Click save button in manage group members modal', () => page.getByTestId('manage-group-members-save-btn').click(), 'Could not click save button in manage group members modal.');
      await action('Verify manage group members modal is closed', () => expect(modal).not.toBeVisible({ timeout: 10000 }), 'Manage group members modal did not close after saving.');

      const isOpenA = await groupA.evaluate((el) => el.open);
      if (!isOpenA) await action('Expand Group A', () => groupA.locator('> summary').click(), 'Could not expand Group A details.');
      await action('Verify host ' + address + ':8001 is visible inside Group A', () => expect(groupA.locator(`[title="${address}:8001"]`)).toBeVisible({ timeout: 10000 }), 'Host was not visible inside Group A.');
    });

    await When('the user opens Manage Group for Group B and selects the host', async () => {
      groupB = page.locator('#host-section').locator('details').filter({ hasText: groupBName }).first();
      await action('Right-click Group B summary', () => groupB.locator('> summary').click({ button: 'right' }), 'Could not right-click on Group B summary.');
      await action('Click Manage Group context menu option', () => page.getByRole('button', { name: /Manage Group/i }).click(), 'Could not click Manage Group option for Group B.');
      const modal = page.getByTestId('manage-group-members-modal');
      await action('Verify manage group members modal is visible', () => expect(modal).toBeVisible(), 'Manage group members modal was not displayed.');
      const row = memberRow(modal, address, 8001);
      await action('Verify host row displays group name ' + groupAName, () => expect(row.getByText(groupAName)).toBeVisible(), 'Group A name was not displayed in member row.');
      await action('Check host ' + address + ':8001 checkbox for Group B', () => row.locator('[data-testid^="manage-group-members-checkbox-"]').click(), 'Could not check host checkbox in Group B manage members modal.');
      await action('Click save button in manage group members modal', () => page.getByTestId('manage-group-members-save-btn').click(), 'Could not click save button in manage group members modal.');
      await action('Verify manage group members modal is closed', () => expect(modal).not.toBeVisible({ timeout: 10000 }), 'Manage group members modal did not close after saving.');
    });

    await Then('the host belongs to Group B and is removed from Group A', async () => {
      const isOpenB = await groupB.evaluate((el) => el.open);
      if (!isOpenB) await action('Expand Group B', () => groupB.locator('> summary').click(), 'Could not expand Group B details.');
      await action('Verify host ' + address + ':8001 is visible inside Group B', () => expect(groupB.locator(`[title="${address}:8001"]`)).toBeVisible({ timeout: 10000 }), 'Host was not visible inside Group B.');
      await action('Verify host ' + address + ':8001 is no longer inside Group A', () => expect(groupA.locator(`[title="${address}:8001"]`)).not.toBeVisible({ timeout: 5000 }), 'Host was still visible inside Group A after reassignment.');
    });
  });
});
