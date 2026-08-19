const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

test.describe('Database Backup Plan', () => {
  let dbTree;

  test.beforeEach(async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    await host.dblclick();
    dbTree = new DatabaseTreePage(page);
    await dbTree.waitForAuthorized();
  });

  /**
   * Opens the Add Backup Plan modal, fills the backupid, and submits.
   * Returns 'success' | 'permission-denied' | 'other-error'. Only
   * 'permission-denied' is a known, accepted environment limitation (the CMS
   * host's OS user may not have write access to the default backup
   * directory here) — 'other-error' means a real app/validation bug and
   * must fail the test rather than be silently swallowed.
   */
  async function addPlan(page, planFolder, planId) {
    await planFolder.locator('> summary').click({ button: 'right' });
    await page.getByRole('button', { name: /Create Backup Plan/i }).click();
    const addModal = page.getByTestId('add-backup-plan-modal');
    await expect(addModal).toBeVisible();
    await addModal.locator('input').first().fill(planId);
    await page.getByTestId('add-backup-plan-save-btn').click();

    const successText = page.getByText(/Success|Committed/i).first();
    const errorText = page.getByText(/Execution Error|Operation Interrupted/i).first();
    await expect(successText.or(errorText)).toBeVisible({ timeout: 30000 });

    if (await errorText.isVisible().catch(() => false)) {
      const permissionDenied = await page.getByText(/Permission denied/i).first().isVisible().catch(() => false);
      if (!permissionDenied) {
        const errorDetail = await page.locator('body').innerText().catch(() => '');
        throw new Error(`Add Backup Plan failed with an unexpected error (not the known permission issue): ${errorDetail.slice(0, 500)}`);
      }
      await page.getByRole('button', { name: 'Close', exact: true }).click();
      return 'permission-denied';
    }
    await page.keyboard.press('Escape');
    return 'success';
  }

  test('백업 계획을 생성하면 트리에 나타나고, 삭제하면 사라진다', async ({ page }) => {
    const backupFolder = await dbTree.expandSubNode(E2E_DB, 'Job automation');
    const planFolder = backupFolder.getByTestId('tree-node-Backup Plan');
    await expect(planFolder).toBeVisible({ timeout: 10000 });

    const planId = `e2e_plan_${Date.now().toString().slice(-6)}`;
    const outcome = await addPlan(page, planFolder, planId);
    if (outcome === 'permission-denied') {
      test.info().annotations.push({ type: 'skip-reason', description: 'Backup dir not writable in this environment' });
      return;
    }

    const isOpen = await planFolder.evaluate((el) => el.open).catch(() => false);
    if (!isOpen) await planFolder.locator('> summary').click();
    const planItem = dbTree.planItem(E2E_DB, planId);
    await expect(planItem).toBeVisible({ timeout: 10000 });

    // Cleanup
    await planItem.locator('> summary, button').first().click({ button: 'right' }).catch(async () => {
      await planItem.click({ button: 'right' });
    });
    await page.getByRole('button', { name: /Delete/i }).click();
    const deleteModal = page.getByTestId('delete-backup-plan-modal');
    await expect(deleteModal).toBeVisible();
    await page.getByTestId('delete-backup-plan-confirm-btn').click();
    await expect(page.getByText(/Success/i).first()).toBeVisible({ timeout: 15000 });
    await page.keyboard.press('Escape');

    await expect(planItem).not.toBeVisible({ timeout: 10000 });
  });

  test('백업 계획을 수정하면 변경한 값이 반영된다', async ({ page }) => {
    const backupFolder = await dbTree.expandSubNode(E2E_DB, 'Job automation');
    const planFolder = backupFolder.getByTestId('tree-node-Backup Plan');
    await expect(planFolder).toBeVisible({ timeout: 10000 });

    const planId = `e2e_plan_${Date.now().toString().slice(-6)}`;
    const outcome = await addPlan(page, planFolder, planId);
    if (outcome === 'permission-denied') {
      test.info().annotations.push({ type: 'skip-reason', description: 'Backup dir not writable in this environment' });
      return;
    }

    const isOpen = await planFolder.evaluate((el) => el.open).catch(() => false);
    if (!isOpen) await planFolder.locator('> summary').click();
    const planItem = dbTree.planItem(E2E_DB, planId);
    await expect(planItem).toBeVisible({ timeout: 10000 });

    // Edit: switch backup level from Full (L0) to Inc. (L1).
    await planItem.click({ button: 'right' }).catch(async () => {
      await planItem.locator('> summary, button').first().click({ button: 'right' });
    });
    await page.getByRole('button', { name: /Edit/i }).click();
    const editModal = page.getByTestId('edit-backup-plan-modal');
    await expect(editModal).toBeVisible();
    await editModal.getByText('Inc. (L1)').click();
    await page.getByTestId('edit-backup-plan-save-btn').click();
    await expect(page.getByText(/Update Successful/i).first()).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /OK/ }).click();

    // Reopen edit to confirm the change actually persisted on the CMS side
    // (the modal refetches the schedule fresh on every open).
    await planItem.click({ button: 'right' });
    await page.getByRole('button', { name: /Edit/i }).click();
    await expect(editModal).toBeVisible();
    const l1Preset = editModal.locator('button', { hasText: 'Inc. (L1)' });
    await expect(l1Preset).toHaveClass(/border-amber-500\/40/, { timeout: 10000 });
    await page.getByTestId('edit-backup-plan-cancel-btn').click();

    // Cleanup
    await planItem.click({ button: 'right' });
    await page.getByRole('button', { name: /Delete/i }).click();
    const deleteModal = page.getByTestId('delete-backup-plan-modal');
    await expect(deleteModal).toBeVisible();
    await page.getByTestId('delete-backup-plan-confirm-btn').click();
    await expect(page.getByText(/Success/i).first()).toBeVisible({ timeout: 15000 });
    await page.keyboard.press('Escape');
    await expect(planItem).not.toBeVisible({ timeout: 10000 });
  });

  test('이미 존재하는 backupid로 생성하면 CMS가 거부하고 오류가 표시된다', async ({ page }) => {
    const backupFolder = await dbTree.expandSubNode(E2E_DB, 'Job automation');
    const planFolder = backupFolder.getByTestId('tree-node-Backup Plan');
    await expect(planFolder).toBeVisible({ timeout: 10000 });

    const planId = `e2e_dup_${Date.now().toString().slice(-6)}`;
    const outcome = await addPlan(page, planFolder, planId);
    if (outcome === 'permission-denied') {
      test.info().annotations.push({ type: 'skip-reason', description: 'Backup dir not writable in this environment' });
      return;
    }

    // Re-open and try to add the exact same backupid again — CMS rejects
    // the duplicate instead of silently overwriting it.
    await planFolder.locator('> summary').click({ button: 'right' });
    await page.getByRole('button', { name: /Create Backup Plan/i }).click();
    const addModal = page.getByTestId('add-backup-plan-modal');
    await expect(addModal).toBeVisible();
    await addModal.locator('input').first().fill(planId);
    await page.getByTestId('add-backup-plan-save-btn').click();
    await expect(page.getByText('Operation Interrupted')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Permission denied/i)).not.toBeVisible();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(addModal).toBeVisible();
    await page.getByTestId('add-backup-plan-cancel-btn').click();
    await expect(addModal).not.toBeVisible();

    // Cleanup the one plan that did get created.
    const isOpen = await planFolder.evaluate((el) => el.open).catch(() => false);
    if (!isOpen) await planFolder.locator('> summary').click();
    const planItem = dbTree.planItem(E2E_DB, planId);
    await expect(planItem).toBeVisible({ timeout: 10000 });
    await planItem.click({ button: 'right' });
    await page.getByRole('button', { name: /Delete/i }).click();
    const deleteModal = page.getByTestId('delete-backup-plan-modal');
    await expect(deleteModal).toBeVisible();
    await page.getByTestId('delete-backup-plan-confirm-btn').click();
    await expect(page.getByText(/Success/i).first()).toBeVisible({ timeout: 15000 });
    await expect(planItem).not.toBeVisible({ timeout: 10000 });
  });
});
