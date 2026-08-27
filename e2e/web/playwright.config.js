const { defineConfig, devices } = require('@playwright/test');
const path = require('path');
const { loadE2EEnv, requireWebEnvironment } = require('../shared/env');

process.env.CWM_E2E_RUNTIME = 'web';
loadE2EEnv();
requireWebEnvironment();

module.exports = defineConfig({
  testDir: path.resolve(__dirname, '../shared/tests'),
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 60000,
  outputDir: path.resolve(__dirname, '../artifacts/web-results'),
  reporter: [
    [path.resolve(__dirname, '../shared/clean-reporter.js')],
    ['html', { outputFolder: path.resolve(__dirname, '../artifacts/web-report'), open: 'never' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://localhost:8080',
    // Local runs have zero retries, so on-first-retry produced no trace for
    // any failure. Keep a trace for failed local tests while preserving the
    // smaller retry-only policy in CI.
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
