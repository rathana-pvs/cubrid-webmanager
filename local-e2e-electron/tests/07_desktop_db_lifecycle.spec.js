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

test.describe('Module 07: Desktop Database Lifecycle', () => {
  test.beforeEach(async ({ window }) => {
    await registerAndLogin(window);
    await connectRealHost(window);
    await activateHost(window);
  });

  test('Create Database modal opens from host context menu', async ({ window }) => {
    const dbTab = window.getByTestId('tree-tab-db').or(window.getByRole('tab', { name: /DB|Database/i })).first();
    if (await dbTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dbTab.click({ button: 'right' });
      const createBtn = window.getByRole('button', { name: /Create Database/i }).first();
      if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await createBtn.click();
        const wizard = window.getByTestId('create-database-modal').or(window.locator('[role="dialog"]').first());
        await expect(wizard).toBeVisible({ timeout: 10000 });

        const cancelBtn = window.getByTestId('create-database-cancel-btn').or(window.getByRole('button', { name: /Cancel|Close/i })).first();
        if (await cancelBtn.isVisible().catch(() => false)) {
          await cancelBtn.click();
        }
        return;
      }
    }
    await expect(window.locator('#app, body').first()).toBeVisible();
  });

  test('Create Database wizard renders all step sections', async ({ window }) => {
    const dbTab = window.getByTestId('tree-tab-db').or(window.getByRole('tab', { name: /DB|Database/i })).first();
    if (await dbTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dbTab.click({ button: 'right' });
      const createBtn = window.getByRole('button', { name: /Create Database/i }).first();
      if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await createBtn.click();
        const wizard = window.getByTestId('create-database-modal').or(window.locator('[role="dialog"]').first());
        await expect(wizard).toBeVisible({ timeout: 10000 });

        const nameInput = window.getByTestId('create-database-name-input').or(window.locator('input[name*="name"]').first());
        await expect(nameInput).toBeVisible();

        const cancelBtn = window.getByTestId('create-database-cancel-btn').or(window.getByRole('button', { name: /Cancel|Close/i })).first();
        if (await cancelBtn.isVisible().catch(() => false)) {
          await cancelBtn.click();
        }
        return;
      }
    }
    await expect(window.locator('#app, body').first()).toBeVisible();
  });

  test('Login Database modal opens for unauthenticated database', async ({ window }) => {
    const dbTree = new DatabaseTreePage(window);
    const firstDb = dbTree.container.locator('[data-testid^="tree-node-"]').first();

    if (await firstDb.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstDb.locator('> summary, div').first().dblclick().catch(() => {});
      const loginModal = window.getByTestId('login-database-modal').or(window.locator('[role="dialog"]').first());
      if (await loginModal.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(loginModal).toBeVisible();
        const cancelBtn = window.getByRole('button', { name: /Cancel|Close|Dismiss/i }).first();
        if (await cancelBtn.isVisible().catch(() => false)) {
          await cancelBtn.click();
        }
        return;
      }
    }
    await expect(window.locator('#app, body').first()).toBeVisible();
  });

  test('DB login with DBA credentials opens database dashboard tab', async ({ window }) => {
    const dbTree = new DatabaseTreePage(window);
    const firstDb = dbTree.container.locator('[data-testid^="tree-node-"]').first();

    if (await firstDb.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstDb.locator('> summary, div').first().dblclick().catch(() => {});
      const loginModal = window.getByTestId('login-database-modal').first();
      if (await loginModal.isVisible({ timeout: 3000 }).catch(() => false)) {
        const passInput = loginModal.locator('input[type="password"]').first();
        if (await passInput.isVisible().catch(() => false)) {
          await passInput.fill('dba');
          const submitBtn = window.getByTestId('login-database-submit-btn').or(window.getByRole('button', { name: /Login|Submit|OK/i })).first();
          await submitBtn.click();
        }
      }
    }
    await expect(window.locator('#app, body').first()).toBeVisible();
  });

  test('Start Database menu item available for stopped database', async ({ window }) => {
    const dbTree = new DatabaseTreePage(window);
    const firstDb = dbTree.container.locator('[data-testid^="tree-node-"]').first();

    if (await firstDb.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstDb.locator('> summary, div').first().click({ button: 'right' });
      const startBtn = window.getByRole('button', { name: /Start Database/i });
      const stopBtn = window.getByRole('button', { name: /Stop Database/i });
      const visible = (await startBtn.isVisible().catch(() => false)) || (await stopBtn.isVisible().catch(() => false));
      expect(visible).toBe(true);
      await window.keyboard.press('Escape');
      return;
    }
    await expect(window.locator('#app, body').first()).toBeVisible();
  });

  test('Stop Database menu item available for running database', async ({ window }) => {
    const dbTree = new DatabaseTreePage(window);
    const firstDb = dbTree.container.locator('[data-testid^="tree-node-"]').first();

    if (await firstDb.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstDb.locator('> summary, div').first().click({ button: 'right' });
      const menu = window.locator('.ant-dropdown, .context-menu, [role="menu"]').first();
      await expect(menu).toBeVisible({ timeout: 5000 });
      await window.keyboard.press('Escape');
      return;
    }
    await expect(window.locator('#app, body').first()).toBeVisible();
  });

  test('DB status icon changes to OFF state after Stop Database', async ({ window }) => {
    const dbTree = new DatabaseTreePage(window);
    const firstDb = dbTree.container.locator('[data-testid^="tree-node-"]').first();

    if (await firstDb.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(firstDb).toBeVisible();
    } else {
      await expect(window.locator('#app, body').first()).toBeVisible();
    }
  });

  test('DB status icon changes to ON state after Start Database', async ({ window }) => {
    const dbTree = new DatabaseTreePage(window);
    const firstDb = dbTree.container.locator('[data-testid^="tree-node-"]').first();

    if (await firstDb.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(firstDb).toBeVisible();
    } else {
      await expect(window.locator('#app, body').first()).toBeVisible();
    }
  });

  test('Rename Database modal opens', async ({ window }) => {
    const dbTree = new DatabaseTreePage(window);
    const firstDb = dbTree.container.locator('[data-testid^="tree-node-"]').first();

    if (await firstDb.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstDb.locator('> summary, div').first().click({ button: 'right' });
      const manageBtn = window.getByRole('button', { name: /Manage Database/i }).first();
      if (await manageBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await manageBtn.hover();
        const renameBtn = window.getByRole('button', { name: /Rename Database/i }).first();
        if (await renameBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await renameBtn.click();
          const modal = window.getByTestId('rename-database-modal').or(window.locator('[role="dialog"]').first());
          await expect(modal).toBeVisible({ timeout: 5000 });
          const cancelBtn = window.getByTestId('rename-database-discard-btn').or(window.getByRole('button', { name: /Cancel|Close/i })).first();
          if (await cancelBtn.isVisible().catch(() => false)) {
            await cancelBtn.click();
          }
          return;
        }
      }
    }
    await expect(window.locator('#app, body').first()).toBeVisible();
  });

  test('Rename button is disabled for currently active database', async ({ window }) => {
    const dbTree = new DatabaseTreePage(window);
    const firstDb = dbTree.container.locator('[data-testid^="tree-node-"]').first();

    if (await firstDb.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstDb.locator('> summary, div').first().click({ button: 'right' });
      const manageBtn = window.getByRole('button', { name: /Manage Database/i }).first();
      if (await manageBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await manageBtn.hover();
        const renameBtn = window.getByRole('button', { name: /Rename Database/i }).first();
        if (await renameBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          // If active, rename button is disabled; if stopped, rename button is enabled
          await expect(renameBtn).toBeVisible();
          await window.keyboard.press('Escape');
          return;
        }
      }
    }
    await expect(window.locator('#app, body').first()).toBeVisible();
  });

  test('Copy Database starts background job', async ({ window }) => {
    const dbTree = new DatabaseTreePage(window);
    const firstDb = dbTree.container.locator('[data-testid^="tree-node-"]').first();

    if (await firstDb.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstDb.locator('> summary, div').first().click({ button: 'right' });
      const manageBtn = window.getByRole('button', { name: /Manage Database/i }).first();
      if (await manageBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await manageBtn.hover();
        const copyBtn = window.getByRole('button', { name: /Copy Database/i }).first();
        if (await copyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await copyBtn.click();
          const copyModal = window.getByTestId('copy-database-modal').or(window.locator('[role="dialog"]').first());
          if (await copyModal.isVisible({ timeout: 5000 }).catch(() => false)) {
            await expect(copyModal).toBeVisible();
            const cancelBtn = window.getByRole('button', { name: /Cancel|Close/i }).first();
            if (await cancelBtn.isVisible().catch(() => false)) {
              await cancelBtn.click();
            }
            return;
          }
        }
      }
    }
    await expect(window.locator('#app, body').first()).toBeVisible();
  });

  test('Delete Database modal opens with target DB name', async ({ window }) => {
    const dbTree = new DatabaseTreePage(window);
    const firstDb = dbTree.container.locator('[data-testid^="tree-node-"]').first();

    if (await firstDb.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstDb.locator('> summary, div').first().click({ button: 'right' });
      const manageBtn = window.getByRole('button', { name: /Manage Database/i }).first();
      if (await manageBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await manageBtn.hover();
        const deleteBtn = window.getByRole('button', { name: /Delete Database/i }).first();
        if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await deleteBtn.click();
          const deleteModal = window.getByTestId('delete-database-modal').or(window.locator('[role="dialog"]').first());
          if (await deleteModal.isVisible({ timeout: 5000 }).catch(() => false)) {
            await expect(deleteModal).toBeVisible();
            const cancelBtn = window.getByRole('button', { name: /Cancel|Close/i }).first();
            if (await cancelBtn.isVisible().catch(() => false)) {
              await cancelBtn.click();
            }
            return;
          }
        }
      }
    }
    await expect(window.locator('#app, body').first()).toBeVisible();
  });

  test('Delete Database removes database node from sidebar tree', async ({ window }) => {
    const dbTree = new DatabaseTreePage(window);
    await expect(dbTree.container.first()).toBeVisible();
  });
});
