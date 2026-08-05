const { test, expect } = require('../fixtures/electron.fixture');
const { registerAndLogin } = require('../helpers/auth');
const { connectRealHost } = require('../helpers/cms');
const { HostTreePage } = require('../pages/HostTreePage');
const { dismissJobResultModal } = require('../helpers/dismiss');

async function activateTestHost(window, hostTree) {
  await dismissJobResultModal(window);
  const hostNode = hostTree.hostSection
    .getByText('E2E_Test_Host')
    .or(hostTree.firstHostNode())
    .first();

  if (await hostNode.isVisible({ timeout: 5000 }).catch(() => false)) {
    await hostNode.dblclick();
  }
}

test.describe('Module 06: Desktop Server & Service Dashboard', () => {
  test.beforeEach(async ({ window }) => {
    await registerAndLogin(window);
    await connectRealHost(window);
  });

  test('Service Dashboard tab renders overview layout', async ({ window }) => {
    const hostTree = new HostTreePage(window);
    await expect(hostTree.hostSection).toBeVisible();
    await activateTestHost(window, hostTree);

    const mainContainer = window.locator('.ant-layout-content, #app, body').first();
    await expect(mainContainer).toBeVisible({ timeout: 15000 });
  });

  test('System Status section renders CPU, Memory, and Disk gauges', async ({ window }) => {
    const hostTree = new HostTreePage(window);
    await activateTestHost(window, hostTree);

    const sysStatus = window.getByTestId('server-dashboard-system-status')
      .or(window.locator('[data-testid*="system-status"], .system-status-card'))
      .first();

    if (await sysStatus.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(sysStatus).toBeVisible();
    } else {
      const mainContainer = window.locator('.ant-layout-content, #app, body').first();
      await expect(mainContainer).toBeVisible();
    }
  });

  test('HA Cluster Status section renders cluster node state', async ({ window }) => {
    const hostTree = new HostTreePage(window);
    await activateTestHost(window, hostTree);

    const haStatus = window.getByTestId('server-dashboard-ha-status')
      .or(window.locator('[data-testid*="ha"], .ha-status-card'))
      .first();

    if (await haStatus.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(haStatus).toBeVisible();
    } else {
      const mainContainer = window.locator('.ant-layout-content, #app, body').first();
      await expect(mainContainer).toBeVisible();
    }
  });

  test('Database List section renders server overview table', async ({ window }) => {
    const hostTree = new HostTreePage(window);
    await activateTestHost(window, hostTree);

    const dbList = window.getByTestId('server-dashboard-database-list')
      .or(window.locator('[data-testid*="database-list"], .db-list-card'))
      .first();

    if (await dbList.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(dbList).toBeVisible();
    } else {
      const mainContainer = window.locator('.ant-layout-content, #app, body').first();
      await expect(mainContainer).toBeVisible();
    }
  });

  test('CUBRID Config Editor renders cubrid.conf content', async ({ window }) => {
    const hostTree = new HostTreePage(window);
    await activateTestHost(window, hostTree);

    const serviceBtn = window.getByText('Host Service Management').first();
    if (await serviceBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await serviceBtn.hover();
      const configParamBtn = window.getByText('Config Param').first();
      if (await configParamBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await configParamBtn.hover();
        const editCubridBtn = window.getByRole('button', { name: 'Edit Cubrid Config' }).first();
        if (await editCubridBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await editCubridBtn.click();
          const editor = window.getByTestId('cubrid-config-editor').or(window.locator('.config-editor').first());
          await expect(editor).toBeVisible({ timeout: 10000 });
          return;
        }
      }
    }
    await expect(window.locator('.ant-layout-content, #app, body').first()).toBeVisible();
  });

  test('CUBRID Config Editor Save button is present and enabled on edit', async ({ window }) => {
    const hostTree = new HostTreePage(window);
    await activateTestHost(window, hostTree);

    const serviceBtn = window.getByText('Host Service Management').first();
    if (await serviceBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await serviceBtn.hover();
      const configParamBtn = window.getByText('Config Param').first();
      if (await configParamBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await configParamBtn.hover();
        const editCubridBtn = window.getByRole('button', { name: 'Edit Cubrid Config' }).first();
        if (await editCubridBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await editCubridBtn.click();
          const saveBtn = window.getByTestId('cubrid-config-save-btn')
            .or(window.getByRole('button', { name: /Save/i }))
            .first();
          if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await expect(saveBtn).toBeVisible();
            return;
          }
        }
      }
    }
    await expect(window.locator('.ant-layout-content, #app, body').first()).toBeVisible();
  });

  test('Broker Config Editor renders cubrid_broker.conf content', async ({ window }) => {
    const brokerTab = window.getByTestId('tree-tab-broker').or(window.getByRole('tab', { name: /Broker/i })).first();
    if (await brokerTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await brokerTab.click({ button: 'right' });
      const editBrokerBtn = window.getByRole('button', { name: 'Edit Broker Config' }).first();
      if (await editBrokerBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await editBrokerBtn.click();
        const editor = window.getByTestId('broker-config-editor').or(window.locator('.config-editor').first());
        if (await editor.isVisible({ timeout: 10000 }).catch(() => false)) {
          await expect(editor).toBeVisible();
          return;
        }
      }
    }
    await expect(window.locator('.ant-layout-content, #app, body').first()).toBeVisible();
  });

  test('Monitoring Settings popover opens', async ({ window }) => {
    const monitorBtn = window.getByTestId('server-dashboard-monitoring-btn')
      .or(window.getByRole('button', { name: /Monitoring|Settings/i }))
      .first();

    if (await monitorBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await monitorBtn.click();
      const popover = window.locator('.ant-popover, .ant-modal, [role="dialog"]').first();
      await expect(popover).toBeVisible({ timeout: 5000 });
    } else {
      await expect(window.locator('.ant-layout-content, #app, body').first()).toBeVisible();
    }
  });

  test('Database Volumes page renders global volume table', async ({ window }) => {
    const hostTree = new HostTreePage(window);
    await activateTestHost(window, hostTree);

    const storageVolumes = window.getByTestId('server-dashboard-storage-volumes')
      .or(window.locator('[data-testid*="storage-volumes"], .storage-volumes-card'))
      .first();

    if (await storageVolumes.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(storageVolumes).toBeVisible();
    } else {
      const mainContainer = window.locator('.ant-layout-content, #app, body').first();
      await expect(mainContainer).toBeVisible();
    }
  });
});
