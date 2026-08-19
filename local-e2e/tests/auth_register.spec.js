const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');

test.describe('Register', () => {
  test('빈 폼으로 제출하면 필수 항목 오류가 표시된다', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoRegister();
    await auth.registerSubmitBtn.click();

    await expect(page.getByText(/Username.*required/i)).toBeVisible();
    await expect(page.getByText(/Password.*required/i)).toBeVisible();
  });

  test('비밀번호와 확인 비밀번호가 다르면 오류가 표시되고 제출되지 않는다', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoRegister();
    await auth.registerUsernameInput.fill(`e2e_user_${Date.now()}`);
    await auth.registerPasswordInput.fill('Password123!');
    await auth.registerConfirmPasswordInput.fill('Password124!');
    await auth.registerSubmitBtn.click();

    await expect(page.getByText(/do not match|일치하지 않/i)).toBeVisible();
    await expect(page).toHaveURL(/register/);
  });

  test('새 계정을 생성하면 로그인 페이지로 이동하고, 그 계정으로 로그인할 수 있다', async ({ page }) => {
    const auth = new AuthPage(page);
    const username = `e2e_user_${Date.now()}`;
    const password = 'Password123!';

    await auth.register(username, password);
    await expect(page).toHaveURL(/login/);

    await auth.login(username, password);
    await expect(page).not.toHaveURL(/login/);
  });

  test('이미 존재하는 사용자명으로 가입하면 오류가 표시된다', async ({ page }) => {
    const auth = new AuthPage(page);
    const username = `e2e_dup_${Date.now()}`;
    const password = 'Password123!';

    await auth.register(username, password);
    await expect(page).toHaveURL(/login/);

    await auth.register(username, password);
    await expect(page.getByText(/already exists|이미 존재/i)).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/register/);
  });

  // Regression test: the client-side check used to only require 6+ chars,
  // while the server (passwordValidityChecker) requires 8+ chars with both a
  // letter and a digit — a password like "abcdefgh" passed here but was then
  // rejected after a round trip to the server. Client validation now mirrors
  // the real policy so this is caught inline instead.
  test('정책에 맞지 않는 비밀번호(문자만/숫자만/8자 미만)는 서버 왕복 없이 즉시 오류가 표시된다', async ({ page }) => {
    const auth = new AuthPage(page);

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
});
