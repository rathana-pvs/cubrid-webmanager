const { expect } = require('@playwright/test');

class NavigationPage {
  constructor(window) {
    this.window = window;
  }

  tabItem(tabId) {
    return this.window.getByTestId(`tab-${tabId}`);
  }

  breadcrumb() {
    return this.window.locator('[data-testid="breadcrumb"]');
  }
}

module.exports = { NavigationPage };
