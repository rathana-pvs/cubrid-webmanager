const { test, expect } = require('@playwright/test');

/**
 * Modernized UI Branding Test Suite
 * Verifies that logos, color schemes, and premium design elements are correctly displayed across pages.
 */
test.describe('Modernized UI Branding', () => {

  test('should show correct branding and logo on Login Page', async ({ page }) => {
    await page.goto('/');
    
    // 1. Core Branding
    await expect(page.getByText('CUBRID', { exact: true })).toBeVisible();
    await expect(page.getByText('Web Manager', { exact: true })).toBeVisible();
    
    // 2. Logo check
    const logoImg = page.getByAltText(/CUBRID Logo/i);
    await expect(logoImg).toBeVisible();
    
    // 3. Modernized footer/credits
    await expect(page.getByText(/Powered by CUBRID/i).or(page.getByText(/All rights reserved/i))).toBeVisible();
  });

  test('should verify Dark/Light mode toggle works in Dashboard', async ({ page }) => {
    // 1. Initial Login
    await page.goto('/');
    await page.getByPlaceholder(/Enter username/i).fill(process.env.E2E_USERNAME);
    await page.getByPlaceholder(/••••••••/).fill(process.env.E2E_PASSWORD);
    await page.getByRole('button', { name: /Authorize Access/i }).click();

    // 2. Find Dark/Light toggle (usually a sun/moon icon)
    const toggleBtn = page.locator('button:has-text("dark_mode"), button:has-text("light_mode")').first();
    await expect(toggleBtn).toBeVisible();

    // 3. Initial check for theme class on <html>
    const isInitiallyDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));

    // 4. Toggle it
    await toggleBtn.click();
    
    // 5. Verify transition
    const isNowDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isNowDark).not.toBe(isInitiallyDark);
    
    // 6. Color check (verify premium colors are used)
    // Dark mode often uses bg-bk-main or similar
    if (isNowDark) {
        const bgColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
        // Add specific color assertions if needed (e.g. hex #121212)
    }
  });

  test('should check for consistent sidebar design tokens', async ({ page }) => {
    // 1. Inspect Sidebar after login
    await page.goto('/');
    await page.getByPlaceholder(/Enter username/i).fill(process.env.E2E_USERNAME);
    await page.getByPlaceholder(/••••••••/).fill(process.env.E2E_PASSWORD);
    await page.getByRole('button', { name: /Authorize Access/i }).click();
    
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toBeVisible();

    // 2. Check for Sidebar Header Branding
    await expect(sidebar.getByText('Admin')).toBeVisible();
    await expect(sidebar.getByText('Manager Console')).toBeVisible();
    
    // 3. Verify Sidebar resizability (SplitPane handle exists)
    const resizeHandle = page.locator('.Resizer.horizontal, .Resizer.vertical').first();
    await expect(resizeHandle).toBeVisible();
  });

});
