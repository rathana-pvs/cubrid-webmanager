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
 */
async function dismissJobResultModal(page) {
  const modal = page.getByTestId('job-result-modal');
  if (await modal.isVisible({ timeout: 1000 }).catch(() => false)) {
    await page.getByTestId('job-result-modal-close').click().catch(() => {});
    await modal.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  }
}

module.exports = { dismissJobResultModal };
