const { test, expect } = require('@playwright/test');

/**
 * Authentication Test Suite
 * Covers the critical login flow, validation, and session persistence.
 */
test.describe('Authentication Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Always start at the login page
    await page.goto('/');
  });

  test('should reject invalid credentials and show error overlay', async ({ page }) => {
    // Fill in incorrect details
    await page.getByPlaceholder(/Enter username/i).fill('invalid_user');
    await page.getByPlaceholder(/••••••••/).fill('wrong_password');
    
    // Click Authorize
    const loginBtn = page.getByRole('button', { name: /Authorize Access/i });
    await loginBtn.click();

    // Check for error feedback (based on our modern UI feedback loop)
    // The API should return a 401/403 which our LoginPage.jsx displays
    const errorMsg = page.getByText(/Login failed/i).or(page.getByText(/Invalid/i));
    await expect(errorMsg).toBeVisible();
  });

  test('should successfully log in with valid credentials', async ({ page }) => {
    // NOTE: Loaded from local-e2e/.env
    const username = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;

    if (!username || !password) {
      throw new Error('E2E_USERNAME or E2E_PASSWORD not found in environment');
    }

    await page.getByPlaceholder(/Enter username/i).fill(username);
    await page.getByPlaceholder(/••••••••/).fill(password);
    
    await page.getByRole('button', { name: /Authorize Access/i }).click();

    // 1. Verify URL redirection
    await expect(page).not.toHaveURL(/login/);

    // 2. Verify dashboard elements (Logout button in header confirms authentication)
    const logoutBtn = page.getByTitle(/Logout/i).or(page.locator('button:has-text("logout")'));
    await expect(logoutBtn).toBeVisible();
  });

  test('should persist session on page refresh', async ({ page }) => {
    // Log in first
    await page.getByPlaceholder(/Enter username/i).fill(process.env.E2E_USERNAME);
    await page.getByPlaceholder(/••••••••/).fill(process.env.E2E_PASSWORD);
    await page.getByRole('button', { name: /Authorize Access/i }).click();
    
    // Wait for dashboard (Logout button)
    await expect(page.getByTitle(/Logout/i)).toBeVisible();

    // Reload the page
    await page.reload();

    // Still should be on dashboard
    await expect(page.getByTitle(/Logout/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Enter username/i)).not.toBeVisible();
  });

  test('should successfully log out', async ({ page }) => {
    // Log in
    await page.getByPlaceholder(/Enter username/i).fill(process.env.E2E_USERNAME);
    await page.getByPlaceholder(/••••••••/).fill(process.env.E2E_PASSWORD);
    await page.getByRole('button', { name: /Authorize Access/i }).click();
    
    // Find logout button specifically by its title/icon class
    const logoutBtn = page.getByTitle(/Logout/i);
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();
    
    // Verify redirection back to login
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });
});

