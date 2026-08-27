const { test } = require('@playwright/test');

/**
 * CmsJobProvider (app-wide, mounted at the root) polls the server for the
 * current user's active background jobs on every authenticated page load,
 * and pops a global "job-result" success/error modal whenever one finishes
 * — even if it was started from a completely different test file/session.
 * A spec that abandons a real long-running job (e.g. database_rename_copy's
 * copy test) can cause this modal to surface unpredictably in a *later*
 * spec and block its clicks ("intercepts pointer events"). Call this
 * defensively before any host/db tree interaction that a stray modal could
 * block.
 *
 * If the stray modal reports a FAILURE, that's a real backend error from
 * somewhere — dismissing it to unblock the current test is still correct
 * (attributing it to whichever spec happens to be running next would be
 * wrong), but it must never disappear without a trace. Log it and attach it
 * to the current test's annotations rather than silently discarding it.
 */
async function dismissJobResultModal(page) {
  const loadingOverlay = page.getByTestId('loading-overlay');
  if (await loadingOverlay.isVisible({ timeout: 200 }).catch(() => false)) {
    await loadingOverlay.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => undefined);
  }

  const modal = page.getByTestId('job-result-modal');
  if (await modal.first().isVisible({ timeout: 500 }).catch(() => false)) {
    const failed = await modal.first().getByText(/failed|실패/i).first().isVisible().catch(() => false);
    if (failed) {
      const text = await modal.first().innerText().catch(() => '(unable to read modal text)');
      console.error(`[dismissJobResultModal] dismissing a FAILED background job (likely stray from an earlier spec):\n${text}`);
      test.info().annotations.push({ type: 'stray-job-failure', description: text.slice(0, 300) });
    }
    const closeBtn = modal.first().getByRole('button', { name: /Dismiss|Close|닫기|OK|확인/i }).last();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click({ force: true }).catch(() => undefined);
    } else {
      await modal.first().getByRole('button').first().click({ force: true }).catch(() => undefined);
    }
    await modal.first().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => undefined);
  }

  const statusModal = page.getByTestId('status-modal');
  if (await statusModal.first().isVisible({ timeout: 500 }).catch(() => false)) {
    await page.getByTestId('status-modal-close-btn').click({ force: true }).catch(() => undefined);
    await statusModal.first().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => undefined);
  }

  const anyDialog = page.getByRole('dialog');
  if (await anyDialog.first().isVisible({ timeout: 300 }).catch(() => false)) {
    const btn = anyDialog.first().getByRole('button', { name: /OK|확인|Close|Dismiss|닫기|Cancel|취소/i }).last();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click({ force: true }).catch(() => undefined);
    } else {
      await anyDialog.first().getByRole('button').first().click({ force: true }).catch(() => undefined);
    }
    await anyDialog.first().waitFor({ state: 'hidden', timeout: 3000 }).catch(() => undefined);
  }
}

module.exports = { dismissJobResultModal };
