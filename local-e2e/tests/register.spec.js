const { test, expect } = require('@playwright/test');

/**
 * Registration Test Suite
 */
test.describe('Account Registration', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to registration page via login link
    await page.goto('/');
    const registerLink = page.getByRole('link', { name: /Create Account/i });
    await registerLink.click();
    await expect(page).toHaveURL(/register/);
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /Create Account/i });
    await submitBtn.click();

    await expect(page.getByText(/Username is required/i)).toBeVisible();
    await expect(page.getByText(/Password is required/i)).toBeVisible();
  });

  test('should show error for short username or password', async ({ page }) => {
    await page.getByPlaceholder(/unique username/i).fill('ab');
    await page.getByPlaceholder(/strong password/i).fill('123');
    await page.getByPlaceholder(/Repeat your password/i).fill('123');
    
    const submitBtn = page.getByRole('button', { name: /Create Account/i });
    await submitBtn.click();

    await expect(page.getByText(/At least 3 characters/i)).toBeVisible();
    await expect(page.getByText(/At least 6 characters/i)).toBeVisible();
  });

  test('should show error for password mismatch', async ({ page }) => {
    await page.getByPlaceholder(/unique username/i).fill('tester');
    await page.getByPlaceholder(/strong password/i).fill('password123');
    await page.getByPlaceholder(/Repeat your password/i).fill('password456');
    
    const submitBtn = page.getByRole('button', { name: /Create Account/i });
    await submitBtn.click();

    await expect(page.getByText(/Passwords do not match/i)).toBeVisible();
  });

  test('should successfully register a new unique account', async ({ page }) => {
    const uniqueId = Date.now().toString().slice(-6);
    const testUser = `user_${uniqueId}`;
    const testPass = 'Password123!';

    await page.getByPlaceholder(/unique username/i).fill(testUser);
    await page.getByPlaceholder(/strong password/i).fill(testPass);
    await page.getByPlaceholder(/Repeat your password/i).fill(testPass);

    // Verify password strength meter reflects "Good" or "Strong"
    const strengthLabel = page.locator('p:has-text("Good"), p:has-text("Strong")');
    await expect(strengthLabel).toBeVisible();

    // Submit registration
    const submitBtn = page.getByRole('button', { name: /Create Account/i });
    await submitBtn.click();

    // After success, should redirect to login
    await expect(page).toHaveURL(/login/);

    // Verify we can now log in with this new account
    await page.getByPlaceholder(/Enter username/i).fill(testUser);
    await page.getByPlaceholder(/••••••••/).fill(testPass);
    await page.getByRole('button', { name: /Authorize Access/i }).click();

    // Verify successful login (Logout button visible)
    await expect(page.getByTitle(/Logout/i)).toBeVisible();
  });

  test('should show error if username is already taken', async ({ page }) => {
    // Assuming 'admin' or our existing user already exists
    const existingUser = 'rathana12'; 
    
    await page.getByPlaceholder(/unique username/i).fill(existingUser);
    await page.getByPlaceholder(/strong password/i).fill('Password123!');
    await page.getByPlaceholder(/Repeat your password/i).fill('Password123!');
    
    const submitBtn = page.getByRole('button', { name: /Create Account/i });
    await submitBtn.click();

    // Should show API error overlay
    // The exact message depends on backend, but we check for general failure
    const errorMsg = page.getByText(/failed/i).or(page.getByText(/already exists/i));
    await expect(errorMsg).toBeVisible();
  });

});
