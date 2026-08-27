const { test: base, expect } = require('@playwright/test');

const test = base.extend({
  appPage: async ({ page }, use) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('cwm-ui-locale', 'en');
      } catch {}
    });
    await use(page);
  },
});

module.exports = { test, expect };
