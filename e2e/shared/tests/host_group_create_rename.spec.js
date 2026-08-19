const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

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
      await page.getByTestId('new-group-toolbar-btn').click();
      modal = page.getByTestId('group-name-modal');
      await expect(modal).toBeVisible();
    });

    await When('the user submits the modal with an empty group name', async () => {
      await page.getByTestId('group-name-submit-btn').click();
    });

    await Then('a required group name validation message is displayed', async () => {
      await expect(modal.getByText(/required|필수/i)).toBeVisible();
    });

    await And('the user can cancel and close the modal', async () => {
      await page.getByTestId('group-name-cancel-btn').click();
      await expect(modal).not.toBeVisible();
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
      await page.getByTestId('new-group-toolbar-btn').click();
    });

    await When('the user fills in a unique group name and submits', async () => {
      const modal = page.getByTestId('group-name-modal');
      await modal.locator('input[name="groupName"]').fill(groupName);
      await page.getByTestId('group-name-submit-btn').click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });
    });

    await Then('the new group appears in the host section tree', async () => {
      await expect(page.locator('#host-section').getByText(groupName)).toBeVisible({ timeout: 10000 });
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
      await page.getByTestId('new-group-toolbar-btn').click();
      const modal = page.getByTestId('group-name-modal');
      await modal.locator('input[name="groupName"]').fill(groupName);
      await page.getByTestId('group-name-submit-btn').click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });

      group = page.locator('#host-section').locator('details').filter({ hasText: groupName }).first();
      await expect(group).toBeVisible({ timeout: 10000 });
    });

    await When('the user opens the context menu and chooses Rename Group with a new name', async () => {
      await group.locator('> summary').click({ button: 'right' });
      await page.getByRole('button', { name: /Rename Group/i }).click();

      const modal = page.getByTestId('group-name-modal');
      await modal.locator('input[name="groupName"]').fill(renamedName);
      await page.getByTestId('group-name-submit-btn').click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });
    });

    await Then('the host tree displays the renamed group title', async () => {
      await expect(page.locator('#host-section').getByText(renamedName)).toBeVisible({ timeout: 10000 });
    });
  });
});
