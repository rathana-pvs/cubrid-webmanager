const { test, expect } = require('../fixtures/electron.fixture');
const { waitForRoute } = require('../helpers/route');
const { AuthPage } = require('../pages/AuthPage');

test.describe('Module 03: Desktop UI Authentication Workflows', () => {
  test('login page renders with all interactive UI controls', async ({ window }) => {
    const auth = new AuthPage(window);
    await auth.gotoLogin();

    await expect(auth.usernameInput).toBeVisible();
    await expect(auth.passwordInput).toBeVisible();
    await expect(auth.submitBtn).toBeVisible();
  });

  test('submitting empty form displays field validation errors in Electron UI', async ({ window }) => {
    const auth = new AuthPage(window);
    await auth.gotoLogin();
    await auth.submitBtn.click();

    await expect(window.getByText(/Username.*required/i)).toBeVisible();
    await expect(window.getByText(/Password.*required/i)).toBeVisible();
  });

  test('toggling password visibility converts input type in Electron UI', async ({ window }) => {
    const auth = new AuthPage(window);
    await auth.gotoLogin();

    await expect(auth.passwordInput).toHaveAttribute('type', 'password');
    await auth.passwordToggle.click();
    await expect(auth.passwordInput).toHaveAttribute('type', 'text');
  });

  test('submitting invalid credentials displays authentication failure in Electron UI', async ({ window }) => {
    const auth = new AuthPage(window);
    await auth.gotoLogin();

    await auth.usernameInput.fill('invalid_electron_user');
    await auth.passwordInput.fill('wrong_password_123');
    await auth.submitBtn.click();

    await expect(window.getByText(/Authentication Failed/i)).toBeVisible({ timeout: 10000 });
  });

  test('navigating to register page and returning to login works in Electron UI', async ({ window }) => {
    const auth = new AuthPage(window);
    await auth.gotoLogin();

    const registerLink = window.getByRole('link', { name: /Create Account|Sign Up|회원가입/i });
    await expect(registerLink).toBeVisible();
    await registerLink.click();

    await expect(auth.registerUsernameInput).toBeVisible({ timeout: 10000 });

    const loginLink = window.getByRole('link', { name: /Already have an account|Sign In|로그인/i });
    await loginLink.click();

    await expect(auth.usernameInput).toBeVisible({ timeout: 10000 });
  });
});
