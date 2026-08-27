const { test } = require('@playwright/test');

/**
 * Wraps a single UI interaction as a named, human-readable test step.
 *
 * @param {string} label      What you are doing — shown as a step name in reports.
 * @param {Function} fn       The Playwright action or assertion to run.
 * @param {string} [onFailure] Plain-English explanation of what this failure means.
 *                             Shown as the headline of the error in the report.
 *                             If omitted, the raw Playwright error is shown as-is.
 */
async function action(label, fn, onFailure) {
  return await test.step(label, async () => {
    try {
      return await fn();
    } catch (err) {
      if (!onFailure || err.name === 'TestSkipError' || (err.message && err.message.includes('Test was skipped:')) || err.name === 'SkipError') throw err;
      const human = `${onFailure}\n\n[Technical] ${err.message}`;
      const enhancedError = new Error(human);
      enhancedError.stack = err.stack;
      throw enhancedError;
    }
  }, { box: true });
}

module.exports = { action };
