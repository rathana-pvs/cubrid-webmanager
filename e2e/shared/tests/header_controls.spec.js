const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

test.describe('Feature: Header Controls & System Actions', () => {
  test.beforeEach(async ({ appPage: page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);
  });

  test('Scenario: Help menu opens the real About dialog and closes it', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Application Controls',
      feature: 'Header Menu',
      story: 'About CUBRID Dialog',
    });

    let dialog;

    await Given('the user hovers over the Help menu trigger', async () => {
      await page.getByRole('button', { name: /Help/i }).hover();
    });

    await When('the user clicks About CUBRID Admin menu item', async () => {
      const aboutItem = page.getByRole('button', { name: /About CUBRID Admin/i });
      await expect(aboutItem).toBeVisible({ timeout: 5000 });
      await aboutItem.click({ force: true });
      dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
    });

    await Then('the About dialog renders application version information', async () => {
      await expect(dialog.getByText(/CUBRID Web Manager/i).first()).toBeVisible();
      await expect(dialog.getByText('12.4.0-STABLE')).toBeVisible();
    });

    await And('clicking Close dismisses the modal dialog', async () => {
      await dialog.getByRole('button', { name: 'Close', exact: true }).click();
      await expect(dialog).not.toBeVisible();
    });
  });

  test('Scenario: Language toggle changes the rendered menu locale and can restore English', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Application Controls',
      feature: 'Localization',
      story: 'Language Switcher (EN / KR)',
    });

    const english = page.getByRole('button', { name: 'EN', exact: true });
    const korean = page.getByRole('button', { name: 'KR', exact: true });

    await Given('the interface is initially displayed in English', async () => {
      await expect(english).toHaveAttribute('aria-pressed', 'true');
    });

    await When('the user clicks the KR button', async () => {
      await korean.click();
      await expect(korean).toHaveAttribute('aria-pressed', 'true');
    });

    await Then('navigation menus switch to Korean translation', async () => {
      await expect(page.getByRole('button', { name: /파일/ })).toBeVisible();
    });

    await And('clicking EN restores the English locale', async () => {
      await english.click();
      await expect(english).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByRole('button', { name: /File/ })).toBeVisible();
    });
  });

  test('Scenario: Logged in username opens the account profile dialog', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Application Controls',
      feature: 'User Profile',
      story: 'View Account Profile',
    });

    const username = process.env.E2E_USERNAME;
    let dialog;

    await Given('the logged-in username button is visible in header', async () => {
      const profileButton = page.getByRole('button', { name: new RegExp(username, 'i') });
      await expect(profileButton).toBeVisible();
      await profileButton.click();
    });

    await When('the user clicks the account profile trigger', async () => {
      dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
    });

    await Then('the Account Profile dialog displays the active username', async () => {
      await expect(dialog.getByText(username, { exact: true }).first()).toBeVisible();
      await expect(dialog.getByRole('heading', { name: /Account Profile|계정 프로필/i })).toBeVisible();
    });
  });
});
