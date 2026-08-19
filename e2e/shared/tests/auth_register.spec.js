const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

test.describe('Feature: User Registration', () => {
  test('Scenario: Submitting empty registration form shows required field validation errors', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Identity & Access',
      feature: 'User Registration',
      story: 'Form Validation',
    });

    const auth = new AuthPage(page);

    await Given('the user navigates to the registration page', async () => {
      await auth.gotoRegister();
    });

    await When('the user clicks submit without filling username or password', async () => {
      await auth.registerSubmitBtn.click();
    });

    await Then('username required error message should be displayed', async () => {
      await expect(page.getByText(/Username.*required/i)).toBeVisible();
    });

    await And('password required error message should be displayed', async () => {
      await expect(page.getByText(/Password.*required/i)).toBeVisible();
    });
  });

  test('Scenario: Password mismatch prevents registration and displays error', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Identity & Access',
      feature: 'User Registration',
      story: 'Password Confirmation',
    });

    const auth = new AuthPage(page);

    await Given('the user is on the registration page', async () => {
      await auth.gotoRegister();
    });

    await When('the user fills password and non-matching confirm password', async () => {
      await auth.registerUsernameInput.fill(`e2e_user_${Date.now()}`);
      await auth.registerPasswordInput.fill('Password123!');
      await auth.registerConfirmPasswordInput.fill('Password124!');
      await auth.registerSubmitBtn.click();
    });

    await Then('a password mismatch error is displayed', async () => {
      await expect(page.getByText(/do not match|일치하지 않/i)).toBeVisible();
    });

    await And('the user remains on the register page', async () => {
      await expect(page).toHaveURL(/register/);
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
      await auth.register(username, password);
    });

    await When('the registration completes successfully', async () => {
      await expect(page).toHaveURL(/login/);
    });

    await Then('the new user can successfully log in with their credentials', async () => {
      await auth.login(username, password);
      await expect(page).not.toHaveURL(/login/);
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
      await auth.register(username, password);
      await expect(page).toHaveURL(/login/);
    });

    await When('another registration attempt uses the exact same username', async () => {
      await auth.register(username, password);
    });

    await Then('an already exists error is displayed and user remains on register page', async () => {
      await expect(page.getByText(/already exists|이미 존재/i)).toBeVisible({ timeout: 10000 });
      await expect(page).toHaveURL(/register/);
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
        await auth.gotoRegister();
        await auth.registerUsernameInput.fill(`e2e_weak_${Date.now()}`);
        await auth.registerPasswordInput.fill(badPassword);
        await auth.registerConfirmPasswordInput.fill(badPassword);
        await auth.registerSubmitBtn.click();

        await expect(page.getByText('At least 8 characters, including a letter and a number')).toBeVisible();
        await expect(page).toHaveURL(/register/);
      }
    });

    await Then('the client enforces password complexity policy directly', async () => {
      await expect(page).toHaveURL(/register/);
    });
  });
});
