const { defineConfig } = require('@playwright/test');

/**
 * Playwright configuration specifically for Electron desktop testing.
 * @see https://playwright.dev/docs/api/class-electron
 */
module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  retries: process.env.CI ? 1 : 0,
});
