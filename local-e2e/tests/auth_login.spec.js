const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');

test.describe('Login', () => {
  test('빈 폼으로 제출하면 필수 항목 오류가 표시된다', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await auth.submitBtn.click();

    await expect(page.getByText(/Username.*required/i)).toBeVisible();
    await expect(page.getByText(/Password.*required/i)).toBeVisible();
  });

  test('잘못된 자격증명으로 로그인하면 인증 실패 메시지가 표시된다', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await auth.usernameInput.fill('nonexistent_user_e2e');
    await auth.passwordInput.fill('wrong_password');
    await auth.submitBtn.click();

    await expect(page.getByText(/Authentication Failed/i)).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/login/);
  });

  test('올바른 자격증명으로 로그인하면 대시보드로 이동한다', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);
    await expect(page).not.toHaveURL(/login/);
  });

  test('비밀번호 표시 토글이 입력 타입을 전환한다', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await expect(auth.passwordInput).toHaveAttribute('type', 'password');
    await auth.passwordToggle.click();
    await expect(auth.passwordInput).toHaveAttribute('type', 'text');
  });

  test('회원가입 링크를 클릭하면 회원가입 페이지로 이동한다', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoLogin();
    await page.getByRole('link', { name: /Create Account|Sign Up|회원가입/i }).click();
    await expect(page).toHaveURL(/register/);
  });
});
