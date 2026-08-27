const { defineConfig } = require('@playwright/test');
const path = require('path');
const { loadE2EEnv } = require('../shared/env');

process.env.CWM_E2E_RUNTIME = 'electron';
loadE2EEnv();

module.exports = defineConfig({
  testDir: path.resolve(__dirname, '..'),
  testMatch: ['shared/tests/**/*.spec.js', 'electron/tests/**/*.spec.js'],
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 90000,
  outputDir: path.resolve(__dirname, '../artifacts/electron-results'),
  reporter: [
    [path.resolve(__dirname, '../shared/clean-reporter.js')],
    ['html', { outputFolder: path.resolve(__dirname, '../artifacts/electron-report'), open: 'never' }],
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});
