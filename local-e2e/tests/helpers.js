/**
 * Shared E2E test helpers.
 * Import in any spec file:
 *   const { login, connectToHost, ... } = require('./helpers');
 */

const { expect } = require('@playwright/test');

/** Database name used by most tests. Override via E2E_DB env var. */
const E2E_DB = process.env.E2E_DB || 'demodb';

/** Log in with credentials from .env and wait for the dashboard. */
async function login(page) {
  await page.goto('/');
  await page.getByPlaceholder(/Enter username/i).fill(process.env.E2E_USERNAME);
  await page.getByPlaceholder(/••••••••/).fill(process.env.E2E_PASSWORD);
  await page.getByRole('button', { name: /Authorize Access/i }).click();
  await expect(page).not.toHaveURL(/login/, { timeout: 10000 });
}

/** Click the first registered host and wait for the database tree. */
async function connectToHost(page) {
  await page.locator('#host-section div[title*=":"]').first().click();
  await expect(page.locator('#db-tree-container')).toBeVisible({ timeout: 10000 });
}

/**
 * Expand a database node in the tree (clicks the chevron if collapsed).
 * Returns the dbNode locator.
 */
async function expandDatabase(page, dbName = E2E_DB) {
  const dbNode = page.locator('#db-tree-container')
    .locator('div')
    .filter({ hasText: new RegExp(`^${dbName}$`) })
    .first();
  await expect(dbNode).toBeVisible({ timeout: 10000 });
  const chevron = dbNode.locator('span.material-symbols-outlined:has-text("chevron_right")');
  if (await chevron.isVisible()) await chevron.click();
  return dbNode;
}

/** Right-click a database node and return its locator. */
async function openDbContextMenu(page, dbName = E2E_DB) {
  const dbNode = page.locator('#db-tree-container')
    .locator('div')
    .filter({ hasText: new RegExp(`^${dbName}$`) })
    .first();
  await dbNode.click({ button: 'right' });
  return dbNode;
}

/** Close the currently open dialog modal via its cancel/close button. */
async function dismissModal(page) {
  const modal = page.locator('div[role="dialog"]');
  const btn = modal.getByRole('button', { name: /Discard|Cancel|Close/i }).first();
  await btn.click();
  await expect(modal).not.toBeVisible({ timeout: 5000 });
}

module.exports = { login, connectToHost, expandDatabase, openDbContextMenu, dismissModal, E2E_DB };
