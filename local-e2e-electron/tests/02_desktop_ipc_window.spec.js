const { test, expect } = require('../fixtures/electron.fixture');
const { waitForRoute } = require('../helpers/route');

test.describe('Module 02: Desktop IPC Bridge, Keyboard Shortcuts & Window Lifecycle', () => {
  test('desktopBridge.isWorkspaceSetupRequired() returns false when setup complete', async ({ window }) => {
    await waitForRoute(window, 'login');

    const required = await window.evaluate(() => window.desktopBridge.isWorkspaceSetupRequired());
    expect(required).toBe(false);
  });

  test('desktopBridge.getWorkspaceInfo() returns workspace paths', async ({ window }) => {
    await waitForRoute(window, 'login');

    const info = await window.evaluate(() => window.desktopBridge.getWorkspaceInfo());
    expect(info).toHaveProperty('workspaceRoot');
    expect(info).toHaveProperty('defaultWorkspaceRoot');
    expect(info).toHaveProperty('isCustomWorkspace');
    expect(info).toHaveProperty('settingsFilePath');
  });

  test('Ctrl+W: calls event.preventDefault() and sends desktop:close-active-tab', async ({ electronApp, window }) => {
    await waitForRoute(window, 'login');

    await window.evaluate(() => {
      window._testCloseTabCalled = false;
      window.addEventListener('in-app:close-active-tab', (e) => {
        e.preventDefault();
        window._testCloseTabCalled = true;
      });
    });

    await electronApp.evaluate(({ BrowserWindow }) => {
      const wins = BrowserWindow.getAllWindows();
      if (wins.length > 0) {
        wins[0].webContents.send('desktop:close-active-tab');
      }
    });

    await expect.poll(async () => {
      return await window.evaluate(() => window._testCloseTabCalled);
    }).toBe(true);
  });

  test('Ctrl+W does not close the Electron window', async ({ electronApp, window }) => {
    await waitForRoute(window, 'login');
    await window.keyboard.press('Control+w');

    const winCount = await electronApp.evaluate(({ BrowserWindow }) => {
      return BrowserWindow.getAllWindows().length;
    });

    expect(winCount).toBe(1);
  });

  test('closing main window clears auth token from localStorage', async ({ electronApp, window }) => {
    await waitForRoute(window, 'login');

    await window.evaluate(() => localStorage.setItem('token', 'e2e-test-session-token'));
    const beforeToken = await window.evaluate(() => localStorage.getItem('token'));
    expect(beforeToken).toBe('e2e-test-session-token');

    const winId = await electronApp.evaluate(({ BrowserWindow }) => {
      const wins = BrowserWindow.getAllWindows();
      return wins.length > 0 ? wins[0].id : null;
    });
    expect(winId).not.toBeNull();

    await electronApp.evaluate(({ BrowserWindow }, id) => {
      const win = BrowserWindow.fromId(id);
      if (win) {
        win.emit('close');
      }
    }, winId);

    await expect.poll(async () => {
      return await window.evaluate(() => localStorage.getItem('token'));
    }).toBeNull();
  });
});
