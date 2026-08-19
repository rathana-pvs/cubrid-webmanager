const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

test.describe('Feature: Database Maintenance (Check / Compact / Optimize)', () => {
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

  test('Scenario: Running Check Database starts background diagnostic job', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Maintenance',
      story: 'Check Database Diagnostic',
    });

    let modal;

    await Given('the user opens the Check Database dialog from management menu', async () => {
      await dbTree.clickManageDatabaseItem(E2E_DB, 'Check Database');
      modal = page.getByTestId('check-database-modal');
      await expect(modal).toBeVisible();
    });

    await When('the user confirms running check database', async () => {
      await page.getByTestId('check-database-run-btn').click();
    });

    await Then('the diagnostic job launches and opens progress dialog', async () => {
      await expect(modal).not.toBeVisible({ timeout: 10000 });
      await expect(page.locator('div[role="dialog"]')).toBeVisible();
    });
  });

  test('Scenario: Running Compact Database initiates space reclamation job', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Maintenance',
      story: 'Compact Database Job',
    });

    let modal;

    await Given('the user opens Compact Database dialog', async () => {
      await dbTree.clickManageDatabaseItem(E2E_DB, 'Compact Database');
      modal = page.getByTestId('compact-database-modal');
      await expect(modal).toBeVisible();
    });

    await When('the user clicks Run Compact', async () => {
      await page.getByTestId('compact-database-run-btn').click();
    });

    await Then('the compaction process starts', async () => {
      await expect(modal).not.toBeVisible({ timeout: 10000 });
      await expect(page.locator('div[role="dialog"]')).toBeVisible();
    });
  });

  test('Scenario: Running Optimize Database triggers index and statistics optimization', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Maintenance',
      story: 'Optimize Database Job',
    });

    let modal;

    await Given('the user opens Optimize Database dialog', async () => {
      await dbTree.clickManageDatabaseItem(E2E_DB, 'Optimize Database');
      modal = page.getByTestId('optimize-database-modal');
      await expect(modal).toBeVisible();
    });

    await When('the user confirms running optimization', async () => {
      await page.getByTestId('optimize-database-run-btn').click();
    });

    await Then('the database optimization job launches', async () => {
      await expect(modal).not.toBeVisible({ timeout: 10000 });
      await expect(page.locator('div[role="dialog"]')).toBeVisible();
    });
  });
});
