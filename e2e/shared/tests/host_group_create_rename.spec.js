const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { Given, When, Then, And, bddMeta, action } = require('../bdd');

test.describe('Feature: Host Group Creation and Renaming', () => {
  test.beforeEach(async ({ appPage: page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);
  });

  test('Scenario: Attempting to create a group with an empty name shows validation error', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Host Management',
      feature: 'Host Groups',
      story: 'Group Creation Validation',
    });

    let modal;

    await Given('the user opens the new group creation modal', async () => {
      await action('Click new group toolbar button', () => page.getByTestId('new-group-toolbar-btn').click(), 'Could not click new group toolbar button.');
      modal = page.getByTestId('group-name-modal');
      await action('Verify group name modal is visible', () => expect(modal).toBeVisible(), 'Group name modal did not appear.');
    });

    await When('the user submits the modal with an empty group name', async () => {
      await action('Click group name submit button', () => page.getByTestId('group-name-submit-btn').click(), 'Could not click group name submit button.');
    });

    await Then('a required group name validation message is displayed', async () => {
      await action('Verify required group name validation message is displayed', () => expect(modal.getByText(/required|필수/i)).toBeVisible(), 'Required group name validation message was not displayed.');
    });

    await And('the user can cancel and close the modal', async () => {
      await action('Click cancel button on group name modal', () => page.getByTestId('group-name-cancel-btn').click(), 'Could not click cancel button on group name modal.');
      await action('Verify group name modal is closed', () => expect(modal).not.toBeVisible(), 'Group name modal did not close after clicking cancel.');
    });
  });

  test('Scenario: Successfully creating a new group adds it to the host tree list', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Host Management',
      feature: 'Host Groups',
      story: 'Create Group',
    });

    const groupName = `E2E_Group_${Date.now().toString().slice(-6)}`;

    await Given('the user opens the new group dialog', async () => {
      await action('Click new group toolbar button', () => page.getByTestId('new-group-toolbar-btn').click(), 'Could not click new group toolbar button.');
    });

    await When('the user fills in a unique group name and submits', async () => {
      const modal = page.getByTestId('group-name-modal');
      await action('Fill group name with: ' + groupName, () => modal.locator('input[name="groupName"]').fill(groupName), 'Could not type group name into input.');
      await action('Click group name submit button', () => page.getByTestId('group-name-submit-btn').click(), 'Could not click group name submit button.');
      await action('Verify group name modal is closed', () => expect(modal).not.toBeVisible({ timeout: 10000 }), 'Group name modal did not close after submitting.');
    });

    await Then('the new group appears in the host section tree', async () => {
      await action('Verify group ' + groupName + ' is visible in host section tree', () => expect(page.locator('#host-section').getByText(groupName)).toBeVisible({ timeout: 10000 }), 'New group was not visible in the host section tree.');
    });
  });

  test('Scenario: Renaming an existing group updates its title across the tree', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Host Management',
      feature: 'Host Groups',
      story: 'Rename Group',
    });

    const groupName = `E2E_Group_${Date.now().toString().slice(-6)}`;
    const renamedName = `${groupName}_Renamed`;
    let group;

    await Given('a host group already exists in the list', async () => {
      await action('Click new group toolbar button', () => page.getByTestId('new-group-toolbar-btn').click(), 'Could not click new group toolbar button.');
      const modal = page.getByTestId('group-name-modal');
      await action('Fill group name with: ' + groupName, () => modal.locator('input[name="groupName"]').fill(groupName), 'Could not type group name into input.');
      await action('Click group name submit button', () => page.getByTestId('group-name-submit-btn').click(), 'Could not click group name submit button.');
      await action('Verify group name modal is closed', () => expect(modal).not.toBeVisible({ timeout: 10000 }), 'Group name modal did not close after creating group.');

      group = page.locator('#host-section').locator('details').filter({ hasText: groupName }).first();
      await action('Verify group ' + groupName + ' is visible in host tree', () => expect(group).toBeVisible({ timeout: 10000 }), 'Created group was not visible in the host tree.');
    });

    await When('the user opens the context menu and chooses Rename Group with a new name', async () => {
      await action('Right-click group ' + groupName + ' summary', () => group.locator('> summary').click({ button: 'right' }), 'Could not right-click on group summary.');
      await action('Click Rename Group context menu option', () => page.getByRole('button', { name: /Rename Group/i }).click(), 'Could not click Rename Group option in context menu.');

      const modal = page.getByTestId('group-name-modal');
      await action('Fill renamed group name with: ' + renamedName, () => modal.locator('input[name="groupName"]').fill(renamedName), 'Could not type new group name into input.');
      await action('Click group name submit button', () => page.getByTestId('group-name-submit-btn').click(), 'Could not click group name submit button.');
      await action('Verify group name modal is closed', () => expect(modal).not.toBeVisible({ timeout: 10000 }), 'Rename group modal did not close after submitting.');
    });

    await Then('the host tree displays the renamed group title', async () => {
      await action('Verify renamed group ' + renamedName + ' appears in host tree', () => expect(page.locator('#host-section').getByText(renamedName)).toBeVisible({ timeout: 10000 }), 'Renamed group title was not displayed in the host tree.');
    });
  });
});
