const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const E2E_DB = process.env.E2E_DB || 'demodb';

test.describe('Feature: Database Dashboard Sections', () => {
  let dbTree;
  let hostUid;

  test.beforeEach(async ({ appPage: page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await host.dblclick();
    dbTree = new DatabaseTreePage(page);
    await dbTree.waitForAuthorized();
  });

  test('Scenario: Activating database opens dashboard with all six monitoring sections rendered', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Dashboard',
      story: 'Dashboard Sections Layout',
    });

    let dashboard;

    await Given('the database dashboard tab is opened', async () => {
      await dbTree.openDashboardTab(E2E_DB, hostUid);
      dashboard = page.getByTestId('database-dashboard');
      await expect(dashboard).toBeVisible();
    });

    await Then('Performance, Volumes, Space Info, CAS, Lock/Transaction, and Job Automation sections are visible', async () => {
      const sections = [
        'db-dashboard-performance',
        'db-dashboard-volumes',
        'db-dashboard-space-info',
        'db-dashboard-cas',
        'db-dashboard-lock-transaction',
        'db-dashboard-job-automation',
      ];
      for (const testId of sections) {
        await expect(dashboard.getByTestId(testId)).toBeVisible({ timeout: 15000 });
      }
    });
  });

  test('Scenario: Clicking section header collapses and expands section table content', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Dashboard',
      story: 'Accordion Section Toggle',
    });

    let header;
    let table;

    await Given('the database performance section is visible', async () => {
      await dbTree.openDashboardTab(E2E_DB, hostUid);
      const section = page.getByTestId('database-dashboard').getByTestId('db-dashboard-performance');
      await expect(section).toBeVisible({ timeout: 15000 });
      header = section.locator('> div').first();
      table = section.locator('table');
      await expect(table).toBeVisible();
    });

    await When('the user clicks the section header', async () => {
      await header.click();
    });

    await Then('the table content collapses and clicking again expands it', async () => {
      await expect(table).not.toBeVisible();
      await header.click();
      await expect(table).toBeVisible();
    });
  });

  test('Scenario: Refresh button reloads database monitoring metrics', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Database Operations',
      feature: 'Database Dashboard',
      story: 'Refresh Dashboard Metrics',
    });

    let dashboard;

    await Given('the database dashboard is open', async () => {
      await dbTree.openDashboardTab(E2E_DB, hostUid);
      dashboard = page.getByTestId('database-dashboard');
      await expect(dashboard).toBeVisible();
    });

    await When('the user clicks the refresh metrics button', async () => {
      const refreshBtn = page.getByTestId('database-dashboard-refresh-btn');
      await refreshBtn.click();
      await expect(refreshBtn).toBeEnabled({ timeout: 15000 });
    });

    await Then('the dashboard sections reload successfully', async () => {
      await expect(dashboard.getByTestId('db-dashboard-performance')).toBeVisible();
    });
  });
});
