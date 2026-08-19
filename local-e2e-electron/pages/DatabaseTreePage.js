const { expect } = require('@playwright/test');
const { dismissJobResultModal } = require('../helpers/dismiss');

class DatabaseTreePage {
  constructor(window) {
    this.window = window;
    this.container = window.locator('#db-tree-container');
  }

  async waitForAuthorized() {
    await expect(this.container).toHaveAttribute('data-authorized', 'true', { timeout: 30000 });
  }

  dbNode(dbname) {
    return this.window.getByTestId(`tree-node-${dbname}`);
  }

  async expandDatabase(dbname) {
    const db = this.dbNode(dbname);
    await expect(db).toBeVisible({ timeout: 15000 });
    const isOpen = await db.evaluate((el) => el.open);
    if (!isOpen) {
      await db.locator('> summary').click();
    }
    return db;
  }

  async activateDatabase(dbname) {
    await dismissJobResultModal(this.window);
    const db = this.dbNode(dbname);
    await expect(db).toBeVisible({ timeout: 15000 });
    await db.locator('> summary').dblclick();
  }

  async openContextMenu(dbname) {
    await dismissJobResultModal(this.window);
    await this.window.mouse.click(2, 2).catch(() => {});
    const db = this.dbNode(dbname);
    await expect(db).toBeVisible({ timeout: 15000 });
    await db.locator('> summary').click({ button: 'right' });
  }

  subNode(dbname, subId) {
    return this.dbNode(dbname).getByTestId(`tree-node-${subId}`);
  }
}

module.exports = { DatabaseTreePage };
