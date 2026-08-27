const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { Given, When, Then, And, bddMeta, action } = require('../bdd');

test.describe('Feature: User Authentication & Login', () => {
  test('Scenario: Submitting an empty login form shows validation errors', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Identity & Access',
      feature: 'User Login',
      story: 'Form Validation',
    });

    const auth = new AuthPage(page);

    await Given('the user navigates to the login page', async () => {
      await action('Navigate to login page', () => auth.gotoLogin(), 'Could not navigate to the login page.');
    });

    await When('the user clicks the submit button with empty credentials', async () => {
      await action('Click Login button', () => auth.submitBtn.click(), 'Login button was not clickable or disabled.');
    });

    await Then('username required error message should be displayed', async () => {
      await action('Verify username required validation error is displayed', () => expect(page.getByText(/Username.*required/i)).toBeVisible(), 'Username required validation error was not displayed.');
    });

    await And('password required error message should be displayed', async () => {
      await action('Verify password required validation error is displayed', () => expect(page.getByText(/Password.*required/i)).toBeVisible(), 'Password required validation error was not displayed.');
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
      await action('Navigate to login page', () => auth.gotoLogin(), 'Could not navigate to the login page.');
    });

    await When('the user fills nonexistent username and wrong password', async () => {
      await action('Fill username: nonexistent_user_e2e', () => auth.usernameInput.fill('nonexistent_user_e2e'), 'Could not type into username input field.');
      await action('Fill password: ••••••••', () => auth.passwordInput.fill('wrong_password'), 'Could not type into password input field.');
    });

    await And('the user submits the login form', async () => {
      await action('Click Login button', () => auth.submitBtn.click(), 'Login button was not clickable or disabled.');
    });

    await Then('an authentication failure notification is displayed', async () => {
      await action('Verify authentication failure notification is displayed', () => expect(page.getByText(/Authentication Failed/i)).toBeVisible({ timeout: 10000 }), 'Authentication failure notification was not displayed.');
    });

    await And('the user remains on the login page', async () => {
      await action('Verify user remains on login page', () => expect(page).toHaveURL(/login/), 'User was unexpectedly redirected away from the login page.');
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
      await action('Navigate to login page', () => auth.gotoLogin(), 'Could not navigate to the login page.');
    });

    await When('the user enters valid credentials and submits', async () => {
      await action('Log in with username: ' + process.env.E2E_USERNAME + ' and password: ••••••••', () => auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD), 'Failed to log in with valid credentials.');
    });

    await Then('the user is redirected away from login to the dashboard', async () => {
      await action('Verify redirected to dashboard', () => expect(page).not.toHaveURL(/login/), 'Login did not redirect away from login page.');
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
      await action('Navigate to login page', () => auth.gotoLogin(), 'Could not navigate to the login page.');
      await action('Verify password input is masked (type="password")', () => expect(auth.passwordInput).toHaveAttribute('type', 'password'), 'Password input field is not masked by default.');
    });

    await When('the user clicks the password visibility toggle', async () => {
      await action('Click password visibility toggle', () => auth.passwordToggle.click(), 'Password visibility toggle button was not clickable.');
    });

    await Then('the password input field type changes to text (unmasked)', async () => {
      await action('Verify password input is unmasked (type="text")', () => expect(auth.passwordInput).toHaveAttribute('type', 'text'), 'Password input field did not switch to type="text".');
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
      await action('Navigate to login page', () => auth.gotoLogin(), 'Could not navigate to the login page.');
    });

    await When('the user clicks the create account link', async () => {
      await action('Click Create Account link', () => page.getByRole('link', { name: /Create Account|Sign Up|회원가입/i }).click(), 'Create Account link was not clickable.');
    });

    await Then('the browser navigates to the register route', async () => {
      await action('Verify redirected to register page', () => expect(page).toHaveURL(/register/), 'Browser did not navigate to the register page.');
    });
  });
});
