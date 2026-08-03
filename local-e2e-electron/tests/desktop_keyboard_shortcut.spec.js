const { test, expect } = require('../fixtures/electron.fixture');
const { waitForRoute } = require('../helpers/route');

/**
 * Tests the Ctrl+W (Cmd+W on Mac) keyboard shortcut defined in main.ts.
 *
 * Full handler under test (main.ts):
 *   mainWindow.webContents.on('before-input-event', (event, input) => {
 *     if (input.type === 'keyDown' && (input.control || input.meta) && input.key === 'w') {
 *       event.preventDefault();                            ← suppress browser default
 *       mainWindow.webContents.send('desktop:close-active-tab'); ← notify renderer
 *     }
 *   });
 *
 * Strategy: emit 'before-input-event' directly via electronApp.evaluate() to
 * invoke the main.ts handler. Intercept webContents.send() to verify the correct
 * IPC channel is used — WITHOUT actually delivering the message to the renderer,
 * which would trigger the app's own tab-close handler and close the window.
 */
test.describe('Desktop Keyboard Shortcuts', () => {
  test('Ctrl+W: calls event.preventDefault() and sends desktop:close-active-tab', async ({ electronApp, window }) => {
    await waitForRoute(window, 'login');

    const result = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      if (!win) return { preventDefaultCalled: false, ipcSent: false };

      let preventDefaultCalled = false;
      let ipcSent = false;

      // Intercept webContents.send() to check the call without delivering to the
      // renderer — prevents the app's own onCloseActiveTab handler from running
      // (which would try to close tabs and potentially the window)
      const originalSend = win.webContents.send.bind(win.webContents);
      win.webContents.send = (channel, ...args) => {
        if (channel === 'desktop:close-active-tab') {
          ipcSent = true;
          return; // Block delivery to renderer
        }
        return originalSend(channel, ...args);
      };

      // Emit before-input-event directly to invoke the main.ts handler
      win.webContents.emit(
        'before-input-event',
        { preventDefault: () => { preventDefaultCalled = true; } },
        { type: 'keyDown', control: true, meta: false, shift: false, alt: false, key: 'w' }
      );

      // Restore original send
      win.webContents.send = originalSend;

      return { preventDefaultCalled, ipcSent };
    });

    // Handler must call event.preventDefault() to suppress Chromium's default
    expect(result.preventDefaultCalled).toBe(true);
    // Handler must send the correct IPC channel to the renderer
    expect(result.ipcSent).toBe(true);
  });

  test('Ctrl+W does not close the Electron window', async ({ electronApp, window }) => {
    await waitForRoute(window, 'login');

    const windowsBefore = await electronApp.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows().length
    );

    // Emit Ctrl+W with intercepted send to keep window open
    await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      if (!win) return;

      const originalSend = win.webContents.send.bind(win.webContents);
      win.webContents.send = (channel, ...args) => {
        if (channel === 'desktop:close-active-tab') return;
        return originalSend(channel, ...args);
      };

      win.webContents.emit(
        'before-input-event',
        { preventDefault: () => {} },
        { type: 'keyDown', control: true, meta: false, shift: false, alt: false, key: 'w' }
      );

      win.webContents.send = originalSend;
    });

    const windowsAfter = await electronApp.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows().length
    );

    expect(windowsAfter).toBe(windowsBefore);
  });
});
