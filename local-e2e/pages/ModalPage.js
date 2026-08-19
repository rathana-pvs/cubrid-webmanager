const { expect } = require('@playwright/test');

/**
 * Generic helper for modals built on the shared Modal component
 * (apps/web-manager/src/components/ds/layout/Modal.jsx).
 *
 * Modal.jsx renders data-testid="{testId}-modal" / "{testId}-modal-close"
 * only when the modal component passes a `testId` prop — this is being
 * wired in modal-by-modal as each spec file is written. Until a given
 * modal has been wired, fall back to `page.locator('div[role="dialog"]')`.
 */
class ModalPage {
  constructor(page) {
    this.page = page;
  }

  /** Locator for a modal wired with `testId="{name}"` in its component. */
  byTestId(name) {
    return this.page.getByTestId(`${name}-modal`);
  }

  /** Any open modal — use when the target hasn't been wired with a testId yet. */
  any() {
    return this.page.locator('div[role="dialog"]');
  }

  async closeByTestId(name) {
    const modal = this.byTestId(name);
    await this.page.getByTestId(`${name}-modal-close`).click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });
  }

  /** Fills a text/number/password input by its `name` attribute inside the given modal locator. */
  async fillField(modalLocator, fieldName, value) {
    await modalLocator.locator(`[name="${fieldName}"]`).fill(value);
  }
}

module.exports = { ModalPage };
