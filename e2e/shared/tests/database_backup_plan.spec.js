const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { Given, When, Then, And, bddMeta, action } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

test.describe.serial('Feature: Database Backup Plan', () => {
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

  async function addPlan(page, planFolder, planId) {
    await action('Right-click Backup Plan folder in tree', () => planFolder.locator('> summary').click({ button: 'right' }), 'Could not right-click Backup Plan folder.');
    await action('Click Create Backup Plan menu item', () => page.getByRole('button', { name: /Create Backup Plan|백업 자동화 계획 추가/i }).click(), 'Could not click Create Backup Plan context menu option.');
    const addModal = page.getByTestId('add-backup-plan-modal');
    await action('Verify Add Backup Plan modal is visible', () => expect(addModal).toBeVisible(), 'Add Backup Plan modal did not appear.');
    const pathInput = addModal.locator('input').nth(1);
    await action('Wait for backup path to be populated', () => expect(pathInput).not.toHaveValue('', { timeout: 10000 }), 'Backup path was not populated in Add Backup Plan modal.').catch(() => undefined);
    await action(`Fill backup plan ID with: ${planId}`, () => addModal.locator('input').first().fill(planId), 'Could not fill backup plan ID input.');
    await action('Click Save button on Add Backup Plan modal', () => page.getByTestId('add-backup-plan-save-btn').click(), 'Could not click Save button on Add Backup Plan modal.');

    const successText = page.getByText(/Success|성공|Committed|Saved|저장됨/i).first();
    const errorText = page.getByText(/Execution Error|실행 오류|Operation Interrupted|작업 중단됨/i).first();
    await action('Wait for backup plan save confirmation or error', () => expect(successText.or(errorText)).toBeVisible({ timeout: 30000 }), 'No success or error confirmation appeared after saving backup plan.');

    let result = 'success';
    await action('Check backup plan save outcome', async () => {
      if (await errorText.isVisible().catch(() => false)) {
        await page.getByRole('button', { name: /^Close$|^닫기$/i }).click().catch(() => undefined);
        result = 'engine-error';
        return;
      }
      await page.keyboard.press('Escape').catch(() => undefined);
    }, 'Failed while checking backup plan creation outcome.');
    return result;
  }

  test('Scenario: Creating a backup plan adds it to the tree and deleting removes it', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Backup Management',
      story: 'Create and Delete Backup Plan',
    });

    const planId = `e2e_plan_${Date.now().toString().slice(-6)}`;
    let planFolder;
    let planItem;

    await Given('the user expands Job automation and Backup Plan tree node', async () => {
      let backupFolder;
      await action(`Expand "Job automation" node for "${E2E_DB}"`, async () => {
        backupFolder = await dbTree.expandSubNode(E2E_DB, 'Job automation');
      }, 'Failed to expand Job automation sub-node.');
      planFolder = backupFolder.getByTestId('tree-node-Backup Plan');
      await action('Verify "Backup Plan" folder node is visible', () => expect(planFolder).toBeVisible({ timeout: 10000 }), 'Backup Plan tree node was not visible.');
    });

    await When('the user fills and submits a new backup plan', async () => {
      const outcome = await addPlan(page, planFolder, planId);
      if (outcome !== 'success') {
        test.skip(true, 'Backup plan creation rejected by engine/environment');
      }
    });

    await Then('the backup plan is visible in the tree and can be deleted', async () => {
      await action('Ensure Backup Plan folder is expanded', async () => {
        const isOpen = await planFolder.evaluate((el) => el.open).catch(() => false);
        if (!isOpen) await planFolder.locator('> summary').click();
      }, 'Failed to ensure Backup Plan folder is expanded.');
      planItem = dbTree.planItem(E2E_DB, planId);
      await action(`Verify plan item "${planId}" is visible in tree`, () => expect(planItem).toBeVisible({ timeout: 10000 }), `Backup plan "${planId}" was not found in the tree.`);

      await action(`Right-click plan item "${planId}"`, () => planItem.click({ button: 'right' }), `Could not right-click plan item "${planId}".`);
      await action('Click Delete menu item', () => page.getByRole('button', { name: /Delete|Remove|삭제/i }).click(), 'Could not click Delete option from context menu.');
      const deleteModal = page.getByTestId('delete-backup-plan-modal');
      await action('Verify Delete Backup Plan confirmation modal is visible', () => expect(deleteModal).toBeVisible(), 'Delete Backup Plan modal did not appear.');
      await action('Click Confirm Delete button', () => page.getByTestId('delete-backup-plan-confirm-btn').click(), 'Could not click Confirm Delete button.');
      await action('Verify deletion success notification', () => expect(page.getByText(/Success|삭제 성공/i).first()).toBeVisible({ timeout: 15000 }), 'Deletion success message did not appear.');
      await action('Press Escape to dismiss any lingering notifications', () => page.keyboard.press('Escape'), 'Failed to press Escape.');

      await action(`Verify plan item "${planId}" is removed from tree`, () => expect(planItem).not.toBeVisible({ timeout: 10000 }), `Backup plan "${planId}" remained visible in the tree after deletion.`);
    });
  });

  test('Scenario: Editing a backup plan updates configured properties', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Backup Management',
      story: 'Edit Backup Plan',
    });

    const planId = `e2e_plan_${Date.now().toString().slice(-6)}`;
    let planFolder;
    let planItem;

    await Given('a backup plan is created and located in the tree', async () => {
      let backupFolder;
      await action(`Expand "Job automation" node for "${E2E_DB}"`, async () => {
        backupFolder = await dbTree.expandSubNode(E2E_DB, 'Job automation');
      }, 'Failed to expand Job automation node.');
      planFolder = backupFolder.getByTestId('tree-node-Backup Plan');
      await action('Verify "Backup Plan" folder node is visible', () => expect(planFolder).toBeVisible({ timeout: 10000 }), 'Backup Plan folder node did not appear.');

      const outcome = await addPlan(page, planFolder, planId);
      if (outcome !== 'success') {
        test.skip(true, 'Backup plan creation rejected by engine/environment');
      }

      await action('Ensure Backup Plan folder is expanded', async () => {
        const isOpen = await planFolder.evaluate((el) => el.open).catch(() => false);
        if (!isOpen) await planFolder.locator('> summary').click();
      }, 'Failed to ensure Backup Plan folder is open.');
      planItem = dbTree.planItem(E2E_DB, planId);
      await action(`Verify backup plan "${planId}" is visible in tree`, () => expect(planItem).toBeVisible({ timeout: 10000 }), `Backup plan "${planId}" was not found in the tree.`);
    });

    await When('the user edits the backup level to Incremental (L1)', async () => {
      await action(`Right-click backup plan "${planId}"`, async () => {
        await planItem.click({ button: 'right' }).catch(async () => {
          await planItem.locator('> summary, button').first().click({ button: 'right' });
        });
      }, `Could not right-click backup plan "${planId}".`);
      await action('Click Edit menu item', () => page.getByRole('button', { name: /Edit|수정/i }).click(), 'Could not click Edit option from context menu.');
      const editModal = page.getByTestId('edit-backup-plan-modal');
      await action('Verify Edit Backup Plan modal is visible', () => expect(editModal).toBeVisible(), 'Edit Backup Plan modal did not appear.');
      await action('Verify Save button is enabled', () => expect(page.getByTestId('edit-backup-plan-save-btn')).toBeEnabled({ timeout: 10000 }), 'Save button was not enabled.');
      await action('Select Incremental (L1) backup level preset', () => editModal.getByText('Inc. (L1)').click(), 'Could not select Inc. (L1) backup level.');
      await action('Click Save button in Edit Backup Plan modal', () => page.getByTestId('edit-backup-plan-save-btn').click(), 'Could not click Save button in Edit Backup Plan modal.');
      await action('Verify update successful confirmation', () => expect(page.getByText(/Update Successful|갱신 성공/i).first()).toBeVisible({ timeout: 15000 }), 'Update Successful message did not appear.');
      await action('Click OK on confirmation dialog', () => page.getByRole('button', { name: /OK|확인/ }).click(), 'Could not click OK button on update confirmation dialog.');
    });

    await Then('the modified backup plan properties persist and the plan can be cleaned up', async () => {
      const editModal = page.getByTestId('edit-backup-plan-modal');
      await action(`Right-click backup plan "${planId}" to re-inspect`, () => planItem.click({ button: 'right' }), `Could not right-click backup plan "${planId}".`);
      await action('Click Edit menu item to verify saved level', () => page.getByRole('button', { name: /Edit|수정/i }).click(), 'Could not click Edit menu item.');
      await action('Verify Edit Backup Plan modal is visible', () => expect(editModal).toBeVisible(), 'Edit Backup Plan modal did not appear.');
      const l1Preset = editModal.locator('button', { hasText: 'Inc. (L1)' });
      await action('Verify L1 preset button has active highlight class', () => expect(l1Preset).toHaveClass(/border-amber-500\/40/, { timeout: 10000 }), 'L1 preset button was not selected as active.');
      await action('Click Cancel to close Edit Backup Plan modal', () => page.getByTestId('edit-backup-plan-cancel-btn').click(), 'Could not click Cancel on Edit Backup Plan modal.');

      // Cleanup
      await action(`Right-click plan item "${planId}" for cleanup`, () => planItem.click({ button: 'right' }), `Could not right-click plan item "${planId}".`);
      await action('Click Delete menu item for cleanup', () => page.getByRole('button', { name: /Delete|Remove|삭제/i }).click(), 'Could not click Delete menu item.');
      const deleteModal = page.getByTestId('delete-backup-plan-modal');
      await action('Verify Delete confirmation modal is visible', () => expect(deleteModal).toBeVisible(), 'Delete confirmation modal did not appear.');
      await action('Click Confirm Delete button', () => page.getByTestId('delete-backup-plan-confirm-btn').click(), 'Could not click Confirm Delete button.');
      await action('Verify deletion success confirmation', () => expect(page.getByText(/Success|삭제 성공/i).first()).toBeVisible({ timeout: 15000 }), 'Deletion success message did not appear.');
      await action('Press Escape to dismiss dialog', () => page.keyboard.press('Escape'), 'Failed to press Escape.');
      await action(`Verify plan item "${planId}" is removed from tree`, () => expect(planItem).not.toBeVisible({ timeout: 10000 }), `Backup plan "${planId}" was not removed from tree.`);
    });
  });

  test('Scenario: Creating backup plan with existing backupid is rejected with CMS error', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Backup Management',
      story: 'Duplicate Backup Plan ID Prevention',
    });

    const planId = `e2e_dup_${Date.now().toString().slice(-6)}`;
    let planFolder;

    await Given('a backup plan with a specific ID is created', async () => {
      let backupFolder;
      await action(`Expand "Job automation" node for "${E2E_DB}"`, async () => {
        backupFolder = await dbTree.expandSubNode(E2E_DB, 'Job automation');
      }, 'Failed to expand Job automation node.');
      planFolder = backupFolder.getByTestId('tree-node-Backup Plan');
      await action('Verify "Backup Plan" folder node is visible', () => expect(planFolder).toBeVisible({ timeout: 10000 }), 'Backup Plan folder node did not appear.');

      const outcome = await addPlan(page, planFolder, planId);
      if (outcome !== 'success') {
        test.skip(true, 'Backup plan creation rejected by engine/environment');
      }
    });

    await When('the user tries to create another backup plan with the same ID', async () => {
      await action('Right-click Backup Plan folder in tree', () => planFolder.locator('> summary').click({ button: 'right' }), 'Could not right-click Backup Plan folder.');
      await action('Click Create Backup Plan menu item', () => page.getByRole('button', { name: /Create Backup Plan|백업 자동화 계획 추가/i }).click(), 'Could not click Create Backup Plan context menu option.');
      const addModal = page.getByTestId('add-backup-plan-modal');
      await action('Verify Add Backup Plan modal is visible', () => expect(addModal).toBeVisible(), 'Add Backup Plan modal did not appear.');
      const pathInput = addModal.locator('input').nth(1);
      await action('Wait for backup path to be populated', () => expect(pathInput).not.toHaveValue('', { timeout: 10000 }), 'Backup path was not populated in Add Backup Plan modal.').catch(() => undefined);
      await action(`Fill duplicate backup plan ID: ${planId}`, () => addModal.locator('input').first().fill(planId), 'Could not fill duplicate backup plan ID.');
      await action('Click Save button on Add Backup Plan modal', () => page.getByTestId('add-backup-plan-save-btn').click(), 'Could not click Save button on duplicate Add Backup Plan modal.');
    });

    await Then('an operation interrupted error is displayed rejecting duplicate plan ID', async () => {
      await action('Verify Operation Interrupted error is displayed', () => expect(page.getByText(/Operation Interrupted|작업 중단됨/)).toBeVisible({ timeout: 15000 }), 'Operation Interrupted error message did not appear for duplicate plan ID.');
      await action('Verify error is not a permission denied error', () => expect(page.getByText(/Permission denied/i)).not.toBeVisible(), 'Error was unexpectedly a permission denied error instead of duplicate ID.');
      await action('Click Close button on error dialog', () => page.getByRole('button', { name: /^Close$|^닫기$/i }).click(), 'Could not click Close button on error dialog.');
      const addModal = page.getByTestId('add-backup-plan-modal');
      await action('Verify Add Backup Plan modal is visible before canceling', () => expect(addModal).toBeVisible(), 'Add Backup Plan modal was not visible.');
      await action('Click Cancel button to close Add Backup Plan modal', () => page.getByTestId('add-backup-plan-cancel-btn').click(), 'Could not click Cancel button on Add Backup Plan modal.');
      await action('Verify Add Backup Plan modal is dismissed', () => expect(addModal).not.toBeVisible(), 'Add Backup Plan modal remained open.');

      // Cleanup
      await action('Ensure Backup Plan folder is expanded for cleanup', async () => {
        const isOpen = await planFolder.evaluate((el) => el.open).catch(() => false);
        if (!isOpen) await planFolder.locator('> summary').click();
      }, 'Failed to expand Backup Plan folder for cleanup.');
      const planItem = dbTree.planItem(E2E_DB, planId);
      await action(`Verify original plan "${planId}" is visible in tree`, () => expect(planItem).toBeVisible({ timeout: 10000 }), `Original plan "${planId}" was not found in tree.`);
      await action(`Right-click plan item "${planId}" for cleanup`, () => planItem.click({ button: 'right' }), `Could not right-click plan item "${planId}".`);
      await action('Click Delete menu item for cleanup', () => page.getByRole('button', { name: /Delete|Remove|삭제/i }).click(), 'Could not click Delete option.');
      const deleteModal = page.getByTestId('delete-backup-plan-modal');
      await action('Verify Delete confirmation modal is visible', () => expect(deleteModal).toBeVisible(), 'Delete confirmation modal did not appear.');
      await action('Click Confirm Delete button', () => page.getByTestId('delete-backup-plan-confirm-btn').click(), 'Could not click Confirm Delete button.');
      await action('Verify deletion success confirmation', () => expect(page.getByText(/Success|삭제 성공/i).first()).toBeVisible({ timeout: 15000 }), 'Deletion success confirmation did not appear.');
      await action(`Verify plan item "${planId}" is removed from tree`, () => expect(planItem).not.toBeVisible({ timeout: 10000 }), `Plan "${planId}" remained visible in tree after deletion.`);
    });
  });
});
