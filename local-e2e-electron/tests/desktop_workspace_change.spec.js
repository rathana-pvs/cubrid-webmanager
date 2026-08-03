const { test, expect } = require('../fixtures/electron.fixture');
const { waitForRoute } = require('../helpers/route');

/**
 * Tests for desktop IPC handlers via window.desktopBridge.
 * desktopBridge is exposed by preload.ts via contextBridge — the correct
 * public API, not private ipcMain internals.
 */
test.describe('Desktop Workspace IPC Handlers', () => {
  test('desktopBridge.getWorkspaceInfo() returns workspace paths', async ({ window }) => {
    await waitForRoute(window, 'login');

    const info = await window.evaluate(() => window.desktopBridge.getWorkspaceInfo());

    expect(info).toHaveProperty('workspaceRoot');
    expect(info).toHaveProperty('isCustomWorkspace');
    expect(info).toHaveProperty('settingsFilePath');
    expect(typeof info.workspaceRoot).toBe('string');
    expect(info.workspaceRoot.length).toBeGreaterThan(0);
    // fixture writes a custom workspaceRoot → isCustomWorkspace should be true
    expect(info.isCustomWorkspace).toBe(true);
  });

  test('desktopBridge.isWorkspaceSetupRequired() returns false when setup complete', async ({ window }) => {
    // fixture pre-populates settings with workspaceSetupComplete: true
    // app routes straight to /login (not /desktop/workspace)
    await waitForRoute(window, 'login');

    const isRequired = await window.evaluate(() =>
      window.desktopBridge.isWorkspaceSetupRequired()
    );

    expect(isRequired).toBe(false);
  });
});
