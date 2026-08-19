const config = require('./playwright.config');
const path = require('path');

module.exports = {
  ...config,
  testDir: path.resolve(__dirname, '../shared/tests'),
  testMatch: '**/*.spec.js',
};
