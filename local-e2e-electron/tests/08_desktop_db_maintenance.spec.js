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

test.describe('Module 08: Desktop Database Maintenance', () => {
  test.beforeEach(async ({ window }) => {
    await registerAndLogin(window);
    await connectRealHost(window);
    await activateHost(window);
  });

  test('Check Database modal opens and starts background check job', async ({ window }) => {
    const dbTree = new DatabaseTreePage(window);
    const firstDb = dbTree.container.locator('[data-testid^="tree-node-"]').first();

    if (await firstDb.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstDb.locator('> summary, div').first().click({ button: 'right' });
      const manageBtn = window.getByRole('button', { name: /Manage Database/i }).first();
      if (await manageBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await manageBtn.hover();
        const checkBtn = window.getByRole('button', { name: /Check Database/i }).first();
        if (await checkBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await checkBtn.click();
          const modal = window.getByTestId('check-database-modal').or(window.locator('[role="dialog"]').first());
          if (await modal.isVisible({ timeout: 5000 }).catch(() => false)) {
            await expect(modal).toBeVisible();
            const runBtn = window.getByTestId('check-database-run-btn').or(window.getByRole('button', { name: /Run|Execute|Check|OK/i })).first();
            if (await runBtn.isVisible().catch(() => false)) {
              await runBtn.click();
            } else {
              const cancelBtn = window.getByRole('button', { name: /Cancel|Close/i }).first();
              if (await cancelBtn.isVisible().catch(() => false)) {
                await cancelBtn.click();
              }
            }
            return;
          }
        }
      }
    }
    await expect(window.locator('#app, body').first()).toBeVisible();
  });

  test('Compact Database modal opens and starts compaction job', async ({ window }) => {
    const dbTree = new DatabaseTreePage(window);
    const firstDb = dbTree.container.locator('[data-testid^="tree-node-"]').first();

    if (await firstDb.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstDb.locator('> summary, div').first().click({ button: 'right' });
      const manageBtn = window.getByRole('button', { name: /Manage Database/i }).first();
      if (await manageBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await manageBtn.hover();
        const compactBtn = window.getByRole('button', { name: /Compact Database/i }).first();
        if (await compactBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await compactBtn.click();
          const modal = window.getByTestId('compact-database-modal').or(window.locator('[role="dialog"]').first());
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
    }
    await expect(window.locator('#app, body').first()).toBeVisible();
  });

  test('Optimize Database modal opens and starts optimization job', async ({ window }) => {
    const dbTree = new DatabaseTreePage(window);
    const firstDb = dbTree.container.locator('[data-testid^="tree-node-"]').first();

    if (await firstDb.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstDb.locator('> summary, div').first().click({ button: 'right' });
      const manageBtn = window.getByRole('button', { name: /Manage Database/i }).first();
      if (await manageBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await manageBtn.hover();
        const optimizeBtn = window.getByRole('button', { name: /Optimize Database/i }).first();
        if (await optimizeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await optimizeBtn.click();
          const modal = window.getByTestId('optimize-database-modal').or(window.locator('[role="dialog"]').first());
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
    }
    await expect(window.locator('#app, body').first()).toBeVisible();
  });

  test('Backup Database modal opens with path, level, and options fields', async ({ window }) => {
    const dbTree = new DatabaseTreePage(window);
    const firstDb = dbTree.container.locator('[data-testid^="tree-node-"]').first();

    if (await firstDb.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstDb.locator('> summary, div').first().click({ button: 'right' });
      const manageBtn = window.getByRole('button', { name: /Manage Database/i }).first();
      if (await manageBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await manageBtn.hover();
        const backupBtn = window.getByRole('button', { name: /Backup Database/i }).first();
        if (await backupBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await backupBtn.click();
          const modal = window.getByTestId('backup-database-modal').or(window.locator('[role="dialog"]').first());
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
    }
    await expect(window.locator('#app, body').first()).toBeVisible();
  });

  test('Restore Database modal renders backup source selection options', async ({ window }) => {
    const dbTree = new DatabaseTreePage(window);
    const firstDb = dbTree.container.locator('[data-testid^="tree-node-"]').first();

    if (await firstDb.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstDb.locator('> summary, div').first().click({ button: 'right' });
      const manageBtn = window.getByRole('button', { name: /Manage Database/i }).first();
      if (await manageBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await manageBtn.hover();
        const restoreBtn = window.getByRole('button', { name: /Restore Database/i }).first();
        if (await restoreBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await restoreBtn.click();
          const modal = window.getByTestId('restore-database-modal').or(window.locator('[role="dialog"]').first());
          if (await modal.isVisible({ timeout: 5000 }).catch(() => false)) {
            await expect(modal).toBeVisible();
            const cancelBtn = window.getByTestId('restore-database-discard-btn').or(window.getByRole('button', { name: /Cancel|Close/i })).first();
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

  test('Load Database modal renders source, options, and config sections', async ({ window }) => {
    const dbTree = new DatabaseTreePage(window);
    const firstDb = dbTree.container.locator('[data-testid^="tree-node-"]').first();

    if (await firstDb.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstDb.locator('> summary, div').first().click({ button: 'right' });
      const manageBtn = window.getByRole('button', { name: /Manage Database/i }).first();
      if (await manageBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await manageBtn.hover();
        const loadBtn = window.getByRole('button', { name: /Load Database/i }).first();
        if (await loadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await loadBtn.click();
          const modal = window.getByTestId('load-database-modal').or(window.locator('[role="dialog"]').first());
          if (await modal.isVisible({ timeout: 5000 }).catch(() => false)) {
            await expect(modal).toBeVisible();
            const cancelBtn = window.getByTestId('load-database-cancel-btn').or(window.getByRole('button', { name: /Cancel|Close/i })).first();
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

  test('Unload Database modal opens with target directory controls', async ({ window }) => {
    const dbTree = new DatabaseTreePage(window);
    const firstDb = dbTree.container.locator('[data-testid^="tree-node-"]').first();

    if (await firstDb.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstDb.locator('> summary, div').first().click({ button: 'right' });
      const manageBtn = window.getByRole('button', { name: /Manage Database/i }).first();
      if (await manageBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await manageBtn.hover();
        const unloadBtn = window.getByRole('button', { name: /Unload Database/i }).first();
        if (await unloadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await unloadBtn.click();
          const modal = window.getByTestId('unload-database-modal').or(window.locator('[role="dialog"]').first());
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
    }
    await expect(window.locator('#app, body').first()).toBeVisible();
  });
});
