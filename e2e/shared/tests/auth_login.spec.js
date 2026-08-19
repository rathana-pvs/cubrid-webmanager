const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

test.describe('Feature: User Authentication & Login', () => {
  test('Scenario: Submitting an empty login form shows validation errors', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Identity & Access',
      feature: 'User Login',
      story: 'Form Validation',
    });

    const auth = new AuthPage(page);

    await Given('the user navigates to the login page', async () => {
      await auth.gotoLogin();
    });

    await When('the user clicks the submit button with empty credentials', async () => {
      await auth.submitBtn.click();
    });

    await Then('username required error message should be displayed', async () => {
      await expect(page.getByText(/Username.*required/i)).toBeVisible();
    });

    await And('password required error message should be displayed', async () => {
      await expect(page.getByText(/Password.*required/i)).toBeVisible();
    });
  });

  test('Scenario: Attempting login with incorrect credentials shows authentication failure', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Identity & Access',
      feature: 'User Login',
      story: 'Invalid Credentials',
    });

    const auth = new AuthPage(page);

    await Given('the user is on the login page', async () => {
      await auth.gotoLogin();
    });

    await When('the user fills nonexistent username and wrong password', async () => {
      await auth.usernameInput.fill('nonexistent_user_e2e');
      await auth.passwordInput.fill('wrong_password');
    });

    await And('the user submits the login form', async () => {
      await auth.submitBtn.click();
    });

    await Then('an authentication failure notification is displayed', async () => {
      await expect(page.getByText(/Authentication Failed/i)).toBeVisible({ timeout: 10000 });
    });

    await And('the user remains on the login page', async () => {
      await expect(page).toHaveURL(/login/);
    });
  });

  test('Scenario: Successful login with valid credentials redirects to dashboard', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Identity & Access',
      feature: 'User Login',
      story: 'Happy Path Login',
    });

    const auth = new AuthPage(page);

    await Given('the user is on the login page', async () => {
      await auth.gotoLogin();
    });

    await When('the user enters valid credentials and submits', async () => {
      await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);
    });

    await Then('the user is redirected away from login to the dashboard', async () => {
      await expect(page).not.toHaveURL(/login/);
    });
  });

  test('Scenario: Toggling password visibility switches input field type', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Identity & Access',
      feature: 'User Login',
      story: 'Password Visibility Toggle',
    });

    const auth = new AuthPage(page);

    await Given('the user is on the login page with default password field masked', async () => {
      await auth.gotoLogin();
      await expect(auth.passwordInput).toHaveAttribute('type', 'password');
    });

    await When('the user clicks the password visibility toggle', async () => {
      await auth.passwordToggle.click();
    });

    await Then('the password input field type changes to text (unmasked)', async () => {
      await expect(auth.passwordInput).toHaveAttribute('type', 'text');
    });
  });

  test('Scenario: Clicking registration link navigates to register page', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Identity & Access',
      feature: 'User Login',
      story: 'Navigation to Register',
    });

    const auth = new AuthPage(page);

    await Given('the user is on the login page', async () => {
      await auth.gotoLogin();
    });

    await When('the user clicks the create account link', async () => {
      await page.getByRole('link', { name: /Create Account|Sign Up|회원가입/i }).click();
    });

    await Then('the browser navigates to the register route', async () => {
      await expect(page).toHaveURL(/register/);
    });
  });
});
