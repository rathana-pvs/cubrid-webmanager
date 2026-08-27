const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { Given, When, Then, And, bddMeta, action } = require('../bdd');

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
    await hostTree.activateHost(hostUid);
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
      await action('Open dashboard tab for database ' + E2E_DB, () => dbTree.openDashboardTab(E2E_DB, hostUid), 'Could not open database dashboard tab.');
      dashboard = page.getByTestId('database-dashboard');
      await action('Verify database dashboard container is visible', () => expect(dashboard).toBeVisible(), 'Database dashboard container was not visible.');
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
        await action('Verify section ' + testId + ' is visible', () => expect(dashboard.getByTestId(testId)).toBeVisible({ timeout: 15000 }), 'Dashboard section ' + testId + ' was not visible.');
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
      await action('Open dashboard tab for database ' + E2E_DB, () => dbTree.openDashboardTab(E2E_DB, hostUid), 'Could not open database dashboard tab.');
      const section = page.getByTestId('database-dashboard').getByTestId('db-dashboard-performance');
      await action('Verify database performance section is visible', () => expect(section).toBeVisible({ timeout: 15000 }), 'Database performance section was not visible.');
      header = section.locator('> div').first();
      table = section.locator('table');
      await action('Verify performance section table is visible', () => expect(table).toBeVisible(), 'Performance section table was not visible.');
    });

    await When('the user clicks the section header', async () => {
      await action('Click performance section header to collapse', () => header.click(), 'Could not click performance section header.');
    });

    await Then('the table content collapses and clicking again expands it', async () => {
      await action('Verify table content is collapsed', () => expect(table).not.toBeVisible(), 'Performance section table did not collapse.');
      await action('Click performance section header to expand', () => header.click(), 'Could not click performance section header.');
      await action('Verify table content is expanded', () => expect(table).toBeVisible(), 'Performance section table did not expand.');
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
      await action('Open dashboard tab for database ' + E2E_DB, () => dbTree.openDashboardTab(E2E_DB, hostUid), 'Could not open database dashboard tab.');
      dashboard = page.getByTestId('database-dashboard');
      await action('Verify database dashboard container is visible', () => expect(dashboard).toBeVisible(), 'Database dashboard container was not visible.');
    });

    await When('the user clicks the refresh metrics button', async () => {
      const refreshBtn = page.getByTestId('database-dashboard-refresh-btn');
      await action('Click refresh metrics button', () => refreshBtn.click(), 'Could not click refresh metrics button.');
      await action('Verify refresh button is enabled after reloading', () => expect(refreshBtn).toBeEnabled({ timeout: 15000 }), 'Refresh button did not return to enabled state.');
    });

    await Then('the dashboard sections reload successfully', async () => {
      await action('Verify dashboard performance section is visible after reload', () => expect(dashboard.getByTestId('db-dashboard-performance')).toBeVisible(), 'Dashboard performance section was not visible after reload.');
    });
  });
});
