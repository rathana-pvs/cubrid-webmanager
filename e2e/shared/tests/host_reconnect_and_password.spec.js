const { test, expect } = require('../fixture');
const { AuthPage } = require('../pages/AuthPage');
const { HostTreePage } = require('../pages/HostTreePage');
const { DatabaseTreePage } = require('../pages/DatabaseTreePage');
const { Given, When, Then, And, bddMeta } = require('../bdd');

const E2E_HOST_ADDRESS = process.env.E2E_HOST_ADDRESS || 'localhost';
const E2E_HOST_PORT = process.env.E2E_HOST_PORT || '8001';
const ORIGINAL_PASSWORD = process.env.E2E_HOST_PASSWORD;

// Fixed on purpose (not timestamp-generated): if this test dies mid-run
// before the restore below completes, the real host is left on whatever the
// temp password was. A fixed, known constant means recovery is just "log in
// with this exact string" — no guessing, no lost value. Do not make this
// dynamic again.
const TEMP_PASSWORD = 'E2eTempPass_Fixed01';

// Changing the real CMS passcode invalidates the current session token,
// which reliably triggers ReconnectHostModal ("Connection Lost") as a side
// effect — so this spec covers both halves of the feature: the passcode
// change itself (distinct from host_edit.spec.js's local-only "Edit Host"
// alias/save flow) and the reconnect prompt it provokes.
//
// This changes the REAL host password that every other spec in this suite
// depends on. The restore-to-original step runs in a `finally` block so it
// executes even if an assertion above it throws — never skip or remove that.
test.describe('Feature: Host Change Password & Reconnect', () => {
  let hostTree;
  let hostUid;

  test.beforeEach(async ({ appPage: page }) => {
    const auth = new AuthPage(page);
    await auth.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);

    hostTree = new HostTreePage(page);
    const host = hostTree.hostRowByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await expect(host).toBeVisible({ timeout: 10000 });
    hostUid = await hostTree.getUidByConnection(E2E_HOST_ADDRESS, E2E_HOST_PORT);
    await hostTree.activateHost(hostUid);
  });

  const dismissReconnectIfPresent = async (page) => {
    const reconnectModal = page.getByTestId('reconnect-host-modal');
    if (await reconnectModal.isVisible({ timeout: 5000 }).catch(() => false)) {
      await page.getByTestId('reconnect-host-reconnect-btn').click();
      await expect(reconnectModal).not.toBeVisible({ timeout: 15000 });
    }
  };

  // The passcode change invalidates the current session token, which can
  // provoke ReconnectHostModal — sometimes more than once, and sometimes
  // *while* the change-password success screen is still showing (it's a
  // separate global modal, rendered later in the DOM, so it sits on top and
  // intercepts pointer events until dismissed). Loop rather than a single
  // check-then-proceed: this step changes the REAL host's passcode, so it
  // must not give up and leave it stuck on a temp value.
  const settleAfterPasswordChange = async (page, modal) => {
    const reconnectModal = page.getByTestId('reconnect-host-modal');
    const closeBtn = page.getByTestId('change-host-password-close-btn');
    for (let i = 0; i < 10; i++) {
      if (await reconnectModal.isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.getByTestId('reconnect-host-reconnect-btn').click().catch(() => undefined);
        await page.waitForTimeout(1000);
        continue;
      }
      if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await closeBtn.click().catch(() => undefined);
        await page.waitForTimeout(1000);
        continue;
      }
      break;
    }
    await expect(modal).not.toBeVisible({ timeout: 10000 });
  };

  const changePasswordTo = async (page, newPassword) => {
    // A prior action's session-invalidation reconnect prompt can still be
    // up (it appears asynchronously, sometimes after a short delay) and
    // would otherwise block the right-click below.
    await dismissReconnectIfPresent(page);
    await hostTree.openHostContextMenu(hostUid);
    await page.getByRole('button', { name: 'Change Password' }).click();

    const modal = page.getByTestId('change-host-password-modal');
    await expect(modal).toBeVisible({ timeout: 10000 });
    await page.getByTestId('change-host-password-new-input').fill(newPassword);
    await page.getByTestId('change-host-password-confirm-input').fill(newPassword);
    await page.getByTestId('change-host-password-submit-btn').click();

    const reconnectModal = page.getByTestId('reconnect-host-modal');
    await Promise.race([
      page.getByText('Passcode Updated').waitFor({ state: 'visible', timeout: 30000 }),
      reconnectModal.waitFor({ state: 'visible', timeout: 30000 }),
    ]);

    await settleAfterPasswordChange(page, modal);
    await dismissReconnectIfPresent(page);
  };

  test('Scenario: Changing host CMS password succeeds and restoring original password maintains authorized session', async ({ appPage: page }) => {
    await bddMeta({
      epic: 'Host Management',
      feature: 'Host Security & Authentication',
      story: 'Change Host CMS Password and Reconnect',
      severity: 'blocker',
    });

    // The real host has occasionally taken well over a minute per passcode
    // change under load (observed up to ~2min) — generous budget on purpose.
    test.setTimeout(240000);

    await Given('the host is connected and authorized in the tree', async () => {
      await expect(page.locator('#db-tree-container')).toHaveAttribute('data-authorized', 'true', { timeout: 20000 });
    });

    await When('the user changes the host passcode to a temporary value', async () => {
      try {
        await changePasswordTo(page, TEMP_PASSWORD);
        await expect(page.locator('#db-tree-container')).toHaveAttribute('data-authorized', 'true', { timeout: 20000 });
      } finally {
        await changePasswordTo(page, ORIGINAL_PASSWORD);
      }
    });

    await Then('the original passcode is restored and the host session remains authorized', async () => {
      await expect(page.locator('#db-tree-container')).toHaveAttribute('data-authorized', 'true', { timeout: 20000 });
    });
  });
});
