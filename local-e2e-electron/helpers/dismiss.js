/**
 * Dismisses global job-result success/error modal if popped by background CMS jobs.
 */
async function dismissJobResultModal(window) {
  try {
    const modal = window.getByTestId('job-result-modal');
    if (await modal.isVisible({ timeout: 1000 }).catch(() => false)) {
      await window.getByTestId('job-result-modal-close').click().catch(() => {});
      await modal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    }
  } catch {
    // Ignore modal dismissal errors
  }
}

module.exports = { dismissJobResultModal };
