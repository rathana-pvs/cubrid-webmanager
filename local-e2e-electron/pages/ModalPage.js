const { expect } = require('@playwright/test');

class ModalPage {
  constructor(window) {
    this.window = window;
  }

  byTestId(name) {
    return this.window.getByTestId(`${name}-modal`);
  }

  any() {
    return this.window.locator('div[role="dialog"], .ant-modal-content');
  }

  async closeByTestId(name) {
    const modal = this.byTestId(name);
    await this.window.getByTestId(`${name}-modal-close`).click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });
  }
}

module.exports = { ModalPage };
