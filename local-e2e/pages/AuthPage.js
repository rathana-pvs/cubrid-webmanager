const { expect } = require('@playwright/test');
const { dismissJobResultModal } = require('./dismissJobResultModal');

/**
 * Page Object for LoginPage / RegisterPage.
 * Selectors are backed by data-testid — see
 * apps/web-manager/src/features/auth/components/{LoginPage,RegisterPage}.jsx
 */
class AuthPage {
  constructor(page) {
    this.page = page;
    this.usernameInput = page.getByTestId('login-username-input');
    this.passwordInput = page.getByTestId('login-password-input');
    this.passwordToggle = page.getByTestId('login-password-toggle');
    this.submitBtn = page.getByTestId('login-submit-btn');

    this.registerUsernameInput = page.getByTestId('register-username-input');
    this.registerPasswordInput = page.getByTestId('register-password-input');
    this.registerConfirmPasswordInput = page.getByTestId('register-confirm-password-input');
    this.registerSubmitBtn = page.getByTestId('register-submit-btn');
  }

  async gotoLogin() {
    await this.page.goto('/login');
    await expect(this.usernameInput).toBeVisible();
  }

  async gotoRegister() {
    await this.page.goto('/register');
    await expect(this.registerUsernameInput).toBeVisible();
  }

  /** Logs in and waits for the dashboard shell to load. */
  async login(username, password) {
    await this.gotoLogin();
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitBtn.click();
    await expect(this.page).not.toHaveURL(/login/, { timeout: 10000 });
    await expect(this.page.locator('#host-section')).toBeVisible({ timeout: 10000 });
    // CmsJobProvider (app-wide) checks for the user's active background jobs
    // right after login and can pop a completion modal for a job a *previous*
    // test file abandoned (e.g. database_rename_copy's copy test) — dismiss
    // it here so it can't block the very next click in whatever spec happens
    // to be running when that job finishes.
    await dismissJobResultModal(this.page);
  }

  async register(username, password, confirmPassword = password) {
    await this.gotoRegister();
    await this.registerUsernameInput.fill(username);
    await this.registerPasswordInput.fill(password);
    await this.registerConfirmPasswordInput.fill(confirmPassword);
    await this.registerSubmitBtn.click();
  }
}

module.exports = { AuthPage };
