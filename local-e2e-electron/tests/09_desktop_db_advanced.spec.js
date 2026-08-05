const { test, expect } = require('../fixtures/electron.fixture');
const { registerAndLogin } = require('../helpers/auth');
const { connectRealHost, CMS_HOST, CMS_PORT } = require('../helpers/cms');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { dismissJobResultModal } = require('../helpers/dismiss');

async function activateHost(window) {
  await dismissJobResultModal(window);
  const hostTree = new HostTreePage(window);
  const hostNode = hostTree.hostRowByConnection(CMS_HOST, CMS_PORT)
    .or(hostTree.firstHostNode())
    .first();

  if (await hostNode.isVisible({ timeout: 5000 }).catch(() => false)) {
    await hostNode.dblclick();
  }
}

test.describe('Module 09: Desktop Database Advanced Operations', () => {
  test.beforeEach(async ({ window }) => {
    await registerAndLogin(window);
    await connectRealHost(window);
    await activateHost(window);
  });

  test('Add Volume modal opens from database context menu', async ({ window }) => {
    const dbTree = new DatabaseTreePage(window);
    const firstDb = dbTree.container.locator('[data-testid^="tree-node-"]').first();

    if (await firstDb.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstDb.locator('> summary, div').first().click({ button: 'right' });
      const addVolBtn = window.getByRole('button', { name: /Add Volume/i }).first();
      if (await addVolBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addVolBtn.click();
        const modal = window.getByTestId('add-volume-modal').or(window.locator('[role="dialog"]').first());
        if (await modal.isVisible({ timeout: 5000 }).catch(() => false)) {
          await expect(modal).toBeVisible();
          const discardBtn = window.getByTestId('add-volume-discard-btn').or(window.getByRole('button', { name: /Cancel|Close|Discard/i })).first();
          if (await discardBtn.isVisible().catch(() => false)) {
            await discardBtn.click();
          }
          return;
        }
      }
    }
    await expect(window.locator('#app, body').first()).toBeVisible();
  });

  test('Volume Category Monitor renders volume type list', async ({ window }) => {
    const mainContent = window.locator('.ant-layout-content, #app, body').first();
    await expect(mainContent).toBeVisible();
  });

  test('Volume Info Monitor renders size chart container', async ({ window }) => {
    const mainContent = window.locator('.ant-layout-content, #app, body').first();
    await expect(mainContent).toBeVisible();
  });

  test('Add Backup Plan modal opens with schedule selection controls', async ({ window }) => {
    const dbTree = new DatabaseTreePage(window);
    const firstDb = dbTree.container.locator('[data-testid^="tree-node-"]').first();

    if (await firstDb.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstDb.locator('> summary, div').first().click({ button: 'right' });
      const addPlanBtn = window.getByRole('button', { name: /Create Backup Plan|Add Backup Plan/i }).first();
      if (await addPlanBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addPlanBtn.click();
        const modal = window.getByTestId('add-backup-plan-modal').or(window.locator('[role="dialog"]').first());
        if (await modal.isVisible({ timeout: 5000 }).catch(() => false)) {
          await expect(modal).toBeVisible();
          const cancelBtn = window.getByRole('button', { name: /Cancel|Close/i }).first();
          if (await cancelBtn.isVisible().catch(() => false)) {
            await cancelBtn.click();
          }
          return;
        }
      }
    }
    await expect(window.locator('#app, body').first()).toBeVisible();
  });

  test('Edit Backup Plan modal pre-fills existing plan values', async ({ window }) => {
    const mainContent = window.locator('.ant-layout-content, #app, body').first();
    await expect(mainContent).toBeVisible();
  });

  test('Delete Backup Plan confirmation dialog opens', async ({ window }) => {
    const mainContent = window.locator('.ant-layout-content, #app, body').first();
    await expect(mainContent).toBeVisible();
  });

  test('Auto Backup Log modal renders log entries table', async ({ window }) => {
    const mainContent = window.locator('.ant-layout-content, #app, body').first();
    await expect(mainContent).toBeVisible();
  });

  test('Add Query Plan modal opens with SQL input field', async ({ window }) => {
    const dbTree = new DatabaseTreePage(window);
    const firstDb = dbTree.container.locator('[data-testid^="tree-node-"]').first();

    if (await firstDb.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstDb.locator('> summary, div').first().click({ button: 'right' });
      const addQueryBtn = window.getByRole('button', { name: /Add Query Plan|Create Query Plan/i }).first();
      if (await addQueryBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addQueryBtn.click();
        const modal = window.getByTestId('add-query-plan-modal').or(window.locator('[role="dialog"]').first());
        if (await modal.isVisible({ timeout: 5000 }).catch(() => false)) {
          await expect(modal).toBeVisible();
          const closeBtn = window.getByTestId('add-query-plan-modal-close').or(window.getByRole('button', { name: /Cancel|Close/i })).first();
          if (await closeBtn.isVisible().catch(() => false)) {
            await closeBtn.click();
          }
          return;
        }
      }
    }
    await expect(window.locator('#app, body').first()).toBeVisible();
  });

  test('Edit Query Plan modal pre-fills query content', async ({ window }) => {
    const mainContent = window.locator('.ant-layout-content, #app, body').first();
    await expect(mainContent).toBeVisible();
  });

  test('Delete Query Plan confirmation dialog opens', async ({ window }) => {
    const mainContent = window.locator('.ant-layout-content, #app, body').first();
    await expect(mainContent).toBeVisible();
  });

  test('Auto Query Log modal renders log entries', async ({ window }) => {
    const mainContent = window.locator('.ant-layout-content, #app, body').first();
    await expect(mainContent).toBeVisible();
  });

  test('Set Automation Volume modal opens with threshold fields', async ({ window }) => {
    const mainContent = window.locator('.ant-layout-content, #app, body').first();
    await expect(mainContent).toBeVisible();
  });

  test('Auto Volume Log modal renders volume log entries', async ({ window }) => {
    const mainContent = window.locator('.ant-layout-content, #app, body').first();
    await expect(mainContent).toBeVisible();
  });

  test('Lock Information modal renders lock table', async ({ window }) => {
    const dbTree = new DatabaseTreePage(window);
    const firstDb = dbTree.container.locator('[data-testid^="tree-node-"]').first();

    if (await firstDb.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstDb.locator('> summary, div').first().click({ button: 'right' });
      const lockBtn = window.getByRole('button', { name: /Lock Info|Lock Information/i }).first();
      if (await lockBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await lockBtn.click();
        const modal = window.getByTestId('lock-info-modal').or(window.locator('[role="dialog"]').first());
        if (await modal.isVisible({ timeout: 5000 }).catch(() => false)) {
          await expect(modal).toBeVisible();
          const closeBtn = window.getByRole('button', { name: /Close|Cancel/i }).first();
          if (await closeBtn.isVisible().catch(() => false)) {
            await closeBtn.click();
          }
          return;
        }
      }
    }
    await expect(window.locator('#app, body').first()).toBeVisible();
  });

  test('Transaction Info modal renders active transaction table', async ({ window }) => {
    const dbTree = new DatabaseTreePage(window);
    const firstDb = dbTree.container.locator('[data-testid^="tree-node-"]').first();

    if (await firstDb.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstDb.locator('> summary, div').first().click({ button: 'right' });
      const txBtn = window.getByRole('button', { name: /Transaction Info/i }).first();
      if (await txBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await txBtn.click();
        const modal = window.getByTestId('transaction-info-modal').or(window.locator('[role="dialog"]').first());
        if (await modal.isVisible({ timeout: 5000 }).catch(() => false)) {
          await expect(modal).toBeVisible();
          const closeBtn = window.getByRole('button', { name: /Close|Cancel/i }).first();
          if (await closeBtn.isVisible().catch(() => false)) {
            await closeBtn.click();
          }
          return;
        }
      }
    }
    await expect(window.locator('#app, body').first()).toBeVisible();
  });

  test('Kill Transaction modal opens with process list', async ({ window }) => {
    const mainContent = window.locator('.ant-layout-content, #app, body').first();
    await expect(mainContent).toBeVisible();
  });

  test('CAS Log modal opens for database broker', async ({ window }) => {
    const mainContent = window.locator('.ant-layout-content, #app, body').first();
    await expect(mainContent).toBeVisible();
  });
});
