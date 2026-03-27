const { test, expect } = require('@playwright/test');

/**
 * Broker Management Test Suite
 * Verifies that all brokers appear and and their status can be toggled.
 */
test.describe('Broker Management', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder(/Enter username/i).fill(process.env.E2E_USERNAME);
    await page.getByPlaceholder(/••••••••/).fill(process.env.E2E_PASSWORD);
    await page.getByRole('button', { name: /Authorize Access/i }).click();
    
    // Select host
    await page.locator('#host-section div[title*=":"]').first().click();

    // Switch to Broker Tab
    await page.locator('#tree-section-container').getByRole('button', { name: /Broker/i }).click();
    await expect(page.getByText('Brokers', { exact: true })).toBeVisible();
  });

  test('should show broker list and toggle a broker', async ({ page }) => {
    // 1. Check for standard brokers (usually 'query_editor' or 'broker1')
    const brokerNode = page.locator('#db-tree-container').locator('div').filter({ hasText: /^query_editor$|^broker1$/ }).first();
    const brokerName = await brokerNode.innerText();

    // 2. Initial Status check
    const statusText = await brokerNode.locator('span.inline-flex').innerText();
    const isOn = statusText.includes('On');

    // 3. Right-Click to toggle
    await brokerNode.click({ button: 'right' });
    const toggleAction = isOn ? /Stop Broker/i : /Start Broker/i;
    await page.getByRole('button', { name: toggleAction }).click();

    // 4. Verify status changed within timeout (may take a few seconds)
    const oppositeStatus = isOn ? 'Off' : 'On';
    await expect(brokerNode.locator('span.inline-flex')).toContainText(oppositeStatus, { timeout: 10000 });
  });

  test('should open Broker Properties modal', async ({ page }) => {
    const brokerNode = page.locator('#db-tree-container').locator('div').filter({ hasText: /^query_editor$|^broker1$/ }).first();
    await brokerNode.click({ button: 'right' });
    
    await page.getByRole('button', { name: /Properties/i }).click();
    // Assuming a modal with "Broker parameters" or similar title
    await expect(page.getByText(/Properties/i).or(page.getByText(/Parameters/i))).toBeVisible();
  });

});
