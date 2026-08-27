const fs = require('fs');
const path = require('path');
const os = require('os');
const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { Given, When, Then, And, bddMeta, action } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';

test.describe('Feature: Host Import and Export', () => {
  test.beforeEach(async ({ appPage: page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    const hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
  });

  test('Scenario: Exporting host configuration and importing the same file flags all entries as duplicate', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Host Management',
      feature: 'Import & Export',
      story: 'Duplicate Detection on Import',
    });

    let modal;
    let filePath;

    await Given('the user exports existing registered hosts to a file', async () => {
      await page.evaluate(() => {
        window.__exportedPayloads = [];
        const origCreate = URL.createObjectURL;
        URL.createObjectURL = (blob) => {
          blob.text().then((text) => {
            window.__exportedPayloads.push(text);
          });
          return origCreate(blob);
        };
      });

      await action('Hover over File menu', () => page.getByText('File', { exact: true }).hover(), 'Could not hover over File menu.');
      await action('Click Export Host menu option', () => page.getByRole('button', { name: 'Export Host' }).click(), 'Export Host menu option was not clickable.');

      modal = page.getByTestId('import-export-host-modal');
      await action('Verify Export Host modal is visible', () => expect(modal).toBeVisible({ timeout: 10000 }), 'Export Host modal did not open.');

      const downloadPromise = page.waitForEvent('download', { timeout: 3000 }).catch(() => null);
      await action('Click export button', () => page.getByTestId('import-export-host-action-btn').click(), 'Could not click export button.');

      const download = await downloadPromise;
      if (download) {
        filePath = await action('Get downloaded file path', () => download.path(), 'Could not retrieve downloaded file path.');
      } else {
        await action('Wait for exported payload in page context', () => page.waitForFunction(() => (window.__exportedPayloads || []).length > 0, { timeout: 5000 }), 'No exported file payload captured.');
        const exportedText = await page.evaluate(() => window.__exportedPayloads[0]);
        const tmpPath = path.join(os.tmpdir(), `cwm_exported_hosts_${Date.now()}.xml`);
        fs.writeFileSync(tmpPath, exportedText, 'utf8');
        filePath = tmpPath;
      }
      await action('Verify downloaded file path is valid', () => expect(filePath).toBeTruthy(), 'Exported file path was empty.');
      await action('Verify Export modal is closed after download', () => expect(modal).not.toBeVisible({ timeout: 10000 }), 'Export modal did not close after export.');
    });

    await When('the user opens Import Host and uploads the exported file', async () => {
      await action('Hover over File menu', () => page.getByText('File', { exact: true }).hover(), 'Could not hover over File menu.');
      await action('Click Import Host menu option', () => page.getByRole('button', { name: 'Import Host' }).click(), 'Import Host menu option was not clickable.');
      await action('Verify Import Host modal is visible', () => expect(modal).toBeVisible({ timeout: 10000 }), 'Import Host modal did not open.');

      await action('Upload exported host configuration file', () => modal.locator('input[type="file"]').setInputFiles(filePath), 'Could not upload exported host configuration file.');
    });

    await Then('every existing host row is tagged with a DUPLICATE badge and import action is disabled', async () => {
      const duplicateBadges = modal.getByText('DUPLICATE', { exact: true });
      await action('Verify DUPLICATE badge is displayed for existing host entry', () => expect(duplicateBadges.first()).toBeVisible({ timeout: 10000 }), 'DUPLICATE badge was not displayed for existing host entry.');

      const actionBtn = page.getByTestId('import-export-host-action-btn');
      await action('Verify Import button is disabled for duplicate entries', () => expect(actionBtn).toBeDisabled(), 'Import action button was not disabled.');
    });

    await And('the user can safely discard the import modal', async () => {
      await action('Click Cancel button on Import modal', () => page.getByTestId('import-export-host-cancel-btn').click(), 'Cancel button was not clickable.');
      await action('Verify Import modal is closed', () => expect(modal).not.toBeVisible(), 'Import modal did not close after clicking Cancel.');
    });
  });
});
