const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

test.describe('Feature: Database Query Plan Automation', () => {
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

  test('Scenario: Creating a query plan adds it to tree, editing and removing deletes it', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Job Automation',
      story: 'Create, Edit, and Delete Query Plan',
    });

    let planFolder;
    let planItem;
    const queryId = `e2e_query_${Date.now().toString().slice(-6)}`;

    await Given('the user expands Query Plan automation folder and opens Add modal', async () => {
      const jobFolder = await dbTree.expandSubNode(E2E_DB, 'Job automation');
      planFolder = jobFolder.getByTestId('tree-node-Query Plan');
      await expect(planFolder).toBeVisible({ timeout: 10000 });
      await planFolder.locator('> summary').click({ button: 'right' });
      await page.getByRole('button', { name: 'Add Query Plan' }).click();
    });

    await When('the user fills SQL query details and saves', async () => {
      const addModal = page.getByTestId('add-query-plan-modal');
      await expect(addModal).toBeVisible();
      await addModal.locator('input').first().fill(queryId);
      await addModal.locator('input[type="password"]').fill('public');
      await addModal.locator('.monaco-editor').click();
      await page.keyboard.type('SELECT 1 FROM db_root;');
      await page.getByTestId('add-query-plan-save-btn').click();

      await expect(page.getByText(/Query Plan Added/i).first()).toBeVisible({ timeout: 15000 });
      await page.getByRole('button', { name: /OK/ }).click();
    });

    await Then('the query plan appears under the tree and can be edited', async () => {
      const isOpen = await planFolder.evaluate((el) => el.open).catch(() => false);
      if (!isOpen) await planFolder.locator('> summary').click();
      planItem = dbTree.planItem(E2E_DB, queryId);
      await expect(planItem).toBeVisible({ timeout: 10000 });

      await planItem.click({ button: 'right' });
      await page.getByRole('button', { name: 'Edit Query Plan' }).click();
      const editModal = page.getByTestId('edit-query-plan-modal');
      await expect(editModal).toBeVisible();
      await editModal.locator('input[type="password"]').fill('public');
      await page.getByTestId('edit-query-plan-save-btn').click();
      await expect(page.getByText(/Update Successful/i).first()).toBeVisible({ timeout: 15000 });
      await page.getByRole('button', { name: /OK/ }).click();
    });

    await And('the query plan can be removed completely', async () => {
      await planItem.click({ button: 'right' });
      await page.getByRole('button', { name: 'Remove' }).click();
      const deleteModal = page.getByTestId('delete-query-plan-modal');
      await expect(deleteModal).toBeVisible();
      await page.getByTestId('delete-query-plan-confirm-btn').click();
      await expect(page.getByText(/Deletion Success/i).first()).toBeVisible({ timeout: 15000 });
      await expect(deleteModal).not.toBeVisible({ timeout: 5000 });
      await expect(planItem).not.toBeVisible({ timeout: 10000 });
    });
  });

  test('Scenario: Adding a duplicate query_id is rejected by CMS with error', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Job Automation',
      story: 'Duplicate Query Plan ID Validation',
    });

    const jobFolder = await dbTree.expandSubNode(E2E_DB, 'Job automation');
    const planFolder = jobFolder.getByTestId('tree-node-Query Plan');
    await expect(planFolder).toBeVisible({ timeout: 10000 });
    const queryId = `e2e_query_${Date.now().toString().slice(-6)}`;

    const fillAndSubmit = async (addModal) => {
      await addModal.locator('input').first().fill(queryId);
      await addModal.locator('input[type="password"]').fill('public');
      await addModal.locator('.monaco-editor').click();
      await page.keyboard.type('SELECT 1 FROM db_root;');
      await page.getByTestId('add-query-plan-save-btn').click();
    };

    await Given('a query plan is already registered', async () => {
      await planFolder.locator('> summary').click({ button: 'right' });
      await page.getByRole('button', { name: 'Add Query Plan' }).click();
      const addModal = page.getByTestId('add-query-plan-modal');
      await expect(addModal).toBeVisible();
      await fillAndSubmit(addModal);
      await expect(page.getByText(/Query Plan Added/i).first()).toBeVisible({ timeout: 15000 });
      await page.getByRole('button', { name: /OK/ }).click();
    });

    await When('the user submits another plan with identical query_id', async () => {
      await planFolder.locator('> summary').click({ button: 'right' });
      await page.getByRole('button', { name: 'Add Query Plan' }).click();
      const addModal = page.getByTestId('add-query-plan-modal');
      await expect(addModal).toBeVisible();
      await fillAndSubmit(addModal);

      await expect(page.getByText('Operation Interrupted')).toBeVisible({ timeout: 15000 });
      await page.getByRole('button', { name: 'Close', exact: true }).click();
      await page.getByTestId('add-query-plan-modal-close').click();
      await expect(addModal).not.toBeVisible();
    });

    await Then('the original plan remains intact in the list', async () => {
      const isOpen = await planFolder.evaluate((el) => el.open).catch(() => false);
      if (!isOpen) await planFolder.locator('> summary').click();
      const planItem = dbTree.planItem(E2E_DB, queryId);
      await expect(planItem).toBeVisible({ timeout: 10000 });

      // Clean up
      await planItem.click({ button: 'right' });
      await page.getByRole('button', { name: 'Remove' }).click();
      await page.getByTestId('delete-query-plan-confirm-btn').click();
      await expect(page.getByText(/Deletion Success/i).first()).toBeVisible({ timeout: 15000 });
      await expect(planItem).not.toBeVisible({ timeout: 10000 });
    });
  });
});
