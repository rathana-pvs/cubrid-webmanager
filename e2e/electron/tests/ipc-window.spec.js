const { test, expect } = require('../fixture');
const { waitForRoute } = require('../helpers/route');
const { Given, When, Then, And, bddMeta } = require('../../shared/bdd');

test.describe('Feature: Desktop IPC Bridge, Keyboard Shortcuts & Window Lifecycle', () => {
  test('Scenario: desktopBridge.isWorkspaceSetupRequired returns false when setup complete', async ({ window }) => {
    await bddMeta({
      epic: 'Desktop Application',
      feature: 'IPC Bridge',
      story: 'Workspace Setup Query',
    });

    let required;

    await Given('the desktop app is running and past initial setup', async () => {
      await waitForRoute(window, 'login');
    });

    await When('the renderer invokes desktopBridge.isWorkspaceSetupRequired()', async () => {
      required = await window.evaluate(() => window.desktopBridge.isWorkspaceSetupRequired());
    });

    await Then('it returns false', async () => {
      expect(required).toBe(false);
    });
  });

  test('Scenario: desktopBridge.getWorkspaceInfo returns valid paths and storage metadata', async ({ window }) => {
    await bddMeta({
      epic: 'Desktop Application',
      feature: 'IPC Bridge',
      story: 'Workspace Paths Query',
    });

    let info;

    await Given('the desktop app is in an initialized state', async () => {
      await waitForRoute(window, 'login');
    });

    await When('the renderer calls desktopBridge.getWorkspaceInfo()', async () => {
      info = await window.evaluate(() => window.desktopBridge.getWorkspaceInfo());
    });

    await Then('the returned payload contains workspace root and settings file paths', async () => {
      expect(info).toHaveProperty('workspaceRoot');
      expect(info).toHaveProperty('defaultWorkspaceRoot');
      expect(info).toHaveProperty('isCustomWorkspace');
      expect(info).toHaveProperty('settingsFilePath');
    });
  });

  test('Scenario: Ctrl+W IPC shortcut intercepts default and triggers close-active-tab event', async ({ electronApp, window }) => {
    await bddMeta({
      epic: 'Desktop Application',
      feature: 'Shortcuts & Events',
      story: 'Close Active Tab Shortcut',
    });

    await Given('an in-app event listener for close-active-tab is registered', async () => {
      await waitForRoute(window, 'login');
      await window.evaluate(() => {
        window._testCloseTabCalled = false;
        window.addEventListener('in-app:close-active-tab', (e) => {
          e.preventDefault();
          window._testCloseTabCalled = true;
        });
      });
    });

    await When('the main electron process sends desktop:close-active-tab IPC message', async () => {
      await electronApp.evaluate(({ BrowserWindow }) => {
        const wins = BrowserWindow.getAllWindows();
        if (wins.length > 0) {
          wins[0].webContents.send('desktop:close-active-tab');
        }
      });
    });

    await Then('the frontend tab close event handler is successfully invoked', async () => {
      await expect.poll(async () => {
        return await window.evaluate(() => window._testCloseTabCalled);
      }).toBe(true);
    });
  });

  test('Scenario: Ctrl+W shortcut does not close the Electron window itself', async ({ electronApp, window }) => {
    await bddMeta({
      epic: 'Desktop Application',
      feature: 'Shortcuts & Events',
      story: 'Window Retention on Ctrl+W',
    });

    await Given('the electron window is active', async () => {
      await waitForRoute(window, 'login');
    });

    await When('the user presses Control+W keyboard shortcut', async () => {
      await window.keyboard.press('Control+w');
    });

    await Then('the electron window remains open and window count is 1', async () => {
      const winCount = await electronApp.evaluate(({ BrowserWindow }) => {
        return BrowserWindow.getAllWindows().length;
      });
      expect(winCount).toBe(1);
    });
  });

  test('Scenario: Closing main window clears session authentication token from storage', async ({ electronApp, window }) => {
    await bddMeta({
      epic: 'Desktop Application',
      feature: 'Window Lifecycle',
      story: 'Clear Auth Token on Window Close',
    });

    let winId;

    await Given('a session token is saved in localStorage', async () => {
      await waitForRoute(window, 'login');
      await window.evaluate(() => localStorage.setItem('token', 'e2e-test-session-token'));
      const beforeToken = await window.evaluate(() => localStorage.getItem('token'));
      expect(beforeToken).toBe('e2e-test-session-token');

      winId = await electronApp.evaluate(({ BrowserWindow }) => {
        const wins = BrowserWindow.getAllWindows();
        return wins.length > 0 ? wins[0].id : null;
      });
      expect(winId).not.toBeNull();
    });

    await When('the main window emits close event', async () => {
      await electronApp.evaluate(({ BrowserWindow }, id) => {
        const win = BrowserWindow.fromId(id);
        if (win) {
          win.emit('close');
        }
      }, winId);
    });

    await Then('the stored token is purged from localStorage', async () => {
      await expect.poll(async () => {
        return await window.evaluate(() => localStorage.getItem('token'));
      }).toBeNull();
    });
  });
});
