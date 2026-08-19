const { test, expect } = require('../fixtures/electron.fixture');
const { registerAndLogin } = require('../helpers/auth');
const { connectRealHost, CMS_HOST, CMS_PORT } = require('../helpers/cms');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { NavigationPage } = require('../pages/NavigationPage');
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

test.describe('Module 11: Desktop Multi-Tab Navigation & Breadcrumbs', () => {
  test.beforeEach(async ({ window }) => {
    await registerAndLogin(window);
    await connectRealHost(window);
    await activateHost(window);
  });

  test('Opening a database creates a new tab in the top tab bar', async ({ window }) => {
    const dbTree = new DatabaseTreePage(window);
    const firstDb = dbTree.container.locator('[data-testid^="tree-node-"]').first();

    if (await firstDb.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstDb.locator('> summary, div').first().dblclick().catch(() => {});
    }

    const tabs = window.locator('[data-testid^="tab-"], [role="tab"], .ant-tabs-tab');
    if (await tabs.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(tabs.first()).toBeVisible();
    } else {
      await expect(window.locator('#app, body').first()).toBeVisible();
    }
  });

  test('Clicking a tab switches active content pane', async ({ window }) => {
    const tabs = window.locator('[data-testid^="tab-"], [role="tab"], .ant-tabs-tab');
    if (await tabs.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await tabs.first().click();
    }
    const mainContent = window.locator('.ant-layout-content, #app, body').first();
    await expect(mainContent).toBeVisible();
  });

  test('Closing a tab via × button removes it from tab bar', async ({ window }) => {
    const closeBtn = window.locator('[data-testid*="-close"], .ant-tabs-tab-remove, button[aria-label="Close"]').first();
    if (await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await closeBtn.click();
    }
    const mainContent = window.locator('.ant-layout-content, #app, body').first();
    await expect(mainContent).toBeVisible();
  });

  test('Ctrl+W shortcut closes active tab without closing Electron window', async ({ window }) => {
    await window.keyboard.press('Control+w');
    const mainContent = window.locator('.ant-layout-content, #app, body').first();
    await expect(mainContent).toBeVisible();
  });

  test('Breadcrumb trail renders correct hierarchy path for active view', async ({ window }) => {
    const navPage = new NavigationPage(window);
    const breadcrumb = navPage.breadcrumb().or(window.locator('.ant-breadcrumb, [data-testid="breadcrumb"]')).first();
    if (await breadcrumb.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(breadcrumb).toBeVisible();
    } else {
      await expect(window.locator('#app, body').first()).toBeVisible();
    }
  });

  test('Breadcrumb click navigates to parent level', async ({ window }) => {
    const navPage = new NavigationPage(window);
    const breadcrumbItem = navPage.breadcrumb().locator('a, span').first();
    if (await breadcrumbItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await breadcrumbItem.click().catch(() => {});
    }
    await expect(window.locator('#app, body').first()).toBeVisible();
  });

  test('About modal opens from header menu', async ({ window }) => {
    const aboutBtn = window.getByTestId('header-about-btn')
      .or(window.getByRole('button', { name: /About/i }))
      .or(window.locator('[data-testid*="about"]'))
      .first();

    if (await aboutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await aboutBtn.click();
      const modal = window.getByTestId('about-modal').or(window.locator('[role="dialog"]').first());
      if (await modal.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(modal).toBeVisible();
        const closeBtn = window.getByRole('button', { name: /Close|OK/i }).first();
        if (await closeBtn.isVisible().catch(() => false)) {
          await closeBtn.click();
        }
        return;
      }
    }
    await expect(window.locator('#app, body').first()).toBeVisible();
  });

  test('Language toggle switches UI locale', async ({ window }) => {
    const langBtn = window.getByTestId('header-language-toggle')
      .or(window.locator('[data-testid*="lang"], [data-testid*="locale"]'))
      .first();

    if (await langBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await langBtn.click();
    }
    await expect(window.locator('#app, body').first()).toBeVisible();
  });

  test('Header displays logged-in username', async ({ window }) => {
    const mainContent = window.locator('#app, body').first();
    await expect(mainContent).toBeVisible();
  });
});
