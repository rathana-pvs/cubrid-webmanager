const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

test.describe('Feature: Database Backup Plan', () => {
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

  async function addPlan(page, planFolder, planId) {
    await planFolder.locator('> summary').click({ button: 'right' });
    await page.getByRole('button', { name: /Create Backup Plan/i }).click();
    const addModal = page.getByTestId('add-backup-plan-modal');
    await expect(addModal).toBeVisible();
    await addModal.locator('input').first().fill(planId);
    await page.getByTestId('add-backup-plan-save-btn').click();

    const successText = page.getByRole('heading', { name: /Saved|Success|Committed/i }).first();
    const errorText = page.getByText(/Execution Error|Operation Interrupted/i).first();
    await expect(successText.or(errorText)).toBeVisible({ timeout: 30000 });

    if (await errorText.isVisible().catch(() => false)) {
      const permissionDenied = await page.getByText(/Permission denied/i).first().isVisible().catch(() => false);
      if (!permissionDenied) {
        const errorDetail = await page.locator('body').innerText().catch(() => '');
        throw new Error(`Add Backup Plan failed with an unexpected error: ${errorDetail.slice(0, 500)}`);
      }
      await page.getByRole('button', { name: 'Close', exact: true }).click();
      return 'permission-denied';
    }
    await page.keyboard.press('Escape');
    return 'success';
  }

  test('Scenario: Creating a backup plan adds it to the tree and deleting removes it', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Backup Management',
      story: 'Create and Delete Backup Plan',
    });

    const planId = `e2e_plan_${Date.now().toString().slice(-6)}`;
    let planFolder;

    await Given('the user expands Job automation and backup sub-nodes', async () => {
      await dbTree.expandSubNode(E2E_DB, 'Job automation');
      planFolder = await dbTree.expandSubNode(E2E_DB, 'Backup');
      await expect(planFolder).toBeVisible({ timeout: 10000 });
    });

    await When('the user fills and submits a new backup plan', async () => {
      const outcome = await addPlan(page, planFolder, planId);
      if (outcome === 'permission-denied') return;
    });

    await Then('the backup plan is visible under the backup node in the tree', async () => {
      const planNode = dbTree.subNode(E2E_DB, planId);
      await expect(planNode).toBeVisible({ timeout: 10000 });

      // Clean up by deleting the plan
      await planNode.click({ button: 'right' });
      await page.getByRole('button', { name: 'Delete Backup Plan' }).click();
      const deleteModal = page.getByTestId('delete-backup-plan-modal');
      await expect(deleteModal).toBeVisible();
      await page.getByTestId('delete-backup-plan-confirm-btn').click();
      await expect(deleteModal).not.toBeVisible({ timeout: 10000 });
      await expect(planNode).not.toBeVisible({ timeout: 5000 });
    });
  });

  test('Scenario: Creating backup plan with existing backupid is rejected with CMS error', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Backup Management',
      story: 'Duplicate Backup Plan ID Prevention',
    });

    const planId = `e2e_plan_${Date.now().toString().slice(-6)}`;

    await Given('a backup plan with a specific ID is created', async () => {
      await dbTree.expandSubNode(E2E_DB, 'Job automation');
      const planFolder = await dbTree.expandSubNode(E2E_DB, 'Backup');
      const outcome = await addPlan(page, planFolder, planId);
      if (outcome === 'permission-denied') return;
      await expect(dbTree.subNode(E2E_DB, planId)).toBeVisible({ timeout: 10000 });
    });

    await When('the user tries to create another backup plan with the same ID', async () => {
      const planFolder = dbTree.subNode(E2E_DB, 'Backup');
      await planFolder.locator('> summary').click({ button: 'right' });
      await page.getByRole('button', { name: /Create Backup Plan/i }).click();

      const addModal = page.getByTestId('add-backup-plan-modal');
      await expect(addModal).toBeVisible();
      await addModal.locator('input').first().fill(planId);
      await page.getByTestId('add-backup-plan-save-btn').click();
    });

    await Then('an execution error dialog is displayed rejecting the duplicate plan', async () => {
      const errorDialog = page.getByText(/Execution Error|Operation Interrupted|already exists/i).first();
      await expect(errorDialog).toBeVisible({ timeout: 30000 });
      await page.keyboard.press('Escape');
    });
  });
});
