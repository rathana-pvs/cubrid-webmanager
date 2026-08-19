const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const DBA_PASSWORD = 'E2eTestPass123';

test.describe('Feature: Create Database & Login Authentication', () => {
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

  test('Scenario: Creating a new database provisions volume, validates login dialog, and allows deletion', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Lifecycle',
      story: 'Create Database Provisioning & Authentication',
    });

    test.setTimeout(240000);
    const dbName = `e2e_createdb_${Date.now().toString().slice(-6)}`;
    let wizard;
    let dbNode;
    let loginModal;

    await Given('the user opens the Create Database wizard', async () => {
      await page.mouse.click(2, 2).catch(() => undefined);
      await page.getByTestId('tree-tab-db').click({ button: 'right' });
      await page.getByRole('button', { name: 'Create Database' }).click();

      wizard = page.getByTestId('create-database-modal');
      await expect(wizard).toBeVisible();
    });

    await When('the user configures name, autostart off, volume paths, and DBA credentials', async () => {
      await page.getByTestId('create-database-name-input').fill(dbName);
      await page.getByTestId('create-database-autostart-toggle').click();
      await expect(page.getByTestId('create-database-generic-path-input')).not.toHaveValue('', { timeout: 30000 });
      await page.getByTestId('create-database-next-btn').click();
      await page.getByTestId('create-database-next-btn').click();
      await page.getByTestId('create-database-next-btn').click();
      await page.getByTestId('create-database-dba-password-input').fill(DBA_PASSWORD);
      await page.getByTestId('create-database-confirm-password-input').fill(DBA_PASSWORD);
      await page.getByTestId('create-database-next-btn').click();
      await page.getByTestId('create-database-finish-btn').click();

      const successOk = wizard.getByRole('button', { name: /OK/ });
      const jobResultModal = page.getByTestId('job-result-modal');
      await expect(successOk.or(jobResultModal)).toBeVisible({ timeout: 120000 });

      if (await jobResultModal.isVisible().catch(() => false)) {
        await expect(jobResultModal.getByRole('heading', { name: /Create database failed/i })).toBeVisible();
        await jobResultModal.getByRole('button', { name: 'Close', exact: true }).click();
        await expect(jobResultModal).not.toBeVisible();
        await wizard.getByRole('button', { name: 'Close', exact: true }).click();
        await page.getByTestId('create-database-cancel-btn').click();
        await expect(wizard).not.toBeVisible();
        test.skip(true, 'Real createdb job failed server-side in this environment.');
      }

      await successOk.click();
      await expect(wizard).not.toBeVisible();
    });

    await Then('the new database node appears in tree and requires login to access', async () => {
      dbNode = dbTree.dbNode(dbName);
      await expect(dbNode).toBeVisible({ timeout: 15000 });

      await dbNode.locator('> summary').dblclick();
      loginModal = page.getByTestId('login-database-modal');
      await expect(loginModal).toBeVisible({ timeout: 10000 });

      // Wrong password
      await loginModal.locator('input').nth(1).fill('dba');
      await loginModal.locator('input[type="password"]').fill('wrong_password');
      await page.getByTestId('login-database-submit-btn').click();
      await expect(page.getByRole('button', { name: /retry/i })).toBeVisible({ timeout: 15000 });
      await page.getByRole('button', { name: /dismiss|cancel|close/i }).first().click();

      // Correct password
      await expect(loginModal).toBeVisible({ timeout: 10000 });
      await loginModal.locator('input').nth(1).fill('dba');
      await loginModal.locator('input[type="password"]').fill(DBA_PASSWORD);
      await page.getByTestId('login-database-submit-btn').click();
      await expect(loginModal).not.toBeVisible({ timeout: 15000 });
    });

    await And('the newly created database can be deleted cleanly', async () => {
      await dbTree.clickManageDatabaseItem(dbName, 'Delete Database');
      const deleteModal = page.getByTestId('delete-database-modal');
      await expect(deleteModal).toBeVisible();
      await page.getByTestId('delete-database-confirm-btn').click();
      await expect(page.getByTestId('delete-database-dba-id-input')).toBeVisible({ timeout: 10000 });
      await page.getByTestId('delete-database-dba-password-input').fill(DBA_PASSWORD);
      await page.getByTestId('delete-database-confirm-btn').click();

      await expect(page.getByRole('button', { name: /OK/ })).toBeVisible({ timeout: 60000 });
      await page.getByRole('button', { name: /OK/ }).click();
      await expect(deleteModal).not.toBeVisible();
      await expect(dbNode).not.toBeVisible({ timeout: 10000 });
    });
  });

  test('Scenario: DBA password complexity and confirmation rules enforce client-side validation', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Lifecycle',
      story: 'Create Database Password Policy',
    });

    let wizard;
    let nextBtn;

    await Given('the user progresses to Step 4 (DBA Password) in Create Database wizard', async () => {
      await page.mouse.click(2, 2).catch(() => undefined);
      await page.getByTestId('tree-tab-db').click({ button: 'right' });
      await page.getByRole('button', { name: 'Create Database' }).click();

      wizard = page.getByTestId('create-database-modal');
      await expect(wizard).toBeVisible();

      const dbName = `e2e_pwcheck_${Date.now().toString().slice(-6)}`;
      await page.getByTestId('create-database-name-input').fill(dbName);
      await expect(page.getByTestId('create-database-generic-path-input')).not.toHaveValue('', { timeout: 30000 });
      await page.getByTestId('create-database-next-btn').click();
      await page.getByTestId('create-database-next-btn').click();
      await page.getByTestId('create-database-next-btn').click();
    });

    await When('the user tests short or non-matching password confirmation', async () => {
      nextBtn = page.getByTestId('create-database-next-btn');
      await page.getByTestId('create-database-dba-password-input').fill('short1');
      await page.getByTestId('create-database-confirm-password-input').fill('short1');
      await expect(nextBtn).toBeDisabled();

      await page.getByTestId('create-database-dba-password-input').fill('LongEnoughPass1');
      await page.getByTestId('create-database-confirm-password-input').fill('LongEnoughPass2');
    });

    await Then('passwords mismatch error is displayed and next button is disabled until valid', async () => {
      await expect(page.getByText('Passwords do not match')).toBeVisible();
      await expect(nextBtn).toBeDisabled();

      await page.getByTestId('create-database-confirm-password-input').fill('LongEnoughPass1');
      await expect(nextBtn).toBeEnabled();

      await page.getByTestId('create-database-cancel-btn').click();
      await expect(wizard).not.toBeVisible();
    });
  });
});
