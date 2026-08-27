const { defineConfig } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: path.resolve(__dirname, 'packaged'),
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  workers: 1,
  timeout: 120000,
  outputDir: path.resolve(__dirname, '../artifacts/packaged-electron-results'),
  reporter: [
    [path.resolve(__dirname, '../shared/clean-reporter.js')],
    ['html', {
      outputFolder: path.resolve(__dirname, '../artifacts/packaged-electron-report'),
      open: 'never',
    }],
  ],
  use: { trace: 'on-first-retry', screenshot: 'only-on-failure' },
});
