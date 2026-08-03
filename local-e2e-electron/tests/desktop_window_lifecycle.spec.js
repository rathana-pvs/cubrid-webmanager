const { test, expect } = require('../fixtures/electron.fixture');
const { waitForRoute } = require('../helpers/route');

test.describe('Desktop Window Lifecycle & Security', () => {
  test('closing main window clears auth token from localStorage', async ({ electronApp, window }) => {
    await waitForRoute(window, 'login');

    // Simulate logged in state by storing a token in localStorage
    await window.evaluate(() => localStorage.setItem('token', 'e2e-test-session-token'));
    const beforeToken = await window.evaluate(() => localStorage.getItem('token'));
    expect(beforeToken).toBe('e2e-test-session-token');

    // Trigger window close event in main process
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

    // Verify token was cleared by the close handler
    const afterToken = await window.evaluate(() => localStorage.getItem('token'));
    expect(afterToken).toBeNull();
  });
});
