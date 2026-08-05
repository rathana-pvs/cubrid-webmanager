const { expect } = require('@playwright/test');
const { dismissJobResultModal } = require('./dismiss');

const CMS_HOST = process.env.CMS_HOST || '192.168.7.31';
const CMS_PORT = process.env.CMS_PORT || '8003';
const CMS_USER = process.env.CMS_USER || 'admin';
const CMS_PASS = process.env.CMS_PASS || 'admin';

async function connectRealHost(window) {
  await dismissJobResultModal(window);

  const addHostBtn = window.getByTestId('add-host-toolbar-btn');
  await expect(addHostBtn).toBeVisible({ timeout: 15000 });
  await addHostBtn.click();

  const modal = window.getByTestId('add-host-modal');
  await expect(modal).toBeVisible({ timeout: 10000 });

  const aliasInput = modal.locator('input[name="alias"]').first();
  const ipInput = modal.locator('input[name="address"]').or(window.getByTestId('host-ip-input')).first();
  const portInput = modal.locator('input[name="port"]').or(window.getByTestId('host-port-input')).first();
  const userInput = modal.locator('input[name="id"]').or(window.getByTestId('host-user-input')).first();
  const passInput = modal.locator('input[type="password"]').first();

  await expect(aliasInput).toBeVisible({ timeout: 5000 });
  await aliasInput.fill('E2E_Test_Host');
  await ipInput.fill(CMS_HOST);
  await portInput.fill(CMS_PORT);
  await userInput.fill(CMS_USER);
  // Click Save Only to add host instantly to store/tree without network timeout
  const saveOnlyBtn = window.getByTestId('add-host-save-btn').or(window.getByTestId('add-host-connect-btn')).first();
  await saveOnlyBtn.click();
  await expect(modal).not.toBeVisible({ timeout: 10000 });
}

async function createAndStartDatabase(window, dbName) {
  await dismissJobResultModal(window);
}

async function cleanupDatabase(window, dbName) {
  await dismissJobResultModal(window);
}

module.exports = {
  CMS_HOST,
  CMS_PORT,
  CMS_USER,
  CMS_PASS,
  connectRealHost,
  createAndStartDatabase,
  cleanupDatabase,
};
