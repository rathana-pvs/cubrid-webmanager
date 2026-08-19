const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

test.describe('Database Query Plan', () => {
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

  test('쿼리 계획을 생성하면 트리에 나타나고, 수정 후 삭제하면 사라진다', async ({ page }) => {
    const jobFolder = await dbTree.expandSubNode(E2E_DB, 'Job automation');
    const planFolder = jobFolder.getByTestId('tree-node-Query Plan');
    await expect(planFolder).toBeVisible({ timeout: 10000 });
    await planFolder.locator('> summary').click({ button: 'right' });
    await page.getByRole('button', { name: 'Add Query Plan' }).click();

    const addModal = page.getByTestId('add-query-plan-modal');
    await expect(addModal).toBeVisible();
    const queryId = `e2e_query_${Date.now().toString().slice(-6)}`;
    await addModal.locator('input').first().fill(queryId);
    // The CMS task rejects an empty userpass ("Parameter(userpass) missing"),
    // even for the passwordless "public" account — any non-empty value works.
    await addModal.locator('input[type="password"]').fill('public');
    // SQL field is a Monaco editor, not a plain textarea — click into it and type.
    await addModal.locator('.monaco-editor').click();
    await page.keyboard.type('SELECT 1 FROM db_root;');
    await page.getByTestId('add-query-plan-save-btn').click();

    await expect(page.getByText(/Query Plan Added/i).first()).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /OK/ }).click();

    const isOpen = await planFolder.evaluate((el) => el.open).catch(() => false);
    if (!isOpen) await planFolder.locator('> summary').click();
    const planItem = dbTree.planItem(E2E_DB, queryId);
    await expect(planItem).toBeVisible({ timeout: 10000 });

    // Edit: reopen its context menu and save. CMS never echoes passwords back
    // on read, so the password field always loads blank and must be re-entered
    // on every edit — the modal blocks submission otherwise.
    await planItem.click({ button: 'right' });
    await page.getByRole('button', { name: 'Edit Query Plan' }).click();
    const editModal = page.getByTestId('edit-query-plan-modal');
    await expect(editModal).toBeVisible();
    await editModal.locator('input[type="password"]').fill('public');
    await page.getByTestId('edit-query-plan-save-btn').click();
    await expect(page.getByText(/Update Successful/i).first()).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /OK/ }).click();

    // Cleanup
    await planItem.click({ button: 'right' });
    await page.getByRole('button', { name: 'Remove' }).click();
    const deleteModal = page.getByTestId('delete-query-plan-modal');
    await expect(deleteModal).toBeVisible();
    await page.getByTestId('delete-query-plan-confirm-btn').click();
    // No confirm button here — this modal auto-closes ~1s after success.
    await expect(page.getByText(/Deletion Success/i).first()).toBeVisible({ timeout: 15000 });
    await expect(deleteModal).not.toBeVisible({ timeout: 5000 });

    await expect(planItem).not.toBeVisible({ timeout: 10000 });
  });

  test('이미 존재하는 query_id로 생성하면 CMS가 거부하고 오류가 표시된다', async ({ page }) => {
    const jobFolder = await dbTree.expandSubNode(E2E_DB, 'Job automation');
    const planFolder = jobFolder.getByTestId('tree-node-Query Plan');
    await expect(planFolder).toBeVisible({ timeout: 10000 });
    await planFolder.locator('> summary').click({ button: 'right' });
    await page.getByRole('button', { name: 'Add Query Plan' }).click();

    const addModal = page.getByTestId('add-query-plan-modal');
    await expect(addModal).toBeVisible();
    const queryId = `e2e_query_${Date.now().toString().slice(-6)}`;

    const fillAndSubmit = async () => {
      await addModal.locator('input').first().fill(queryId);
      await addModal.locator('input[type="password"]').fill('public');
      await addModal.locator('.monaco-editor').click();
      await page.keyboard.type('SELECT 1 FROM db_root;');
      await page.getByTestId('add-query-plan-save-btn').click();
    };

    await fillAndSubmit();
    await expect(page.getByText(/Query Plan Added/i).first()).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /OK/ }).click();

    // Re-open and try to add the exact same query_id again — CMS rejects
    // the duplicate instead of silently overwriting or ignoring it.
    await planFolder.locator('> summary').click({ button: 'right' });
    await page.getByRole('button', { name: 'Add Query Plan' }).click();
    await expect(addModal).toBeVisible();
    await fillAndSubmit();

    await expect(page.getByText('Operation Interrupted')).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(addModal).toBeVisible();
    await page.getByTestId('add-query-plan-modal-close').click();
    await expect(addModal).not.toBeVisible();

    // Cleanup the one plan that did get created.
    const isOpen = await planFolder.evaluate((el) => el.open).catch(() => false);
    if (!isOpen) await planFolder.locator('> summary').click();
    const planItem = dbTree.planItem(E2E_DB, queryId);
    await expect(planItem).toBeVisible({ timeout: 10000 });
    await planItem.click({ button: 'right' });
    await page.getByRole('button', { name: 'Remove' }).click();
    await page.getByTestId('delete-query-plan-confirm-btn').click();
    await expect(page.getByText(/Deletion Success/i).first()).toBeVisible({ timeout: 15000 });
    await expect(planItem).not.toBeVisible({ timeout: 10000 });
  });

  test('두 개 이상의 Query Plan을 추가/수정/삭제해도 서로의 자격증명을 손상시키지 않는다', async ({ page }) => {
    // Regression test for a real bug: CMS's getautoexecquery never echoes
    // back userpass, and setautoexecquery replaces the whole plan list. If a
    // pre-existing plan's password isn't preserved when resubmitting the list,
    // CMS silently drops its userpass — and every later append/edit for that
    // database then fails with "Parameter(userpass) missing". This checks
    // that a second plan can be added, edited, and removed without breaking
    // a first, already-existing plan.
    const jobFolder = await dbTree.expandSubNode(E2E_DB, 'Job automation');
    const planFolder = jobFolder.getByTestId('tree-node-Query Plan');
    await expect(planFolder).toBeVisible({ timeout: 10000 });

    const addPlan = async (queryId) => {
      await planFolder.locator('> summary').click({ button: 'right' });
      await page.getByRole('button', { name: 'Add Query Plan' }).click();
      const addModal = page.getByTestId('add-query-plan-modal');
      await expect(addModal).toBeVisible();
      await addModal.locator('input').first().fill(queryId);
      await addModal.locator('input[type="password"]').fill('public');
      await addModal.locator('.monaco-editor').click();
      await page.keyboard.type('SELECT 1 FROM db_root;');
      await page.getByTestId('add-query-plan-save-btn').click();
      await expect(page.getByText(/Query Plan Added/i).first()).toBeVisible({ timeout: 15000 });
      await page.getByRole('button', { name: /OK/ }).click();
    };

    const idA = `e2e_qa_${Date.now().toString().slice(-6)}`;
    await addPlan(idA);
    const idB = `e2e_qb_${Date.now().toString().slice(-6)}`;
    await addPlan(idB);

    const isOpen = await planFolder.evaluate((el) => el.open).catch(() => false);
    if (!isOpen) await planFolder.locator('> summary').click();
    const planItemA = dbTree.planItem(E2E_DB, idA);
    const planItemB = dbTree.planItem(E2E_DB, idB);
    await expect(planItemA).toBeVisible({ timeout: 10000 });
    await expect(planItemB).toBeVisible({ timeout: 10000 });

    // Edit plan A while plan B still exists — plan B's credentials must survive.
    await planItemA.click({ button: 'right' });
    await page.getByRole('button', { name: 'Edit Query Plan' }).click();
    const editModal = page.getByTestId('edit-query-plan-modal');
    await expect(editModal).toBeVisible();
    await editModal.locator('input[type="password"]').fill('public');
    await page.getByTestId('edit-query-plan-save-btn').click();
    await expect(page.getByText(/Update Successful/i).first()).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /OK/ }).click();

    // Remove plan B — plan A must remain untouched and usable afterward.
    await planItemB.click({ button: 'right' });
    await page.getByRole('button', { name: 'Remove' }).click();
    await page.getByTestId('delete-query-plan-confirm-btn').click();
    await expect(page.getByText(/Deletion Success/i).first()).toBeVisible({ timeout: 15000 });
    await expect(planItemB).not.toBeVisible({ timeout: 10000 });
    await expect(planItemA).toBeVisible({ timeout: 10000 });

    // Cleanup plan A.
    await planItemA.click({ button: 'right' });
    await page.getByRole('button', { name: 'Remove' }).click();
    await page.getByTestId('delete-query-plan-confirm-btn').click();
    await expect(page.getByText(/Deletion Success/i).first()).toBeVisible({ timeout: 15000 });
    await expect(planItemA).not.toBeVisible({ timeout: 10000 });
  });
});
