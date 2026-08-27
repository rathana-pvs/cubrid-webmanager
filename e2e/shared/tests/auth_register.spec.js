const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { Given, When, Then, And, bddMeta, action } = require('../bdd');

test.describe('Feature: User Registration', () => {
  test('Scenario: Submitting empty registration form shows required field validation errors', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Identity & Access',
      feature: 'User Registration',
      story: 'Form Validation',
    });

    const auth = new AuthPage(page);

    await Given('the user navigates to the registration page', async () => {
      await action('Navigate to registration page', () => auth.gotoRegister(), 'Could not navigate to the registration page.');
    });

    await When('the user clicks submit without filling username or password', async () => {
      await action('Click submit button without filling fields', () => auth.registerSubmitBtn.click(), 'Register submit button was not clickable or disabled.');
    });

    await Then('username required error message should be displayed', async () => {
      await action('Verify username required validation error is displayed', () => expect(page.getByText(/Username.*required/i)).toBeVisible(), 'Username required validation error was not displayed.');
    });

    await And('password required error message should be displayed', async () => {
      await action('Verify password required validation error is displayed', () => expect(page.getByText(/Password.*required/i)).toBeVisible(), 'Password required validation error was not displayed.');
    });
  });

  test('Scenario: Password mismatch prevents registration and displays error', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Identity & Access',
      feature: 'User Registration',
      story: 'Password Confirmation',
    });

    const auth = new AuthPage(page);
    const username = `e2e_user_${Date.now()}`;

    await Given('the user is on the registration page', async () => {
      await action('Navigate to registration page', () => auth.gotoRegister(), 'Could not navigate to the registration page.');
    });

    await When('the user fills password and non-matching confirm password', async () => {
      await action('Fill username: ' + username, () => auth.registerUsernameInput.fill(username), 'Could not type into username input field.');
      await action('Fill password: ••••••••', () => auth.registerPasswordInput.fill('Password123!'), 'Could not type into password input field.');
      await action('Fill confirm password: •••••••• (mismatched)', () => auth.registerConfirmPasswordInput.fill('Password124!'), 'Could not type into confirm password input field.');
      await action('Click Register submit button', () => auth.registerSubmitBtn.click(), 'Register submit button was not clickable or disabled.');
    });

    await Then('a password mismatch error is displayed', async () => {
      await action('Verify password mismatch error is displayed', () => expect(page.getByText(/do not match|일치하지 않/i)).toBeVisible(), 'Password mismatch error was not displayed.');
    });

    await And('the user remains on the register page', async () => {
      await action('Verify user remains on register page', () => expect(page).toHaveURL(/register/), 'User was unexpectedly redirected away from register page.');
    });
  });

  test('Scenario: Successfully registering a new account redirects to login and allows logging in', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Identity & Access',
      feature: 'User Registration',
      story: 'Successful Account Creation',
    });

    const auth = new AuthPage(page);
    const username = `e2e_user_${Date.now()}`;
    const password = 'Password123!';

    await Given('the user fills in valid account credentials', async () => {
      await action('Register new user: ' + username + ' with password: ••••••••', () => auth.register(username, password), 'Failed to submit registration form.');
    });

    await When('the registration completes successfully', async () => {
      await action('Verify redirected to login page after registration', () => expect(page).toHaveURL(/login/), 'Did not redirect to login page after registration.');
    });

    await Then('the new user can successfully log in with their credentials', async () => {
      await action('Log in with new user: ' + username + ' and password: ••••••••', () => auth.login(username, password), 'Failed to log in with newly registered credentials.');
      await action('Verify redirected away from login to dashboard', () => expect(page).not.toHaveURL(/login/), 'New user login did not redirect away from login page.');
    });
  });

  test('Scenario: Registering with an already existing username shows duplicate error', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Identity & Access',
      feature: 'User Registration',
      story: 'Duplicate Username Prevention',
    });

    const auth = new AuthPage(page);
    const username = `e2e_dup_${Date.now()}`;
    const password = 'Password123!';

    await Given('an existing user account is already created', async () => {
      await action('Register initial user account: ' + username, () => auth.register(username, password), 'Failed to register initial user account.');
      await action('Verify initial registration redirected to login page', () => expect(page).toHaveURL(/login/), 'Initial registration did not redirect to login page.');
    });

    await When('another registration attempt uses the exact same username', async () => {
      await action('Attempt registration with duplicate username: ' + username, () => auth.register(username, password), 'Failed to submit duplicate registration form.');
    });

    await Then('an already exists error is displayed and user remains on register page', async () => {
      await action('Verify duplicate username error is displayed', () => expect(page.getByText(/already exists|이미 존재/i)).toBeVisible({ timeout: 10000 }), 'Duplicate username error was not displayed.');
      await action('Verify user remains on register page', () => expect(page).toHaveURL(/register/), 'User was unexpectedly redirected away from register page.');
    });
  });

  test('Scenario: Password complexity rule violations are validated inline without server roundtrip', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Identity & Access',
      feature: 'User Registration',
      story: 'Password Complexity Rules',
    });

    const auth = new AuthPage(page);

    await Given('the user tests weak passwords (under 8 chars, letters only, numbers only)', async () => {
      for (const badPassword of ['short1', 'onlyletters', '12345678']) {
        const testUser = `e2e_weak_${Date.now()}`;
        await action('Navigate to registration page', () => auth.gotoRegister(), 'Could not navigate to the registration page.');
        await action('Fill username: ' + testUser, () => auth.registerUsernameInput.fill(testUser), 'Could not type into username input field.');
        await action('Fill weak password: •••••••• (' + badPassword + ')', () => auth.registerPasswordInput.fill(badPassword), 'Could not type into password input field.');
        await action('Fill confirm password: •••••••• (' + badPassword + ')', () => auth.registerConfirmPasswordInput.fill(badPassword), 'Could not type into confirm password input field.');
        await action('Click Register submit button', () => auth.registerSubmitBtn.click(), 'Register submit button was not clickable or disabled.');

        await action('Verify password complexity validation message is displayed', () => expect(page.getByText('At least 8 characters, including a letter and a number')).toBeVisible(), 'Password complexity error message was not displayed for password: ' + badPassword);
        await action('Verify user remains on register page', () => expect(page).toHaveURL(/register/), 'User was unexpectedly navigated away from register page for password: ' + badPassword);
      }
    });

    await Then('the client enforces password complexity policy directly', async () => {
      await action('Verify user remains on register page after weak password attempts', () => expect(page).toHaveURL(/register/), 'User did not remain on register page.');
    });
  });
});
