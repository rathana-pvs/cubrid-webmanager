const { test: base, expect } = require('@playwright/test');

const test = base.extend({
  appPage: async ({ page }, use) => {
    await use(page);
  },
});

module.exports = { test, expect };
