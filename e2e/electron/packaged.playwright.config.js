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
    ['list'],
    ['html', {
      outputFolder: path.resolve(__dirname, '../artifacts/packaged-electron-report'),
      open: 'never',
    }],
    ['allure-playwright', {
      outputFolder: path.resolve(__dirname, '../artifacts/allure-results'),
      detail: true,
      suiteTitle: true,
    }],
  ],
  use: { trace: 'on-first-retry', screenshot: 'only-on-failure' },
});
