const { expect } = require('@playwright/test');
const { waitForRoute } = require('./route');
const { dismissJobResultModal } = require('./dismiss');

/**
 * Helper to register a unique user and log into the application in Electron mode.
 */
async function registerAndLogin(window) {
  await waitForRoute(window, 'login');

  const registerLink = window.getByRole('link', { name: /Create Account|Sign Up|회원가입/i });
  await registerLink.click();

  const username = `e2e_usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const password = 'Password123!';

  const regUsername = window.getByTestId('register-username-input');
  const regPassword = window.getByTestId('register-password-input');
  const regConfirm = window.getByTestId('register-confirm-password-input');
  const regSubmit = window.getByTestId('register-submit-btn');

  await expect(regUsername).toBeVisible({ timeout: 15000 });
  await regUsername.fill(username);
  await regPassword.fill(password);
  await regConfirm.fill(password);
  await regSubmit.click();

  await waitForRoute(window, 'login');

  const loginUsername = window.getByTestId('login-username-input');
  const loginPassword = window.getByTestId('login-password-input');
  const loginSubmit = window.getByTestId('login-submit-btn');

  await expect(loginUsername).toBeVisible({ timeout: 15000 });
  await loginUsername.fill(username);
  await loginPassword.fill(password);
  await loginSubmit.click();

  await expect(window.locator('#host-section')).toBeVisible({ timeout: 20000 });
  await dismissJobResultModal(window);

  return { username, password };
}

async function login(window, username, password) {
  await waitForRoute(window, 'login');

  const loginUsername = window.getByTestId('login-username-input');
  const loginPassword = window.getByTestId('login-password-input');
  const loginSubmit = window.getByTestId('login-submit-btn');

  await expect(loginUsername).toBeVisible({ timeout: 15000 });
  await loginUsername.fill(username);
  await loginPassword.fill(password);
  await loginSubmit.click();

  await expect(window.locator('#host-section')).toBeVisible({ timeout: 20000 });
  await dismissJobResultModal(window);
}

module.exports = { registerAndLogin, login };
