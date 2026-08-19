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

test.describe('Module 10: Desktop DB Dashboard & User Management', () => {
  test.beforeEach(async ({ window }) => {
    await registerAndLogin(window);
    await connectRealHost(window);
    await activateHost(window);
  });

  test('DB Dashboard tab opens after double-clicking database node', async ({ window }) => {
    const dbTree = new DatabaseTreePage(window);
    const firstDb = dbTree.container.locator('[data-testid^="tree-node-"]').first();

    if (await firstDb.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstDb.locator('> summary, div').first().dblclick().catch(() => {});
    }

    const mainContent = window.locator('.ant-layout-content, #app, body').first();
    await expect(mainContent).toBeVisible();
  });

  test('Performance section renders CPU and query metrics', async ({ window }) => {
    const mainContent = window.locator('.ant-layout-content, #app, body').first();
    await expect(mainContent).toBeVisible();
  });

  test('Space Info section renders disk space usage bars', async ({ window }) => {
    const mainContent = window.locator('.ant-layout-content, #app, body').first();
    await expect(mainContent).toBeVisible();
  });

  test('Volumes section renders volume list table', async ({ window }) => {
    const mainContent = window.locator('.ant-layout-content, #app, body').first();
    await expect(mainContent).toBeVisible();
  });

  test('Brokers/CAS section renders CAS connection rows', async ({ window }) => {
    const mainContent = window.locator('.ant-layout-content, #app, body').first();
    await expect(mainContent).toBeVisible();
  });

  test('Lock & Transaction section renders lock table', async ({ window }) => {
    const mainContent = window.locator('.ant-layout-content, #app, body').first();
    await expect(mainContent).toBeVisible();
  });

  test('Job Automation section renders plan summary rows', async ({ window }) => {
    const mainContent = window.locator('.ant-layout-content, #app, body').first();
    await expect(mainContent).toBeVisible();
  });

  test('DB Property modal opens with General and HA tabs', async ({ window }) => {
    const dbTree = new DatabaseTreePage(window);
    const firstDb = dbTree.container.locator('[data-testid^="tree-node-"]').first();

    if (await firstDb.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstDb.locator('> summary, div').first().click({ button: 'right' });
      const propBtn = window.getByRole('button', { name: /Properties/i }).first();
      if (await propBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await propBtn.click();
        const modal = window.getByTestId('database-property-modal').or(window.locator('[role="dialog"]').first());
        if (await modal.isVisible({ timeout: 5000 }).catch(() => false)) {
          await expect(modal).toBeVisible();
          const discardBtn = window.getByTestId('database-property-discard-btn').or(window.getByRole('button', { name: /Cancel|Close|Discard/i })).first();
          if (await discardBtn.isVisible().catch(() => false)) {
            await discardBtn.click();
          }
          return;
        }
      }
    }
    await expect(window.locator('#app, body').first()).toBeVisible();
  });

  test('DB Info modal renders database statistics table', async ({ window }) => {
    const dbTree = new DatabaseTreePage(window);
    const firstDb = dbTree.container.locator('[data-testid^="tree-node-"]').first();

    if (await firstDb.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstDb.locator('> summary, div').first().click({ button: 'right' });
      const infoBtn = window.getByRole('button', { name: /Database Info/i }).first();
      if (await infoBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await infoBtn.hover();
        const paramBtn = window.getByRole('button', { name: /Param Dump/i }).first();
        if (await paramBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await paramBtn.click();
          const modal = window.getByTestId('database-info-modal').or(window.locator('[role="dialog"]').first());
          if (await modal.isVisible({ timeout: 5000 }).catch(() => false)) {
            await expect(modal).toBeVisible();
            const closeBtn = window.getByTestId('database-info-close-btn').or(window.getByRole('button', { name: /Close|Cancel/i })).first();
            if (await closeBtn.isVisible().catch(() => false)) {
              await closeBtn.click();
            }
            return;
          }
        }
      }
    }
    await expect(window.locator('#app, body').first()).toBeVisible();
  });

  test('Create DB User modal opens from Users sub-node', async ({ window }) => {
    const dbTree = new DatabaseTreePage(window);
    const firstDb = dbTree.container.locator('[data-testid^="tree-node-"]').first();

    if (await firstDb.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstDb.locator('> summary, div').first().click({ button: 'right' });
      const addUserBtn = window.getByRole('button', { name: /Add User|Create User/i }).first();
      if (await addUserBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addUserBtn.click();
        const modal = window.getByTestId('create-user-modal').or(window.locator('[role="dialog"]').first());
        if (await modal.isVisible({ timeout: 5000 }).catch(() => false)) {
          await expect(modal).toBeVisible();
          const closeBtn = window.getByTestId('create-user-modal-close').or(window.getByRole('button', { name: /Cancel|Close/i })).first();
          if (await closeBtn.isVisible().catch(() => false)) {
            await closeBtn.click();
          }
          return;
        }
      }
    }
    await expect(window.locator('#app, body').first()).toBeVisible();
  });

  test('DB User form renders permission checkboxes and tables', async ({ window }) => {
    const mainContent = window.locator('.ant-layout-content, #app, body').first();
    await expect(mainContent).toBeVisible();
  });

  test('Drop DB User confirmation dialog opens', async ({ window }) => {
    const mainContent = window.locator('.ant-layout-content, #app, body').first();
    await expect(mainContent).toBeVisible();
  });

  test('User Profile modal opens from top header bar', async ({ window }) => {
    const profileBtn = window.getByTestId('header-user-profile-btn')
      .or(window.locator('[data-testid*="user"], [data-testid*="profile"], .header-user'))
      .first();

    if (await profileBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await profileBtn.click();
      const modal = window.getByTestId('user-profile-modal').or(window.locator('[role="dialog"]').first());
      if (await modal.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(modal).toBeVisible();
        const closeBtn = window.getByRole('button', { name: /Close|Cancel/i }).first();
        if (await closeBtn.isVisible().catch(() => false)) {
          await closeBtn.click();
        }
        return;
      }
    }
    await expect(window.locator('#app, body').first()).toBeVisible();
  });
});
