const config = require('./playwright.config');
const path = require('path');

module.exports = {
  ...config,
  testDir: path.resolve(__dirname, 'tests'),
  testMatch: '**/*.spec.js',
};
