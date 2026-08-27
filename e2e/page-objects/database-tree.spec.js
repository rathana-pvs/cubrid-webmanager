const { test, expect } = require('@playwright/test');
const { DatabaseTreePage } = require('../shared/pages/DatabaseTreePage');

async function installDatabase(page, { savedProfile = true, delay = 0 } = {}) {
  await page.route('http://page-object.test/', route => route.fulfill({
    contentType: 'text/html',
    body: '<details data-testid="tree-node-demodb"><summary>demodb</summary></details>',
  }));
  await page.goto('http://page-object.test/');
  await page.evaluate(({ savedProfile, delay }) => {
    window.activations = 0;
    let loggedIn = false;
    const showTab = () => document.body.insertAdjacentHTML('beforeend',
      '<div data-testid="tab-db:host:demodb">Dashboard</div>');
    document.querySelector('summary').addEventListener('dblclick', () => {
      window.activations += 1;
      if (loggedIn) return showTab();
      setTimeout(() => {
        if (savedProfile) return showTab();
        const modal = document.createElement('div');
        modal.setAttribute('role', 'dialog');
        modal.dataset.testid = 'login-database-modal';
        modal.innerHTML = '<h4>Login Database</h4><input disabled value="demodb"><input><input type="password"><button data-testid="login-database-submit-btn">OK</button>';
        document.body.appendChild(modal);
        modal.querySelector('button').onclick = async () => {
          // Real LoginDatabaseModal removes the form test ID while loading.
          delete modal.dataset.testid;
          modal.innerHTML = '<h4>Login Database</h4><p>Loading</p>';
          const response = await fetch('/api/host/database/users/login/demodb', { method: 'POST' });
          if (!response.ok) {
            modal.innerHTML = '<h4>Login Database</h4><p>Login failed</p>';
            return;
          }
          loggedIn = true;
          modal.innerHTML = '<h4>Login Database</h4><p>Success</p>';
          setTimeout(() => modal.remove(), 800);
        };
      }, delay);
    });
  }, { savedProfile, delay });
  return new DatabaseTreePage(page);
}

for (const delay of [0, 16000]) {
  test(`waits for saved-profile activation (${delay}ms) without another double-click`, async ({ page }) => {
    const tree = await installDatabase(page, { delay });
    await tree.openDashboardTab('demodb', 'host');
    expect(await page.evaluate(() => window.activations)).toBe(1);
  });
}

test('handles a delayed credential prompt and waits for the login response before reactivating', async ({ page }) => {
  const tree = await installDatabase(page, { savedProfile: false, delay: 300 });
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  await page.route('**/database/users/login/demodb', async route => {
    await pending;
    await route.fulfill({ json: { success: true } });
  });
  const opening = tree.openDashboardTab('demodb', 'host');
  // Observe the loading state, in which the old helper immediately reactivated.
  await expect(page.getByText('Loading', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.activations)).toBe(1);
  release();
  await opening;
  expect(await page.evaluate(() => window.activations)).toBe(2);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('reports a rejected credential login without retrying it', async ({ page }) => {
  const tree = await installDatabase(page, { savedProfile: false, delay: 300 });
  let requests = 0;
  await page.route('**/database/users/login/demodb', route => {
    requests += 1;
    return route.fulfill({ status: 401, json: { message: 'Invalid credentials' } });
  });
  await expect(tree.openDashboardTab('demodb', 'host')).rejects.toThrow('login returned HTTP 401');
  expect(requests).toBe(1);
  expect(await page.evaluate(() => window.activations)).toBe(1);
  await expect(page.getByTestId('tab-db:host:demodb')).toHaveCount(0);
});
