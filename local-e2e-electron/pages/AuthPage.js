const { expect } = require('@playwright/test');
const { waitForRoute } = require('../helpers/route');
const { dismissJobResultModal } = require('../helpers/dismiss');

class AuthPage {
  constructor(window) {
    this.window = window;
    this.usernameInput = window.getByTestId('login-username-input');
    this.passwordInput = window.getByTestId('login-password-input');
    this.passwordToggle = window.getByTestId('login-password-toggle');
    this.submitBtn = window.getByTestId('login-submit-btn');

    this.registerUsernameInput = window.getByTestId('register-username-input');
    this.registerPasswordInput = window.getByTestId('register-password-input');
    this.registerConfirmPasswordInput = window.getByTestId('register-confirm-password-input');
    this.registerSubmitBtn = window.getByTestId('register-submit-btn');
  }

  async gotoLogin() {
    await waitForRoute(this.window, 'login');
    await expect(this.usernameInput).toBeVisible({ timeout: 15000 });
  }

  async gotoRegister() {
    await waitForRoute(this.window, 'login');
    const registerLink = this.window.getByRole('link', { name: /Create Account|Sign Up|회원가입/i });
    await registerLink.click();
    await expect(this.registerUsernameInput).toBeVisible({ timeout: 15000 });
  }

  async login(username, password) {
    await this.gotoLogin();
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitBtn.click();
    await expect(this.window.locator('#host-section')).toBeVisible({ timeout: 20000 });
    await dismissJobResultModal(this.window);
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
