const { defineConfig } = require('@playwright/test');
const path = require('path');

// Isolated helper regressions: no running app, credentials, or CMS required.
module.exports = defineConfig({
  testDir: __dirname,
  testMatch: '*.spec.js',
  workers: 1,
  retries: 0,
  timeout: 30000,
  reporter: 'list',
  outputDir: path.resolve(__dirname, '../artifacts/page-object-results'),
  use: { browserName: 'chromium', headless: true },
});
